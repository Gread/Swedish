import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, rock, person,
} from '../rig/helpers'

/**
 * "Jag är trött." — IÁ! É TRÖTT!
 *
 * Um cowboy passou a noite gritando IÁ! em cima de um cavalo xucro — cada
 * pinote era uma TRETA nova. Ao amanhecer os dois apagam de pé no curral: o
 * cavalo dorme de cabeça baixa, o cowboy desaba na sela com o chapéu no nariz,
 * braços pendurados até o chão e um beicinho de choro (o ö de TRÖTT).
 *
 * Diorama: terra batida laranja-areia, cerca de dois postes, cacto, laço
 * enrolado no chão e o sol nascendo atrás. Acento saturado RESERVADO: os três
 * Z azuis — o "trött" que a cena inteira resume.
 */

const DIRT = '#cf9659'
const DIRT_DARK = '#b07a42'
const DIRT_PRINT = '#9c6a39'
const WOOD = '#8a5e3b'
const WOOD_DARK = '#6b4529'
const CACTUS = '#5b8a4c'
const CACTUS_DARK = '#4a7540'
const ROPE = '#d9c394'
const SUN = '#ff9b3d'
const HORSE = '#8b5a35'
const HORSE_LIGHT = '#a7744a'
const MANE = '#3b2617'
const HOOF = '#2f2620'
const SADDLE = '#4d2e1b'
const BLANKET = '#3e6b74'
const BLANKET_STRIPE = '#e6d6b4'
const SHIRT = '#a8433a'
const VEST = '#6b4428'
const JEANS = '#3e5577'
const BOOT = '#4a2e1c'
const SKIN = '#e2b48c'
const LIP = '#c4605f'
const HAT = '#d8c299'
const HAT_BAND = '#5a3a24'
const ZBLUE = '#2f7df6' // acento saturado, reservado aos Z

const GY = 0.12 // topo do chão de terra
const SEAT_Y = 1.3 // topo do assento da sela (espaço do cavalo)
const ARM_S = 1.95 // braços esticados de cansaço (escala do braço)

// pose do tronco: erguido gritando IÁ (montagem) e desabado (final)
const P_UP = -0.15
const P_SLUMP = 1.12
const R_SLUMP = 0.28
// cabeça do cavalo: erguida (pinotes) e baixa (dormindo)
const NECK_UP = 0.85
const NECK_DOWN = 0
// chapéu escorregado sobre o nariz: [y, z, inclinação]
const HAT_UP: [number, number, number] = [0.17, -0.03, -0.25]
const HAT_DOWN: [number, number, number] = [0.07, 0.06, 0.3]
const CAM: [number, number, number] = [0.85, 2.35, 5.0]
const TARGET: [number, number, number] = [0.25, 1.2, 0.1]
const FACE_DROOP = 0.05 // rosto levemente pra baixo
const FACE_TILT = 0.22 // cabeça tombada de lado

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.05, 0.012, ZBLUE, { roughness: 0.35, emissive: ZBLUE, emissiveIntensity: 0.18 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Letra Z de traço grosso, altura h. */
function letterZ(h: number) {
  const g = new THREE.Group()
  const w = h * 0.8
  const t = h * 0.2
  g.add(stroke(w, t, 0, h / 2 - t / 2))
  g.add(stroke(w, t, 0, -h / 2 + t / 2))
  const dx = w - t
  const dy = h - t * 1.6
  g.add(stroke(Math.hypot(dx, dy) + t * 0.3, t * 0.95, 0, 0, Math.atan2(dy, dx)))
  return g
}

/** Rotação Euler (XYZ) de um braço que, dentro do tronco girado, aponta para baixo com leve abertura. */
function hangingArm(tronco: THREE.Euler, splay: number, fwd = 0): [number, number, number] {
  const qT = new THREE.Quaternion().setFromEuler(tronco)
  const qS = new THREE.Quaternion().setFromEuler(new THREE.Euler(fwd, 0, splay))
  const q = qT.invert().multiply(qS)
  const e = new THREE.Euler().setFromQuaternion(q, 'XYZ')
  return [e.x, e.y, e.z]
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- curral: terra batida, cerca, cacto, laço -----------------------------
  const base = new THREE.Group()

  const chao = cylinder(2.6, 2.7, 0.12, DIRT, { roughness: 0.95 })
  chao.position.y = 0.06
  base.add(chao)

  const borda = torus(2.62, 0.04, DIRT_DARK, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.1
  base.add(borda)

  // marcas de casco espalhadas: a noite de pinotes deixou o chão revirado
  for (let i = 0; i < 16; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.7 + rand() * 1.5
    const marca = cylinder(0.075, 0.075, 0.01, DIRT_PRINT, { roughness: 0.95 })
    marca.scale.set(1, 1, 0.75)
    marca.position.set(Math.cos(a) * r, GY + 0.004, Math.sin(a) * r)
    marca.rotation.y = rand() * Math.PI
    base.add(marca)
  }

  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.5 + rand() * 0.95
    const pedra = rock(0.05 + rand() * 0.05, i % 2 ? '#a98f74' : '#8f7a63', 70 + i, { roughness: 0.85 })
    pedra.position.set(Math.cos(a) * r, GY + 0.02, Math.sin(a) * r)
    base.add(pedra)
  }

  // tufos de capim seco
  for (const [tx, tz] of [[-2.0, -0.6], [2.05, 0.45], [-0.9, 1.95], [0.9, -2.15]] as const) {
    const tufo = new THREE.Group()
    tufo.position.set(tx, GY, tz)
    for (let k = 0; k < 5; k++) {
      const folha = cone(0.03, 0.22 + rand() * 0.1, '#c9b56a', { roughness: 0.9 })
      folha.position.set((rand() - 0.5) * 0.1, 0.11, (rand() - 0.5) * 0.1)
      folha.rotation.set((rand() - 0.5) * 0.6, 0, (rand() - 0.5) * 0.6)
      tufo.add(folha)
    }
    base.add(tufo)
  }

  // cerca de madeira: dois postes, duas travessas (fundo, à direita)
  const P1 = new THREE.Vector2(-0.35, -1.95)
  const P2 = new THREE.Vector2(1.75, -1.25)
  for (const p of [P1, P2]) {
    const poste = cylinder(0.075, 0.085, 1.05, WOOD_DARK, { roughness: 0.8 })
    poste.position.set(p.x, GY + 0.52, p.y)
    base.add(poste)
    const topo = cone(0.085, 0.08, WOOD_DARK, { roughness: 0.8 })
    topo.position.set(p.x, GY + 1.08, p.y)
    base.add(topo)
  }
  const dir = P2.clone().sub(P1)
  const len = dir.length()
  const ang = -Math.atan2(dir.y, dir.x)
  const nx = -dir.y / len
  const nz = dir.x / len
  for (const [y, tilt] of [[0.48, 0.02], [0.84, -0.015]] as const) {
    const trave = rbox(len + 0.4, 0.1, 0.06, 0.02, WOOD, { roughness: 0.8 })
    trave.position.set((P1.x + P2.x) / 2 + nx * 0.09, GY + y, (P1.y + P2.y) / 2 + nz * 0.09)
    trave.rotation.set(0, ang, tilt)
    base.add(trave)
  }

  // cacto de dois braços (frente, à esquerda)
  const cacto = new THREE.Group()
  cacto.position.set(-1.75, GY, 0.55)
  base.add(cacto)
  const tronco = capsule(0.15, 0.75, CACTUS, { roughness: 0.7 })
  tronco.position.y = 0.52
  cacto.add(tronco)
  for (const [side, y, h] of [[-1, 0.5, 0.32], [1, 0.68, 0.26]] as const) {
    const cotovelo = capsule(0.085, 0.16, CACTUS, { roughness: 0.7 })
    cotovelo.rotation.z = Math.PI / 2
    cotovelo.position.set(side * 0.2, y, 0)
    cacto.add(cotovelo)
    const braco = capsule(0.085, h, CACTUS, { roughness: 0.7 })
    braco.position.set(side * 0.3, y + h / 2 + 0.02, 0)
    cacto.add(braco)
  }
  for (let k = 0; k < 4; k++) {
    const costela = capsule(0.022, 0.7, CACTUS_DARK, { roughness: 0.7 })
    const a = (k / 4) * Math.PI * 2 + 0.4
    costela.position.set(Math.cos(a) * 0.14, 0.52, Math.sin(a) * 0.14)
    cacto.add(costela)
  }
  const flor = sphere(0.055, '#e88aa0', { roughness: 0.6 })
  flor.position.y = 1.0
  cacto.add(flor)

  // laço de corda enrolado na terra (frente, à direita)
  const laco = new THREE.Group()
  laco.position.set(1.45, GY, 1.05)
  base.add(laco)
  for (const [i, r] of [0.27, 0.235, 0.255].entries()) {
    const volta = torus(r, 0.026, ROPE, { roughness: 0.9 })
    volta.rotation.set(Math.PI / 2 + (rand() - 0.5) * 0.12, 0, 0)
    volta.position.set((rand() - 0.5) * 0.05, 0.028 + i * 0.045, (rand() - 0.5) * 0.05)
    laco.add(volta)
  }
  const ponta = capsule(0.026, 0.5, ROPE, { roughness: 0.9 })
  ponta.rotation.set(Math.PI / 2, 0, 0.9)
  ponta.position.set(-0.4, 0.03, 0.22)
  laco.add(ponta)
  const no = sphere(0.045, ROPE, { roughness: 0.9 })
  no.position.set(-0.6, 0.04, 0.37)
  laco.add(no)

  root.add(base)

  // ---- sol nascente (meia esfera no horizonte) ------------------------------
  const sol = new THREE.Group()
  sol.position.set(-1.55, GY, -2.0)
  root.add(sol)
  const disco = new THREE.Mesh(
    new THREE.SphereGeometry(0.72, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(SUN, { emissive: SUN, emissiveIntensity: 0.85, roughness: 0.5 }),
  )
  sol.add(disco)
  for (let k = 0; k < 7; k++) {
    const a = (k / 6) * Math.PI
    const raio = rbox(0.24, 0.06, 0.04, 0.02, '#ffc070', { emissive: '#ffb04a', emissiveIntensity: 0.9 })
    raio.position.set(Math.cos(a) * 0.95, Math.sin(a) * 0.95, 0)
    raio.rotation.z = a
    sol.add(raio)
  }

  // ---- cavalo (espaço local: +x = frente) -----------------------------------
  const cavalo = new THREE.Group()
  cavalo.position.set(-0.15, 0, 0.2)
  cavalo.rotation.y = -0.3
  root.add(cavalo)

  const corpo = capsule(0.32, 0.85, HORSE, { roughness: 0.75 })
  corpo.rotation.z = Math.PI / 2
  corpo.position.y = 0.92
  cavalo.add(corpo)

  const peito = sphere(0.34, HORSE, { roughness: 0.75 })
  peito.scale.set(1, 1, 0.92)
  peito.position.set(0.42, 0.94, 0)
  cavalo.add(peito)

  const anca = sphere(0.36, HORSE, { roughness: 0.75 })
  anca.scale.set(1, 1, 0.95)
  anca.position.set(-0.46, 0.98, 0)
  cavalo.add(anca)

  for (const [lx, back] of [[0.42, false], [-0.48, true]] as const) {
    for (const lz of [-0.16, 0.16]) {
      const coxa = capsule(back ? 0.13 : 0.11, 0.22, HORSE, { roughness: 0.75 })
      coxa.position.set(lx, 0.66, lz)
      cavalo.add(coxa)
      const canela = capsule(0.068, 0.34, HORSE_LIGHT, { roughness: 0.75 })
      canela.position.set(lx + (back ? -0.03 : 0.01), 0.37, lz)
      cavalo.add(canela)
      const casco = cylinder(0.08, 0.095, 0.1, HOOF, { roughness: 0.55 })
      casco.position.set(lx + (back ? -0.03 : 0.01), GY + 0.05, lz)
      cavalo.add(casco)
    }
  }

  // rabo desgrenhado
  const raboBase = capsule(0.07, 0.22, MANE, { roughness: 0.9 })
  raboBase.position.set(-0.86, 1.05, 0)
  raboBase.rotation.z = -0.6
  cavalo.add(raboBase)
  const rabo = puff(0.13, MANE, 6, 12, { roughness: 0.95 })
  rabo.scale.set(0.8, 1.6, 0.8)
  rabo.position.set(-0.95, 0.78, 0)
  cavalo.add(rabo)

  // ---- pescoço + cabeça (dobradiça na cernelha) -----------------------------
  const cabecaCavalo = new THREE.Group()
  cabecaCavalo.position.set(0.55, 1.12, 0)
  cabecaCavalo.rotation.z = NECK_DOWN
  cavalo.add(cabecaCavalo)

  const pescoco = capsule(0.18, 0.46, HORSE, { roughness: 0.75 })
  pescoco.position.set(0.26, -0.19, 0)
  pescoco.rotation.z = 0.927
  cabecaCavalo.add(pescoco)

  const cranio = capsule(0.145, 0.3, HORSE, { roughness: 0.75 })
  cranio.position.set(0.6, -0.55, 0)
  cranio.rotation.z = 0.468
  cabecaCavalo.add(cranio)

  const focinho = sphere(0.125, '#6e4529', { roughness: 0.7 })
  focinho.scale.set(1, 1.05, 0.95)
  focinho.position.set(0.72, -0.8, 0)
  cabecaCavalo.add(focinho)

  for (const side of [-1, 1]) {
    const narina = sphere(0.022, '#2a1a10', { roughness: 0.5 })
    narina.position.set(0.8, -0.86, side * 0.06)
    cabecaCavalo.add(narina)

    // olho fechado: pálpebra inchada + risco em arco (dormindo)
    const palpebra = sphere(0.05, HORSE, { roughness: 0.75 })
    palpebra.scale.set(1, 0.8, 0.5)
    palpebra.position.set(0.55, -0.47, side * 0.125)
    cabecaCavalo.add(palpebra)
    const risco = new THREE.Mesh(
      new THREE.TorusGeometry(0.04, 0.011, 8, 16, Math.PI),
      mat('#1f140c', { roughness: 0.5 }),
    )
    risco.position.set(0.555, -0.47, side * 0.15)
    risco.rotation.set(0, 0, Math.PI + 0.47)
    cabecaCavalo.add(risco)

    // orelhas caídas de sono
    const orelha = cone(0.05, 0.16, HORSE, { roughness: 0.75 })
    orelha.position.set(0.44, -0.3, side * 0.09)
    orelha.rotation.set(side * 1.0, 0, 0.6)
    cabecaCavalo.add(orelha)
  }

  // crina toda desgrenhada ao longo do pescoço (peça própria, fora do
  // refinamento: os tufos ficam soltos em vez de fundidos no pescoço)
  const crina = new THREE.Group()
  cabecaCavalo.add(crina)
  for (let k = 0; k < 6; k++) {
    const t = 0.02 + k * 0.11
    const tufo = puff(0.085 + rand() * 0.03, MANE, 4, 90 + k, { roughness: 0.95 })
    tufo.position.set(0.8 * t + 0.6 * 0.14 + (rand() - 0.5) * 0.04, -0.6 * t + 0.8 * 0.14, (rand() - 0.5) * 0.08)
    crina.add(tufo)
  }
  const topete = puff(0.07, MANE, 4, 99, { roughness: 0.95 })
  topete.position.set(0.5, -0.3, 0)
  crina.add(topete)

  // ---- sela + manta + estribos (no lombo) -----------------------------------
  const sela = new THREE.Group()
  cavalo.add(sela)

  const manta = new THREE.Mesh(
    new THREE.CylinderGeometry(0.34, 0.34, 0.64, 40, 1, true, -1.25, 2.5),
    mat(BLANKET, { roughness: 0.92 }),
  )
  ;(manta.material as THREE.Material).side = THREE.DoubleSide
  manta.castShadow = true
  manta.receiveShadow = true
  manta.rotation.z = Math.PI / 2
  manta.rotation.y = 0
  manta.position.set(-0.05, 0.92, 0)
  sela.add(manta)
  for (const sx of [-0.27, 0.17]) {
    const faixa = new THREE.Mesh(
      new THREE.CylinderGeometry(0.343, 0.343, 0.05, 40, 1, true, -1.25, 2.5),
      mat(BLANKET_STRIPE, { roughness: 0.92 }),
    )
    ;(faixa.material as THREE.Material).side = THREE.DoubleSide
    faixa.rotation.z = Math.PI / 2
    faixa.position.set(sx, 0.92, 0)
    sela.add(faixa)
  }

  const assento = rbox(0.5, 0.1, 0.4, 0.05, SADDLE, { roughness: 0.5 })
  assento.position.set(-0.05, 1.27, 0)
  sela.add(assento)
  const patilha = rbox(0.08, 0.18, 0.36, 0.035, SADDLE, { roughness: 0.5 })
  patilha.position.set(-0.29, 1.34, 0)
  patilha.rotation.z = 0.3
  sela.add(patilha)
  const arcao = rbox(0.1, 0.12, 0.34, 0.04, SADDLE, { roughness: 0.5 })
  arcao.position.set(0.2, 1.32, 0)
  sela.add(arcao)
  const chifre = cylinder(0.03, 0.035, 0.12, SADDLE, { roughness: 0.5 })
  chifre.position.set(0.22, 1.43, 0)
  sela.add(chifre)
  const tampaChifre = cylinder(0.065, 0.06, 0.03, SADDLE, { roughness: 0.5 })
  tampaChifre.position.set(0.22, 1.5, 0)
  sela.add(tampaChifre)
  for (const sz of [-1, 1]) {
    const aba = rbox(0.18, 0.5, 0.03, 0.03, SADDLE, { roughness: 0.55 })
    aba.position.set(0.04, 0.98, sz * 0.36)
    aba.rotation.set(sz * 0.12, 0, 0)
    sela.add(aba)
    const estribo = torus(0.07, 0.018, '#3a2414', { roughness: 0.5 })
    estribo.position.set(0.06, 0.68, sz * 0.43)
    estribo.rotation.y = Math.PI / 2
    sela.add(estribo)
  }

  // ---- cowboy (montado; +z do person = frente do cavalo) --------------------
  const cowboy = new THREE.Group()
  cowboy.position.set(-0.05, SEAT_Y, 0)
  cowboy.rotation.y = Math.PI / 2
  cavalo.add(cowboy)

  // pernas abertas em volta do lombo, botas nos estribos
  for (const side of [-1, 1]) {
    const coxa = capsule(0.1, 0.26, JEANS, { roughness: 0.85 })
    coxa.position.set(side * 0.3, -0.1, 0.08)
    coxa.rotation.set(0.9, 0, side * 0.75)
    cowboy.add(coxa)
    const canela = capsule(0.085, 0.3, JEANS, { roughness: 0.85 })
    canela.position.set(side * 0.42, -0.38, 0.12)
    canela.rotation.set(0.15, 0, side * 0.12)
    cowboy.add(canela)
    const bota = rbox(0.14, 0.16, 0.26, 0.05, BOOT, { roughness: 0.6 })
    bota.position.set(side * 0.44, -0.6, 0.17)
    cowboy.add(bota)
    const espora = torus(0.03, 0.008, '#b8bec4', { roughness: 0.3, metalness: 0.7 })
    espora.position.set(side * 0.44, -0.6, 0.02)
    espora.rotation.y = Math.PI / 2
    cowboy.add(espora)
  }

  // tronco: person() que desaba pra frente
  const corpoCowboy = person({ body: SHIRT, skin: SKIN, height: 1.5 })
  corpoCowboy.position.y = -0.1
  corpoCowboy.rotation.set(P_SLUMP, 0, R_SLUMP)
  cowboy.add(corpoCowboy)

  // colete de couro aberto na frente
  const colete = new THREE.Mesh(
    new THREE.CylinderGeometry(0.255, 0.275, 0.36, 40, 1, true, 0.5, Math.PI * 2 - 1.0),
    mat(VEST, { roughness: 0.7 }),
  )
  ;(colete.material as THREE.Material).side = THREE.DoubleSide
  colete.castShadow = true
  colete.position.y = 0.5
  corpoCowboy.add(colete)
  const cinto = cylinder(0.262, 0.262, 0.06, '#3a2414', { roughness: 0.5 })
  cinto.position.y = 0.3
  corpoCowboy.add(cinto)
  const fivela = rbox(0.09, 0.065, 0.03, 0.01, '#c9a24a', { roughness: 0.3, metalness: 0.7 })
  fivela.position.set(0, 0.3, 0.26)
  corpoCowboy.add(fivela)

  // cabeça largada de lado sobre a crina, rosto virado para a câmera (um
  // pouco pra baixo e tombado): calculada no mundo e trazida pro local
  const head = corpoCowboy.getObjectByName('head')!
  root.updateMatrixWorld(true)
  {
    const H = head.getWorldPosition(new THREE.Vector3())
    const f = new THREE.Vector3(...CAM).sub(H).normalize()
    f.y -= FACE_DROOP
    f.normalize()
    const up = new THREE.Vector3(FACE_TILT, 1, 0).normalize()
    const m = new THREE.Matrix4().lookAt(H.clone().add(f), H, up)
    const qW = new THREE.Quaternion().setFromRotationMatrix(m)
    const qP = head.parent!.getWorldQuaternion(new THREE.Quaternion())
    head.quaternion.copy(qP.invert().multiply(qW))
  }
  const HEAD_F: [number, number, number] = [head.rotation.x, head.rotation.y, head.rotation.z]

  // olhos fechados de sono (troca os olhos abertos do person por pálpebras)
  for (const o of [...head.children]) {
    const m = o as THREE.Mesh
    if (m.isMesh && o !== head.children[0]) head.remove(o)
  }
  for (const side of [-1, 1]) {
    const palp = sphere(0.062, SKIN, { roughness: 0.6 })
    palp.scale.set(1, 0.75, 0.55)
    palp.position.set(side * 0.108, 0.034, 0.215)
    head.add(palp)
    const cilio = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.01, 8, 16, Math.PI), mat('#3a2418', { roughness: 0.5 }))
    cilio.position.set(side * 0.108, 0.03, 0.25)
    cilio.rotation.set(-0.2, 0, Math.PI)
    head.add(cilio)
  }

  // beicinho de choro bem saliente (o ö de TRÖTT)
  const beicinho = new THREE.Group()
  beicinho.position.set(0, -0.15, 0.25)
  head.add(beicinho)
  const labioInf = sphere(0.06, LIP, { roughness: 0.4 })
  labioInf.scale.set(1.45, 0.8, 1.15)
  labioInf.position.set(0, -0.02, 0.03)
  beicinho.add(labioInf)
  const labioSup = capsule(0.025, 0.09, LIP, { roughness: 0.4 })
  labioSup.rotation.z = Math.PI / 2
  labioSup.position.set(0, 0.035, 0.0)
  beicinho.add(labioSup)

  // chapéu de cowboy (escorrega pro nariz)
  const chapeu = new THREE.Group()
  chapeu.position.set(0, HAT_DOWN[0], HAT_DOWN[1])
  chapeu.rotation.set(HAT_DOWN[2], 0, 0)
  head.add(chapeu)
  const aba = lathe(
    [
      [0, 0], [0.2, 0], [0.34, 0.012], [0.41, 0.055], [0.395, 0.07],
      [0.33, 0.038], [0.2, 0.035], [0.195, 0.12], [0.18, 0.21], [0.12, 0.25], [0.03, 0.225], [0, 0.23],
    ],
    HAT,
    { roughness: 0.75 },
  )
  aba.scale.set(1.32, 1.25, 1.32 * 0.88)
  chapeu.add(aba)
  const fita = cylinder(0.2, 0.2, 0.045, HAT_BAND, { roughness: 0.6 })
  fita.scale.set(1.34, 1.25, 1.34 * 0.88)
  fita.position.y = 0.08
  chapeu.add(fita)

  // braços: pivô no ombro, esticados de cansaço
  const tEuler = new THREE.Euler(P_SLUMP, 0, R_SLUMP)
  const bracoE = corpoCowboy.getObjectByName('armL')!
  const bracoD = corpoCowboy.getObjectByName('armR')!
  for (const arm of [bracoE, bracoD]) {
    shoulderPivot(arm, 1.5)
    arm.scale.y = ARM_S
    const hand = arm.children[0]
    if (hand) hand.scale.y = 1 / ARM_S
  }
  const HANG_E = hangingArm(tEuler, -0.32, 0.1)
  const HANG_D = hangingArm(tEuler, 0.32, 0.1)
  bracoE.rotation.set(...HANG_E)
  bracoD.rotation.set(...HANG_D)

  // ---- Z Z Z sobre a cabeça ---------------------------------------------------
  root.updateMatrixWorld(true)
  const cabecaW = head.getWorldPosition(new THREE.Vector3())
  const zzz = new THREE.Group()
  zzz.position.copy(cabecaW).add(new THREE.Vector3(0.5, 0.3, 0))
  zzz.rotation.y = Math.atan2(CAM[0] - zzz.position.x, CAM[2] - zzz.position.z)
  root.add(zzz)
  for (const [i, h] of [0.17, 0.23, 0.29].entries()) {
    const z = letterZ(h)
    z.position.set(i * 0.24, i * 0.27, 0)
    z.rotation.z = 0.12 - i * 0.08
    zzz.add(z)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'curral', object: base },
    { name: 'cavalo', group: 'cavalo', object: cavalo },
    { name: 'cabecaCavalo', group: 'cavalo', object: cabecaCavalo },
    { name: 'crina', group: 'cavalo', object: crina },
    { name: 'sela', group: 'cavalo', object: sela },
    { name: 'cowboy', group: 'cowboy', object: cowboy },
    { name: 'tronco', group: 'cowboy', object: corpoCowboy },
    { name: 'bracoE', group: 'cowboy', object: bracoE },
    { name: 'bracoD', group: 'cowboy', object: bracoD },
    { name: 'cabeca', group: 'cowboy', object: head },
    { name: 'chapeu', group: 'cowboy', object: chapeu },
    { name: 'sol', group: 'amanhecer', object: sol },
    { name: 'beicinho', group: 'trott', object: beicinho },
    { name: 'zzz', group: 'trott', object: zzz },
  ]

  // ---- montagem ------------------------------------------------------------
  // braço esquerdo erguido (IÁ!) e direito aberto pro lado, tronco erguido
  const UP_E: [number, number, number] = [0.2, 0, -2.7]
  const WAVE_E = -2.95
  const UP_D: [number, number, number] = [0.1, 0, 0.75]
  const HEAD_UP: [number, number, number] = [-0.35, -0.6, 0]
  const ZY = zzz.position.y

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Noite num curral de terra batida: cerca de madeira, um cacto e um laço jogado no chão.',
    }),

    seq('cavalo-rise', 'cavalo', 1.5, 0.85, [riseFrom(0, 1.8)], {
      ease: 'easeOut',
      caption: 'Sobe um cavalo xucro, crina toda desgrenhada, com a sela no lombo…',
    }),
    seq('cabeca-ergue', 'cabecaCavalo', 1.5, 0.85, [ch('rotation.z', 0.2, NECK_UP)], { ease: 'easeOut' }),
    seq('crina-arrepia', 'crina', 1.9, 0.5, [
      ch('scale.x', 0.6, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.6, 1),
    ], { ease: 'easeOut' }),
    seq('sela-cai', 'sela', 1.9, 0.6, [ch('position.y', 0.8, 0)], { ease: 'easeIn' }),

    seq('cowboy-pula', 'cowboy', 3.2, 0.6, [ch('position.y', SEAT_Y + 1.3, SEAT_Y)], {
      ease: 'easeIn',
      caption: '…e um cowboy pula na sela, gritando a noite inteira: IÁ! IÁ!',
    }),
    seq('tronco-ergue', 'tronco', 3.2, 0.6, [ch('rotation.x', 0, P_UP), ch('rotation.z', 0, 0)]),
    seq('cabeca-grita', 'cabeca', 3.2, 0.6, [
      ch('rotation.x', 0, HEAD_UP[0]), ch('rotation.y', 0, HEAD_UP[1]), ch('rotation.z', 0, HEAD_UP[2]),
    ]),
    seq('bracoE-ergue', 'bracoE', 3.2, 0.6, [
      ch('rotation.x', 0, UP_E[0]), ch('rotation.y', 0, UP_E[1]), ch('rotation.z', -0.4, UP_E[2]),
    ], { ease: 'easeOut' }),
    seq('bracoD-abre', 'bracoD', 3.2, 0.6, [
      ch('rotation.x', 0, UP_D[0]), ch('rotation.y', 0, UP_D[1]), ch('rotation.z', 0.3, UP_D[2]),
    ], { ease: 'easeOut' }),
    seq('chapeu-tras', 'chapeu', 3.2, 0.6, [
      ch('position.y', HAT_UP[0], HAT_UP[0]), ch('position.z', HAT_UP[1], HAT_UP[1]), ch('rotation.x', HAT_UP[2], HAT_UP[2]),
    ]),

    // pinotes: cada um uma TRETA nova
    seq('pinote-1', 'cavalo', 4.3, 0.4, [ch('rotation.z', 0, 0.3), ch('position.y', 0, 0.22)], {
      ease: 'easeOut',
      caption: 'O bicho pinoteia e corcoveia — cada pulo uma TRETA nova: É TRETA! É TRETA!',
    }),
    seq('pinote-1b', 'cavalo', 4.7, 0.4, [ch('rotation.z', 0.3, -0.2), ch('position.y', 0.22, 0.12)]),
    seq('pinote-2', 'cavalo', 5.1, 0.4, [ch('rotation.z', -0.2, 0.26), ch('position.y', 0.12, 0.2)]),
    seq('pinote-2b', 'cavalo', 5.5, 0.45, [ch('rotation.z', 0.26, 0), ch('position.y', 0.2, 0)], { ease: 'easeIn' }),
    seq('aceno-1', 'bracoE', 4.3, 0.4, [ch('rotation.z', UP_E[2], WAVE_E)]),
    seq('aceno-2', 'bracoE', 4.7, 0.4, [ch('rotation.z', WAVE_E, UP_E[2])]),
    seq('aceno-3', 'bracoE', 5.1, 0.4, [ch('rotation.z', UP_E[2], WAVE_E)]),
    seq('aceno-4', 'bracoE', 5.5, 0.45, [ch('rotation.z', WAVE_E, UP_E[2])]),

    // amanhece: o cavalo dorme de pé
    seq('sol-nasce', 'sol', 6.6, 1.2, [riseFrom(GY, 1.0)], {
      ease: 'easeOut',
      caption: 'Amanhece. O cavalo apaga de pé, cabeça baixa, olhos fechados…',
    }),
    seq('cabeca-dorme', 'cabecaCavalo', 6.9, 1.1, [ch('rotation.z', NECK_UP, NECK_DOWN)]),

    // o cowboy desaba
    seq('tronco-desaba', 'tronco', 8.3, 1.0, [ch('rotation.x', P_UP, P_SLUMP), ch('rotation.z', 0, R_SLUMP)], {
      ease: 'easeIn',
      caption: '…e o cowboy desaba na sela: chapéu escorrega pro nariz, braços pendurados até o chão.',
    }),
    seq('bracoE-cai', 'bracoE', 8.3, 1.0, [
      ch('rotation.x', UP_E[0], HANG_E[0]), ch('rotation.y', UP_E[1], HANG_E[1]), ch('rotation.z', UP_E[2], HANG_E[2]),
    ], { ease: 'easeIn' }),
    seq('bracoD-cai', 'bracoD', 8.3, 1.0, [
      ch('rotation.x', UP_D[0], HANG_D[0]), ch('rotation.y', UP_D[1], HANG_D[1]), ch('rotation.z', UP_D[2], HANG_D[2]),
    ], { ease: 'easeIn' }),
    seq('cabeca-tomba', 'cabeca', 8.3, 1.0, [
      ch('rotation.x', HEAD_UP[0], HEAD_F[0]), ch('rotation.y', HEAD_UP[1], HEAD_F[1]), ch('rotation.z', HEAD_UP[2], HEAD_F[2]),
    ], { ease: 'easeIn' }),
    seq('chapeu-escorrega', 'chapeu', 9.1, 0.6, [
      ch('position.y', HAT_UP[0], HAT_DOWN[0]), ch('position.z', HAT_UP[1], HAT_DOWN[1]), ch('rotation.x', HAT_UP[2], HAT_DOWN[2]),
    ], { ease: 'easeIn' }),

    // beicinho + Zs
    seq('beicinho', 'beicinho', 10.3, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Sem força nem pro -A da treta, faz beicinho e resmunga: IÁ… É… TRÖTT.',
    }),
    seq('zzz-sobe', 'zzz', 11.0, 1.0, [
      ch('position.y', ZY - 0.35, ZY), ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Jag är trött. — Estou cansado.',
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
    id: 'jag-ar-trott',
    contexto:
      'Em casa, no trabalho de manhã, no fim do treino, no inverno escuro — muitas vezes como "Jag är så trött".',
    fraseFonte: 'Estou cansado.',
    fraseAlvo: 'Jag är trött.',
    pronuncia:
      "iá é TRÖTT ('jag' = iá; 'trött' com ö CURTO: língua de Ê e lábios em bico — nunca o Ó aberto de 'trote', que dá 'trott' (acreditado); R de um toque só, de 'trave', e TT seco no fim, sem 'tchi')",
    ponteSonora:
      "IÁ! É TRÖTT! (3 batidas, tônica em TRÖTT; IÁ é o grito de cowboy E o 'jag' de sempre — I de ioga, nunca J chiado; É aberto e curto = 'är', o mesmo de 'Jag är sjuk' e 'Jag är hungrig'; TRÖTT = TRETA sem o -A, dita de BEICINHO: mantenha a língua do Ê da treta e empurre os lábios num bico de choro — é o ö, o mesmo truque de IÖR e FÖÖ; nunca troque por TROTE: o Ó aberto de 'trote' dá 'trott', que é outra palavra (acreditado); Ö CURTO, R de um toque só grudado no T, e o TT final seco — nada de 'TRÉ-tchi', que cria uma sílaba a mais)",
    historia:
      'O cowboy passou a noite inteira em cima do cavalo xucro gritando IÁ! IÁ! — o bicho pinoteava, corcoveava, e cada pulo era uma TRETA nova: É TRETA! É TRETA! Ao amanhecer os dois apagam de pé no meio do curral: o cavalo dorme, o chapéu escorrega pro nariz do cowboy, os braços pendem até o chão. Sem força nem pra soltar o -A, ele faz um beicinho de choro e resmunga o resumo da noite: IÁ... É... TRÖTT. Estou cansado.',
  },
  createScene,
  refine: { organic: ['cavalo', 'cabecaCavalo'] },
}

export default card
