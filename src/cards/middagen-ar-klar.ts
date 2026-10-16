import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Middagen är klar!" — (co)MIDA, NÉ? CLÁR(a)!
 *
 * O falcão-peregrino, o bicho mais rápido do mundo, mergulha na sala de
 * jantar com a frigideira nas garras e crava no meio da mesa um ovo frito do
 * tamanho de uma pizza, de CLARA branquinha (pronta). Ele berra "COMIDA, NÉ?
 * CLARA!", mas voa mais rápido que a voz: o CO ficou pra trás, num balão lá
 * no fogão, e os dois filhotes de babador só ouvem "MIDA, NÉ? CLAR!".
 *
 * Diorama: piso de tacos claros; mesa redonda de toalha xadrez no centro;
 * dois cadeirões brancos do outro lado; falcão em mergulho vindo da direita,
 * rastros de velocidade apontando de volta pro fogão no fundo, onde flutua o
 * balão "CO". Acento saturado RESERVADO à gema do ovo.
 */

const WOOD_A = '#d8b88a'
const WOOD_B = '#cfab79'
const WOOD_C = '#e0c49b'
const BORDER = '#8d6a45'
const TABLE_WOOD = '#9a6b42'
const CLOTH = '#f5f1e8'
const CHECK = '#bf5048'
const CHAIR = '#f3f1ec'
const TRAY = '#d9dee2'
const SLATE = '#5e6d85'
const SLATE_DARK = '#414c62'
const CREAM = '#efe3c8'
const BAR = '#2e2e34'
const HOOD = '#232328'
const YELLOW_SOFT = '#dcbd55' // olho, cera e pés: amarelo apagado
const BEAK = '#5f6670'
const BEAK_LIGHT = '#8a8f97'
const TALON = '#1c1c20'
const DOWN = '#f6f2ea'
const DOWN_SHADE = '#e7e0d3'
const BEAK_CHICK = '#f4d675'
const MOUTH = '#c8605c'
const BIB = '#4f86c6'
const IRON = '#2b2c31'
const EGG_WHITE = '#fbfaf4'
const YOLK = '#ffa30f' // acento saturado RESERVADO: a gema do ovo pronto
const STOVE = '#e9e2d3'
const STOVE_TOP = '#2f3238'
const METAL = '#a7adb4'
const INK = '#2b2e3a'

const GY = 0.12 // topo do piso
const TABLE = new THREE.Vector3(-0.3, GY, 0)
const TOP = GY + 0.724 // topo da toalha
const PAN = new THREE.Vector3(-0.25, TOP, 0.12)
const F = new THREE.Vector3(0.78, 1.6, 0.25) // falcão (centro do corpo)
const PITCH = 0.42 // cabeça para baixo-esquerda
const YAW = 0.35 // cabeça um pouco para a câmera
const HEAD_ROT = -0.72 // a cabeça se ergue do mergulho para berrar
const HANDLE_TILT = 0.12
const CAM: [number, number, number] = [0.6, 2.2, 4.3]
const FS = 1.15 // escala do falcão
const BALAO = new THREE.Vector3(2.08, 1.5, -1.1)

const Y_AXIS = new THREE.Vector3(0, 1, 0)

/** Cilindro entre dois pontos (pernas, dedos, pés de cadeira). */
function limb(a: THREE.Vector3, b: THREE.Vector3, rA: number, rB: number, color: string, opts: MatOpts = {}) {
  const dir = b.clone().sub(a)
  const len = dir.length()
  const m = cylinder(rB, rA, len, color, opts, 16)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y_AXIS, dir.normalize())
  return m
}

function shadedMesh(geo: THREE.BufferGeometry, color: string, opts: MatOpts = {}) {
  const m = new THREE.Mesh(geo, mat(color, opts))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Arco de toro: letra C. */
function arc(r: number, tube: number, angle: number, color: string) {
  return shadedMesh(new THREE.TorusGeometry(r, tube, 14, 40, angle), color, { roughness: 0.5 })
}

/** Clara do ovo: disco macio de borda ondulada (extrusão chanfrada). */
function eggWhite() {
  const shape = new THREE.Shape()
  const n = 72
  for (let i = 0; i <= n; i++) {
    const a = (i / n) * Math.PI * 2
    const r = 0.3 * (1 + 0.075 * Math.sin(5 * a + 0.4) + 0.04 * Math.sin(9 * a + 1.3))
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.012,
    bevelEnabled: true,
    bevelThickness: 0.022,
    bevelSize: 0.024,
    bevelSegments: 5,
    curveSegments: 72,
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, 0.022, 0)
  geo.computeVertexNormals()
  return shadedMesh(geo, EGG_WHITE, { roughness: 0.32, detail: 0.3 })
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- piso de tacos claros (cesto trançado) --------------------------------
  const piso = new THREE.Group()
  const disco = cylinder(2.62, 2.7, 0.1, BORDER, { roughness: 0.7 })
  disco.position.y = 0.05
  piso.add(disco)

  const R = 2.5
  const cell = 0.6
  const slatW = 0.185
  const tones = [WOOD_A, WOOD_B, WOOD_C]
  for (let ci = -5; ci <= 5; ci++) {
    for (let cj = -5; cj <= 5; cj++) {
      const cx = ci * cell
      const cz = cj * cell
      const alongX = (ci + cj) % 2 === 0
      for (let k = -1; k <= 1; k++) {
        const off = k * (slatW + 0.012)
        // slat ao longo de u, deslocado em v; recorta pela corda do círculo
        const vC = (alongX ? cz : cx) + off
        const vMax = Math.max(Math.abs(vC - slatW / 2), Math.abs(vC + slatW / 2))
        if (vMax >= R) continue
        const half = Math.sqrt(R * R - vMax * vMax)
        const uC = alongX ? cx : cz
        const u0 = Math.max(uC - cell / 2 + 0.007, -half)
        const u1 = Math.min(uC + cell / 2 - 0.007, half)
        if (u1 - u0 < 0.06) continue
        const len = u1 - u0
        const mid = (u0 + u1) / 2
        const tone = tones[Math.floor(rand() * 3)]
        const taco = rbox(alongX ? len : slatW, 0.02, alongX ? slatW : len, 0.006, tone, { roughness: 0.6 })
        taco.position.set(alongX ? mid : vC, 0.11, alongX ? vC : mid)
        piso.add(taco)
      }
    }
  }
  const moldura = lathe(
    [[2.28, 0.1], [2.64, 0.1], [2.64, 0.135], [2.28, 0.135], [2.28, 0.1]],
    BORDER,
    { roughness: 0.6 },
    96,
  )
  piso.add(moldura)
  root.add(piso)

  // ---- mesa redonda com toalha xadrez --------------------------------------
  const mesa = new THREE.Group()
  mesa.position.copy(TABLE)
  root.add(mesa)

  const pedestal = lathe(
    [[0, 0], [0.34, 0], [0.35, 0.03], [0.22, 0.08], [0.09, 0.15], [0.065, 0.3], [0.085, 0.48], [0.06, 0.62], [0.12, 0.665], [0, 0.665]],
    TABLE_WOOD,
    { roughness: 0.5 },
  )
  mesa.add(pedestal)

  const tampo = cylinder(0.8, 0.8, 0.04, TABLE_WOOD, { roughness: 0.5 })
  tampo.position.y = 0.68
  mesa.add(tampo)

  const toalha = cylinder(0.855, 0.855, 0.02, CLOTH, { roughness: 0.9 })
  toalha.position.y = 0.71
  mesa.add(toalha)

  const sq = 0.15
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      if ((i + j + 12) % 2 !== 0) continue
      const x = i * sq
      const z = j * sq
      const far = Math.hypot(Math.abs(x) + sq / 2, Math.abs(z) + sq / 2)
      if (far > 0.84) continue
      const q = rbox(sq, 0.006, sq, 0.002, CHECK, { roughness: 0.9 })
      q.position.set(x, 0.721, z)
      mesa.add(q)
    }
  }

  const nPanels = 28
  for (let i = 0; i < nPanels; i++) {
    const a = (i / nPanels) * Math.PI * 2
    for (let row = 0; row < 2; row++) {
      const p = rbox(0.2, 0.11, 0.012, 0.004, (i + row) % 2 === 0 ? CHECK : CLOTH, { roughness: 0.9 })
      p.position.set(Math.sin(a) * 0.858, 0.665 - row * 0.11, Math.cos(a) * 0.858)
      p.rotation.y = a
      mesa.add(p)
    }
  }

  // ---- cadeirões + filhotes ------------------------------------------------
  const lookAt = new THREE.Vector3(0.35, 0, 2.3)
  const seats = [
    new THREE.Vector3(-1.32, GY, -0.56),
    new THREE.Vector3(-0.66, GY, -1.02),
  ]
  const yaws = seats.map((s) => Math.atan2(lookAt.x - s.x, lookAt.z - s.z))

  const cadeiroes = new THREE.Group()
  root.add(cadeiroes)
  seats.forEach((s, idx) => {
    const c = new THREE.Group()
    c.position.copy(s)
    c.rotation.y = yaws[idx]
    cadeiroes.add(c)
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        c.add(limb(
          new THREE.Vector3(sx * 0.25, 0, sz * 0.23),
          new THREE.Vector3(sx * 0.15, 0.6, sz * 0.12),
          0.026, 0.022, CHAIR, { roughness: 0.4 },
        ))
      }
    }
    const assento = rbox(0.36, 0.05, 0.34, 0.02, CHAIR, { roughness: 0.4 })
    assento.position.y = 0.61
    c.add(assento)
    const encosto = rbox(0.36, 0.52, 0.05, 0.04, CHAIR, { roughness: 0.4 })
    encosto.position.set(0, 0.88, -0.16)
    encosto.rotation.x = -0.1
    c.add(encosto)
    for (const sx of [-1, 1]) {
      const braco = rbox(0.04, 0.04, 0.3, 0.015, CHAIR, { roughness: 0.4 })
      braco.position.set(sx * 0.18, 0.79, 0.02)
      c.add(braco)
      const poste = cylinder(0.014, 0.014, 0.16, CHAIR, { roughness: 0.4 })
      poste.position.set(sx * 0.18, 0.7, 0.12)
      c.add(poste)
    }
    const bandeja = rbox(0.5, 0.035, 0.2, 0.015, TRAY, { roughness: 0.35 })
    bandeja.position.set(0, 0.83, 0.3)
    c.add(bandeja)
    const aba = rbox(0.5, 0.05, 0.02, 0.01, TRAY, { roughness: 0.35 })
    aba.position.set(0, 0.86, 0.395)
    c.add(aba)
    const apoio = rbox(0.3, 0.03, 0.08, 0.01, CHAIR, { roughness: 0.4 })
    apoio.position.set(0, 0.3, 0.18)
    c.add(apoio)
  })

  const filhotes = new THREE.Group()
  root.add(filhotes)
  const babadores = new THREE.Group()
  filhotes.add(babadores)

  seats.forEach((s, idx) => {
    const g = new THREE.Group()
    g.position.set(s.x, s.y + 0.635, s.z)
    g.rotation.y = yaws[idx]
    filhotes.add(g)
    const fr = rng(80 + idx)

    const corpo = sphere(0.21, DOWN, { roughness: 0.92 })
    corpo.scale.set(1, 1.05, 0.95)
    corpo.position.y = 0.19
    g.add(corpo)
    // tufos de penugem pelo corpo
    for (let t = 0; t < 7; t++) {
      const a = fr() * Math.PI * 2
      const tufo = sphere(0.075 + fr() * 0.03, t % 2 ? DOWN : DOWN_SHADE, { roughness: 0.95 })
      tufo.position.set(Math.cos(a) * 0.17, 0.12 + fr() * 0.16, Math.sin(a) * 0.15 - 0.03)
      g.add(tufo)
    }
    const cabeca = sphere(0.16, DOWN, { roughness: 0.92 })
    cabeca.position.set(0, 0.48, 0.02)
    g.add(cabeca)
    for (const [tx, ty, tz, tr] of [[0, 0.64, 0, 0.05], [-0.05, 0.62, -0.03, 0.04], [0.05, 0.625, -0.02, 0.042]] as const) {
      const topete = sphere(tr, DOWN, { roughness: 0.95 })
      topete.position.set(tx, ty, tz)
      g.add(topete)
    }
    for (const side of [-1, 1]) {
      const asinha = sphere(0.085, DOWN_SHADE, { roughness: 0.92 })
      asinha.scale.set(0.5, 1, 0.8)
      asinha.position.set(side * 0.21, 0.27, 0)
      asinha.rotation.z = side * 0.9
      g.add(asinha)

      const olho = sphere(0.04, '#1b1b1f', { roughness: 0.2 })
      olho.position.set(side * 0.066, 0.52, 0.13)
      g.add(olho)
      const brilho = sphere(0.012, '#ffffff', { roughness: 0.2 })
      brilho.position.set(side * 0.058, 0.535, 0.165)
      g.add(brilho)
    }
    const boca = sphere(0.05, MOUTH, { roughness: 0.5 })
    boca.position.set(0, 0.43, 0.15)
    g.add(boca)
    const bicoSup = cone(0.06, 0.1, BEAK_CHICK, { roughness: 0.45 })
    bicoSup.rotation.x = Math.PI / 2 - 0.6
    bicoSup.position.set(0, 0.455 + 0.028, 0.14 + 0.041)
    g.add(bicoSup)
    const bicoInf = cone(0.05, 0.08, BEAK_CHICK, { roughness: 0.45 })
    bicoInf.rotation.x = Math.PI / 2 + 0.65
    bicoInf.position.set(0, 0.405 - 0.024, 0.14 + 0.032)
    g.add(bicoInf)

    // babador azul: calota esférica na frente do peito + tira no pescoço
    const bib = new THREE.Group()
    bib.position.copy(g.position)
    bib.rotation.y = g.rotation.y
    babadores.add(bib)
    const pano = shadedMesh(
      new THREE.SphereGeometry(0.218, 32, 16, Math.PI / 2 - 0.95, 1.9, 0.6, 1.05),
      BIB,
      { roughness: 0.85 },
    )
    pano.scale.set(1, 1.05, 0.95)
    pano.position.y = 0.19
    bib.add(pano)
    const tira = torus(0.135, 0.013, BIB, { roughness: 0.85 })
    tira.rotation.x = Math.PI / 2
    tira.position.y = 0.355
    bib.add(tira)
  })

  // ---- fogão no fundo da sala ----------------------------------------------
  const fogao = new THREE.Group()
  fogao.position.set(1.88, GY, -1.08)
  fogao.rotation.y = -0.55
  root.add(fogao)

  const rodape = rbox(0.6, 0.06, 0.5, 0.02, STOVE_TOP, { roughness: 0.6 })
  rodape.position.y = 0.03
  fogao.add(rodape)
  const caixa = rbox(0.66, 0.72, 0.56, 0.05, STOVE, { roughness: 0.35 })
  caixa.position.y = 0.42
  fogao.add(caixa)
  const chapa = rbox(0.67, 0.03, 0.57, 0.012, STOVE_TOP, { roughness: 0.4 })
  chapa.position.y = 0.79
  fogao.add(chapa)
  const espelho = rbox(0.66, 0.18, 0.05, 0.02, STOVE, { roughness: 0.35 })
  espelho.position.set(0, 0.89, -0.26)
  fogao.add(espelho)
  for (const [bx, bz] of [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.13], [0.15, 0.13]] as const) {
    const boca = torus(0.075, 0.016, '#1b1c20', { roughness: 0.5 })
    boca.rotation.x = Math.PI / 2
    boca.position.set(bx, 0.81, bz)
    fogao.add(boca)
    const tampa = cylinder(0.04, 0.045, 0.02, '#1b1c20', { roughness: 0.5 })
    tampa.position.set(bx, 0.815, bz)
    fogao.add(tampa)
  }
  // a boca de onde o ovo saiu ainda acesa
  const chama = torus(0.06, 0.012, '#5aa0ff', { emissive: '#3d8bff', emissiveIntensity: 1.4 })
  chama.rotation.x = Math.PI / 2
  chama.position.set(0.15, 0.83, 0.13)
  fogao.add(chama)
  const vidro = rbox(0.42, 0.25, 0.02, 0.03, '#3a3f47', { roughness: 0.15 })
  vidro.position.set(0, 0.4, 0.285)
  fogao.add(vidro)
  const puxador = cylinder(0.016, 0.016, 0.44, METAL, { roughness: 0.3, metalness: 0.7 })
  puxador.rotation.z = Math.PI / 2
  puxador.position.set(0, 0.6, 0.33)
  fogao.add(puxador)
  for (const px of [-0.2, 0.2]) {
    const suporte = cylinder(0.012, 0.012, 0.05, METAL, { roughness: 0.3, metalness: 0.7 })
    suporte.rotation.x = Math.PI / 2
    suporte.position.set(px, 0.6, 0.305)
    fogao.add(suporte)
  }
  for (const kx of [-0.22, -0.075, 0.075, 0.22]) {
    const botao = cylinder(0.032, 0.032, 0.035, '#3a3c42', { roughness: 0.4 })
    botao.rotation.x = Math.PI / 2
    botao.position.set(kx, 0.69, 0.29)
    fogao.add(botao)
  }

  // ---- FALCÃO-peregrino em mergulho ----------------------------------------
  const falcao = new THREE.Group()
  falcao.position.copy(F)
  root.add(falcao)

  const pose = new THREE.Group()
  pose.rotation.set(0, YAW, PITCH, 'YXZ')
  pose.scale.setScalar(FS)
  falcao.add(pose)

  const dorso = sphere(0.28, SLATE, { roughness: 0.75 })
  dorso.scale.set(1.55, 0.95, 0.92)
  pose.add(dorso)

  const peito = sphere(0.27, CREAM, { roughness: 0.85 })
  peito.scale.set(1.3, 0.85, 0.82)
  peito.position.set(-0.12, -0.08, 0)
  pose.add(peito)

  // listrinhas pretas do peito (meio enterradas na superfície)
  const pc = new THREE.Vector3(-0.12, -0.08, 0)
  const pr = new THREE.Vector3(0.351, 0.2295, 0.2214)
  const rows = [0.55, 0.82, 1.1, 1.38]
  rows.forEach((u, ri) => {
    for (const v of ri % 2 ? [-0.7, -0.25, 0.25, 0.7] : [-0.48, 0, 0.48]) {
      const p = new THREE.Vector3(
        -Math.cos(u) * Math.cos(v) * pr.x,
        -Math.sin(u) * Math.cos(v) * pr.y,
        Math.sin(v) * pr.z,
      ).multiplyScalar(0.97).add(pc)
      const listra = sphere(0.03, BAR, { roughness: 0.8 })
      listra.scale.set(0.45, 0.45, 1.5)
      listra.position.copy(p)
      listra.rotation.y = -v * 0.8
      pose.add(listra)
    }
  })

  const pescoco = sphere(0.17, SLATE, { roughness: 0.75 })
  pescoco.position.set(-0.36, 0.07, 0)
  pose.add(pescoco)

  const cauda = cone(0.14, 0.52, SLATE, { roughness: 0.75 })
  cauda.rotation.z = -Math.PI / 2
  cauda.scale.set(1, 1, 0.42)
  cauda.position.set(0.56, 0.04, 0)
  pose.add(cauda)
  const caudaPonta = sphere(0.1, SLATE_DARK, { roughness: 0.75 })
  caudaPonta.scale.set(0.9, 0.42, 1.2)
  caudaPonta.position.set(0.74, 0.04, 0)
  pose.add(caudaPonta)

  // ---- cabeça: capuz preto, bigode, anel amarelo, bico curvo aberto ---------
  const cabeca = new THREE.Group()
  cabeca.position.set(-0.5, 0.12, 0)
  cabeca.rotation.z = HEAD_ROT
  pose.add(cabeca)

  const cranio = sphere(0.185, CREAM, { roughness: 0.8 })
  cabeca.add(cranio)
  const capuz = sphere(0.19, HOOD, { roughness: 0.7 })
  capuz.scale.set(1.0, 0.95, 1.03)
  capuz.position.set(0.035, 0.045, 0)
  cabeca.add(capuz)
  for (const side of [-1, 1]) {
    const bigode = capsule(0.036, 0.1, HOOD, { roughness: 0.7 })
    bigode.position.set(-0.07, -0.07, side * 0.152)
    bigode.rotation.z = 0.3
    cabeca.add(bigode)

    const anel = sphere(0.062, YELLOW_SOFT, { roughness: 0.5 })
    anel.scale.set(1, 1, 0.6)
    anel.position.set(-0.075, 0.035, side * 0.148)
    cabeca.add(anel)
    const olho = sphere(0.047, '#17171b', { roughness: 0.15 })
    olho.scale.set(1, 1, 0.6)
    olho.position.set(-0.08, 0.037, side * 0.17)
    cabeca.add(olho)
    const brilho = sphere(0.013, '#ffffff', { roughness: 0.2 })
    brilho.position.set(-0.095, 0.052, side * 0.195)
    cabeca.add(brilho)
    // sobrancelha determinada
    const sobrancelha = capsule(0.022, 0.08, HOOD, { roughness: 0.7 })
    sobrancelha.position.set(-0.08, 0.1, side * 0.15)
    sobrancelha.rotation.z = Math.PI / 2 + 0.35
    cabeca.add(sobrancelha)
  }
  const cera = sphere(0.052, YELLOW_SOFT, { roughness: 0.5 })
  cera.scale.set(0.8, 0.9, 1.1)
  cera.position.set(-0.17, 0.0, 0)
  cabeca.add(cera)
  const boca = sphere(0.05, '#7d2b31', { roughness: 0.5 })
  boca.position.set(-0.18, -0.065, 0)
  cabeca.add(boca)
  const bicoSup = cone(0.058, 0.125, BEAK, { roughness: 0.4 })
  bicoSup.rotation.z = Math.PI / 2 + 0.62
  bicoSup.position.set(-0.19 - 0.051, -0.015 - 0.036, 0)
  cabeca.add(bicoSup)
  // ponta em gancho, curvada pra baixo
  const gancho = cone(0.017, 0.05, BEAK, { roughness: 0.4 })
  gancho.rotation.z = Math.PI - 0.35
  gancho.position.set(-0.283, -0.103, 0)
  cabeca.add(gancho)
  const bicoInf = cone(0.04, 0.1, BEAK_LIGHT, { roughness: 0.45 })
  bicoInf.rotation.z = Math.PI / 2 + 1.05
  bicoInf.position.set(-0.17 - 0.026, -0.075 - 0.043, 0)
  cabeca.add(bicoInf)

  // ---- asas dobradas pra trás em V -----------------------------------------
  const asas = new THREE.Group()
  pose.add(asas)
  for (const side of [-1, 1]) {
    const asa = new THREE.Group()
    asa.position.set(-0.2, 0.1, side * 0.2)
    asa.rotation.set(0, -side * 0.22, 0.02)
    asas.add(asa)
    const cobertura = sphere(1, SLATE, { roughness: 0.75 })
    cobertura.scale.set(0.42, 0.17, 0.075)
    cobertura.position.x = 0.3
    asa.add(cobertura)
    // rêmiges: uma lâmina longa e pontuda, varrida pra trás
    const remiges = cone(0.15, 0.66, SLATE_DARK, { roughness: 0.75 })
    remiges.rotation.z = -Math.PI / 2
    remiges.scale.set(1, 1, 0.32)
    remiges.position.set(0.6, 0.02, side * 0.012)
    asa.add(remiges)
    const ponta = cone(0.09, 0.32, '#343d50', { roughness: 0.75 })
    ponta.rotation.z = -Math.PI / 2
    ponta.scale.set(1, 1, 0.3)
    ponta.position.set(0.8, 0.025, side * 0.02)
    asa.add(ponta)
    // barras escuras na cobertura
    for (const bx of [0.18, 0.36]) {
      const faixa = sphere(1, SLATE_DARK, { roughness: 0.75 })
      faixa.scale.set(0.03, 0.14, 0.03)
      faixa.position.set(bx, 0, side * 0.055)
      asa.add(faixa)
    }
  }

  // ---- frigideira (filha do falcão: chega com ele) --------------------------
  const frigideira = new THREE.Group()
  frigideira.position.copy(PAN).sub(F)
  falcao.add(frigideira)

  const panela = lathe(
    [[0, 0], [0.33, 0], [0.37, 0.012], [0.405, 0.07], [0.415, 0.085], [0.398, 0.088], [0.385, 0.075], [0.35, 0.028], [0, 0.022]],
    IRON,
    { roughness: 0.4, metalness: 0.6 },
    56,
  )
  frigideira.add(panela)
  const hDir = new THREE.Vector3(Math.cos(HANDLE_TILT), Math.sin(HANDLE_TILT), 0)
  const hStart = new THREE.Vector3(0.39, 0.06, 0)
  const hEnd = hStart.clone().addScaledVector(hDir, 0.72)
  frigideira.add(limb(hStart, hEnd, 0.03, 0.027, IRON, { roughness: 0.4, metalness: 0.6 }))
  const argola = torus(0.03, 0.01, IRON, { roughness: 0.4, metalness: 0.6 })
  argola.position.copy(hEnd).addScaledVector(hDir, 0.03)
  argola.rotation.z = HANDLE_TILT
  frigideira.add(argola)

  // ---- ovo frito gigante ---------------------------------------------------
  const ovo = new THREE.Group()
  ovo.position.y = 0.022
  frigideira.add(ovo)
  const clara = eggWhite()
  ovo.add(clara)
  const gema = sphere(0.125, YOLK, { roughness: 0.18 })
  gema.scale.set(1, 0.62, 1)
  gema.position.set(0.03, 0.058, 0.02)
  ovo.add(gema)
  const reflexo = sphere(0.03, '#fff3d6', { roughness: 0.1 })
  reflexo.scale.set(1.3, 0.5, 1)
  reflexo.position.set(-0.01, 0.125, 0.06)
  ovo.add(reflexo)

  // ---- pés amarelos agarrando o cabo ---------------------------------------
  const pes = new THREE.Group()
  falcao.add(pes)
  const toF = (v: THREE.Vector3) => v.clone().multiplyScalar(FS).applyEuler(pose.rotation)
  const panLocal = PAN.clone().sub(F)
  for (const [i, s] of [[0, 0.5], [1, 0.62]] as const) {
    const side = i === 0 ? 1 : -1
    const coxaPos = toF(new THREE.Vector3(0.02, -0.25, side * 0.08))
    const grip = panLocal.clone().add(hStart).addScaledVector(hDir, s)
    const pe = grip.clone().add(new THREE.Vector3(0, 0.045, 0))

    const coxa = sphere(0.085, CREAM, { roughness: 0.85 })
    coxa.scale.set(1, 1.35, 1)
    coxa.position.copy(coxaPos)
    coxa.quaternion.setFromUnitVectors(Y_AXIS, coxaPos.clone().sub(pe).normalize())
    pes.add(coxa)
    pes.add(limb(coxaPos.clone().lerp(pe, 0.2), pe, 0.03, 0.026, YELLOW_SOFT, { roughness: 0.5 }))
    const almofada = sphere(0.04, YELLOW_SOFT, { roughness: 0.5 })
    almofada.position.copy(pe)
    pes.add(almofada)
    const toes: [number, number][] = [[-0.045, 1], [0, 1], [0.045, 1], [0, -1]]
    for (const [dx, dz] of toes) {
      const a = pe.clone().add(new THREE.Vector3(dx * 0.6, 0, dz * 0.01))
      const b = grip.clone().add(new THREE.Vector3(dx, -0.005, dz * 0.05))
      pes.add(limb(a, b, 0.018, 0.015, YELLOW_SOFT, { roughness: 0.5 }))
      const garra = cone(0.012, 0.045, TALON, { roughness: 0.3 })
      garra.position.copy(b).add(new THREE.Vector3(0, -0.02, -dz * 0.008))
      garra.rotation.set(Math.PI + dz * 0.5, 0, 0)
      pes.add(garra)
    }
  }

  // ---- rastros de velocidade (apontam de volta pro fogão) -------------------
  const rastros = new THREE.Group()
  const tailDir = toF(new THREE.Vector3(1, 0.12, 0)).normalize()
  rastros.position.copy(toF(new THREE.Vector3(1.05, 0.16, 0)))
  rastros.quaternion.setFromUnitVectors(Y_AXIS, tailDir)
  falcao.add(rastros)
  const trails: [number, number, number, number][] = [
    [0.22, 0.0, 0.1, 0.5],
    [-0.08, 0.12, 0.2, 0.68],
    [-0.28, 0.05, -0.12, 0.42],
  ]
  for (const [ox, oy, oz, len] of trails) {
    const geo = new THREE.CylinderGeometry(0.006, 0.028, len, 16)
    geo.translate(0, len / 2, 0)
    const linha = shadedMesh(geo, '#ffffff', { roughness: 0.5 })
    linha.position.set(ox, oy, oz)
    rastros.add(linha)
  }

  // ---- balão "CO" deixado pra trás -----------------------------------------
  const balao = new THREE.Group()
  balao.position.copy(BALAO)
  const dx = CAM[0] - BALAO.x
  const dz = CAM[2] - BALAO.z
  balao.rotation.set(-Math.atan2(CAM[1] - BALAO.y, Math.hypot(dx, dz)) * 0.8, Math.atan2(dx, dz), 0, 'YXZ')
  root.add(balao)

  const nuvem = sphere(0.3, '#ffffff', { roughness: 0.6 })
  nuvem.scale.set(1.25, 0.8, 0.32)
  balao.add(nuvem)
  const rabicho = cone(0.075, 0.2, '#ffffff', { roughness: 0.6 })
  rabicho.scale.z = 0.5
  rabicho.rotation.z = Math.PI - 0.35
  rabicho.position.set(-0.12, -0.27, 0)
  balao.add(rabicho)
  const letraC = arc(0.075, 0.024, Math.PI * 1.45, INK)
  letraC.rotation.z = Math.PI * 0.275
  letraC.position.set(-0.115, 0, 0.1)
  balao.add(letraC)
  const letraO = torus(0.075, 0.024, INK, { roughness: 0.5 })
  letraO.scale.set(0.9, 1, 1)
  letraO.position.set(0.115, 0, 0.1)
  balao.add(letraO)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'sala', object: piso },
    { name: 'mesa', group: 'sala', object: mesa },
    { name: 'cadeiroes', group: 'filhotes', object: cadeiroes },
    { name: 'filhotes', group: 'filhotes', object: filhotes },
    { name: 'babadores', group: 'filhotes', object: babadores },
    { name: 'fogao', group: 'fogao', object: fogao },
    { name: 'falcao', group: 'falcao', object: falcao },
    { name: 'cabeca', group: 'falcao', object: cabeca },
    { name: 'asas', group: 'falcao', object: asas },
    { name: 'pes', group: 'falcao', object: pes },
    { name: 'frigideira', group: 'falcao', object: frigideira },
    { name: 'ovo', group: 'falcao', object: ovo },
    { name: 'rastros', group: 'falcao', object: rastros },
    { name: 'balao', group: 'co', object: balao },
  ]

  // ---- montagem ------------------------------------------------------------
  const PAN_Y = frigideira.position.y
  const dive = tailDir.clone().multiplyScalar(3.4)
  const T = 5.5 // início do mergulho
  const HIT = T + 0.9

  const build = [
    seq('piso-sobe', 'piso', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma sala de jantar sobe do chão: piso de tacos claros e, no meio, a mesa redonda de toalha xadrez.',
    }),
    seq('mesa-sobe', 'mesa', 0.6, 0.7, [riseFrom(GY, 1.0)], { ease: 'easeOut' }),

    seq('cadeiroes-sobem', 'cadeiroes', 1.9, 0.7, [riseFrom(0, 1.3)], {
      ease: 'easeOut',
      caption: 'Do outro lado, dois filhotes de falcão esperam o jantar nos cadeirões, de bico aberto.',
    }),
    seq('filhotes-pousam', 'filhotes', 2.4, 0.6, [ch('position.y', 0.9, 0)], { ease: 'easeOut' }),
    seq('babadores-caem', 'babadores', 3.0, 0.45, [ch('position.y', 0.45, 0)], { ease: 'easeIn' }),

    seq('fogao-sobe', 'fogao', 3.8, 0.7, [riseFrom(GY, 1.1)], {
      ease: 'easeOut',
      caption: 'Lá no fundo, o fogão: o pai só tira o ovo do fogo quando a CLARA fica branquinha — pronta.',
    }),

    seq('falcao-mergulha', 'falcao', T, 0.9, [
      ch('position.x', F.x + dive.x, F.x),
      ch('position.y', F.y + dive.y, F.y),
      ch('position.z', F.z + dive.z, F.z),
    ], {
      ease: 'easeIn',
      caption: 'E vem o FALCÃO-peregrino, num mergulho de 390 km/h, com a frigideira nas garras!',
    }),
    seq('cabeca-ergue', 'cabeca', T, 0.9, [ch('rotation.z', HEAD_ROT + 0.35, HEAD_ROT)], { ease: 'easeIn' }),
    seq('asas-dobram', 'asas', T, 0.7, [ch('scale.z', 2.6, 1)], { ease: 'easeOut' }),
    seq('pes-esticam', 'pes', T, 0.9, [ch('scale.y', 0.55, 1)], { ease: 'easeIn' }),
    seq('frigideira-nivela', 'frigideira', T, 0.9, [ch('rotation.z', 0.3, 0)], { ease: 'easeIn' }),
    seq('ovo-gira', 'ovo', T, 0.9, [ch('rotation.y', 1.2, 0)], { ease: 'easeOut' }),
    seq('rastros-crescem', 'rastros', T + 0.25, 0.8, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),

    seq('frigideira-quica', 'frigideira', HIT, 0.14, [ch('position.y', PAN_Y, PAN_Y + 0.07)], {
      ease: 'easeOut',
      caption: 'Crava o ovo gigante no meio da mesa e berra pros filhotes: "COMIDA, NÉ? CLARA!"',
    }),
    seq('frigideira-assenta', 'frigideira', HIT + 0.14, 0.2, [ch('position.y', PAN_Y + 0.07, PAN_Y)], { ease: 'easeIn' }),
    seq('ovo-chacoalha', 'ovo', HIT + 0.1, 0.45, [ch('scale.y', 0.45, 1), ch('scale.x', 1.12, 1), ch('scale.z', 1.12, 1)], {
      ease: 'easeOut',
    }),
    seq('cabeca-berra', 'cabeca', HIT + 0.2, 0.35, [ch('rotation.z', HEAD_ROT - 0.25, HEAD_ROT)], { ease: 'easeOut' }),

    seq('balao-surge', 'balao', 8.2, 0.55, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Só que ele voa mais rápido que a própria voz: o CO ficou lá atrás, no fogão…',
    }),
    seq('balao-balanca', 'balao', 8.75, 0.6, [ch('position.y', BALAO.y + 0.1, BALAO.y)], { ease: 'easeInOut' }),

    seq('filhotes-pulam', 'filhotes', 9.9, 0.22, [ch('position.y', 0, 0.09)], {
      ease: 'easeOut',
      caption: '…e os filhotes, na mesa, só ouvem: "MIDA, NÉ? CLAR!"',
    }),
    seq('filhotes-descem', 'filhotes', 10.12, 0.22, [ch('position.y', 0.09, 0)], { ease: 'easeIn' }),

    seq('filhotes-pulam-2', 'filhotes', 11.3, 0.22, [ch('position.y', 0, 0.09)], {
      ease: 'easeOut',
      caption: 'Middagen är klar! — O jantar está pronto!',
    }),
    seq('filhotes-descem-2', 'filhotes', 11.52, 0.22, [ch('position.y', 0.09, 0)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.42, 1.38, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'middagen-ar-klar',
    contexto:
      "Casa: o grito da cozinha pra casa inteira, lá pelas cinco e meia, seis da tarde — o jantar sueco é cedo. Você também vai ouvir 'Maten är klar!' (a comida está pronta) e 'Kom och ät!' (venham comer).",
    fraseFonte: 'O jantar está pronto!',
    fraseAlvo: 'Middagen är klar!',
    pronuncia:
      "MÍD-dan é KLÁÁR! (na fala, 'middagen' encolhe pra 'middan', como 'födelsedagen' vira 'födelsedan' — com calma também se ouve MÍD-da-guen; força no MID, I curto e D dobrado, segurado um instante; o -an fraquinho, N na língua e sem nasal; 'är' = É aberto e curto; 'klar' com A LONGO e o R do fim brando, mas audível)",
    ponteSonora:
      "(co)MIDA, NÉ? CLÁR(a)! (4 sílabas: MÍD-da-ne-KLÁÁR; força no MÍD e, maior, no CLÁ; MIDA = a COMIDA sem o CO, que ficou pra trás no mergulho: o português já põe a força no MI (co-MI-da), então é só arrancar o CO e a palavra começa na sílaba forte; I CURTO e o D segurado um instante (é 'dd', dobrado), D de 'dado', nunca 'dji'; o -da fraquinho; NÉ = o 'né?' que todo brasileiro gruda no fim da frase, colado no MIDA sem pausa — e ele vale por dois: o N é o artigo colado no fim do jantar (middag = jantar, middan = O jantar, o mesmo N de IS-KÚÚ-LAN e IÁK-KAN), e o É é o 'är', aberto e curto, o mesmo de 'Jag är klar'; mas sai FRACO, só a cola entre as duas palavras (o português dá força ao 'né'; aqui não): MÍD-da-ne-KLÁR; é 'middan' porque na fala 'middagen' encolhe, como 'födelsedagen' vira 'födelsedan' (o SEDÁN da zebra); CLÁR(a) = a MESMA CLARA sem o -A do maestro de 'Jag är klar' — lá, clara em neve; aqui, a clara do ovo frito que ficou branquinha, pronta —: A LONGO e de boca bem aberta, e o R do fim BRANDO, um toque de língua, mas AUDÍVEL — sem ele sobra 'kla'; com o -A de volta vira 'klara', a CLARA inteira de 'Kan du förklara?')",
    historia:
      "Na casa do FALCÃO-peregrino, o bicho mais rápido do mundo, o jantar é um ovo frito do tamanho de uma pizza, e ele só tira do fogo quando a CLARA fica branquinha — pronta. Pra não esfriar, agarra a frigideira com as garras e leva até a mesa num mergulho de 390 km/h, berrando pros filhotes: 'COMIDA, NÉ? CLARA!' Só que ele voa mais rápido que a própria voz: o CO ficou lá atrás, no fogão, e o -A ainda vem chegando pelo corredor. Na mesa, os filhotes de babador só ouvem 'MIDA, NÉ? CLAR!' — o jantar está pronto.",
  },
  createScene,
  refine: { organic: ['falcao', 'cabeca', 'filhotes'] },
}

export default card
