import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, puff, person,
} from '../rig/helpers'

/**
 * "Sov gott!" — SÔÔV... GÓT!
 *
 * No quarto não tem cama: tem um IAQUE gigante deitado no tapete. Ele ergue a
 * pata da frente e abre o SOVACO, um ninho de lã morninho com travesseiro; você
 * entra de pijama e touca dizendo "que SOVACO…" e só sai SÔÔÔV — a pata desce
 * feito edredom e o iaque grunhe GÓT! (o começo de GÓSTOSO).
 *
 * Diorama: assoalho escuro, tapete azul-noite, parede com janela redonda de lua
 * cheia, iaque marrom de saia de lã até o chão, você aninhado no sovaco com a
 * touca vermelha (o único acento saturado: marca o lugar-chave da ponte).
 */

const PISO = '#4b3526'
const PISO_RIPA = '#553c2b'
const TAPETE = '#1f2f55'
const TAPETE_BORDA = '#3a5590'
const FRANJA = '#c9c0ae'
const PAREDE = '#33405f'
const RODAPE = '#222b42'
const MOLDURA = '#9a7853'
const CEU = '#121c35'
const LUA = '#fff0b8'
const PELO = '#5a3e2c'
const PELO_ESC = '#43301f'
const PELO_CLARO = '#7a5a40'
const FOCINHO = '#cdb79c'
const CASCO = '#2a211c'
const CHIFRE = '#efe4c8'
const LA = '#e8d9bc'
const LA_ESC = '#d9c6a3'
const FRONHA = '#fbf8f2'
const DEBRUM = '#8eaad8'
const PIJAMA = '#eef2f8'
const LISTRA = '#4f74b6'
const PELE = '#e8c39e'
const TOUCA = '#da2f2a' // acento saturado RESERVADO: a touca (você, no SOVACO)
const POMPOM = '#f7f3ea'
const PANTUFA = '#6283c2'

const FY = 0.12 // topo do assoalho
const GY = 0.165 // topo do tapete

// pata: rotação em torno do ombro (x = abre/fecha por cima de você)
const PATA_DEITADA = 2.0
const PATA_ABERTA = -0.3
const PATA_FINAL = 0.22
const TOUCA_Z = 0.1

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula de a até b — membros, mechas de lã. */
function limb(r: number, a: V3, b: V3, color: string, opts?: MatOpts) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Cone curvado (chifre, touca): base em y=0, eixo +y dobrando para +x. */
function bentCone(r: number, h: number, arc: number, color: string, opts?: MatOpts) {
  const geo = new THREE.ConeGeometry(r, h, 20, 16)
  geo.translate(0, h / 2, 0)
  const R = h / arc
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    const phi = (pos.getY(i) / h) * arc
    const rr = R - x
    pos.setXY(i, R - rr * Math.cos(phi), rr * Math.sin(phi))
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(color, { ...opts, size: Math.max(r * 2, h) }))
  m.castShadow = true
  m.receiveShadow = true
  return { mesh: m, tip: new THREE.Vector3(R * (1 - Math.cos(arc)), R * Math.sin(arc), 0) }
}

/** Orienta o objeto: eixo local y → `y`, eixo local x → `x` (ortogonalizado). */
function orient(o: THREE.Object3D, x: V3, y: V3) {
  const vy = new THREE.Vector3(...y).normalize()
  const vz = new THREE.Vector3(...x).cross(vy).normalize()
  const vx = new THREE.Vector3().crossVectors(vy, vz)
  o.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(vx, vy, vz))
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- quarto: assoalho, tapete azul-noite, parede ------------------------
  const base = new THREE.Group()

  const piso = cylinder(2.62, 2.7, 0.12, PISO, { roughness: 0.75 })
  piso.position.y = 0.06
  base.add(piso)
  for (let i = -3; i <= 3; i++) {
    const meia = Math.sqrt(Math.max(0, 2.55 * 2.55 - (i * 0.66) * (i * 0.66)))
    const ripa = rbox(meia * 2, 0.012, 0.6, 0.005, i % 2 === 0 ? PISO : PISO_RIPA, { roughness: 0.75 })
    ripa.position.set(0, FY + 0.006, i * 0.66)
    base.add(ripa)
  }

  const tapete = rbox(3.8, 0.05, 2.7, 0.025, TAPETE, { roughness: 0.95 })
  tapete.position.set(0.1, GY - 0.025, 0.2)
  base.add(tapete)
  // barra interna do tapete
  for (const [w, d, x, z] of [
    [3.4, 0.05, 0.1, 0.2 - 1.15], [3.4, 0.05, 0.1, 0.2 + 1.15],
    [0.05, 2.35, 0.1 - 1.7, 0.2], [0.05, 2.35, 0.1 + 1.7, 0.2],
  ] as const) {
    const barra = rbox(w, 0.01, d, 0.004, TAPETE_BORDA, { roughness: 0.95 })
    barra.position.set(x, GY + 0.002, z)
    base.add(barra)
  }
  // franjas nas pontas curtas
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 12; k++) {
      const fio = rbox(0.1, 0.012, 0.03, 0.005, FRANJA, { roughness: 0.9 })
      fio.position.set(0.1 + sx * 1.94, FY + 0.008, 0.2 - 1.15 + k * 0.209)
      base.add(fio)
    }
  }

  // parede com rodapé (a janela é peça própria)
  const parede = new THREE.Group()
  parede.position.set(-1.2, FY, -1.6)
  parede.rotation.y = 0.35
  const painel = rbox(1.8, 2.55, 0.14, 0.04, PAREDE, { roughness: 0.92 })
  painel.position.y = 1.275
  parede.add(painel)
  const rodape = rbox(1.84, 0.16, 0.18, 0.03, RODAPE, { roughness: 0.8 })
  rodape.position.y = 0.08
  parede.add(rodape)
  const cimalha = rbox(1.86, 0.07, 0.2, 0.025, RODAPE, { roughness: 0.8 })
  cimalha.position.y = 2.55
  parede.add(cimalha)
  base.add(parede)

  root.add(base)

  // ---- janela redonda com lua cheia ---------------------------------------
  const janela = new THREE.Group()
  janela.position.set(-1.2 + Math.sin(0.35) * 0.08, FY + 1.82, -1.6 + Math.cos(0.35) * 0.08)
  janela.rotation.y = 0.35
  root.add(janela)

  const ceu = cylinder(0.47, 0.47, 0.02, CEU, { roughness: 0.6, detail: 0 })
  ceu.rotation.x = Math.PI / 2
  janela.add(ceu)

  const lua = cylinder(0.2, 0.2, 0.02, LUA, { emissive: LUA, emissiveIntensity: 1.2 })
  lua.rotation.x = Math.PI / 2
  lua.position.set(0.12, 0.1, 0.015)
  janela.add(lua)
  for (const [cx, cy, cr] of [[0.06, 0.15, 0.045], [0.17, 0.04, 0.035], [0.18, 0.17, 0.025]] as const) {
    const cratera = cylinder(cr, cr, 0.01, '#efdc9a', { emissive: '#e9d58f', emissiveIntensity: 0.9 })
    cratera.rotation.x = Math.PI / 2
    cratera.position.set(cx, cy, 0.027)
    janela.add(cratera)
  }
  for (const [sx, sy] of [[-0.24, 0.2], [-0.12, -0.25], [0.28, -0.18]] as const) {
    const estrela = sphere(0.016, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 1.2 })
    estrela.position.set(sx, sy, 0.02)
    janela.add(estrela)
  }

  const aro = torus(0.48, 0.06, MOLDURA, { roughness: 0.55 })
  aro.position.z = 0.03
  janela.add(aro)
  for (const rot of [0, Math.PI / 2]) {
    const travessa = rbox(0.94, 0.035, 0.035, 0.012, MOLDURA, { roughness: 0.55 })
    travessa.rotation.z = rot
    travessa.position.z = 0.04
    janela.add(travessa)
  }
  const peitoril = rbox(0.7, 0.05, 0.16, 0.02, MOLDURA, { roughness: 0.55 })
  peitoril.position.set(0, -0.56, 0.06)
  janela.add(peitoril)

  // luar: banho frio entrando pela janela, pousa no lombo do iaque
  const luar = new THREE.PointLight('#cfdcff', 1.5, 3.6, 1.6)
  luar.position.set(0.1, 0, 0.7)
  janela.add(luar)

  // ---- IAQUE deitado (corpo + saia de lã até o chão) ----------------------
  const iaque = new THREE.Group()
  iaque.position.set(-0.15, GY, -0.35)
  iaque.rotation.y = -0.28
  root.add(iaque)

  const tronco = sphere(1, PELO, { roughness: 0.92 })
  tronco.scale.set(1.5, 0.72, 0.85)
  tronco.position.set(-0.2, 0.68, 0)
  iaque.add(tronco)

  const garupa = sphere(0.72, PELO, { roughness: 0.92 })
  garupa.position.set(-1.2, 0.66, 0)
  iaque.add(garupa)

  const peito = sphere(0.75, PELO, { roughness: 0.92 })
  peito.position.set(0.85, 0.74, 0.05)
  iaque.add(peito)

  const pescoco = sphere(0.5, PELO, { roughness: 0.92 })
  pescoco.scale.set(1, 1, 0.9)
  pescoco.position.set(1.45, 0.98, 0.08)
  iaque.add(pescoco)

  // coxa traseira dobrada do lado da câmera
  const coxa = sphere(0.42, PELO, { roughness: 0.92 })
  coxa.scale.set(1.15, 0.85, 0.8)
  coxa.position.set(-1.0, 0.45, 0.6)
  iaque.add(coxa)
  iaque.add(limb(0.12, [-0.85, 0.13, 0.85], [-0.45, 0.12, 0.92], PELO_ESC, { roughness: 0.92 }))
  const cascoTras = sphere(0.1, CASCO, { roughness: 0.5 })
  cascoTras.scale.set(1.2, 0.8, 1)
  cascoTras.position.set(-0.33, 0.09, 0.93)
  iaque.add(cascoTras)

  // pata da frente do outro lado, dobrada, com o casco aparecendo
  iaque.add(limb(0.13, [1.3, 0.14, -0.4], [1.75, 0.13, -0.32], PELO_ESC, { roughness: 0.92 }))
  const cascoFrente = sphere(0.1, CASCO, { roughness: 0.5 })
  cascoFrente.scale.set(1.2, 0.8, 1)
  cascoFrente.position.set(1.88, 0.1, -0.3)
  iaque.add(cascoFrente)

  // saia de lã comprida, do flanco até o tapete
  // mechas separadas (com fresta entre elas) para a fusão manter os sulcos
  for (let i = 0; i < 36; i++) {
    const a = ((i + 0.5) / 36) * Math.PI * 2
    const c = Math.cos(a)
    const s = Math.sin(a)
    const pe = 0.06 + rand() * 0.05
    iaque.add(limb(
      0.095,
      [-0.2 + c * 1.42, 0.62, s * 0.8],
      [-0.2 + c * 1.8, pe + 0.095, s * 1.05],
      i % 2 === 0 ? PELO_ESC : PELO,
      { roughness: 0.95 },
    ))
  }
  // rabo com pincel de pelo, caído rente à garupa
  iaque.add(limb(0.07, [-1.75, 0.95, 0.05], [-1.92, 0.55, 0.2], PELO, { roughness: 0.92 }))
  const pincel = puff(0.14, PELO_ESC, 5, 61, { roughness: 0.95 })
  pincel.position.set(-1.94, 0.42, 0.22)
  pincel.scale.set(0.9, 1.3, 0.9)
  iaque.add(pincel)

  // ---- corcova de lã sobre os ombros --------------------------------------
  const corcova = new THREE.Group()
  corcova.position.set(0.55, 1.28, -0.05)
  iaque.add(corcova)
  const morro = sphere(0.62, PELO, { roughness: 0.92 })
  morro.scale.set(1.25, 0.7, 1.0)
  corcova.add(morro)
  for (const [dx, dy, r] of [[-0.48, -0.06, 0.4], [0.4, -0.04, 0.44]] as const) {
    const lombo = sphere(r, PELO, { roughness: 0.92 })
    lombo.position.set(dx, dy, 0)
    corcova.add(lombo)
  }
  const topete = sphere(0.3, PELO, { roughness: 0.95 })
  topete.scale.set(1.6, 0.55, 1.1)
  topete.position.set(0.05, 0.3, 0.12)
  corcova.add(topete)

  // ---- cabeça: focinho claro, olhos sonolentos -----------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(1.95, 1.0, 0.22)
  cabeca.rotation.set(0.2, 0.12, 0)
  cabeca.scale.setScalar(1.2)
  iaque.add(cabeca)

  const cranio = sphere(0.4, PELO, { roughness: 0.92 })
  cranio.scale.set(1.05, 0.95, 1.05)
  cabeca.add(cranio)

  const cara = sphere(0.3, PELO, { roughness: 0.92 })
  cara.scale.set(0.95, 0.9, 1.2)
  cara.position.set(0, -0.12, 0.3)
  cabeca.add(cara)

  const focinho = sphere(0.24, FOCINHO, { roughness: 0.8 })
  focinho.scale.set(1.15, 0.85, 0.85)
  focinho.position.set(0, -0.24, 0.52)
  cabeca.add(focinho)

  const testa = puff(0.2, PELO_CLARO, 6, 47, { roughness: 0.95 })
  testa.position.set(0, 0.3, 0.1)
  testa.scale.set(1.2, 0.8, 1)
  cabeca.add(testa)

  for (const side of [-1, 1]) {
    const narina = sphere(0.045, '#2a1e18', { roughness: 0.4 })
    narina.scale.set(1, 0.7, 0.6)
    narina.position.set(side * 0.09, -0.2, 0.71)
    cabeca.add(narina)

    const esclera = sphere(0.07, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(side * 0.24, 0.03, 0.33)
    const pupila = sphere(0.034, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.24, 0.005, 0.368)
    const palpebra = sphere(0.075, PELO_ESC, { roughness: 0.9 })
    palpebra.scale.set(1, 0.62, 0.7)
    palpebra.position.set(side * 0.24, 0.07, 0.336)
    cabeca.add(esclera, pupila, palpebra)

    const orelha = capsule(0.07, 0.14, PELO, { roughness: 0.92 })
    orelha.position.set(side * 0.44, -0.06, -0.02)
    orelha.rotation.z = side * (Math.PI / 2 + 0.4)
    cabeca.add(orelha)
  }

  const boca = capsule(0.016, 0.16, '#2a1e18', { roughness: 0.6 })
  boca.rotation.z = Math.PI / 2
  boca.position.set(0, -0.38, 0.56)
  cabeca.add(boca)

  // barba de lã sob o queixo
  for (const [bx, len] of [[-0.12, 0.26], [0, 0.34], [0.12, 0.26]] as const) {
    cabeca.add(limb(0.1, [bx, -0.32, 0.25], [bx * 1.2, -0.32 - len, 0.22], PELO_ESC, { roughness: 0.95 }))
  }

  // ---- chifres cor de creme ----------------------------------------------
  const chifres = new THREE.Group()
  chifres.position.set(0, 0.2, -0.02)
  cabeca.add(chifres)
  for (const side of [-1, 1]) {
    const { mesh } = bentCone(0.085, 0.62, 1.7, CHIFRE, { roughness: 0.4 })
    mesh.position.set(side * 0.3, 0, 0)
    orient(mesh, [0, 1, 0.35], [side, 0.3, 0.1])
    chifres.add(mesh)
  }

  // ---- pata da frente erguida em arco (pivô no ombro) ---------------------
  const pata = new THREE.Group()
  pata.position.set(1.0, 0.95, 0.6)
  pata.rotation.x = PATA_FINAL
  iaque.add(pata)

  // arco: ombro → cotovelo (sobe) → joelho (topo do arco) → boleto (desce)
  const COTOVELO: V3 = [-0.3, 0.62, 0.2]
  const JOELHO: V3 = [-0.75, 0.78, 0.32]
  const BOLETO: V3 = [-1.02, 0.5, 0.4]
  pata.add(limb(0.26, [0, 0, 0], COTOVELO, PELO, { roughness: 0.92 }))
  const juntaCot = sphere(0.23, PELO, { roughness: 0.92 })
  juntaCot.position.set(...COTOVELO)
  pata.add(juntaCot)
  pata.add(limb(0.18, COTOVELO, JOELHO, PELO, { roughness: 0.92 }))
  const juntaJoe = sphere(0.16, PELO, { roughness: 0.92 })
  juntaJoe.position.set(...JOELHO)
  pata.add(juntaJoe)
  // canela de "meia" clara: separa a pata do corpo escuro
  pata.add(limb(0.12, JOELHO, BOLETO, FOCINHO, { roughness: 0.85 }))
  // tufo de pelo no boleto, logo acima do casco
  const tufoBoleto = puff(0.13, FOCINHO, 5, 91, { roughness: 0.92 })
  tufoBoleto.position.set(BOLETO[0], BOLETO[1] - 0.02, BOLETO[2])
  tufoBoleto.scale.set(1, 0.8, 1)
  pata.add(tufoBoleto)
  // casco fendido, pendurado: duas metades lustrosas
  for (const side of [-1, 1]) {
    const unha = sphere(0.1, CASCO, { roughness: 0.3 })
    unha.scale.set(0.62, 1.05, 0.95)
    unha.position.set(BOLETO[0] + side * 0.06, BOLETO[1] - 0.17, BOLETO[2] + 0.01)
    pata.add(unha)
  }

  // ---- ninho de lã no sovaco ---------------------------------------------
  const ninho = new THREE.Group()
  iaque.add(ninho)
  const almofadao = sphere(0.5, LA, { roughness: 0.95 })
  almofadao.scale.set(1.5, 0.45, 0.85)
  almofadao.position.set(0.25, 0.2, 1.2)
  ninho.add(almofadao)
  // dobra da lã por cima das suas pernas
  ninho.add(limb(0.22, [-0.5, 0.25, 1.5], [0.08, 0.44, 1.5], LA, { roughness: 0.95 }))
  for (const [x, y, z, r] of [
    [-0.7, 0.2, 1.2, 0.2], [0.72, 0.26, 1.42, 0.17], [-0.2, 0.3, 1.68, 0.15],
    [-0.45, 0.42, 1.55, 0.13], [-0.18, 0.5, 1.58, 0.13], [0.08, 0.6, 1.52, 0.12],
    [0.42, 0.28, 1.6, 0.12], [0.95, 0.3, 1.2, 0.14],
  ] as const) {
    const tufo = puff(r, LA_ESC, 5, 70 + Math.round(x * 10), { roughness: 0.95 })
    tufo.position.set(x, y, z)
    ninho.add(tufo)
  }
  // pivô no meio do ninho: ele cresce a partir do sovaco, não de dentro do iaque
  const NINHO_C = new THREE.Vector3(0.15, 0.2, 1.35)
  for (const c of ninho.children) c.position.sub(NINHO_C)
  ninho.position.copy(NINHO_C)

  // ---- travesseiro branco ------------------------------------------------
  // de pé atrás da sua cabeça, encostado no peito do iaque
  const PILLOW_Y = 0.7
  const travesseiro = new THREE.Group()
  travesseiro.position.set(0.62, PILLOW_Y, 0.86)
  travesseiro.rotation.set(1.22, 0, -0.7)
  iaque.add(travesseiro)
  // miolo estufado + costura reta em volta: lê como travesseiro, não tábua
  const fronha = sphere(0.5, FRONHA, { roughness: 0.85 })
  fronha.scale.set(0.9, 0.26, 0.58)
  travesseiro.add(fronha)
  // debrum azul em volta: desenha o retângulo do travesseiro contra a lã
  const costura = rbox(0.96, 0.05, 0.64, 0.03, DEBRUM, { roughness: 0.8 })
  travesseiro.add(costura)
  const miolo = rbox(0.9, 0.07, 0.58, 0.03, FRONHA, { roughness: 0.85 })
  travesseiro.add(miolo)

  // ---- você, de pijama listrado ------------------------------------------
  const PX = -0.15
  const PY = 0.14
  const PZ = 1.38
  const voce = person({ body: PIJAMA, skin: PELE, height: 1.4, armAngle: 0.35 })
  voce.position.set(PX, PY, PZ)
  voce.rotation.set(-0.35, 0.1, -0.7)
  iaque.add(voce)

  for (const y of [0.3, 0.42, 0.54, 0.66]) {
    const listra = cylinder(0.247, 0.247, 0.05, LISTRA, { roughness: 0.85 })
    listra.position.y = y
    voce.add(listra)
  }
  for (const armName of ['armL', 'armR']) {
    const arm = voce.getObjectByName(armName)
    if (!arm) continue
    for (const y of [0.04, -0.08]) {
      const punho = torus(0.072, 0.018, LISTRA, { roughness: 0.85 })
      punho.rotation.x = Math.PI / 2
      punho.position.y = y
      arm.add(punho)
    }
  }
  for (const by of [0.36, 0.48, 0.6]) {
    const botao = sphere(0.022, LISTRA, { roughness: 0.4 })
    botao.position.set(0, by, 0.245)
    voce.add(botao)
  }

  const cabecaVoce = voce.getObjectByName('head') as THREE.Group
  const HR = 0.19 * 1.4
  // olhos pesados de sono e boca redonda: SÔÔÔV
  for (const side of [-1, 1]) {
    const palp = sphere(HR * 0.235, PELE, { roughness: 0.6 })
    palp.scale.set(1, 0.6, 0.7)
    palp.position.set(side * HR * 0.38, HR * 0.19, HR * 0.84)
    cabecaVoce.add(palp)
  }
  const bocaO = torus(0.045, 0.016, '#a2564a', { roughness: 0.5 })
  bocaO.position.set(0, -HR * 0.42, HR * 0.9)
  bocaO.scale.y = 1.2
  cabecaVoce.add(bocaO)
  const bocaFundo = sphere(0.038, '#4a1f1c', { roughness: 0.7 })
  bocaFundo.position.set(0, -HR * 0.42, HR * 0.86)
  cabecaVoce.add(bocaFundo)

  // ---- touca de dormir vermelha com pompom --------------------------------
  const touca = new THREE.Group()
  touca.position.set(0, HR * 0.42, -0.02)
  touca.rotation.set(-0.2, 0, TOUCA_Z)
  cabecaVoce.add(touca)
  const { mesh: saco, tip } = bentCone(HR * 0.98, 0.6, 2.7, TOUCA, { roughness: 0.85 })
  orient(saco, [-1, 0.2, 0], [0, 1, 0])
  touca.add(saco)
  const barra = torus(HR * 0.98, 0.05, POMPOM, { roughness: 0.95 })
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.02
  touca.add(barra)
  const pompom = puff(0.075, POMPOM, 6, 83, { roughness: 0.95 })
  pompom.position.copy(tip).applyQuaternion(saco.quaternion).add(saco.position)
  touca.add(pompom)

  // ---- pantufas largadas no tapete ----------------------------------------
  const pantufas = new THREE.Group()
  root.add(pantufas)
  for (const [px, pz, ry] of [[1.55, 1.3, 0.5], [1.92, 1.05, -0.2]] as const) {
    const pe = new THREE.Group()
    pe.position.set(px, GY, pz)
    pe.rotation.y = ry
    const sola = rbox(0.2, 0.05, 0.36, 0.024, '#e6dccb', { roughness: 0.9 })
    sola.position.y = 0.025
    pe.add(sola)
    const gaspea = sphere(0.11, PANTUFA, { roughness: 0.95 })
    gaspea.scale.set(0.95, 0.6, 1.2)
    gaspea.position.set(0, 0.06, 0.07)
    pe.add(gaspea)
    const calcanhar = rbox(0.18, 0.08, 0.12, 0.035, PANTUFA, { roughness: 0.95 })
    calcanhar.position.set(0, 0.07, -0.12)
    pe.add(calcanhar)
    const bola = sphere(0.045, POMPOM, { roughness: 0.95 })
    bola.position.set(0, 0.13, 0.12)
    pe.add(bola)
    pantufas.add(pe)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'quarto', object: base },
    { name: 'janela', group: 'quarto', object: janela },
    { name: 'iaque', group: 'iaque', object: iaque },
    { name: 'corcova', group: 'iaque', object: corcova },
    { name: 'cabeca', group: 'iaque', object: cabeca },
    { name: 'chifres', group: 'iaque', object: chifres },
    { name: 'pata', group: 'sovaco', object: pata },
    { name: 'ninho', group: 'sovaco', object: ninho },
    { name: 'travesseiro', group: 'sovaco', object: travesseiro },
    { name: 'voce', group: 'voce', object: voce },
    { name: 'touca', group: 'voce', object: touca },
    { name: 'pantufas', group: 'voce', object: pantufas },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Seu quarto à noite: tapete azul-noite, lua cheia na janela… e nenhuma cama.',
    }),
    seq('janela-abre', 'janela', 0.6, 0.7, grow(), { ease: 'easeOut' }),

    seq('iaque-rise', 'iaque', 2.0, 1.0, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'No lugar da cama, um iaque do Himalaia, peludo até o chão, deitado no tapete.',
    }),
    seq('corcova-cresce', 'corcova', 2.5, 0.6, grow(0.3), { ease: 'easeOut' }),
    seq('cabeca-sobe', 'cabeca', 2.6, 0.7, [ch('position.y', 0.3, 1.0)], { ease: 'easeOut' }),
    seq('chifres-crescem', 'chifres', 3.0, 0.5, grow(), { ease: 'easeOut' }),

    seq('pata-ergue', 'pata', 4.4, 0.9, [ch('rotation.x', PATA_DEITADA, PATA_ABERTA)], {
      ease: 'easeOut',
      caption: 'Hora de dormir: ele ergue a pata da frente e abre o SOVACO — uma caverna de lã morninha.',
    }),
    seq('ninho-cresce', 'ninho', 4.8, 0.6, grow(), { ease: 'easeOut' }),
    seq('travesseiro-cai', 'travesseiro', 5.1, 0.5, [ch('position.y', PILLOW_Y + 0.7, PILLOW_Y)], {
      ease: 'easeIn',
    }),

    seq('voce-entra', 'voce', 6.6, 1.0, [ch('position.z', PZ + 1.3, PZ), ch('position.x', PX - 0.5, PX)], {
      ease: 'easeOut',
      caption: 'Você entra de pijama e touca e começa: "que SOVACO…" — mas só sai SÔÔÔV, comprido e sonolento.',
    }),
    seq('touca-poe', 'touca', 6.8, 0.6, grow(), { ease: 'easeOut' }),
    seq('pantufas-caem', 'pantufas', 7.0, 0.5, [ch('position.y', 0.5, 0)], { ease: 'easeIn' }),

    seq('pata-cobre', 'pata', 8.8, 0.9, [ch('rotation.x', PATA_ABERTA, PATA_FINAL)], {
      caption: 'A pata desce por cima de você feito edredom e engole o resto da palavra…',
    }),
    seq('cabeca-grunhe', 'cabeca', 10.0, 0.25, [ch('rotation.x', 0.2, 0.42)], {
      ease: 'easeOut',
      caption: '…e lá do alto o iaque grunhe o boa-noite, com T seco: GÓT! Lugar mais GÓSTOSO não há.',
    }),
    seq('cabeca-volta', 'cabeca', 10.25, 0.5, [ch('rotation.x', 0.42, 0.2)]),

    seq('touca-assenta', 'touca', 11.8, 0.6, [ch('rotation.z', TOUCA_Z + 0.3, TOUCA_Z)], {
      caption: 'Sov gott! — Durma bem!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.4, 5.0], target: [0.2, 1.05, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'sov-gott',
    contexto:
      'Casa: boa-noite pro filho, pra parceira, pra visita que dorme em casa; a última mensagem da noite.',
    fraseFonte: 'Durma bem! / Dorme gostoso!',
    fraseAlvo: 'Sov gott!',
    pronuncia:
      "SÔÔV GÓT! ('sov' com Ô FECHADO e longo, o mesmo som de 'så', mais um V no fim; 'gott' com Ó ABERTO e curto, g duro e T seco)",
    ponteSonora:
      "SÔÔV... GÓT! (2 sílabas, força nas duas, um pouco mais no GÓT; SÔÔV = o SOVACO cortado logo depois do V, com a força puxada toda pro SÔ: Ô FECHADO e LONGO — o mesmo Ô do 'så' (SÔ) das outras cartas — e o V colado no fim, dente de cima no lábio de baixo; sem o V sobra 'så gott', que é 'que gostoso!', outra frase; e não deixe escapar o VA de sovaco: 'sova' é o infinitivo sueco ('dormir'), e o pedido é 'sov!'; nunca o Ó aberto de 'sova' (surra) nem o 'su-' de quem fala 'suvaco' — é SÔ de boca redonda, o mesmo SÔ mineiro de 'Tack så mycket'; GÓT = o MESMO GÓT de IÉ-TE-GÓT ('Det var jättegott'): o começo de GÓSTOSO com o G duro de 'gato', Ó ABERTO e CURTO, e um T seco no lugar do resto — nunca 'GÓ-tchi'. Juntando: dorme no SOVACO GOSTOSO)",
    historia:
      "No seu quarto não tem cama: tem um iaque do Himalaia, peludo até o chão, deitado no tapete. Na hora de dormir ele levanta a pata da frente e abre o SOVACO, uma caverna de lã comprida, morninha e com cheiro de feno. Você entra de pijama e touca e começa a dizer 'que SOVACO...', mas só sai o começo, comprido e sonolento — SÔÔÔV — e a pata desce por cima de você feito um edredom, engolindo o resto da palavra. Lá do alto, o iaque grunhe o boa-noite dele, com um T batendo seco no fim: GÓT! Não existe lugar mais GÓSTOSO no mundo pra dormir — durma bem.",
  },
  createScene,
  refine: { organic: ['iaque', 'corcova', 'cabeca', 'pata', 'ninho'] },
}

export default card
