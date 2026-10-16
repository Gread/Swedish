import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, torus, lathe, rock, person,
} from '../rig/helpers'
import type { MatOpts } from '../rig/helpers'

/**
 * "Ring polisen!" — R-R-RING! PO-LÍÍS... SEM (capa)!
 *
 * Tourada de gala: em vez do boi, sai da porteira o BOItatá, a cobra de fogo
 * de olhos de tocha, dá o bote na capa vermelha e foge com ela na boca. O
 * toureiro fica no meio da arena de mãos vazias, faz telefone com a mão
 * (R-R-RING — os mesmos três arcos amarelos do sino de 'Ring 112!') e aponta
 * a porteira: POLÍÍS... SEM capa!
 *
 * Diorama: arena de areia ocre com os círculos pintados, barreira de madeira
 * vermelha (meia-lua ao fundo), porteira aberta à direita; o toureiro dourado
 * à esquerda, grande; o boitatá serpenteando da arena até a porteira, com a
 * cabeça virada pra trás e a capa tremulando entre os dois.
 */

const BASE_TERRA = '#5a4330'
const AREIA = '#d4a45e'
const AREIA_ESC = '#c08f4c'
const AREIA_CLARA = '#e0b878'
const CAL = '#efe6d2' // círculos pintados na areia
const BARREIRA = '#8e2f24' // vermelho de barreira, apagado: o vermelho vivo é da capa
const BARREIRA_ESC = '#6c2119'
const FAIXA = '#d9a93a'
const MADEIRA = '#5a3d26'
const MADEIRA_ESC = '#3f2a1a'
const FERRO = '#3b3b3e'
// traje de luzes no mesmo bronze do sino de 'Ring 112!'
const OURO = '#c9962f'
const OURO_ESC = '#8f6520'
const BORDADO = '#4a3418'
const PELE = '#e8c39e'
const MEIA = '#f0a3b4'
const PRETO = '#1d1b1f'
const CAMISA = '#f4efe4'
const FAIXA_CINTA = '#5c1d2a'
const CHAMUSCADO = '#2a1f19'
const CHAMUSCADO_BORDA = '#7a5434'
// fogo do boitatá: a mesma paleta das chamas de 'Ring 112!'
const FOGO_CORPO = '#d8400e'
const FOGO_BRILHO = '#ff3a06'
const CROSTA = '#7a1c08'
const CROSTA_BRILHO = '#5a1004'
const OLHO = '#ffc21a'
const OLHO_BRILHO = '#ffaa00'
const FOGO_EXT = '#ff5a1c'
const FOGO_MEIO = '#ff9526'
const FOGO_NUCLEO = '#ffe26a'
const BOCA = '#3a0d06'
// acento saturado RESERVADO à capa roubada (o SEM capa)
const CAPA = '#e3262f'
const CAPA_ESC = '#a8141d'
// os arcos do toque: idênticos aos do sino de 'Ring 112!'
const SOM = '#ffd23a'

const GY = 0.14 // topo da areia
const R_IN = 2.22 // raio interno da barreira
const WALL_T = 0.1
const WALL_H = 0.52
const GATE_PHI = 0.55 // ângulo da porteira (0 = +x, cresce para o fundo -z)
const GATE_HALF = 0.2 // meia-abertura da porteira, em radianos
const TX = -0.5
const TZ = 0.48
const T_ROT = 0.22
const T_SCALE = 1.1
const LEG_H = 0.38
const CAM: [number, number, number] = [0.16, 1.77, 4.07]

/** Ponto do anel no ângulo phi (0 = +x, pi/2 = fundo). */
function ring(r: number, phi: number) {
  return new THREE.Vector3(r * Math.cos(phi), 0, -r * Math.sin(phi))
}

/** Setor de anel extrudado para cima: barreira de cantos arredondados. */
function wallSector(r0: number, r1: number, a0: number, a1: number, h: number, color: string, opts: MatOpts = {}) {
  const s = new THREE.Shape()
  s.absarc(0, 0, r1, a0, a1, false)
  s.absarc(0, 0, r0, a1, a0, true)
  s.closePath()
  const bevel = Math.min(0.02, (r1 - r0) * 0.3)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: h - bevel * 2,
    bevelEnabled: true,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 3,
    curveSegments: 64,
  })
  geo.rotateX(-Math.PI / 2)
  geo.translate(0, bevel, 0)
  const m = new THREE.Mesh(geo, mat(color, { size: h, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula ligando dois pontos — braço dobrado, dedos. */
function link(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = new THREE.Vector3().subVectors(b, a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).addScaledVector(d, 0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

/**
 * Língua de fogo torneada (gota), base na origem, ponta em +y; `curl` entorta
 * a ponta para +x (a língua lambe para o lado, não fica espetada feito espinho).
 */
function gota(s: number, color: string, emissive: string, k: number, curl = 0) {
  const m = lathe(
    [[0, 0], [0.07, 0.02], [0.105, 0.08], [0.1, 0.17], [0.075, 0.27], [0.04, 0.37], [0.012, 0.45], [0, 0.48]],
    color,
    { emissive, emissiveIntensity: k },
    20,
  )
  if (curl) {
    const p = m.geometry.attributes.position
    for (let i = 0; i < p.count; i++) {
      const yy = p.getY(i) / 0.48
      p.setX(i, p.getX(i) + curl * 0.22 * yy * yy)
    }
    m.geometry.computeVertexNormals()
  }
  m.scale.setScalar(s)
  m.castShadow = false
  return m
}

/**
 * Labareda de várias línguas: casca laranja, duas línguas laterais tombadas e
 * o miolo amarelo puxado para a frente (`frente`, vetor local para a câmera)
 * para o núcleo aparecer através da casca.
 */
function labareda(s: number, seed: number, frente: THREE.Vector3) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const curl = (rand() - 0.5) * 1.4
  const casca = gota(s, FOGO_EXT, '#ff3a0a', 1.9, curl)
  casca.scale.set(s * 1.3, s, s * 1.3)
  g.add(casca)
  for (const side of [-1, 1]) {
    const lingua = gota(
      s * (0.5 + rand() * 0.2),
      side < 0 ? FOGO_EXT : FOGO_MEIO,
      side < 0 ? '#ff3a0a' : '#ff7a12',
      1.9,
      side * (0.6 + rand() * 0.6),
    )
    lingua.position.set(side * s * 0.05, 0, 0)
    lingua.rotation.z = -side * (0.35 + rand() * 0.25)
    g.add(lingua)
  }
  const meio = gota(s * 0.7, FOGO_MEIO, '#ff7a12', 2.2, curl * 0.8)
  meio.scale.set(s * 0.9, s * 0.7, s * 0.9)
  meio.position.copy(frente).multiplyScalar(s * 0.07)
  g.add(meio)
  const nucleo = gota(s * 0.42, FOGO_NUCLEO, '#ffc83a', 2.5, curl * 0.6)
  nucleo.scale.set(s * 0.55, s * 0.42, s * 0.55)
  nucleo.position.copy(frente).multiplyScalar(s * 0.12)
  g.add(nucleo)
  return g
}

/** Fita achatada sobre a areia seguindo uma curva (rastro chamuscado). */
function ribbon(curve: THREE.Curve<THREE.Vector3>, width: (u: number) => number, y: number, color: string, n = 90) {
  const pos: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= n; i++) {
    const u = i / n
    const p = curve.getPointAt(u)
    const t = curve.getTangentAt(u)
    const nx = -t.z
    const nz = t.x
    const l = Math.hypot(nx, nz) || 1
    const w = width(u)
    pos.push(p.x + (nx / l) * w, y, p.z + (nz / l) * w)
    pos.push(p.x - (nx / l) * w, y, p.z - (nz / l) * w)
    if (i < n) {
      const a = i * 2
      idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.97, size: 1 }))
  ;(m.material as THREE.Material).side = THREE.DoubleSide
  m.receiveShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(190)

  // ---- arena: disco de areia com os círculos pintados ----------------------
  const base = new THREE.Group()
  const disco = cylinder(2.55, 2.65, 0.1, BASE_TERRA, { roughness: 0.95 })
  disco.position.y = 0.05
  base.add(disco)
  const areia = cylinder(2.5, 2.52, 0.04, AREIA, { roughness: 0.97 })
  areia.position.y = 0.12
  base.add(areia)
  // os dois círculos de cal da arena (raias)
  for (const r of [1.25, 1.95]) {
    const raia = torus(r, 0.018, CAL, { roughness: 0.9 })
    raia.rotation.x = Math.PI / 2
    raia.position.y = GY - 0.008
    raia.scale.z = 0.35
    base.add(raia)
  }
  // areia revolvida: manchas claras e escuras
  for (let i = 0; i < 12; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.5 + rand() * 1.7
    const mancha = sphere(0.18 + rand() * 0.2, i % 2 ? AREIA_ESC : AREIA_CLARA, { roughness: 0.97 })
    mancha.scale.y = 0.035
    mancha.position.set(Math.cos(a) * d, GY - 0.004, Math.sin(a) * d)
    base.add(mancha)
  }
  for (let i = 0; i < 6; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.3 + rand() * 0.8
    const pedra = rock(0.035 + rand() * 0.03, '#9b8a72', 40 + i, { roughness: 0.9 })
    pedra.position.set(Math.cos(a) * d, GY + 0.01, Math.sin(a) * d)
    base.add(pedra)
  }
  root.add(base)

  // ---- barreira de madeira vermelha (meia-lua ao fundo) --------------------
  const barreira = new THREE.Group()
  root.add(barreira)
  const A0 = -0.32
  const A1 = Math.PI + 0.32
  const arcos: [number, number][] = [
    [A0, GATE_PHI - GATE_HALF],
    [GATE_PHI + GATE_HALF, A1],
  ]
  for (const [a0, a1] of arcos) {
    const parede = wallSector(R_IN, R_IN + WALL_T, a0, a1, WALL_H, BARREIRA, { roughness: 0.75 })
    parede.position.y = GY
    barreira.add(parede)
    // faixa amarela perto do topo, na face interna
    const faixa = wallSector(R_IN - 0.012, R_IN + 0.02, a0 + 0.004, a1 - 0.004, 0.07, FAIXA, { roughness: 0.6 })
    faixa.position.y = GY + WALL_H - 0.14
    barreira.add(faixa)
    // capa do topo, mais escura
    const capa = wallSector(R_IN - 0.02, R_IN + WALL_T + 0.02, a0, a1, 0.05, BARREIRA_ESC, { roughness: 0.7 })
    capa.position.y = GY + WALL_H
    barreira.add(capa)
    // juntas das tábuas na face interna
    const n = Math.floor(((a1 - a0) * R_IN) / 0.3)
    for (let k = 1; k < n; k++) {
      const phi = a0 + ((a1 - a0) * k) / n
      const junta = rbox(0.018, WALL_H - 0.2, 0.012, 0.005, BARREIRA_ESC, { roughness: 0.85 })
      const p = ring(R_IN - 0.004, phi)
      junta.position.set(p.x, GY + (WALL_H - 0.2) / 2 + 0.03, p.z)
      junta.rotation.y = Math.atan2(-Math.cos(phi), Math.sin(phi))
      barreira.add(junta)
    }
    // rodapé escuro
    const rodape = wallSector(R_IN - 0.015, R_IN + 0.02, a0, a1, 0.06, BARREIRA_ESC, { roughness: 0.85 })
    rodape.position.y = GY
    barreira.add(rodape)
  }

  // ---- porteira aberta -----------------------------------------------------
  const porteira = new THREE.Group()
  root.add(porteira)
  const portal = new THREE.Group()
  const gC = ring(R_IN + WALL_T / 2, GATE_PHI)
  portal.position.set(gC.x, GY, gC.z)
  portal.rotation.y = Math.atan2(-Math.cos(GATE_PHI), Math.sin(GATE_PHI)) // +z local olha o centro
  porteira.add(portal)
  const GW = Math.sin(GATE_HALF) * (R_IN + WALL_T / 2) // meia-largura do vão
  const POST_H = 0.95
  for (const side of [-1, 1]) {
    const poste = rbox(0.14, POST_H, 0.16, 0.025, MADEIRA, { roughness: 0.85 })
    poste.position.set(side * (GW + 0.05), POST_H / 2, 0)
    portal.add(poste)
    const pinha = sphere(0.075, MADEIRA_ESC, { roughness: 0.6 })
    pinha.position.set(side * (GW + 0.05), POST_H + 0.1, 0)
    portal.add(pinha)
    const pescoco = cylinder(0.04, 0.06, 0.06, MADEIRA_ESC, { roughness: 0.7 })
    pescoco.position.set(side * (GW + 0.05), POST_H + 0.03, 0)
    portal.add(pescoco)

    // folha da porteira: abre para dentro da arena, encostada no vão
    const folha = new THREE.Group()
    folha.position.set(side * (GW - 0.02), 0, 0.06)
    folha.rotation.y = side * 1.25
    portal.add(folha)
    const FW = GW - 0.04
    for (const fy of [0.12, 0.27, 0.42]) {
      const ripa = rbox(FW, 0.09, 0.05, 0.018, BARREIRA, { roughness: 0.75 })
      ripa.position.set(-side * FW / 2, fy, 0)
      folha.add(ripa)
    }
    for (const fx of [0.03, FW - 0.03]) {
      const montante = rbox(0.06, 0.48, 0.06, 0.018, BARREIRA_ESC, { roughness: 0.75 })
      montante.position.set(-side * fx, 0.27, 0)
      folha.add(montante)
    }
    const diagonal = rbox(Math.hypot(FW - 0.06, 0.32), 0.05, 0.04, 0.015, FAIXA, { roughness: 0.6 })
    diagonal.position.set(-side * FW / 2, 0.27, 0.03)
    diagonal.rotation.z = side * Math.atan2(0.32, FW - 0.06)
    folha.add(diagonal)
    for (const hy of [0.12, 0.42]) {
      const dobradica = cylinder(0.022, 0.022, 0.08, FERRO, { roughness: 0.45, metalness: 0.6 })
      dobradica.position.set(0, hy, 0)
      folha.add(dobradica)
    }
  }
  const verga = rbox(GW * 2 + 0.36, 0.13, 0.18, 0.03, MADEIRA, { roughness: 0.85 })
  verga.position.y = POST_H - 0.02
  portal.add(verga)
  const chapeuVerga = rbox(GW * 2 + 0.46, 0.05, 0.24, 0.02, MADEIRA_ESC, { roughness: 0.8 })
  chapeuVerga.position.y = POST_H + 0.06
  portal.add(chapeuVerga)

  // ---- boitatá: corpo de fogo serpenteando até a porteira -------------------
  const boitata = new THREE.Group()
  root.add(boitata)
  const R_MAX = 0.16
  const raio = (u: number) => {
    const sobe = THREE.MathUtils.smoothstep(u, 0, 0.5)
    const pescoco = THREE.MathUtils.smoothstep(u, 0.8, 1) * 0.03
    return 0.014 + (R_MAX - 0.014) * sobe - pescoco
  }
  const chao = (x: number, z: number, u: number) => new THREE.Vector3(x, GY + raio(u) * 0.86, z)
  const gIn = ring(R_IN - 0.28, GATE_PHI)
  const gMid = ring(R_IN + WALL_T / 2, GATE_PHI)
  const pts = [
    chao(0.1, 0.36, 0),
    chao(0.42, 0.12, 0.08),
    chao(0.28, -0.3, 0.17),
    chao(0.66, -0.55, 0.28),
    chao(1.08, -0.3, 0.4),
    chao(1.34, -0.62, 0.52),
    chao(gIn.x - 0.1, gIn.z + 0.05, 0.64),
    new THREE.Vector3(gMid.x, GY + 0.3, gMid.z),
    new THREE.Vector3(gMid.x + 0.06, GY + 0.68, gMid.z - 0.06),
    new THREE.Vector3(gMid.x - 0.04, GY + 0.96, gMid.z + 0.02),
  ]
  const curva = new THREE.CatmullRomCurve3(pts, false, 'centripetal')
  const SEG = 340
  const RAD = 48
  const tubo = new THREE.TubeGeometry(curva, SEG, 1, RAD, false)
  // escamas em brasa: relevo de escamas sobrepostas esculpido no próprio tubo
  // (fileiras desencontradas, borda de trás saltada feito telha)
  const L = curva.getLength()
  const ESC_L = 0.075
  const ESC_N = 12
  {
    const p = tubo.attributes.position
    const c = new THREE.Vector3()
    const v = new THREE.Vector3()
    for (let i = 0; i <= SEG; i++) {
      const u = i / SEG
      curva.getPointAt(u, c)
      const r = raio(u)
      for (let j = 0; j <= RAD; j++) {
        const k = i * (RAD + 1) + j
        const fa = (j / RAD) * ESC_N
        const fileira = Math.floor(fa) % 2
        const fu = (((u * L) / ESC_L + fileira * 0.5) % 1 + 1) % 1
        const telha = fu < 0.8 ? fu / 0.8 : (1 - fu) / 0.2
        const lado = Math.pow(Math.sin(Math.PI * (fa % 1)), 0.6)
        const k2 = r * (0.97 + 0.085 * telha * lado)
        v.fromBufferAttribute(p, k).sub(c).multiplyScalar(k2).add(c)
        p.setXYZ(k, v.x, v.y, v.z)
      }
    }
    tubo.computeVertexNormals()
  }
  const corpo = new THREE.Mesh(tubo, mat(FOGO_CORPO, { emissive: FOGO_BRILHO, emissiveIntensity: 0.7, roughness: 0.42, detail: 0 }))
  corpo.castShadow = true
  boitata.add(corpo)
  const up = new THREE.Vector3(0, 1, 0)

  // crista de labaredas no dorso, tombadas para trás (fugindo)
  const camV = new THREE.Vector3(...CAM)
  const frenteLocal = (obj: THREE.Object3D) =>
    camV.clone().sub(obj.position).normalize().applyQuaternion(obj.quaternion.clone().invert())
  let fi = 0
  for (let u = 0.12; u < 0.95; u += 0.042) {
    const p = curva.getPointAt(u)
    const t = curva.getTangentAt(u)
    const r = raio(u)
    const lado = new THREE.Vector3().crossVectors(t, up).normalize()
    const topo = new THREE.Vector3().crossVectors(lado, t).normalize()
    const chama = new THREE.Group()
    const balanco = (rand() - 0.5) * 0.5
    chama.position.copy(p).addScaledVector(topo, r * 0.7).addScaledVector(lado, balanco * r * 0.5)
    const dir = topo.clone().addScaledVector(t, -0.4).addScaledVector(lado, balanco).add(up.clone().multiplyScalar(0.6)).normalize()
    chama.quaternion.setFromUnitVectors(up, dir)
    const s = r * (2.4 + rand() * 1.8 + (fi % 3 === 0 ? 0.8 : 0))
    chama.add(labareda(s, 300 + fi, frenteLocal(chama)))
    boitata.add(chama)
    fi++
  }
  // ponta da cauda: chama solta
  {
    const p = curva.getPointAt(0)
    const t = curva.getTangentAt(0)
    const pontaCauda = new THREE.Group()
    pontaCauda.position.copy(p)
    pontaCauda.quaternion.setFromUnitVectors(up, t.clone().multiplyScalar(-1).add(new THREE.Vector3(0, 0.9, 0)).normalize())
    pontaCauda.add(labareda(0.45, 77, frenteLocal(pontaCauda)))
    boitata.add(pontaCauda)
  }
  const brilho = new THREE.PointLight('#ff7a2a', 1.8, 2.6, 1.6)
  brilho.position.set(0.7, GY + 0.22, -0.05)
  boitata.add(brilho)

  // ---- cabeça do boitatá: virada pra trás, olhos de tocha --------------------
  const fimPescoco = curva.getPointAt(1)
  const HEAD_POS = fimPescoco.clone().add(new THREE.Vector3(-0.04, 0.08, 0.03))
  const HEAD_YAW = -0.78 // olha para o toureiro (e quase para a câmera)
  const cabeca = new THREE.Group()
  cabeca.position.copy(HEAD_POS)
  const HEAD_PITCH = 0.18
  cabeca.rotation.set(HEAD_PITCH, HEAD_YAW, 0)
  cabeca.scale.setScalar(1.8)
  root.add(cabeca)
  const fogoOp = { emissive: FOGO_BRILHO, emissiveIntensity: 0.75, roughness: 0.5 }
  // crânio de víbora: largo atrás, afinando no focinho
  const cranio = sphere(0.16, FOGO_CORPO, fogoOp)
  cranio.scale.set(1.15, 0.78, 1.15)
  cabeca.add(cranio)
  const maxila = sphere(0.13, FOGO_CORPO, fogoOp)
  maxila.scale.set(1.0, 0.48, 1.45)
  maxila.position.set(0, 0.0, 0.17)
  cabeca.add(maxila)
  const mandibula = sphere(0.115, FOGO_CORPO, fogoOp)
  mandibula.scale.set(0.9, 0.36, 1.35)
  mandibula.position.set(0, -0.105, 0.13)
  mandibula.rotation.x = 0.34
  cabeca.add(mandibula)
  const goela = sphere(0.1, BOCA, { roughness: 0.6 })
  goela.scale.set(0.85, 0.45, 1.15)
  goela.position.set(0, -0.06, 0.15)
  cabeca.add(goela)
  // placas de crosta no alto da cabeça
  for (const [cx, cz, cr] of [[0, -0.05, 0.07], [-0.07, 0.04, 0.05], [0.07, 0.04, 0.05], [0, 0.12, 0.045]] as const) {
    const placa = sphere(cr, CROSTA, { emissive: CROSTA_BRILHO, emissiveIntensity: 0.35, roughness: 0.75 }, 12)
    placa.position.set(cx, 0.115, cz)
    placa.scale.set(1, 0.3, 1)
    cabeca.add(placa)
  }
  for (const side of [-1, 1]) {
    // olho-tocha: globo amarelo incandescente, pupila em fenda, chama em cima
    const olho = sphere(0.088, OLHO, { emissive: OLHO_BRILHO, emissiveIntensity: 1.6, roughness: 0.3 })
    olho.position.set(side * 0.115, 0.09, 0.07)
    cabeca.add(olho)
    // halo de tocha em volta do olho
    const halo = new THREE.Mesh(
      new THREE.SphereGeometry(0.135, 20, 16),
      new THREE.MeshBasicMaterial({
        color: '#ffb020', transparent: true, opacity: 0.28, depthWrite: false, blending: THREE.AdditiveBlending,
      }),
    )
    halo.position.copy(olho.position)
    cabeca.add(halo)
    const pupila = capsule(0.016, 0.06, '#1a0f0a', { roughness: 0.3 })
    pupila.position.set(side * 0.13, 0.09, 0.143)
    pupila.rotation.y = side * 0.25
    cabeca.add(pupila)
    const sobrolho = capsule(0.03, 0.1, CROSTA, { roughness: 0.75 })
    sobrolho.rotation.set(0, 0, Math.PI / 2 + side * 0.35)
    sobrolho.position.set(side * 0.11, 0.165, 0.09)
    cabeca.add(sobrolho)
    const tocha = new THREE.Group()
    tocha.position.set(side * 0.12, 0.14, 0.05)
    tocha.rotation.set(-0.95, 0, side * -0.12)
    tocha.add(labareda(0.44, 90 + side, new THREE.Vector3(0, 0, 1)))
    cabeca.add(tocha)
    const narina = sphere(0.018, BOCA, { roughness: 0.5 })
    narina.position.set(side * 0.045, 0.045, 0.345)
    cabeca.add(narina)
  }

  // ---- capa vermelha roubada (presa na boca, tremulando) --------------------
  const CW = 1.12 // comprimento a partir da boca
  const CH = 0.74 // altura na ponta solta
  const capaGeo = new THREE.PlaneGeometry(CW, CH, 44, 22)
  {
    const p = capaGeo.attributes.position
    for (let i = 0; i < p.count; i++) {
      const x0 = p.getX(i)
      const y0 = p.getY(i)
      const s = (x0 + CW / 2) / CW // 0 na boca, 1 na ponta solta
      const t = y0 / CH // -0.5 embaixo, 0.5 em cima
      const franzido = 0.12 + 0.88 * Math.pow(s, 0.5)
      const y = y0 * franzido - 0.2 * s * s
      // ondas de bandeira ao longo do pano + pregas que nascem na boca
      const z =
        0.13 * s * Math.sin(Math.PI * 2 * 1.35 * s - 0.6 + t * 1.1) +
        0.035 * (0.3 + s) * Math.sin(t * Math.PI * 2 * 2.2 + s * 2.5)
      const x = -s * CW + 0.05 * Math.sin(t * Math.PI * 2) * s * s
      p.setXYZ(i, x, y, z)
    }
    capaGeo.computeVertexNormals()
  }
  const capa = new THREE.Group()
  root.add(capa)
  const pano = new THREE.Mesh(capaGeo, mat(CAPA, { roughness: 0.82 }))
  ;(pano.material as THREE.Material).side = THREE.DoubleSide
  pano.castShadow = true
  pano.receiveShadow = true
  capa.add(pano)
  // o pano franzido mordido entre as mandíbulas
  const mordido = sphere(0.042, CAPA_ESC, { roughness: 0.82 })
  mordido.scale.set(1.4, 0.8, 0.8)
  mordido.position.x = 0.01
  capa.add(mordido)

  // pose final da capa: o bolo entre as mandíbulas, o pano voando pro toureiro
  cabeca.updateMatrixWorld(true)
  const BOCA_POS = cabeca.localToWorld(new THREE.Vector3(0, -0.06, 0.24))
  const CAPA_ROT = new THREE.Euler(0.05, 0.62, -0.1)
  capa.position.copy(BOCA_POS)
  capa.rotation.copy(CAPA_ROT)

  // ---- rastro de areia chamuscada: do toureiro até a porteira --------------
  const inicio = new THREE.Vector3(TX + 0.3, 0, TZ + 0.1)
  const rastroPts = [
    inicio.clone(),
    ...pts.slice(0, 7).map((v) => new THREE.Vector3(v.x, 0, v.z)),
    new THREE.Vector3(gMid.x, 0, gMid.z),
  ].map((v) => v.sub(inicio))
  const rastroCurva = new THREE.CatmullRomCurve3(rastroPts, false, 'centripetal')
  const rastro = new THREE.Group()
  rastro.position.set(inicio.x, 0, inicio.z)
  root.add(rastro)
  const largura = (u: number) =>
    (0.08 + 0.17 * Math.min(1, u * 4)) * (1 + 0.2 * Math.sin(u * 47) + 0.12 * Math.sin(u * 113))
  rastro.add(ribbon(rastroCurva, (u) => largura(u) + 0.045, GY + 0.003, CHAMUSCADO_BORDA))
  rastro.add(ribbon(rastroCurva, largura, GY + 0.006, CHAMUSCADO))
  // brasinhas ainda acesas no rastro
  for (const u of [0.03, 0.08, 0.13, 0.18, 0.24]) {
    const p = rastroCurva.getPointAt(u)
    const brasa = sphere(0.03, FOGO_MEIO, { emissive: FOGO_EXT, emissiveIntensity: 1.6 }, 10)
    brasa.position.set(p.x + (rand() - 0.5) * 0.08, GY + 0.012, p.z + (rand() - 0.5) * 0.08)
    brasa.scale.y = 0.6
    brasa.castShadow = false
    rastro.add(brasa)
  }

  // ---- toureiro ------------------------------------------------------------
  const toureiro = new THREE.Group()
  toureiro.position.set(TX, GY, TZ)
  toureiro.rotation.y = T_ROT
  toureiro.scale.setScalar(T_SCALE)
  root.add(toureiro)

  const ouro = { roughness: 0.34, metalness: 0.6 }
  // pernas: calça justa dourada até o joelho, meia rosa, sapatilha preta
  for (const side of [-1, 1]) {
    const perna = new THREE.Group()
    perna.position.set(side * 0.11, 0, 0)
    perna.rotation.z = side * 0.05
    toureiro.add(perna)
    const sapatilha = rbox(0.13, 0.065, 0.25, 0.03, PRETO, { roughness: 0.4 })
    sapatilha.position.set(0, 0.033, 0.05)
    perna.add(sapatilha)
    const laco = sphere(0.025, MEIA, { roughness: 0.6 })
    laco.scale.set(1.6, 0.6, 0.8)
    laco.position.set(0, 0.07, 0.15)
    perna.add(laco)
    const canela = capsule(0.06, 0.15, MEIA, { roughness: 0.75 })
    canela.position.y = 0.16
    perna.add(canela)
    const coxa = capsule(0.085, 0.14, OURO, ouro)
    coxa.position.y = 0.33
    perna.add(coxa)
    const joelheira = torus(0.07, 0.016, OURO_ESC, ouro)
    joelheira.rotation.x = Math.PI / 2
    joelheira.position.y = 0.255
    perna.add(joelheira)
    // borlas (machos) no joelho, do lado de fora
    for (const dz of [-0.03, 0.03]) {
      const borla = sphere(0.022, OURO_ESC, ouro)
      borla.scale.set(0.8, 1.5, 0.8)
      borla.position.set(side * 0.075, 0.23, dz)
      perna.add(borla)
    }
  }

  const PH = 1.5
  const p = person({ body: OURO, skin: PELE, height: PH, armAngle: 0.35 })
  p.position.y = LEG_H - 0.05
  toureiro.add(p)
  const bodyH = PH * 0.52
  const bodyR = PH * 0.17
  const corpoT = p.getObjectByName('body') as THREE.Mesh
  corpoT.material = mat(OURO, { ...ouro, size: 0.8 })

  // jaqueta curta bordada: camisa branca, gravata fina, lapelas e cinta
  const camisa = rbox(0.17, 0.3, 0.04, 0.02, CAMISA, { roughness: 0.6 })
  camisa.position.set(0, 0.55, bodyR - 0.01)
  p.add(camisa)
  const gravata = rbox(0.035, 0.24, 0.02, 0.008, PRETO, { roughness: 0.5 })
  gravata.position.set(0, 0.56, bodyR + 0.015)
  p.add(gravata)
  for (const side of [-1, 1]) {
    const lapela = rbox(0.055, 0.34, 0.035, 0.015, OURO_ESC, ouro)
    lapela.position.set(side * 0.105, 0.54, bodyR - 0.005)
    lapela.rotation.z = side * 0.12
    p.add(lapela)
    // bordado em arabescos escuros
    for (const [k, by] of [0.62, 0.5].entries()) {
      const arabesco = torus(0.035, 0.009, BORDADO, { roughness: 0.6 })
      arabesco.position.set(side * (0.19 - k * 0.01), by, bodyR - 0.04)
      arabesco.rotation.y = side * 0.55
      p.add(arabesco)
    }
    // ombreira estofada
    const ombreira = capsule(0.07, 0.1, OURO_ESC, ouro)
    ombreira.rotation.z = Math.PI / 2
    ombreira.position.set(side * (bodyR * 1.0), bodyH * 0.92, 0)
    p.add(ombreira)
  }
  // lantejoulas: fileira de contas na barra da jaqueta
  for (let k = -5; k <= 5; k++) {
    const a = k * 0.2
    const conta = sphere(0.016, '#f1d27a', { roughness: 0.2, metalness: 0.8 }, 10)
    conta.position.set(Math.sin(a) * (bodyR + 0.005), 0.385, Math.cos(a) * (bodyR + 0.005))
    p.add(conta)
  }
  const cinta = torus(bodyR - 0.005, 0.045, FAIXA_CINTA, { roughness: 0.8 })
  cinta.rotation.x = Math.PI / 2
  cinta.position.y = 0.3
  cinta.scale.z = 1.4
  p.add(cinta)

  // cabeça: boca berrando, sobrancelhas erguidas, costeletas, montera preta
  const head = p.getObjectByName('head') as THREE.Group
  const headR = PH * 0.19
  const boca = sphere(0.07, '#3a1a18', { roughness: 0.6 })
  boca.scale.set(1.0, 1.15, 0.5)
  boca.position.set(0, -0.135, headR * 0.88)
  head.add(boca)
  const lingua = sphere(0.035, '#c4606a', { roughness: 0.5 })
  lingua.scale.set(1.3, 0.55, 0.7)
  lingua.position.set(0, -0.175, headR * 0.9)
  head.add(lingua)
  for (const side of [-1, 1]) {
    const sobrancelha = rbox(0.1, 0.028, 0.03, 0.012, PRETO, { roughness: 0.8 })
    sobrancelha.position.set(side * 0.11, 0.135, headR * 0.92)
    sobrancelha.rotation.z = -side * 0.3
    head.add(sobrancelha)
  }
  const montera = new THREE.Group()
  montera.position.y = headR * 0.76
  head.add(montera)
  const copa = sphere(headR * 1.0, PRETO, { roughness: 0.92 })
  copa.scale.set(1.04, 0.46, 1.0)
  montera.add(copa)
  const aba = torus(headR * 0.97, 0.032, PRETO, { roughness: 0.9 })
  aba.rotation.x = Math.PI / 2
  aba.position.y = -0.02
  montera.add(aba)
  // as duas abas arredondadas (machos) caem dos lados, sobre as orelhas
  for (const side of [-1, 1]) {
    const macho = sphere(0.125, PRETO, { roughness: 0.92 })
    macho.scale.set(1.0, 0.82, 0.78)
    macho.position.set(side * 0.27, -0.035, -0.03)
    macho.rotation.z = side * 0.35
    montera.add(macho)
  }
  // cabelo preto curto na nuca e a coleta (rabicho) atrás
  const nuca = sphere(headR * 0.95, PRETO, { roughness: 0.9 })
  nuca.scale.set(1.0, 0.6, 0.8)
  nuca.position.set(0, -0.06, -0.1)
  montera.add(nuca)
  const coleta = sphere(0.055, PRETO, { roughness: 0.9 })
  coleta.position.set(0, -0.2, -0.27)
  montera.add(coleta)

  // braço que aponta a porteira (mão vazia, indicador esticado): o armR, do
  // lado +x — o da porteira
  const bracoAponta = p.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoAponta, PH)
  bracoAponta.material = mat(OURO, { ...ouro, size: 0.4 })
  const maoAponta = bracoAponta.children[0] as THREE.Mesh
  const punhoA = torus(0.075, 0.02, CAMISA, { roughness: 0.6 })
  punhoA.rotation.x = Math.PI / 2
  punhoA.position.y = maoAponta.position.y + 0.1
  bracoAponta.add(punhoA)
  const indicador = capsule(0.025, 0.09, PELE, { roughness: 0.55 })
  indicador.position.set(0, maoAponta.position.y - 0.13, 0.03)
  bracoAponta.add(indicador)
  // Rz ergue o braço para +x; Ry o leva para o fundo, na direção da porteira
  const APONTA = new THREE.Euler(0, 0.42, 1.68)

  // o outro braço (lado -x) vira o braço-telefone: ombro + antebraço dobrado
  const armL = p.getObjectByName('armL') as THREE.Mesh
  p.remove(armL)
  const bracoTel = new THREE.Group()
  const OMBRO = new THREE.Vector3(-bodyR * 1.12, bodyH * 0.62 + 0.27, 0)
  bracoTel.position.copy(OMBRO)
  p.add(bracoTel)
  const COTOVELO = new THREE.Vector3(-0.22, -0.24, 0.12)
  bracoTel.add(link(new THREE.Vector3(0, 0, 0), COTOVELO, 0.085, OURO, ouro))
  const ombroBola = sphere(0.09, OURO_ESC, ouro)
  bracoTel.add(ombroBola)

  const anteTel = new THREE.Group()
  anteTel.position.copy(COTOVELO)
  bracoTel.add(anteTel)
  const MAO_TEL = new THREE.Vector3(0.16, 0.42, 0.02) // relativo ao cotovelo
  anteTel.add(link(new THREE.Vector3(0, 0, 0), MAO_TEL.clone().add(new THREE.Vector3(-0.02, -0.08, 0)), 0.078, OURO, ouro))
  const cotoveloBola = sphere(0.085, OURO, ouro)
  anteTel.add(cotoveloBola)
  const punhoT = torus(0.072, 0.02, CAMISA, { roughness: 0.6 })
  punhoT.position.copy(MAO_TEL).add(new THREE.Vector3(-0.015, -0.08, 0))
  punhoT.rotation.x = Math.PI / 2
  anteTel.add(punhoT)
  // mão-telefone: punho fechado, polegar na orelha, mindinho na boca
  const telefone = new THREE.Group()
  telefone.position.copy(MAO_TEL)
  anteTel.add(telefone)
  const punho = sphere(0.085, PELE, { roughness: 0.55 })
  punho.scale.set(0.8, 1.0, 1.0)
  telefone.add(punho)
  // polegar sobe até a orelha, mindinho desce até a boca: o telefone de mão
  const dedoOp = { roughness: 0.55 }
  telefone.add(link(new THREE.Vector3(0.0, 0.05, -0.01), new THREE.Vector3(0.05, 0.17, -0.08), 0.033, PELE, dedoOp))
  telefone.add(link(new THREE.Vector3(0.02, -0.05, 0.04), new THREE.Vector3(0.15, -0.1, 0.14), 0.03, PELE, dedoOp))
  for (const dy of [-0.03, 0.0, 0.03]) {
    const dedo = sphere(0.03, PELE, dedoOp)
    dedo.position.set(-0.05, dy, 0.045)
    telefone.add(dedo)
  }
  // braço caído (antes do telefone): ombro gira para baixo, antebraço desce
  const TEL_OMBRO_BAIXO = 0.6
  const TEL_ANTE_BAIXO = 2.9

  // ---- três arcos do toque saindo da mão-telefone ---------------------------
  bracoAponta.rotation.copy(APONTA)
  toureiro.updateMatrixWorld(true)
  const ondas = new THREE.Group()
  ondas.position.copy(telefone.localToWorld(new THREE.Vector3(-0.03, 0.02, 0)))
  ondas.rotation.y = Math.atan2(CAM[0] - ondas.position.x, CAM[2] - ondas.position.z)
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

  // posição inicial da capa: na mão do braço que vai apontar (aberto pro lado)
  const BRACO_CAPA = 0.95
  bracoAponta.rotation.set(0, 0, BRACO_CAPA)
  toureiro.updateMatrixWorld(true)
  const MAO_CAPA = maoAponta.localToWorld(new THREE.Vector3(0, -0.05, 0.05))
  bracoAponta.rotation.copy(APONTA)
  const CAPA_ROT_MAO = Math.PI - 0.3 // na mão: pano estendido pra porteira, de frente

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'arena', object: base },
    { name: 'barreira', group: 'arena', object: barreira },
    { name: 'porteira', group: 'arena', object: porteira },
    { name: 'toureiro', group: 'toureiro', object: toureiro },
    { name: 'bracoAponta', group: 'toureiro', object: bracoAponta },
    { name: 'bracoTel', group: 'toureiro', object: bracoTel },
    { name: 'anteTel', group: 'toureiro', object: anteTel },
    { name: 'capa', group: 'toureiro', object: capa },
    { name: 'boitata', group: 'boitata', object: boitata },
    { name: 'cabeca', group: 'boitata', object: cabeca },
    { name: 'rastro', group: 'fuga', object: rastro },
    { name: 'ondas', group: 'ring', object: ondas },
  ]

  // ---- montagem ------------------------------------------------------------
  const s3 = (v0: number, v1: number) => [ch('scale.x', v0, v1), ch('scale.y', v0, v1), ch('scale.z', v0, v1)]
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Tourada de gala: arena de areia, barreira vermelha, arquibancada lotada.',
    }),
    seq('barreira-rise', 'barreira', 0.25, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),
    seq('porteira-rise', 'porteira', 0.5, 0.8, [riseFrom(0, 1.3)], { ease: 'easeOut' }),

    seq('toureiro-rise', 'toureiro', 1.7, 0.85, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'O toureiro de traje dourado gira a capa vermelha pra porteira…',
    }),
    seq('braco-capa', 'bracoAponta', 1.7, 0.85, [ch('rotation.z', BRACO_CAPA, BRACO_CAPA)]),
    seq('braco-tel-baixo', 'bracoTel', 1.7, 0.85, [ch('rotation.z', TEL_OMBRO_BAIXO, TEL_OMBRO_BAIXO)]),
    seq('ante-tel-baixo', 'anteTel', 1.7, 0.85, [ch('rotation.z', TEL_ANTE_BAIXO, TEL_ANTE_BAIXO)]),
    seq('capa-abre', 'capa', 2.4, 0.6, [
      ch('position.x', MAO_CAPA.x, MAO_CAPA.x),
      ch('position.y', MAO_CAPA.y, MAO_CAPA.y),
      ch('position.z', MAO_CAPA.z, MAO_CAPA.z),
      ch('rotation.y', CAPA_ROT_MAO, CAPA_ROT_MAO),
      ...s3(0.05, 1),
    ], { ease: 'easeOut' }),

    seq('boitata-rise', 'boitata', 3.9, 0.9, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: '…e no lugar do boi sai serpenteando o BOItatá, a cobra de fogo de olhos de tocha!',
    }),
    seq('cabeca-rise', 'cabeca', 4.3, 0.7, [ch('position.y', HEAD_POS.y - 0.6, HEAD_POS.y), ...s3(0.3, 1)], {
      ease: 'easeOut',
    }),

    seq('cabeca-bote', 'cabeca', 6.0, 0.3, [ch('rotation.x', HEAD_PITCH, -0.25)], {
      ease: 'easeOut',
      caption: 'Em vez de atacar, ele dá o bote na capa e arranca da mão do toureiro…',
    }),
    seq('capa-voa', 'capa', 6.15, 0.75, [
      ch('position.x', MAO_CAPA.x, BOCA_POS.x),
      ch('position.y', MAO_CAPA.y, BOCA_POS.y),
      ch('position.z', MAO_CAPA.z, BOCA_POS.z),
      ch('rotation.x', 0, CAPA_ROT.x),
      ch('rotation.y', CAPA_ROT_MAO, CAPA_ROT.y),
      ch('rotation.z', 0, CAPA_ROT.z),
    ], { ease: 'easeInOut' }),
    seq('cabeca-morde', 'cabeca', 6.75, 0.35, [ch('rotation.x', -0.25, HEAD_PITCH)], { ease: 'easeOut' }),
    seq('braco-solta', 'bracoAponta', 6.3, 0.5, [ch('rotation.z', BRACO_CAPA, 0.35)], { ease: 'easeOut' }),

    seq('rastro-cresce', 'rastro', 7.4, 1.0, [ch('scale.x', 0.02, 1), ch('scale.z', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…e foge pela porteira com ela na boca, deixando um rastro de areia chamuscada. Roubo!',
    }),
    seq('capa-tremula-a', 'capa', 7.6, 0.45, [ch('rotation.z', CAPA_ROT.z, CAPA_ROT.z + 0.18)], { ease: 'easeInOut' }),
    seq('capa-tremula-b', 'capa', 8.05, 0.5, [ch('rotation.z', CAPA_ROT.z + 0.18, CAPA_ROT.z)], { ease: 'easeInOut' }),

    seq('braco-aponta', 'bracoAponta', 9.0, 0.55, [
      ch('rotation.z', 0.35, APONTA.z), ch('rotation.y', 0, APONTA.y), ch('rotation.x', 0, APONTA.x),
    ], {
      ease: 'easeOut',
      caption: 'De mãos vazias, ele aponta a porteira, faz telefone com a mão e berra pra arquibancada…',
    }),
    seq('braco-tel-sobe', 'bracoTel', 9.3, 0.6, [ch('rotation.z', TEL_OMBRO_BAIXO, 0)], { ease: 'easeOut' }),
    seq('ante-tel-sobe', 'anteTel', 9.3, 0.6, [ch('rotation.z', TEL_ANTE_BAIXO, 0)], { ease: 'easeOut' }),

    seq('ondas-a', 'ondas', 10.4, 0.4, s3(0.2, 1), {
      ease: 'easeOut',
      caption: 'R-R-RING! PO-LÍÍS… — olha pras próprias mãos — …SEM capa!',
    }),
    seq('ondas-b', 'ondas', 11.0, 0.35, s3(0.7, 1), { ease: 'easeOut' }),
    seq('ondas-c', 'ondas', 12.3, 0.4, s3(0.75, 1), {
      ease: 'easeOut',
      caption: 'Ring polisen! — Liga pra polícia!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.2, 1.02, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'ring-polisen',
    contexto:
      'Emergência: briga na rua, alguém arrombando um carro ou uma bicicleta, assalto, alguém sendo ameaçado — gritado pra quem está por perto enquanto você ajuda ou se afasta. Na emergência é 112; sem urgência (registrar o furto da bicicleta no dia seguinte, por exemplo), 114 14.',
    fraseFonte: 'Liga pra polícia!',
    fraseAlvo: 'Ring polisen!',
    pronuncia:
      "RING pu-LÍÍ-sen! ('ring' com R de PONTA DE LÍNGUA — nunca o RR de garganta, que sopra um h e vira 'hing' —, I curto e NG no nariz, sem estalar o G, como em 'Ring 112!'; 'polisen' com o PO fraquinho, quase PU, força no LÍ com I LONGO, S de cobra — nunca Z — e o -sen curtinho e fraco, sem nasal: é 'A polícia')",
    ponteSonora:
      "R-R-RING! PO-LÍÍS... SEM! (4 sílabas: ring-pu-LÍÍ-sen; força no RING e, maior, no LÍ; R-R-RING é o MESMO de 'Ring 112!' (o sino do ganso): o tremido do telefone, R de PONTA DE LÍNGUA vibrando — por isso vem escrito R-R-R —, nunca o RR soprado de RRÁR nem o RR de garganta de 'rato', que sopra um h e vira 'hing'; NG no nariz, sem estalar o G e sem 'gue'; aqui não tem sino: é o toureiro fazendo telefone com a mão; PO-LÍÍS = a POLÍCIA cortada no S, que é exatamente a palavra que você lê toda semana nas viaturas suecas, POLIS: o PO fraquinho, quase PU — como o brasileiro já fala 'pulícia' —, a força no LÍ com o I LONGO, esticado antes do S, e o S de cobra, nunca Z; SEM = o MESMO SEM de 'Jag har missat bussen' (BUS-SEM): o 'sem' de 'SEM capa', mas SEM NASALAR — E curtinho e fraco, N batido na língua — e grudado no S: pu-LÍÍ-sen; é o '-en' de 'polisen', A polícia; sem ele sobra 'polis' pelado, e a frase sai torta)",
    historia:
      'Tourada de gala, arquibancada lotada. O toureiro gira a capa vermelha pra porteira — e, no lugar do boi bravo, sai de lá serpenteando o BOItatá, a cobra de fogo da mata, com dois olhos que são duas tochas. Em vez de atacar, ele dá o bote na capa, arranca-a da mão do toureiro e foge com ela na boca pela porteira, rua afora, a capa tremulando feito bandeira e um rastro de areia chamuscada atrás. Roubo! O toureiro fica plantado no meio da arena de mãos vazias, só com a roupinha justa de lantejoulas. Ele faz telefone com a mão, polegar na orelha e mindinho na boca, aponta a porteira e berra pra arquibancada: R-R-RING! POLÍÍS... — olha pras próprias mãos — ...SEM capa! Alguém liga pra polícia!',
  },
  createScene,
}

export default card
