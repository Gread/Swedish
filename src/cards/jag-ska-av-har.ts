import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag ska av här." — IÁ! SKA… ÁV(e)! RRÉR(a)!
 *
 * O faisão de chapéu pork pie toca SKA no sax dourado dentro do bonde azul —
 * IÁ! SKA! — e quase perde o ponto. Lá fora passa o abrigo dele, coberto de
 * HERA (RRÉR). AVE Maria! (ÁÁV) — ele lembra que é AVE, abre as asas e sai
 * voando pela porta, com sax e tudo, rumo ao teto de hera.
 *
 * Diorama: rua com dois trilhos no fundo, bonde azul e branco parado com a
 * porta do meio aberta; calçada de lajotas na frente; à direita, o abrigo de
 * vidro com o teto tomado de hera. O faisão plana no meio, entre a porta e o
 * abrigo, com a cauda longuíssima ainda saindo da porta. Cenário em tons
 * frios e apagados; a cor fica toda no faisão (cobre, esmeralda, máscara
 * vermelha) — o acento saturado é ele, a AVE.
 */

const CHAO = '#4b4741'
const ASFALTO = '#38383d'
const TRILHO = '#b9c0c6'
const CALCADA = '#9b9991'
const LAJE_A = '#aeaca4'
const LAJE_B = '#a3a199'
const MEIO_FIO = '#c4c2ba'
const AZUL = '#2f5d93'
const AZUL_ESC = '#24476f'
const BRANCO = '#ecebe6'
const TETO = '#b8bcc0'
const VIDRO_ESC = '#1f2a35'
const INTERIOR = '#3d3329'
const AMARELO = '#e3b437'
const FERRO = '#33383d'
const MADEIRA = '#a3713f'
const HERA_A = '#2f6131'
const HERA_B = '#3c7a3a'
const HERA_C = '#24502a'
const COBRE = '#b9612a'
const COBRE_CLARO = '#cf7a3a'
const COBRE_ESC = '#5e2f16'
const ESMERALDA = '#168058'
const ESMERALDA_ESC = '#0e5a3e'
const VERMELHO = '#d8261f' // máscara do faisão
const MARFIM = '#eadcae'
const ASA = '#a8783c'
const ASA_ESC = '#6e4823'
const BEGE = '#e3cd9b'
const LISTRA = '#4a2d16'
const CHAPEU = '#1f1d22'
const DOURADO = '#e2a92c'
const PEROLA = '#f3ead5'
const PATA = '#8e7c70'

const GY = 0.18 // topo da base
const SY = 0.33 // topo das lajotas da calçada
const TZ = -1.1 // eixo do bonde / trilhos
const TX = -0.9 // centro do bonde
const L = 3.2 // comprimento do bonde
const D = 1.2 // largura do bonde
const DOOR_LX = -0.15 // porta do meio, em x local do bonde
const SX = 1.75 // abrigo
const SZ = 0.6

// faisão: pose final em voo e pose na porta (antes de voar)
const F: [number, number, number] = [0.12, 1.8, 0.22]
const FS = 1.15 // o faisão é o protagonista: um pouco maior que o natural
const F_YAW = -0.3
const F_PITCH = 0.12
const P: [number, number, number] = [TX + DOOR_LX, 1.12, -0.24]
const P_YAW = -1.05
const P_PITCH = 0.55
const WING_P = -1.1 // asa de perto: erguida quase na vertical, de frente pra câmera
const WING_L = 0.8 // asa de longe: erguida atrás, aparece por cima do dorso

/** Folha de hera: coração achatado (dois lóbulos + ponta), no plano xy. */
function ivyLeaf(s: number, color: string) {
  const g = new THREE.Group()
  for (const side of [-1, 1]) {
    const lobe = sphere(s * 0.55, color, { roughness: 0.5 }, 12)
    lobe.position.set(side * s * 0.38, 0, 0)
    lobe.scale.z = 0.28
    g.add(lobe)
  }
  const tip = cone(s * 0.62, s * 0.9, color, { roughness: 0.5 }, 12)
  tip.position.y = -s * 0.42
  tip.rotation.z = Math.PI
  tip.scale.z = 0.28
  g.add(tip)
  return g
}

/** Pena listrada: segmentos alternados ao longo de +z (ou -x), afinando. */
function stripedFeather(
  len: number, w0: number, w1: number, n: number,
  colors: [string, string], axis: 'x' | 'z', sign = 1,
) {
  const g = new THREE.Group()
  const seg = len / n
  for (let i = 0; i < n; i++) {
    const w = w0 + (w1 - w0) * (i / (n - 1))
    const c = colors[i % 2]
    const piece = axis === 'z'
      ? rbox(w, 0.028, seg * 1.04, 0.012, c, { roughness: 0.7 })
      : rbox(seg * 1.04, 0.026, w, 0.011, c, { roughness: 0.7 })
    if (axis === 'z') piece.position.z = sign * (i + 0.5) * seg
    else piece.position.x = sign * (i + 0.5) * seg
    g.add(piece)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(77)

  // ---- calçada: base do diorama + lajotas + meio-fio -----------------------
  const calcada = new THREE.Group()
  const chao = rbox(5.45, 0.18, 3.25, 0.07, CHAO, { roughness: 0.85 })
  chao.position.set(0, 0.09, -0.275)
  calcada.add(chao)

  const passeio = rbox(5.37, 0.12, 1.58, 0.03, CALCADA, { roughness: 0.85 })
  passeio.position.set(0, GY + 0.06, 0.5)
  calcada.add(passeio)

  const meioFio = rbox(5.37, 0.15, 0.13, 0.03, MEIO_FIO, { roughness: 0.75 })
  meioFio.position.set(0, GY + 0.075, -0.3)
  calcada.add(meioFio)

  const LAJ = 0.52
  for (let ix = 0; ix < 9; ix++) {
    for (let iz = 0; iz < 3; iz++) {
      const laje = rbox(LAJ - 0.04, 0.03, LAJ - 0.04, 0.012, (ix + iz) % 2 ? LAJE_A : LAJE_B, { roughness: 0.85 })
      laje.position.set(-2.296 + ix * (LAJ + 0.054), GY + 0.135, -0.04 + iz * LAJ)
      laje.rotation.y = (rand() - 0.5) * 0.02
      calcada.add(laje)
    }
  }
  root.add(calcada)

  // ---- rua: asfalto + dois trilhos prateados -------------------------------
  const rua = new THREE.Group()
  const asfalto = rbox(5.37, 0.035, 1.56, 0.012, ASFALTO, { roughness: 0.9 })
  asfalto.position.set(0, GY + 0.017, -1.13)
  rua.add(asfalto)
  for (const dz of [-0.42, 0.42]) {
    const trilho = rbox(5.37, 0.04, 0.07, 0.012, TRILHO, { roughness: 0.3, metalness: 0.75 })
    trilho.position.set(0, GY + 0.045, TZ + dz)
    rua.add(trilho)
    const sulco = rbox(5.37, 0.01, 0.03, 0.004, '#1c1c20', { roughness: 0.9 })
    sulco.position.set(0, GY + 0.068, TZ + dz + 0.05)
    rua.add(sulco)
  }
  root.add(rua)

  // ---- bonde azul e branco, porta do meio aberta ---------------------------
  const bonde = new THREE.Group()
  bonde.position.set(TX, GY + 0.04, TZ)
  root.add(bonde)

  for (const bx of [-1.0, 1.0]) {
    const truque = rbox(0.9, 0.2, 1.0, 0.05, FERRO, { roughness: 0.6 })
    truque.position.set(bx, 0.17, 0)
    bonde.add(truque)
    for (const wx of [-0.27, 0.27]) {
      const roda = cylinder(0.14, 0.14, 0.06, '#2a2d31', { roughness: 0.5, metalness: 0.5 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(bx + wx, 0.14, 0.52)
      bonde.add(roda)
    }
  }

  const casco = rbox(L, 1.68, D, 0.3, BRANCO, { roughness: 0.4 })
  casco.position.y = 1.11
  bonde.add(casco)

  const saia = rbox(L + 0.03, 0.66, D + 0.03, 0.22, AZUL, { roughness: 0.4 })
  saia.position.y = 0.6
  bonde.add(saia)

  const faixa = rbox(L + 0.02, 0.1, D + 0.02, 0.05, AZUL, { roughness: 0.4 })
  faixa.position.y = 1.86
  bonde.add(faixa)

  const teto = rbox(L - 0.4, 0.16, D - 0.3, 0.07, TETO, { roughness: 0.5 })
  teto.position.y = 2.0
  bonde.add(teto)

  // janelas da lateral (menos onde fica a porta)
  for (const wx of [-1.2, 0.98]) {
    const jan = rbox(0.48, 0.6, 0.04, 0.06, VIDRO_ESC, { roughness: 0.12, metalness: 0.3 })
    jan.position.set(wx, 1.42, D / 2 + 0.005)
    bonde.add(jan)
  }

  // cabine na ponta esquerda: para-brisa contornando a quina + farol
  const parabrisa = rbox(0.24, 0.62, D - 0.18, 0.08, VIDRO_ESC, { roughness: 0.12, metalness: 0.3 })
  parabrisa.position.set(-L / 2 + 0.02, 1.42, 0)
  bonde.add(parabrisa)
  const farol = sphere(0.06, '#fff3cf', { emissive: '#ffe7a6', emissiveIntensity: 0.9 })
  farol.position.set(-L / 2 + 0.08, 0.62, D / 2 - 0.05)
  bonde.add(farol)
  const letreiro = rbox(0.5, 0.13, 0.03, 0.02, '#1b1b1d', { roughness: 0.4 })
  letreiro.position.set(-1.1, 1.94, D / 2 + 0.01)
  bonde.add(letreiro)
  const ambar = rbox(0.42, 0.06, 0.02, 0.01, '#ffb43a', { emissive: '#ffa21f', emissiveIntensity: 0.9 })
  ambar.position.set(-1.1, 1.94, D / 2 + 0.025)
  bonde.add(ambar)

  // porta aberta: vão escuro e quente, degrau, balaústre amarelo, folhas recolhidas
  const vao = rbox(0.74, 1.5, 0.04, 0.05, INTERIOR, { roughness: 0.8 })
  vao.position.set(DOOR_LX, 1.08, D / 2 + 0.01)
  bonde.add(vao)
  const piso = rbox(0.74, 0.04, 0.2, 0.015, '#6c6a66', { roughness: 0.7 })
  piso.position.set(DOOR_LX, 0.36, D / 2 + 0.08)
  bonde.add(piso)
  const balaustre = cylinder(0.025, 0.025, 1.46, AMARELO, { roughness: 0.35 })
  balaustre.position.set(DOOR_LX - 0.24, 1.08, D / 2 + 0.05)
  bonde.add(balaustre)
  for (const side of [-1, 1]) {
    const folha = rbox(0.36, 1.48, 0.04, 0.04, AZUL_ESC, { roughness: 0.4 })
    folha.position.set(DOOR_LX + side * 0.58, 1.08, D / 2 + 0.05)
    bonde.add(folha)
    const vidroF = rbox(0.24, 0.62, 0.02, 0.03, VIDRO_ESC, { roughness: 0.12, metalness: 0.3 })
    vidroF.position.set(DOOR_LX + side * 0.58, 1.4, D / 2 + 0.075)
    bonde.add(vidroF)
  }

  // pantógrafo no teto
  const panto = new THREE.Group()
  panto.position.set(0.55, 2.08, 0)
  const pBase = rbox(0.4, 0.06, 0.4, 0.02, FERRO, { roughness: 0.5 })
  panto.add(pBase)
  for (const [a, x0] of [[0.75, -0.08], [-0.75, 0.08]] as const) {
    const haste = cylinder(0.014, 0.014, 0.42, FERRO, { roughness: 0.5, metalness: 0.5 })
    haste.position.set(x0 + Math.sin(a) * 0.0, 0.2, 0)
    haste.rotation.z = a
    panto.add(haste)
  }
  const arco = cylinder(0.018, 0.018, 0.62, FERRO, { roughness: 0.5, metalness: 0.5 })
  arco.rotation.x = Math.PI / 2
  arco.position.y = 0.36
  panto.add(arco)
  bonde.add(panto)

  // ---- abrigo de ponto de vidro, teto plano --------------------------------
  const abrigo = new THREE.Group()
  abrigo.position.set(SX, SY, SZ)
  root.add(abrigo)

  for (const px of [-0.72, 0.72]) {
    for (const pz of [-0.36, 0.36]) {
      const poste = rbox(0.07, 1.95, 0.07, 0.02, FERRO, { roughness: 0.5, metalness: 0.4 })
      poste.position.set(px, 0.975, pz)
      abrigo.add(poste)
    }
  }
  const telhado = rbox(1.7, 0.1, 0.98, 0.03, '#3d4247', { roughness: 0.5 })
  telhado.position.y = 2.0
  abrigo.add(telhado)

  const vidroMat = mat('#cfe7f0', { roughness: 0.05, detail: 0 })
  vidroMat.transparent = true
  vidroMat.opacity = 0.28
  vidroMat.depthWrite = false
  const fundo = new THREE.Mesh(new THREE.BoxGeometry(1.38, 1.5, 0.025), vidroMat)
  fundo.position.set(0, 1.08, -0.36)
  abrigo.add(fundo)
  const lado = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.5, 0.66), vidroMat)
  lado.position.set(0.72, 1.08, 0)
  abrigo.add(lado)
  const travessa = rbox(1.44, 0.05, 0.05, 0.015, FERRO, { roughness: 0.5, metalness: 0.4 })
  travessa.position.set(0, 0.32, -0.36)
  abrigo.add(travessa)

  const banco = rbox(1.0, 0.06, 0.3, 0.025, MADEIRA, { roughness: 0.65 })
  banco.position.set(-0.05, 0.48, -0.18)
  abrigo.add(banco)
  for (const bx of [-0.4, 0.3]) {
    const pe = rbox(0.05, 0.45, 0.22, 0.015, FERRO, { roughness: 0.5 })
    pe.position.set(bx, 0.225, -0.2)
    abrigo.add(pe)
  }

  // ---- hera: cobre o teto e desce pelas colunas -----------------------------
  const hera = new THREE.Group()
  hera.position.set(SX, SY, SZ)
  root.add(hera)
  const HERAS = [HERA_A, HERA_B, HERA_C]

  for (const [hx, hz, r, s] of [
    [-0.52, -0.22, 0.27, 1], [0, -0.24, 0.3, 2], [0.52, -0.2, 0.26, 3],
    [-0.5, 0.22, 0.26, 4], [0.02, 0.24, 0.28, 5], [0.55, 0.2, 0.25, 6],
  ] as const) {
    const moita = puff(r, HERAS[s % 3], 6, 90 + s, { roughness: 0.9 })
    moita.scale.set(1.15, 0.5, 1.1)
    moita.position.set(hx, 2.13, hz)
    hera.add(moita)
  }
  // franja de folhas pendendo da borda da frente e do lado direito do teto
  for (let i = 0; i < 12; i++) {
    const folha = ivyLeaf(0.1 + rand() * 0.035, HERAS[i % 3])
    folha.position.set(-0.78 + i * 0.142, 1.92 - rand() * 0.16, 0.5)
    folha.rotation.set(-0.15, 0, (rand() - 0.5) * 0.7)
    hera.add(folha)
  }
  for (let i = 0; i < 6; i++) {
    const folha = ivyLeaf(0.1 + rand() * 0.03, HERAS[(i + 1) % 3])
    folha.position.set(0.86, 1.92 - rand() * 0.14, -0.42 + i * 0.17)
    folha.rotation.set(0, Math.PI / 2, (rand() - 0.5) * 0.7)
    hera.add(folha)
  }
  // ramas descendo pelas colunas da frente
  for (const [px, bottom] of [[-0.72, 0.55], [0.72, 0.15]] as const) {
    const top = 1.95
    const rama = cylinder(0.016, 0.016, top - bottom, HERA_C, { roughness: 0.8 })
    rama.position.set(px, (top + bottom) / 2, 0.41)
    hera.add(rama)
    const n = Math.round((top - bottom) / 0.13)
    for (let i = 0; i < n; i++) {
      const side = i % 2 ? 1 : -1
      const folha = ivyLeaf(0.085 + rand() * 0.03, HERAS[i % 3])
      folha.position.set(px + side * 0.07, top - 0.05 - i * 0.13, 0.43)
      folha.rotation.set(-0.1, 0, side * (0.5 + rand() * 0.4))
      hera.add(folha)
    }
  }

  // ---- FAISÃO: corpo cobre (orgânico) ---------------------------------------
  const faisao = new THREE.Group()
  faisao.position.set(...F)
  faisao.rotation.set(0, F_YAW, F_PITCH)
  faisao.scale.setScalar(FS)
  root.add(faisao)

  const corpo = sphere(0.32, COBRE, { roughness: 0.6 })
  corpo.scale.set(1.38, 0.86, 0.82)
  faisao.add(corpo)

  const peito = sphere(0.24, COBRE_CLARO, { roughness: 0.6 })
  peito.scale.set(1.0, 0.95, 0.95)
  peito.position.set(0.22, -0.02, 0)
  faisao.add(peito)

  const anca = sphere(0.21, COBRE, { roughness: 0.6 })
  anca.scale.set(1.2, 0.8, 0.85)
  anca.position.set(-0.32, 0.04, 0)
  faisao.add(anca)

  const pescoco = capsule(0.115, 0.17, ESMERALDA, { roughness: 0.35, metalness: 0.2 })
  pescoco.position.set(0.4, 0.21, 0)
  pescoco.rotation.z = -0.62
  faisao.add(pescoco)

  // colar branco na base do pescoço
  const colarGeo = new THREE.TorusGeometry(0.118, 0.028, 12, 32)
  const colar = new THREE.Mesh(colarGeo, mat('#f2efe6', { roughness: 0.6 }))
  colar.castShadow = true
  colar.receiveShadow = true
  colar.position.set(0.33, 0.12, 0)
  colar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0.58, 0.81, 0).normalize())
  faisao.add(colar)

  // escamas escuras salpicadas no dorso e no flanco
  for (let i = 0; i < 16; i++) {
    const a = 0.5 + rand() * 2.2 // ao longo do corpo
    const b = -0.3 + rand() * 2.1 // em volta do eixo x (do flanco da frente ao dorso)
    const sz = rand() < 0.5 ? 1 : -1
    const nx = Math.cos(a)
    const nr = Math.sin(a)
    const pos = new THREE.Vector3(0.44 * nx, 0.275 * nr * Math.sin(b), sz * 0.262 * nr * Math.cos(b))
    const pinta = sphere(0.024, COBRE_ESC, { roughness: 0.7 }, 10)
    pinta.position.copy(pos)
    pinta.scale.set(1.3, 0.8, 1.3)
    faisao.add(pinta)
  }

  // pernas recolhidas pra trás; uma segura o sax
  for (const side of [-1, 1]) {
    const perna = capsule(0.042, 0.2, PATA, { roughness: 0.7 })
    perna.position.set(0.02, -0.3, side * 0.1)
    perna.rotation.z = side < 0 ? 0.25 : 0.9
    faisao.add(perna)
  }
  for (let t = 0; t < 3; t++) {
    const dedo = capsule(0.022, 0.06, PATA, { roughness: 0.7 })
    dedo.position.set(0.1 + t * 0.03, -0.43, -0.1 + (t - 1) * 0.035)
    dedo.rotation.z = 0.4
    faisao.add(dedo)
  }

  // ---- cabeça verde-esmeralda com máscara vermelha --------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.5, 0.36, 0)
  faisao.add(cabeca)

  const cranio = sphere(0.17, ESMERALDA, { roughness: 0.35, metalness: 0.2 })
  cranio.scale.set(1.12, 1, 0.95)
  cabeca.add(cranio)
  const bico = cone(0.05, 0.13, MARFIM, { roughness: 0.4 })
  bico.rotation.z = -Math.PI / 2
  bico.position.set(0.22, -0.03, 0)
  cabeca.add(bico)
  for (const side of [-1, 1]) {
    const mascara = sphere(0.085, VERMELHO, { roughness: 0.55 })
    mascara.scale.set(1.25, 1.35, 0.42)
    mascara.position.set(0.05, 0.0, side * 0.14)
    cabeca.add(mascara)
    const olho = sphere(0.042, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(0.06, 0.02, side * 0.172)
    cabeca.add(olho)
    const pupila = sphere(0.022, '#141414', { roughness: 0.2 })
    pupila.position.set(0.075, 0.025, side * 0.19)
    cabeca.add(pupila)
    const tufo = cone(0.04, 0.14, ESMERALDA_ESC, { roughness: 0.4 })
    tufo.position.set(-0.12, 0.13, side * 0.07)
    tufo.rotation.set(side * -0.25, 0, 0.95)
    cabeca.add(tufo)
  }

  // ---- chapéu pork pie preto, fita branca (no alto da cabeça) ---------------
  const chapeu = new THREE.Group()
  chapeu.position.set(-0.02, 0.14, 0)
  chapeu.rotation.z = 0.28
  cabeca.add(chapeu)
  const aba = lathe(
    [
      [0, 0], [0.22, 0], [0.24, 0.014], [0.232, 0.026], [0.14, 0.03], [0.136, 0.12],
      [0.126, 0.132], [0.104, 0.126], [0.098, 0.112], [0, 0.112],
    ],
    CHAPEU,
    { roughness: 0.8 },
  )
  chapeu.add(aba)
  const fita = cylinder(0.142, 0.141, 0.035, '#f1eee6', { roughness: 0.6 })
  fita.position.y = 0.05
  chapeu.add(fita)

  // ---- cauda longuíssima listrada ------------------------------------------
  const cauda = new THREE.Group()
  cauda.position.set(-0.46, 0.06, 0)
  cauda.rotation.set(0.75, 0, 0.1)
  faisao.add(cauda)
  for (const [dz, rotY, len] of [[0, 0, 1.5], [0.07, 0.2, 1.1], [-0.07, -0.2, 1.1]] as const) {
    const pena = stripedFeather(len, 0.17, 0.06, Math.round(len / 0.12), [ASA_ESC, BEGE], 'x', -1)
    pena.position.set(0, dz === 0 ? 0.02 : 0, dz)
    pena.rotation.y = rotY
    cauda.add(pena)
  }

  // ---- asas abertas marrom-douradas, pontas listradas ----------------------
  function makeWing(s: number, raise: number) {
    const w = new THREE.Group()
    w.position.set(0.04, 0.17, s * 0.12)
    w.rotation.x = raise
    // coberteiras: lâmina arredondada, bordo de ataque grosso
    const coberta = sphere(0.25, ASA, { roughness: 0.7 })
    coberta.scale.set(0.85, 0.14, 1.05)
    coberta.position.set(0.0, 0, s * 0.25)
    w.add(coberta)
    const bordo = capsule(0.05, 0.42, ASA_ESC, { roughness: 0.7 })
    bordo.rotation.x = Math.PI / 2
    bordo.position.set(0.15, 0.005, s * 0.25)
    w.add(bordo)
    // secundárias: penas pendendo pra trás, ponta bege
    for (let j = 0; j < 4; j++) {
      const sec = rbox(0.3, 0.026, 0.11, 0.035, ASA_ESC, { roughness: 0.7 })
      sec.position.set(-0.27, -0.006, s * (0.08 + j * 0.105))
      sec.rotation.y = s * 0.08
      w.add(sec)
      const ponta = rbox(0.06, 0.028, 0.1, 0.03, BEGE, { roughness: 0.7 })
      ponta.position.set(-0.43, -0.006, s * (0.08 + j * 0.105 - 0.012))
      w.add(ponta)
    }
    // primárias: leque na ponta, listradas no fim
    for (let i = 0; i < 5; i++) {
      const d = 0.56 - i * 0.05
      const p = new THREE.Group()
      p.position.set(0.12 - i * 0.07, 0.004 - i * 0.003, s * 0.44)
      p.rotation.y = -s * (i * 0.15)
      const haste = rbox(0.1, 0.028, d - 0.16, 0.035, i % 2 ? ASA : ASA_ESC, { roughness: 0.7 })
      haste.position.z = s * (d - 0.16) / 2
      p.add(haste)
      for (const [k, c] of [[0, LISTRA], [1, BEGE], [2, LISTRA]] as const) {
        const faixa = rbox(0.1 - k * 0.012, 0.03, 0.055, 0.02, c, { roughness: 0.7 })
        faixa.position.z = s * (d - 0.16 + 0.027 + k * 0.052)
        p.add(faixa)
      }
      w.add(p)
    }
    faisao.add(w)
    return w
  }
  const asaPerto = makeWing(1, WING_P)
  const asaLonge = makeWing(-1, WING_L)

  // ---- saxofone dourado curvo, preso na pata -------------------------------
  const sax = new THREE.Group()
  sax.position.set(0.12, -0.45, 0.06)
  sax.rotation.set(0, 0.5, -0.35)
  faisao.add(sax)
  const ouro = { roughness: 0.25, metalness: 0.85 }
  const tubo = cylinder(0.036, 0.062, 0.46, DOURADO, ouro)
  tubo.position.y = -0.29
  sax.add(tubo)
  const curvaGeo = new THREE.TorusGeometry(0.09, 0.062, 14, 24, Math.PI)
  const curva = new THREE.Mesh(curvaGeo, mat(DOURADO, ouro))
  curva.castShadow = true
  curva.rotation.z = Math.PI
  curva.position.set(0.09, -0.52, 0)
  sax.add(curva)
  const subida = cylinder(0.072, 0.064, 0.16, DOURADO, ouro)
  subida.position.set(0.18, -0.44, 0)
  sax.add(subida)
  const campana = lathe(
    [[0.07, 0], [0.085, 0.05], [0.12, 0.1], [0.15, 0.125], [0.155, 0.135], [0.14, 0.138]],
    DOURADO,
    ouro,
  )
  ;(campana.material as THREE.Material).side = THREE.DoubleSide
  campana.position.set(0.18, -0.37, 0)
  sax.add(campana)
  const tudel = cylinder(0.022, 0.034, 0.16, DOURADO, ouro)
  tudel.position.set(-0.045, -0.02, 0)
  tudel.rotation.z = -0.55
  sax.add(tudel)
  const boquilha = cylinder(0.016, 0.022, 0.07, '#18181a', { roughness: 0.3 })
  boquilha.position.set(-0.1, 0.07, 0)
  boquilha.rotation.z = -0.55
  sax.add(boquilha)
  for (let k = 0; k < 5; k++) {
    const chave = cylinder(0.024, 0.024, 0.02, PEROLA, { roughness: 0.3 })
    chave.rotation.x = Math.PI / 2
    chave.position.set(0, -0.12 - k * 0.075, 0.04 + k * 0.004)
    sax.add(chave)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'calcada', group: 'rua', object: calcada },
    { name: 'rua', group: 'rua', object: rua },
    { name: 'bonde', group: 'bonde', object: bonde },
    { name: 'faisao', group: 'faisao', object: faisao },
    { name: 'cabeca', group: 'faisao', object: cabeca },
    { name: 'chapeu', group: 'faisao', object: chapeu },
    { name: 'cauda', group: 'faisao', object: cauda },
    { name: 'sax', group: 'faisao', object: sax },
    { name: 'abrigo', group: 'hera', object: abrigo },
    { name: 'hera', group: 'hera', object: hera },
    { name: 'asaPerto', group: 'ave', object: asaPerto },
    { name: 'asaLonge', group: 'ave', object: asaLonge },
  ]

  // ---- montagem ------------------------------------------------------------
  const grow = (from = 0.01, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const SAX_TOCA = { x: 0.48, y: -0.12, rz: 0.75 }

  const build = [
    seq('calcada-rise', 'calcada', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma rua de cidade sobe do chão: calçada de lajotas e dois trilhos prateados no asfalto.',
    }),
    seq('rua-rise', 'rua', 0.2, 0.7, [riseFrom(0, 0.6)], { ease: 'easeOut' }),

    seq('bonde-chega', 'bonde', 1.5, 1.3, [ch('position.x', TX - 3.2, TX)], {
      ease: 'easeOut',
      caption: 'Chega um bonde azul e branco, freia no ponto e abre a porta do meio.',
    }),

    // o faisão aparece na porta, tocando e dançando
    seq('faisao-surge', 'faisao', 3.3, 0.6, [
      ch('position.x', P[0], P[0]), ch('position.y', P[1], P[1]), ch('position.z', P[2], P[2]),
      ch('rotation.y', P_YAW, P_YAW), ch('rotation.z', P_PITCH, P_PITCH),
      ...grow(0.01, FS),
    ], {
      ease: 'easeOut',
      caption: 'Na porta, um FAISÃO de chapéu pork pie toca SKA num sax dourado e dança: IÁ! SKA!',
    }),
    seq('cabeca-surge', 'cabeca', 3.45, 0.5, grow(0.01, 1), { ease: 'easeOut' }),
    seq('cauda-surge', 'cauda', 3.5, 0.6, [ch('scale.x', 0.05, 1)], { ease: 'easeOut' }),
    seq('asaPerto-dobrada', 'asaPerto', 3.5, 0.5, [
      ch('rotation.x', -0.15, -0.15), ch('rotation.y', -1.35, -1.35), ...grow(0.01, 0.75),
    ], { ease: 'easeOut' }),
    seq('asaLonge-dobrada', 'asaLonge', 3.5, 0.5, [
      ch('rotation.x', 0.15, 0.15), ch('rotation.y', 1.35, 1.35), ...grow(0.01, 0.75),
    ], { ease: 'easeOut' }),
    seq('sax-toca', 'sax', 3.6, 0.5, [
      ch('position.x', SAX_TOCA.x, SAX_TOCA.x), ch('position.y', SAX_TOCA.y, SAX_TOCA.y),
      ch('rotation.z', SAX_TOCA.rz, SAX_TOCA.rz), ...grow(0.01, 1),
    ], { ease: 'easeOut' }),
    seq('chapeu-cai', 'chapeu', 3.8, 0.45, [ch('position.y', 0.6, 0.14)], { ease: 'easeIn' }),
    seq('danca-1', 'faisao', 4.5, 0.35, [ch('rotation.z', P_PITCH, P_PITCH - 0.25)], { ease: 'easeInOut' }),
    seq('danca-2', 'faisao', 4.85, 0.35, [ch('rotation.z', P_PITCH - 0.25, P_PITCH)], { ease: 'easeInOut' }),
    seq('danca-3', 'faisao', 5.2, 0.35, [ch('rotation.z', P_PITCH, P_PITCH - 0.25)], { ease: 'easeInOut' }),
    seq('danca-4', 'faisao', 5.55, 0.35, [ch('rotation.z', P_PITCH - 0.25, P_PITCH)], { ease: 'easeInOut' }),

    // o ponto dele, coberto de hera
    seq('abrigo-rise', 'abrigo', 6.0, 0.8, [riseFrom(SY, 2.3)], {
      ease: 'easeOut',
      caption: 'Ali na calçada está o ponto dele: um abrigo de vidro todo coberto de HERA — RRÉR!',
    }),
    seq('hera-cresce', 'hera', 6.6, 0.9, [ch('scale.y', 0.01, 1), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1)], { ease: 'easeOut' }),

    // ÁVE! abre as asas e sai voando
    seq('asaPerto-abre', 'asaPerto', 8.2, 0.5, [
      ch('rotation.x', -0.15, WING_P), ch('rotation.y', -1.35, 0), ...grow(0.75, 1),
    ], {
      ease: 'easeOut',
      caption: '"ÁVE Maria!" — ele lembra que é AVE: ÁÁV! Abre as asas…',
    }),
    seq('asaLonge-abre', 'asaLonge', 8.2, 0.5, [
      ch('rotation.x', 0.15, WING_L), ch('rotation.y', 1.35, 0), ...grow(0.75, 1),
    ], { ease: 'easeOut' }),
    seq('faisao-voa', 'faisao', 8.9, 1.3, [
      ch('position.x', P[0], F[0]), ch('position.y', P[1], F[1]), ch('position.z', P[2], F[2]),
      ch('rotation.y', P_YAW, F_YAW), ch('rotation.z', P_PITCH, F_PITCH),
    ], {
      ease: 'easeInOut',
      caption: '…e sai voando pela porta, com sax e tudo, rumo ao teto de HERA.',
    }),
    seq('sax-pendura', 'sax', 8.9, 0.8, [
      ch('position.x', SAX_TOCA.x, 0.12), ch('position.y', SAX_TOCA.y, -0.45), ch('rotation.z', SAX_TOCA.rz, -0.35),
    ], { ease: 'easeInOut' }),
    seq('asaPerto-bate', 'asaPerto', 9.0, 0.3, [ch('rotation.x', WING_P, 0.1)], { ease: 'easeInOut' }),
    seq('asaLonge-bate', 'asaLonge', 9.0, 0.3, [ch('rotation.x', WING_L, -0.1)], { ease: 'easeInOut' }),
    seq('asaPerto-sobe', 'asaPerto', 9.3, 0.35, [ch('rotation.x', 0.1, WING_P)], { ease: 'easeInOut' }),
    seq('asaLonge-sobe', 'asaLonge', 9.3, 0.35, [ch('rotation.x', -0.1, WING_L)], { ease: 'easeInOut' }),
    seq('asaPerto-bate2', 'asaPerto', 9.65, 0.3, [ch('rotation.x', WING_P, 0.1)], { ease: 'easeInOut' }),
    seq('asaLonge-bate2', 'asaLonge', 9.65, 0.3, [ch('rotation.x', WING_L, -0.1)], { ease: 'easeInOut' }),
    seq('asaPerto-plana', 'asaPerto', 9.95, 0.4, [ch('rotation.x', 0.1, WING_P)], { ease: 'easeOut' }),
    seq('asaLonge-plana', 'asaLonge', 9.95, 0.4, [ch('rotation.x', -0.1, WING_L)], { ease: 'easeOut' }),

    seq('hera-balanca', 'hera', 11.0, 0.3, [ch('scale.y', 1, 1.06)], {
      ease: 'easeOut',
      caption: 'Jag ska av här. — Vou descer aqui.',
    }),
    seq('hera-assenta', 'hera', 11.3, 0.35, [ch('scale.y', 1.06, 1)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.35, 5.8], target: [0.1, 1.42, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ska-av-har',
    contexto:
      "Transporte: no ônibus, no bonde ou no metrô lotado, pedindo passagem até a porta ('Ursäkta, jag ska av här'), ou avisando o motorista num ônibus regional ou noturno. Variante: 'Jag ska av vid nästa' (desço na próxima).",
    pronuncia:
      "iá ska ÁÁV rrér ('jag' = iá, o G não soa; 'ska' fraquinho, S colado no K, sem 'is'; 'av' é a palavra mais forte da frase: A LONGO e de boca bem aberta, lá do fundo, e V de verdade no fim — é a partícula de 'gå av' (descer), e partícula leva a força; 'här' com h soprado, É aberto e longo, R brando)",
    ponteSonora:
      "IÁ! SKA... ÁV(e)! RRÉR(a)! (4 batidas: iá-ska-ÁÁV-rrér; a força maior no ÁÁV e uma segunda no RRÉR; IÁ é o 'jag' de sempre — I de IOGA, nunca o J chiado de 'já'; SKA = o MESMO SKA da bandinha jamaicana de 'Ska vi säga imorgon klockan tre?' e 'Var ska jag byta?': S grudado no K, sem 'is' na frente, curto e fraco aqui; ÁV(e) = o 'AVE!' de susto — o 'Ave Maria!' de mineiro e nordestino, gritado por uma AVE — cortado antes do E: A LONGO e de boca bem aberta, lá do fundo, e o V de verdade no fim, os dentes no lábio: ÁÁV; é a partícula de 'gå av' (descer), e partícula leva a força — o ÁV é a pancada da frase; sem o V sobra 'a', nada; RRÉR = a HERA de sempre, a mesma de 'Det gör ont här' e 'Är det ledigt här?', sem o -a: h soprado leve, É aberto e longo, R brando)",
    historia:
      "No fundo do bonde, o faisão de chapéu pork pie toca SKA num saxofone dourado e dança no corredor — IÁ! SKA! —, tão animado que quase perde o ponto. Pela janela passa o abrigo do ponto dele, todo coberto de HERA. AVE MARIA! — ele grita, e lembra que é AVE: abre as asas, sai voando pela porta aberta com saxofone e tudo e pousa no teto de hera. Ele desce aqui — nem que seja voando.",
    fraseFonte: 'Vou descer aqui.',
    fraseAlvo: 'Jag ska av här.',
  },
  createScene,
  refine: { organic: ['faisao', 'cabeca'] },
}

export default card
