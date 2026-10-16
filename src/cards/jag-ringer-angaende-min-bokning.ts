import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus,
} from '../rig/helpers'

/**
 * "Jag ringer angående min bokning." — o lêmure reservou o RINGUE do clube
 * pra ensaiar TANGO: chega de rosa na boca e acha o livro de reservas vazio
 * (NINGUÉM na linha dele). Liga pra recepção — IÁ, aqui do RINGUE! — e cai
 * num TANGO de espera sem fim; berra TANGO não! ATENDE!, o sinal come as
 * pontas (...ÁNGO-ENDE!) e ele bate o pé no livro: MINHA... BOOK... NINGUÉM?!
 *
 * Diorama: piso de tacos do clube, tablado azul com holofote claro no meio,
 * postes vermelhos acolchoados e cordas brancas (frente aberta). No centro, o
 * lêmure em pose de tango — braço em arco sobre a cabeça, celular na orelha,
 * cauda anelada em S — com a ponta do pé no livro gigante aberto; três notas
 * douradas saem do celular.
 */

const PLANK = '#6b4831'
const PLANK_ALT = '#4f3322'
const APRON = '#1c336d'
const CANVAS = '#4a72c2'
const SPOT = '#638cd8'
const POST = '#a8262e'
const POST_DARK = '#7a1820'
const ROPE = '#f3eee4'
const STEEL = '#5f666e'
const FUR = '#a39e99'
const FUR_DARK = '#6f6965'
const FUR_WHITE = '#f1ede6'
const MASK = '#211f22'
const IRIS = '#f0891c'
const COVER = '#6a1d2e'
const COVER_DARK = '#4e1421'
const PAGE = '#efe5cc'
const LINE = '#aaa398'
const GOLD = '#e9b13a'
const STEM = '#3d7a37'
const PHONE = '#1b1b20'
const ROSE = '#e3122b' // acento saturado RESERVADO à rosa do tango
const ROSE_DARK = '#a50c20'

const PY = 0.45 // topo da lona
const PX = 1.55 // meia-largura do ringue (postes)
const PZ = 1.3 // meia-profundidade
const LX = -0.05 // lêmure
const LZ = -0.2
const LROT = -0.12
const BOOK: [number, number] = [0.2, 0.5] // centro do livro (x, z)
const BOOK_ROT = -0.12
const ARM_DOWN = 2.55 // braço do arco recolhido (rotation.z, pivô no ombro)
const PHONE_DOWN = 2.3 // braço do celular recolhido (rotation.x, pivô no ombro)
const NOTES_Y = PY + 1.2

const UP = new THREE.Vector3(0, 1, 0)
const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
const FURRY = { roughness: 0.9 }

/** Segmento afunilado entre dois pontos, com esferas nas juntas. */
function limb(
  parent: THREE.Object3D,
  a: THREE.Vector3,
  b: THREE.Vector3,
  ra: number,
  rb: number,
  color: string,
) {
  const d = b.clone().sub(a)
  const len = d.length()
  const c = cylinder(rb, ra, len, color, FURRY, 20)
  c.position.copy(a).addScaledVector(d, 0.5)
  c.quaternion.setFromUnitVectors(UP, d.normalize())
  parent.add(c)
  const ja = sphere(ra, color, FURRY, 20)
  ja.position.copy(a)
  const jb = sphere(rb, color, FURRY, 20)
  jb.position.copy(b)
  parent.add(ja, jb)
}

/** Patinha de lêmure: palma escura e três dedos compridos. */
function paw(parent: THREE.Object3D, at: THREE.Vector3, dir: THREE.Vector3, r: number) {
  const g = new THREE.Group()
  g.position.copy(at)
  g.quaternion.setFromUnitVectors(UP, dir.clone().normalize())
  const palm = sphere(r, MASK, { roughness: 0.6 }, 20)
  palm.scale.set(1, 1.2, 0.7)
  g.add(palm)
  for (let k = -1; k <= 1; k++) {
    const f = capsule(r * 0.32, r * 0.9, MASK, { roughness: 0.6 })
    f.position.set(k * r * 0.55, r * 1.15, r * 0.15)
    f.rotation.set(0.35, 0, -k * 0.2)
    g.add(f)
  }
  parent.add(g)
  return g
}

/** Cauda anelada: tubo ao longo da curva, em faixas brancas e pretas. */
function ringedTail(points: THREE.Vector3[], bands: number, r0: number, r1: number) {
  const g = new THREE.Group()
  const curve = new THREE.CatmullRomCurve3(points)
  for (let i = 0; i < bands; i++) {
    const t0 = i / bands
    const t1 = (i + 1) / bands
    const pts: THREE.Vector3[] = []
    for (let k = 0; k <= 6; k++) pts.push(curve.getPointAt(t0 + ((t1 - t0) * k) / 6))
    const r = r0 + (r1 - r0) * ((t0 + t1) / 2)
    const color = i % 2 === 0 ? FUR_WHITE : MASK
    const tube = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 10, r, 18, false),
      mat(color, { ...FURRY, size: 0.4 }),
    )
    tube.castShadow = true
    tube.receiveShadow = true
    g.add(tube)
    const joint = sphere(r, color, FURRY, 18)
    joint.position.copy(pts[0])
    g.add(joint)
  }
  const tip = sphere(r1 * 1.02, MASK, FURRY, 18)
  tip.position.copy(curve.getPointAt(1))
  g.add(tip)
  return g
}

const OURO = { roughness: 0.28, metalness: 0.55, emissive: '#7a4a00', emissiveIntensity: 0.35 }

function noteHead(x: number, y: number) {
  const h = sphere(0.07, GOLD, OURO)
  h.scale.set(1.35, 0.95, 0.7)
  h.rotation.z = 0.4
  h.position.set(x, y, 0)
  return h
}

function noteStem(x: number, y0: number, y1: number) {
  const s = rbox(0.026, y1 - y0, 0.026, 0.01, GOLD, OURO)
  s.position.set(x, (y0 + y1) / 2, 0)
  return s
}

/** Colcheia (uma cabeça com bandeirola) ou par ligado (♫), de frente. */
function note(kind: 'single' | 'double') {
  const g = new THREE.Group()
  if (kind === 'single') {
    g.add(noteHead(0, 0), noteStem(0.08, 0.02, 0.34))
    const flag = new THREE.Mesh(
      new THREE.TubeGeometry(
        new THREE.CatmullRomCurve3([V(0.08, 0.33, 0), V(0.15, 0.27, 0), V(0.19, 0.19, 0), V(0.16, 0.12, 0)]),
        20, 0.02, 8, false,
      ),
      mat(GOLD, { ...OURO, size: 0.3 }),
    )
    flag.castShadow = true
    g.add(flag)
  } else {
    g.add(noteHead(0, 0), noteHead(0.22, 0.05))
    g.add(noteStem(0.08, 0.02, 0.36), noteStem(0.3, 0.07, 0.41))
    const beam = rbox(0.25, 0.05, 0.03, 0.012, GOLD, OURO)
    beam.position.set(0.19, 0.385, 0)
    beam.rotation.z = Math.atan2(0.05, 0.22)
    g.add(beam)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: piso de tacos do clube + tablado do ringue ---------------------
  const base = new THREE.Group()
  const floor = cylinder(2.75, 2.85, 0.12, PLANK, { roughness: 0.72 })
  floor.position.y = 0.06
  base.add(floor)
  const rim = torus(2.8, 0.05, PLANK_ALT, { roughness: 0.72 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 0.1
  base.add(rim)
  // topo da saia 2 cm abaixo do topo da lona: faces coplanares brigam no z-buffer
  const APRON_H = PY - 0.15
  const apron = rbox(PX * 2 + 0.3, APRON_H, PZ * 2 + 0.3, 0.05, APRON, { roughness: 0.85 })
  apron.position.y = 0.13 + APRON_H / 2
  base.add(apron)
  const stripe = rbox(PX * 2 + 0.32, 0.045, PZ * 2 + 0.32, 0.02, ROPE, { roughness: 0.7 })
  stripe.position.y = 0.13 + APRON_H * 0.6
  base.add(stripe)
  const canvas = rbox(PX * 2 + 0.24, 0.04, PZ * 2 + 0.24, 0.02, CANVAS, { roughness: 0.92 })
  canvas.position.y = PY - 0.02
  base.add(canvas)
  // holofote: círculo claro sob o dançarino
  const spot = cylinder(1.0, 1.0, 0.006, SPOT, { roughness: 0.9 }, 48)
  spot.position.set(LX + 0.1, PY + 0.004, LZ + 0.25)
  spot.castShadow = false // decalque na lona: não projeta sombra
  base.add(spot)
  root.add(base)

  // ---- postes vermelhos acolchoados ----------------------------------------
  const postes = new THREE.Group()
  const POST_H = 1.18
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const post = new THREE.Group()
      post.position.set(sx * PX, PY, sz * PZ)
      const pad = rbox(0.18, POST_H, 0.18, 0.07, POST, { roughness: 0.55 })
      pad.position.y = POST_H / 2
      post.add(pad)
      for (const h of [0.36, 0.68, 1.0]) {
        const seam = rbox(0.19, 0.03, 0.19, 0.012, POST_DARK, { roughness: 0.6 })
        seam.position.y = h + 0.16
        post.add(seam)
      }
      const cap = cylinder(0.08, 0.1, 0.06, ROPE, { roughness: 0.5 })
      cap.position.y = POST_H + 0.03
      post.add(cap)
      postes.add(post)
    }
  }
  root.add(postes)

  // ---- cordas brancas: fundo e laterais (frente aberta) --------------------
  const cordas = new THREE.Group()
  for (const h of [0.36, 0.68, 1.0]) {
    const back = cylinder(0.027, 0.027, PX * 2, ROPE, { roughness: 0.7 }, 12)
    back.rotation.z = Math.PI / 2
    back.position.set(0, PY + h, -PZ)
    cordas.add(back)
    for (const sx of [-1, 1]) {
      const side = cylinder(0.027, 0.027, PZ * 2, ROPE, { roughness: 0.7 }, 12)
      side.rotation.x = Math.PI / 2
      side.position.set(sx * PX, PY + h, 0)
      cordas.add(side)
    }
  }
  // esticadores de aço nos cantos de trás
  for (const sx of [-1, 1]) {
    for (const h of [0.36, 0.68, 1.0]) {
      const tb = cylinder(0.035, 0.035, 0.12, STEEL, { roughness: 0.3, metalness: 0.75 }, 12)
      tb.rotation.x = Math.PI / 2
      tb.position.set(sx * PX, PY + h, -PZ + 0.13)
      cordas.add(tb)
    }
  }
  root.add(cordas)

  // ---- livro de reservas gigante, aberto e vazio ----------------------------
  const livro = new THREE.Group()
  livro.position.set(BOOK[0], PY, BOOK[1])
  livro.rotation.y = BOOK_ROT
  for (const s of [-1, 1]) {
    const capa = rbox(0.6, 0.03, 0.78, 0.012, COVER, { roughness: 0.6 })
    capa.position.set(s * 0.3, 0.015, 0)
    livro.add(capa)
    const folhas = new THREE.Group()
    folhas.position.set(s * 0.285, 0.062, 0)
    folhas.rotation.z = -s * 0.055 // as folhas sobem para a lombada
    const bloco = rbox(0.55, 0.06, 0.72, 0.02, PAGE, { roughness: 0.8 })
    folhas.add(bloco)
    const TOPY = 0.031
    // cabeçalho vinho no alto da página
    const head = rbox(0.47, 0.004, 0.045, 0.002, COVER, { roughness: 0.7 })
    head.position.set(0, TOPY, -0.29)
    folhas.add(head)
    // linhas de reserva: só horários, nenhum nome
    for (let k = 0; k < 9; k++) {
      const z = -0.235 + k * 0.064
      const line = rbox(0.47, 0.004, 0.008, 0.002, LINE, { roughness: 0.8 })
      line.position.set(0, TOPY, z)
      folhas.add(line)
      if (k < 8) {
        const hora = rbox(0.055, 0.004, 0.016, 0.002, '#7d766c', { roughness: 0.8 })
        hora.position.set(-0.185, TOPY, z + 0.032)
        folhas.add(hora)
      }
    }
    const coluna = rbox(0.007, 0.004, 0.55, 0.002, LINE, { roughness: 0.8 })
    coluna.position.set(-0.13, TOPY, 0.02)
    folhas.add(coluna)
    livro.add(folhas)
  }
  const lombada = cylinder(0.035, 0.035, 0.78, COVER_DARK, { roughness: 0.6 }, 16)
  lombada.rotation.x = Math.PI / 2
  lombada.position.y = 0.035
  livro.add(lombada)
  // fita marcadora caindo pela borda da frente
  const fita = rbox(0.035, 0.006, 0.5, 0.002, '#c9a54a', { roughness: 0.5 })
  fita.position.set(0.05, 0.097, 0.15)
  fita.rotation.y = 0.12
  livro.add(fita)
  const fitaPonta = rbox(0.035, 0.08, 0.006, 0.002, '#c9a54a', { roughness: 0.5 })
  fitaPonta.position.set(0.08, 0.055, 0.405)
  livro.add(fitaPonta)
  root.add(livro)

  // ---- LÊMURE: corpo e pernas em passo de tango -----------------------------
  const lemure = new THREE.Group()
  lemure.position.set(LX, PY, LZ)
  lemure.rotation.y = LROT
  root.add(lemure)

  const pelvis = sphere(0.25, FUR, FURRY)
  pelvis.scale.set(1.05, 0.85, 0.95)
  pelvis.position.set(0, 0.72, -0.01)
  const torso = capsule(0.22, 0.4, FUR, FURRY)
  torso.position.set(0, 1.02, -0.02)
  torso.rotation.x = -0.08
  const peito = sphere(0.2, FUR_WHITE, FURRY)
  peito.scale.set(1.0, 1.5, 0.6)
  peito.position.set(0, 0.98, 0.12)
  const ombros = sphere(0.19, FUR, FURRY)
  ombros.scale.set(1.35, 0.7, 0.9)
  ombros.position.set(0, 1.26, -0.02)
  const pescoco = capsule(0.11, 0.1, FUR, FURRY)
  pescoco.position.set(0, 1.37, 0)
  lemure.add(pelvis, torso, peito, ombros, pescoco)

  // perna de apoio (direita do lêmure, lado esquerdo da tela)
  const hipR = V(-0.12, 0.66, 0)
  const kneeR = V(-0.15, 0.38, 0.06)
  const ankleR = V(-0.15, 0.1, -0.02)
  limb(lemure, hipR, kneeR, 0.115, 0.085, FUR)
  limb(lemure, kneeR, ankleR, 0.08, 0.06, FUR)
  const peR = sphere(0.08, FUR_DARK, FURRY)
  peR.scale.set(0.85, 0.5, 1.6)
  peR.position.set(-0.15, 0.045, 0.06)
  lemure.add(peR)
  for (let k = -1; k <= 1; k++) {
    const dedo = sphere(0.028, MASK, { roughness: 0.6 })
    dedo.position.set(-0.15 + k * 0.04, 0.03, 0.19)
    lemure.add(dedo)
  }

  // perna estendida (esquerda do lêmure): ponta do pé no livro
  const hipL = V(0.12, 0.66, 0)
  const kneeL = V(0.3, 0.43, 0.17)
  const ankleL = V(0.45, 0.2, 0.35)
  const toeL = V(0.53, 0.14, 0.47)
  limb(lemure, hipL, kneeL, 0.115, 0.085, FUR)
  limb(lemure, kneeL, ankleL, 0.08, 0.06, FUR)
  limb(lemure, ankleL, toeL, 0.06, 0.045, FUR_DARK)

  // ---- cauda anelada em S (sub-peça) ----------------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(0, 0.62, -0.2)
  cauda.add(ringedTail([
    V(0, 0, 0), V(-0.12, -0.12, -0.12), V(-0.38, -0.12, -0.2), V(-0.6, 0.08, -0.2),
    V(-0.66, 0.38, -0.15), V(-0.55, 0.66, -0.1), V(-0.6, 0.92, -0.08),
    V(-0.78, 1.06, -0.06), V(-0.92, 1.0, -0.04),
  ], 18, 0.085, 0.062))
  lemure.add(cauda)

  // ---- cabeça: máscara preta, olhos laranja, focinho preto ------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.53, 0.03)
  cabeca.rotation.set(0.05, -0.1, 0.06)
  lemure.add(cabeca)

  const cranio = sphere(0.2, FUR_DARK, FURRY)
  cranio.scale.set(1.05, 0.92, 1.0)
  cranio.position.set(0, 0.02, -0.03)
  const rosto = sphere(0.18, FUR_WHITE, FURRY)
  rosto.scale.set(1.05, 0.95, 0.8)
  rosto.position.set(0, -0.01, 0.07)
  cabeca.add(cranio, rosto)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.1, FUR_WHITE, FURRY)
    bochecha.position.set(side * 0.11, -0.07, 0.04)
    const mascara = sphere(0.075, MASK, FURRY)
    mascara.scale.set(0.85, 1.2, 0.45)
    mascara.position.set(side * 0.078, 0.0, 0.19)
    mascara.rotation.z = -side * 0.45
    const orelha = sphere(0.075, FUR, FURRY)
    orelha.scale.set(0.65, 1.15, 0.38)
    orelha.position.set(side * 0.15, 0.16, -0.05)
    orelha.rotation.z = -side * 0.55
    const dentro = sphere(0.05, FUR_WHITE, FURRY)
    dentro.scale.set(0.55, 1.0, 0.2)
    dentro.position.set(side * 0.15, 0.16, -0.022)
    dentro.rotation.z = -side * 0.55
    const olho = sphere(0.05, IRIS, { roughness: 0.2 })
    olho.scale.z = 0.7
    olho.position.set(side * 0.08, 0.01, 0.225)
    const pupila = sphere(0.024, '#120c06', { roughness: 0.2 })
    pupila.position.set(side * 0.08, 0.008, 0.258)
    const brilho = sphere(0.011, '#ffffff', { roughness: 0.1 })
    brilho.position.set(side * 0.08 + 0.016, 0.028, 0.264)
    // sobrancelha franzida: furioso com a espera
    const sobrancelha = rbox(0.085, 0.022, 0.025, 0.01, MASK, { roughness: 0.7 })
    sobrancelha.position.set(side * 0.08, 0.075, 0.235)
    sobrancelha.rotation.z = side * 0.4
    cabeca.add(bochecha, mascara, orelha, dentro, olho, pupila, brilho, sobrancelha)
  }
  const focinho = capsule(0.06, 0.1, MASK, FURRY)
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.06, 0.21)
  const nariz = sphere(0.04, '#0e0d10', { roughness: 0.3 })
  nariz.scale.set(1.2, 0.8, 0.9)
  nariz.position.set(0, -0.045, 0.32)
  cabeca.add(focinho, nariz)

  // ---- rosa vermelha atravessada na boca (sub-peça da cabeça) ---------------
  const rosa = new THREE.Group()
  rosa.position.set(0, -0.115, 0.25)
  rosa.rotation.set(0, 0, 0.1)
  cabeca.add(rosa)
  const caule = cylinder(0.013, 0.013, 0.46, STEM, { roughness: 0.6 }, 12)
  caule.rotation.z = Math.PI / 2
  caule.position.x = -0.03
  rosa.add(caule)
  for (const [lx, s] of [[0.1, 1], [-0.14, -1]] as const) {
    const folha = sphere(0.045, STEM, { roughness: 0.55 })
    folha.scale.set(1.4, 0.22, 0.65)
    folha.position.set(lx, 0.025 * s, 0.03)
    folha.rotation.set(0.4 * s, 0.3, 0.5 * s)
    rosa.add(folha)
  }
  const flor = new THREE.Group()
  flor.position.set(-0.27, 0.01, 0.02)
  flor.quaternion.setFromUnitVectors(UP, V(-0.7, 0.45, 0.55).normalize())
  rosa.add(flor)
  const calice = sphere(0.04, STEM, { roughness: 0.55 })
  calice.scale.set(1, 0.7, 1)
  flor.add(calice)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const sepala = cone(0.018, 0.07, STEM, { roughness: 0.55 }, 8)
    sepala.position.set(Math.cos(a) * 0.035, -0.01, Math.sin(a) * 0.035)
    sepala.rotation.set(Math.sin(a) * 1.9, 0, -Math.cos(a) * 1.9)
    flor.add(sepala)
  }
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2
    const petala = sphere(0.065, ROSE, { roughness: 0.45 })
    petala.scale.set(1, 0.95, 0.36)
    petala.position.set(Math.cos(a) * 0.055, 0.06, Math.sin(a) * 0.055)
    petala.rotation.set(0, Math.PI / 2 - a, 0)
    petala.rotateX(-0.3)
    flor.add(petala)
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.6
    const petala = sphere(0.045, ROSE, { roughness: 0.45 })
    petala.scale.set(1, 1, 0.4)
    petala.position.set(Math.cos(a) * 0.028, 0.085, Math.sin(a) * 0.028)
    petala.rotation.set(0, Math.PI / 2 - a, 0)
    petala.rotateX(-0.15)
    flor.add(petala)
  }
  const botao = sphere(0.032, ROSE_DARK, { roughness: 0.45 })
  botao.scale.set(0.9, 1.2, 0.9)
  botao.position.y = 0.105
  flor.add(botao)
  const espiral = torus(0.022, 0.006, ROSE_DARK, { roughness: 0.45 })
  espiral.rotation.x = Math.PI / 2
  espiral.position.y = 0.125
  flor.add(espiral)

  // ---- braço erguido em arco sobre a cabeça (pivô no ombro) -----------------
  const bracoArco = new THREE.Group()
  bracoArco.position.set(-0.24, 1.27, 0)
  lemure.add(bracoArco)
  {
    const s = V(0, 0, 0)
    const e = V(-0.17, 0.3, 0.04)
    const w = V(0.1, 0.6, 0.07)
    limb(bracoArco, s, e, 0.075, 0.06, FUR)
    limb(bracoArco, e, w, 0.06, 0.048, FUR)
    paw(bracoArco, V(0.15, 0.63, 0.07), V(1, 0.35, 0), 0.05)
  }

  // ---- braço do celular (pivô no ombro) -------------------------------------
  const bracoFone = new THREE.Group()
  bracoFone.position.set(0.24, 1.27, 0)
  lemure.add(bracoFone)
  {
    const s = V(0, 0, 0)
    const e = V(0.15, -0.22, 0.13)
    const w = V(0.05, 0.14, 0.15)
    limb(bracoFone, s, e, 0.075, 0.06, FUR)
    limb(bracoFone, e, w, 0.06, 0.048, FUR)
    paw(bracoFone, V(0.07, 0.2, 0.13), V(-0.3, 1, -0.1), 0.05)
  }

  // celular preto colado na orelha (sub-peça do braço)
  const celular = new THREE.Group()
  celular.position.set(0.01, 0.26, 0.1)
  celular.rotation.set(0, -0.75, -0.2)
  bracoFone.add(celular)
  const corpoCel = rbox(0.035, 0.25, 0.13, 0.014, PHONE, { roughness: 0.3, metalness: 0.3 })
  celular.add(corpoCel)
  const aro = rbox(0.039, 0.24, 0.12, 0.014, '#4a4d55', { roughness: 0.3, metalness: 0.6 })
  aro.scale.set(1, 1.04, 1.06)
  celular.add(aro)
  const camera = rbox(0.012, 0.045, 0.045, 0.008, '#2c2e35', { roughness: 0.3, metalness: 0.5 })
  camera.position.set(0.022, 0.08, -0.025)
  celular.add(camera)
  const lente = cylinder(0.011, 0.011, 0.01, '#0b0b0e', { roughness: 0.15 }, 12)
  lente.rotation.z = Math.PI / 2
  lente.position.set(0.03, 0.088, -0.025)
  celular.add(lente)

  // ---- três notas douradas saindo do celular --------------------------------
  const notas = new THREE.Group()
  notas.position.set(0, NOTES_Y, 0)
  notas.rotation.y = -0.12
  const n1 = note('single')
  n1.position.set(0.5, 0.25, -0.05)
  n1.rotation.z = 0.25
  n1.scale.setScalar(0.85)
  const n2 = note('double')
  n2.position.set(0.8, 0.32, 0.0)
  n2.scale.setScalar(0.9)
  n2.rotation.z = -0.1
  const n3 = note('single')
  n3.position.set(1.12, 0.12, 0.05)
  n3.rotation.z = -0.3
  n3.scale.setScalar(0.95)
  notas.add(n1, n2, n3)
  root.add(notas)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'ringue', object: base },
    { name: 'postes', group: 'ringue', object: postes },
    { name: 'cordas', group: 'ringue', object: cordas },
    { name: 'lemure', group: 'lemure', object: lemure },
    { name: 'cabeca', group: 'lemure', object: cabeca },
    { name: 'cauda', group: 'lemure', object: cauda },
    { name: 'bracoArco', group: 'lemure', object: bracoArco },
    { name: 'bracoFone', group: 'lemure', object: bracoFone },
    { name: 'rosa', group: 'tango', object: rosa },
    { name: 'livro', group: 'livro', object: livro },
    { name: 'celular', group: 'ligacao', object: celular },
    { name: 'notas', group: 'espera', object: notas },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Sobe um RINGUE de boxe: lona azul, postes vermelhos, cordas brancas…',
    }),
    seq('postes-rise', 'postes', 0.3, 0.7, [riseFrom(0, 1.6)], { ease: 'easeOut' }),
    seq('cordas-rise', 'cordas', 0.6, 0.7, [riseFrom(0, 1.4)], { ease: 'easeOut' }),

    seq('lemure-rise', 'lemure', 1.7, 0.9, [riseFrom(PY, 2.4)], {
      ease: 'easeOut',
      caption: 'No meio dele, um lêmure — dançarino nato — que reservou o RINGUE pra ensaiar TANGO.',
    }),
    seq('arco-recolhe', 'bracoArco', 1.7, 0.1, [ch('rotation.z', ARM_DOWN, ARM_DOWN)]),
    seq('fone-recolhe', 'bracoFone', 1.7, 0.1, [ch('rotation.x', PHONE_DOWN, PHONE_DOWN)]),
    seq('cabeca-sobe', 'cabeca', 1.95, 0.7, [ch('position.y', 1.2, 1.53)], { ease: 'easeOut' }),
    seq('cauda-abre', 'cauda', 2.3, 0.9, [...grow(0.01, 1), ch('rotation.z', -0.9, 0)], {
      ease: 'easeOut',
    }),

    seq('rosa-surge', 'rosa', 3.6, 0.6, [...grow(0.01, 1), ch('rotation.z', 1.4, 0.1)], {
      ease: 'easeOut',
      caption: 'Ele chega de rosa vermelha atravessada na boca, pronto pro TANGO…',
    }),

    seq('livro-abre', 'livro', 4.9, 0.8, [
      riseFrom(PY, 0.5), ch('scale.x', 0.05, 1), ch('rotation.y', BOOK_ROT - 0.6, BOOK_ROT),
    ], {
      ease: 'easeOut',
      caption: '…e acha o livro de reservas aberto no ringue: na linha dele, NINGUÉM.',
    }),

    seq('fone-ergue', 'bracoFone', 6.5, 0.6, [ch('rotation.x', PHONE_DOWN, 0)], {
      ease: 'easeInOut',
      caption: 'Liga pra recepção: IÁ, aqui do RINGUE!',
    }),
    seq('celular-surge', 'celular', 6.75, 0.4, grow(0.01, 1), { ease: 'easeOut' }),

    seq('notas-saem', 'notas', 7.9, 0.7, [ch('position.y', NOTES_Y - 0.4, NOTES_Y), ...grow(0.01, 1)], {
      ease: 'easeOut',
      caption: '…e cai na espera: um TANGO de musiquinha que não acaba nunca.',
    }),

    seq('arco-ergue', 'bracoArco', 9.3, 0.7, [ch('rotation.z', ARM_DOWN, 0)], {
      ease: 'easeInOut',
      caption: 'Furioso, dança e berra: TANGO não! ATENDE! — e o sinal come as pontas: …ÁNGO-ENDE!',
    }),
    seq('lemure-gira', 'lemure', 9.3, 0.7, [ch('rotation.y', LROT - 0.5, LROT)], { ease: 'easeInOut' }),
    seq('notas-pulsa', 'notas', 9.6, 0.25, grow(1, 1.18), { ease: 'easeOut' }),
    seq('notas-volta', 'notas', 9.85, 0.3, grow(1.18, 1)),

    seq('lemure-pula', 'lemure', 11.0, 0.22, [ch('position.y', PY, PY + 0.14)], {
      ease: 'easeOut',
      caption: 'Quando enfim atendem, ele bate o pé no livro: MINHA… BOOK… NINGUÉM?!',
    }),
    seq('lemure-pisa', 'lemure', 11.22, 0.2, [ch('position.y', PY + 0.14, PY)], { ease: 'easeIn' }),
    seq('livro-tranco', 'livro', 11.42, 0.12, [ch('position.y', PY, PY + 0.04)], { ease: 'easeOut' }),
    seq('livro-pousa', 'livro', 11.54, 0.22, [ch('position.y', PY + 0.04, PY)], { ease: 'easeIn' }),

    seq('notas-final', 'notas', 12.4, 0.5, [ch('position.y', NOTES_Y - 0.08, NOTES_Y)], {
      ease: 'easeOut',
      caption: 'Jag ringer angående min bokning. — Estou ligando por causa da minha reserva.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.55, 4.0], target: [0.12, 1.32, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ringer-angaende-min-bokning',
    contexto:
      "Telefone: logo no começo da ligação pra hotel, restaurante, cabeleireiro, vårdcentral, oficina ou companhia aérea — pra mudar, confirmar ou cancelar uma reserva ou hora marcada. Vem depois do 'Hej, jag heter ...' e antes do número da reserva (bokningsnumret).",
    fraseFonte: 'Estou ligando por causa da minha reserva.',
    fraseAlvo: 'Jag ringer angående min bokning.',
    pronuncia:
      "iá RÍNG-er ÁN-gô-en-de min BÚÚK-ning ('jag ringer' = iá RÍNG-er, como em 'Jag ringer dig senare': R de um toque só, NG no nariz sem estalar o G, -er fraquinho; 'angående' com a força no ÁN — A curto, N de língua, e aqui o G ESTALA, porque são duas partes, an + gå — e um segundo pico LONGO no GÔ, Ô fechado (é o å longo); o -ende corre fraquinho, D duro, nunca 'dji'; 'min' curto, N de língua, sem nasal; 'bokning' com a força no BÚÚ, U fechado e longo, K seco grudado no N, e o -ning com NG só no nariz)",
    ponteSonora:
      "IÁ-RÍNGUER... (T)ÁNGO-(AT)ENDE!... MIN BÚK-NING! (10 sílabas: iá-RÍNG-er-ÁN-gô-en-de-min-BÚÚK-ning; força no RÍNG, no ÁN e no BÚÚ; IÁ-RÍNGUER é o MESMO 'jag ringer' da freira de 'Jag ringer dig senare': emende IÁ + RINGUE num fôlego só, 'iaríngue', pro R sair de um toque só — com RR soprado vira um h e outra palavra —; do RINGUE fica só o NG no nariz, SEM estalar o G e sem 'gui', e cola um -er fraquinho de R BRANDO: RÍNG-er; (T)ÁNGO-(AT)ENDE = os dois berros da espera, TANGO e ATENDE, com UMA regra só: o sinal picotado come a CABEÇA das duas palavras — sai o T do TANGO, sai o AT do ATENDE, e o que sobra emenda numa palavra de quatro sílabas, ÁN-gô-en-de; a força fica no ÁN, como no próprio 'TANgo' (A curto, N de língua, sem o 'tã' fanhoso), e aqui o G ESTALA, como no tango — 'angå' são duas partes, an + gå; o GÔ é um segundo pico: Ô FECHADO de 'avô' e LONGO, nunca o 'gu' com que o português fecha 'tango' — é o å LONGO, o mesmo GÔ da GOTA de 'Jag måste gå nu': 'angå' é 'gå' com 'an' na frente; o EN-DE corre fraquinho, porque a força do 'aTENde' foi embora junto com o AT: N de língua sem nasalizar, D duro e E fraco, nunca 'dji'; MIN = a MINHA cortada no N, a mesma de 'Jag har tappat min plånbok': I curto e N DE VERDADE, sem o 'mĩ' nasal, sem força; BÚK = o BOOK, o livro de reservas — o mesmo 'bok' do BUUK de 'Jag har tappat min plånbok': U FECHADO e LONGO, toda a força, e K seco grudado no N, sem vogal no meio; NING = o NINGUÉM da página vazia, cortado antes do -uém e sem força: I curto e NG só no nariz, como no fim do RING; junto, BÚK-NING é o 'booking' do Booking.com com um N a mais — BÚK-ning, nunca 'BÚ-king' nem 'bú-ki-ning')",
    historia:
      'O lêmure — dançarino nato, que em Madagascar já anda saltitando de lado — reservou o RINGUE do clube pra ensaiar TANGO. Chega de rosa na boca e encontra o livro de reservas aberto no meio do ringue: na linha dele, NINGUÉM. Ele liga pra recepção — IÁ, aqui do RINGUE! — e cai na musiquinha de espera: um TANGO que não acaba nunca. Furioso, dança sozinho e berra no celular por cima da música: TANGO não! ATENDE! — mas o sinal picota e come a cabeça das duas palavras, e do outro lado só chega ...ÁNGO-ENDE! Quando enfim atendem, ele bate o pé no livro: MINHA... BOOK... NINGUÉM?! — estou ligando por causa da minha reserva.',
  },
  createScene,
  refine: { organic: ['lemure', 'cabeca', 'bracoArco', 'bracoFone'] },
}

export default card
