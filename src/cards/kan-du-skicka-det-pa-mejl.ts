import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kan du skicka det på mejl?" — CAN-DU, RRÍCA... DÊ, PÔ! MÊIL!
 *
 * A pata mais RICA da cidade, de tiara e colar de pérolas, sentada numa
 * almofada roxa em cima do próprio cofre-forte. Ao lado, a papelada dela:
 * uma pilha da altura de uma geladeira, amarrada com fita vermelha e lacre.
 * Ela bufa, aperta UMA tecla do laptop de ouro e um @ gigante sai voando da
 * tela — a pilha murcha: foi tudo pro seu e-mail.
 *
 * Acento saturado (turquesa) RESERVADO ao @ e ao rastro dele.
 */

const PISO = '#4a3122'
const PISO_LINHA = '#3a2619'
const VELUDO = '#7a1e2c'
const VELUDO_ESC = '#5e1621'
const OURO = '#d6a740'
const OURO_ESC = '#a87d26'
const COFRE = '#2d5745'
const COFRE_ESC = '#203f32'
const ROXO = '#6b3f93'
const ROXO_ESC = '#52306f'
const PAPEL = '#f3f0e8'
const PAPEL_B = '#e9e4d8'
const FITA = '#d3302e'
const LACRE = '#861a1f'
const PATA = '#f6f4ee'
const PATA_ESC = '#dcd8cc'
const BICO = '#f08a24'
const BICO_ESC = '#d26f14'
const PEROLA = '#eedfc4'
const TELA = '#bfe4f4'
const ARROBA = '#12c4c0' // acento: o @ que leva tudo pro e-mail

const GY = 0.17 // topo do piso
const RY = GY + 0.04 // topo do tapete
const COFRE_H = 0.86
const CY = RY + COFRE_H // topo do cofre
const AY = CY + 0.17 // topo da almofada
const DUCK_X = -0.38
const DUCK_Z = 0.0
const LAP: [number, number, number] = [0.5, CY, 0.12]
const AT: [number, number, number] = [1.2, 2.2, 0.35]
const PILHA_X = -1.62

/** Teclado do laptop: grade de teclinhas. Retorna a tecla apertada à parte. */
function keyboard(group: THREE.Group) {
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 9; c++) {
      if (r === 2 && c === 6) continue // a tecla ESPECIAL vai separada
      const k = rbox(0.042, 0.012, 0.04, 0.006, '#3b3226', { roughness: 0.6 })
      k.position.set(-0.2 + c * 0.05, 0.036, -0.13 + r * 0.05)
      group.add(k)
    }
  }
  const barra = rbox(0.24, 0.012, 0.04, 0.006, '#3b3226', { roughness: 0.6 })
  barra.position.set(0, 0.036, 0.07)
  group.add(barra)
  const especial = rbox(0.044, 0.01, 0.042, 0.006, ARROBA, { roughness: 0.35 })
  especial.position.set(-0.2 + 6 * 0.05, 0.034, -0.13 + 2 * 0.05)
  group.add(especial)
}

/** @ de traço grosso no plano xy: miolo 'a', haste e arco aberto. */
function makeArroba(size = 1, color = ARROBA) {
  const g = new THREE.Group()
  const material = () => mat(color, { roughness: 0.3, size: 0.6 * size })
  const R = 0.3 * size
  const tube = 0.06 * size

  const arcGeo = new THREE.TorusGeometry(R, tube, 20, 64, Math.PI * 1.72)
  const arco = new THREE.Mesh(arcGeo, material())
  arco.rotation.z = -0.36
  arco.castShadow = true
  g.add(arco)

  const miolo = new THREE.Mesh(new THREE.TorusGeometry(0.12 * size, tube * 0.95, 20, 48), material())
  miolo.castShadow = true
  g.add(miolo)

  const haste = capsule(tube * 0.95, 0.2 * size, color, { roughness: 0.3 })
  haste.position.set(0.14 * size, -0.01 * size, 0)
  g.add(haste)

  // pezinho que liga a haste ao começo do arco
  const pe = capsule(tube * 0.95, 0.12 * size, color, { roughness: 0.3 })
  pe.rotation.z = Math.PI / 2 + 0.25
  pe.position.set(0.215 * size, -0.115 * size, 0)
  g.add(pe)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- salão: assoalho escuro + tapete retangular de veludo ---------------
  const base = new THREE.Group()
  const disco = cylinder(2.62, 2.7, 0.12, '#2e2017', { roughness: 0.9 })
  disco.position.y = 0.06
  base.add(disco)
  const piso = cylinder(2.55, 2.6, 0.05, PISO, { roughness: 0.6 })
  piso.position.y = 0.145
  base.add(piso)
  for (const x of [-2.0, -1.4, -0.8, -0.2, 0.4, 1.0, 1.6, 2.2]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - x * x, 0.01))
    const linha = rbox(0.03, 0.012, len, 0.005, PISO_LINHA, { roughness: 0.8 })
    linha.position.set(x, GY + 0.002, 0)
    base.add(linha)
  }

  const tapete = rbox(4.1, 0.04, 2.6, 0.02, VELUDO, { roughness: 0.95 })
  tapete.position.set(-0.15, GY + 0.02, 0.1)
  base.add(tapete)
  const barrado = rbox(3.7, 0.008, 2.2, 0.004, VELUDO_ESC, { roughness: 0.95 })
  barrado.position.set(-0.15, RY + 0.002, 0.1)
  base.add(barrado)
  const miolo = rbox(3.5, 0.01, 2.0, 0.004, VELUDO, { roughness: 0.95 })
  miolo.position.set(-0.15, RY + 0.004, 0.1)
  base.add(miolo)
  // franja dourada nas pontas
  for (const side of [-1, 1]) {
    for (let i = 0; i < 18; i++) {
      const fio = rbox(0.08, 0.015, 0.03, 0.006, OURO, { roughness: 0.6 })
      fio.position.set(-0.15 + side * 2.09, GY + 0.01, -1.1 + i * 0.13)
      base.add(fio)
    }
  }
  // moedas esquecidas no tapete
  for (const [mx, mz] of [[1.15, 0.9], [1.3, 1.05], [-0.7, 1.0]] as const) {
    const moeda = cylinder(0.06, 0.06, 0.014, OURO, { roughness: 0.3, metalness: 0.85 })
    moeda.position.set(mx, RY + 0.008, mz)
    moeda.rotation.set((rand() - 0.5) * 0.1, 0, (rand() - 0.5) * 0.1)
    base.add(moeda)
  }
  root.add(base)

  // ---- cofre-forte verde ----------------------------------------------------
  const cofre = new THREE.Group()
  cofre.position.set(-0.05, RY, -0.05)
  root.add(cofre)

  const caixa = rbox(1.75, COFRE_H - 0.06, 1.05, 0.07, COFRE, { roughness: 0.4, metalness: 0.55 })
  caixa.position.y = 0.06 + (COFRE_H - 0.06) / 2
  cofre.add(caixa)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pe = cylinder(0.07, 0.08, 0.07, COFRE_ESC, { roughness: 0.5, metalness: 0.5 })
      pe.position.set(sx * 0.75, 0.035, sz * 0.4)
      cofre.add(pe)
    }
  }
  const porta = rbox(1.45, COFRE_H - 0.22, 0.04, 0.04, COFRE_ESC, { roughness: 0.4, metalness: 0.55 })
  porta.position.set(0, 0.06 + (COFRE_H - 0.06) / 2, 0.53)
  cofre.add(porta)
  const frisoPorta = rbox(1.33, COFRE_H - 0.34, 0.03, 0.03, COFRE, { roughness: 0.4, metalness: 0.55 })
  frisoPorta.position.set(0, 0.06 + (COFRE_H - 0.06) / 2, 0.55)
  cofre.add(frisoPorta)
  // dobradiças
  for (const hy of [0.25, 0.68]) {
    const dob = cylinder(0.035, 0.035, 0.14, OURO_ESC, { roughness: 0.3, metalness: 0.85 })
    dob.position.set(-0.74, hy, 0.54)
    cofre.add(dob)
  }
  // roda de segredo dourada + manopla
  const roda = new THREE.Group()
  roda.position.set(-0.22, 0.47, 0.57)
  cofre.add(roda)
  const disco2 = cylinder(0.15, 0.16, 0.04, OURO, { roughness: 0.25, metalness: 0.85 })
  disco2.rotation.x = Math.PI / 2
  roda.add(disco2)
  const aroRoda = torus(0.155, 0.018, OURO_ESC, { roughness: 0.3, metalness: 0.85 })
  aroRoda.position.z = 0.02
  roda.add(aroRoda)
  for (let i = 0; i < 12; i++) {
    const marca = rbox(0.012, 0.035, 0.01, 0.003, '#5a4214', { roughness: 0.5 })
    const a = (i / 12) * Math.PI * 2
    marca.position.set(Math.cos(a) * 0.115, Math.sin(a) * 0.115, 0.025)
    marca.rotation.z = a - Math.PI / 2
    roda.add(marca)
  }
  const botao = sphere(0.04, OURO_ESC, { roughness: 0.25, metalness: 0.85 })
  botao.position.z = 0.03
  roda.add(botao)
  const manopla = new THREE.Group()
  manopla.position.set(0.3, 0.47, 0.58)
  cofre.add(manopla)
  const eixo = cylinder(0.04, 0.04, 0.05, OURO, { roughness: 0.25, metalness: 0.85 })
  eixo.rotation.x = Math.PI / 2
  manopla.add(eixo)
  for (let i = 0; i < 3; i++) {
    const raio = capsule(0.018, 0.16, OURO, { roughness: 0.25, metalness: 0.85 })
    raio.position.z = 0.03
    raio.rotation.z = (i / 3) * Math.PI * 2
    raio.translateY(0.1)
    manopla.add(raio)
    const ponta = sphere(0.032, OURO, { roughness: 0.25, metalness: 0.85 })
    ponta.position.set(-Math.sin((i / 3) * Math.PI * 2) * 0.2, Math.cos((i / 3) * Math.PI * 2) * 0.2, 0.03)
    manopla.add(ponta)
  }
  // plaquinha dourada
  const plaqueta = rbox(0.3, 0.07, 0.015, 0.01, OURO, { roughness: 0.3, metalness: 0.8 })
  plaqueta.position.set(0, 0.74, 0.57)
  cofre.add(plaqueta)

  // ---- almofada roxa --------------------------------------------------------
  const almofada = new THREE.Group()
  almofada.position.set(DUCK_X, CY, DUCK_Z)
  root.add(almofada)
  const fofa = rbox(0.98, 0.17, 0.86, 0.08, ROXO, { roughness: 0.92 })
  fofa.position.y = 0.085
  almofada.add(fofa)
  const vivo = torus(0.5, 0.022, ROXO_ESC, { roughness: 0.9 })
  vivo.rotation.x = Math.PI / 2
  vivo.scale.set(0.98, 0.86, 1)
  vivo.position.y = 0.09
  almofada.add(vivo)
  for (const [bx, bz] of [[-0.45, -0.39], [0.45, -0.39], [-0.45, 0.39], [0.45, 0.39]] as const) {
    const borla = cone(0.04, 0.1, OURO, { roughness: 0.6 })
    borla.position.set(bx, 0.07, bz)
    borla.rotation.z = Math.PI
    almofada.add(borla)
    const no = sphere(0.025, OURO, { roughness: 0.5 })
    no.position.set(bx, 0.12, bz)
    almofada.add(no)
  }
  const botaoA = sphere(0.035, ROXO_ESC, { roughness: 0.8 })
  botaoA.position.set(0, 0.17, 0.25)
  almofada.add(botaoA)

  // ---- pilha de papel (altura de geladeira) ---------------------------------
  const pilha = new THREE.Group()
  pilha.position.set(PILHA_X, RY, 0.1)
  pilha.rotation.y = 0.18
  root.add(pilha)
  let py = 0
  const blocos: { h: number; dx: number; dz: number; ry: number }[] = []
  for (let i = 0; i < 9; i++) {
    const h = 0.14 + rand() * 0.06
    blocos.push({ h, dx: (rand() - 0.5) * 0.06, dz: (rand() - 0.5) * 0.06, ry: (rand() - 0.5) * 0.14 })
  }
  for (const [i, b] of blocos.entries()) {
    const bloco = rbox(0.62, b.h, 0.5, 0.012, i % 2 ? PAPEL_B : PAPEL, { roughness: 0.85 })
    bloco.position.set(b.dx, py + b.h / 2, b.dz)
    bloco.rotation.y = b.ry
    pilha.add(bloco)
    // linhas de folhas na lateral frontal
    for (let k = 1; k < 4; k++) {
      const folha = rbox(0.6, 0.004, 0.006, 0.002, '#cfc8b8', { roughness: 0.9 })
      folha.position.set(0, -b.h / 2 + (k * b.h) / 4, 0.252)
      bloco.add(folha)
    }
    py += b.h
  }
  const PILHA_H = py
  // folha solta escorregando no topo
  const solta = rbox(0.5, 0.012, 0.38, 0.004, PAPEL, { roughness: 0.85 })
  solta.position.set(0.12, PILHA_H + 0.02, 0.05)
  solta.rotation.set(0.05, 0.6, -0.12)
  pilha.add(solta)

  // ---- fita vermelha cruzada + lacre (filha da pilha) -----------------------
  const fita = new THREE.Group()
  pilha.add(fita)
  const fitaV = rbox(0.1, PILHA_H + 0.02, 0.53, 0.01, FITA, { roughness: 0.55 })
  fitaV.position.set(0, PILHA_H / 2, 0)
  fita.add(fitaV)
  const fitaH = rbox(0.65, PILHA_H + 0.02, 0.1, 0.01, FITA, { roughness: 0.55 })
  fitaH.position.set(0, PILHA_H / 2, 0)
  fita.add(fitaH)
  const fitaT = rbox(0.66, 0.1, 0.54, 0.01, FITA, { roughness: 0.55 })
  fitaT.position.set(0, PILHA_H * 0.55, 0)
  fita.add(fitaT)
  // laço no topo
  for (const side of [-1, 1]) {
    const orelha = torus(0.08, 0.028, FITA, { roughness: 0.55 })
    orelha.position.set(side * 0.08, PILHA_H + 0.06, 0)
    orelha.rotation.set(0, 0.2, side * 0.5)
    orelha.scale.set(1, 0.7, 1)
    fita.add(orelha)
  }
  const no = sphere(0.045, FITA, { roughness: 0.55 })
  no.position.set(0, PILHA_H + 0.04, 0)
  fita.add(no)
  // lacre de cera na frente
  const lacre = lathe(
    [[0, 0], [0.085, 0], [0.095, 0.012], [0.09, 0.03], [0.05, 0.04], [0, 0.042]],
    LACRE,
    { roughness: 0.35 },
  )
  lacre.rotation.x = Math.PI / 2
  lacre.position.set(0, PILHA_H * 0.55, 0.27)
  fita.add(lacre)
  const brasao = cylinder(0.045, 0.045, 0.01, '#6d1218', { roughness: 0.4 })
  brasao.rotation.x = Math.PI / 2
  brasao.position.set(0, PILHA_H * 0.55, 0.315)
  fita.add(brasao)

  // ---- PATA rica (corpo) ----------------------------------------------------
  const pata = new THREE.Group()
  pata.position.set(DUCK_X, AY, DUCK_Z)
  pata.rotation.y = 0.32
  root.add(pata)

  const corpo = sphere(0.46, PATA, { roughness: 0.8 })
  corpo.scale.set(1.0, 0.82, 1.08)
  corpo.position.set(0, 0.36, -0.04)
  pata.add(corpo)
  const peito = sphere(0.36, PATA, { roughness: 0.8 })
  peito.position.set(0, 0.5, 0.2)
  pata.add(peito)
  const cauda = cone(0.2, 0.36, PATA, { roughness: 0.8 })
  cauda.position.set(0, 0.55, -0.48)
  cauda.rotation.x = -0.95
  pata.add(cauda)
  const pescoco = capsule(0.17, 0.22, PATA, { roughness: 0.8 })
  pescoco.position.set(0, 0.82, 0.12)
  pescoco.rotation.x = 0.12
  pata.add(pescoco)
  // asa esquerda (lado oposto ao laptop) dobrada no flanco
  const asaE = sphere(0.3, PATA_ESC, { roughness: 0.82 })
  asaE.scale.set(0.35, 0.62, 1.05)
  asaE.position.set(-0.42, 0.42, -0.06)
  asaE.rotation.x = -0.25
  pata.add(asaE)
  // pés palmados pousados na almofada, despontando sob o peito
  for (const side of [-1, 1]) {
    const pe = new THREE.Group()
    pe.position.set(side * 0.2, 0.02, 0.36)
    pe.rotation.y = side * 0.3
    const palma = sphere(0.12, BICO, { roughness: 0.5 })
    palma.scale.set(1.15, 0.2, 1.1)
    palma.position.z = 0.08
    pe.add(palma)
    for (let d = -1; d <= 1; d++) {
      const dedo = sphere(0.035, BICO_ESC, { roughness: 0.5 })
      dedo.scale.set(1, 0.6, 1.2)
      dedo.position.set(Math.sin(d * 0.6) * 0.12, 0.0, 0.08 + Math.cos(d * 0.6) * 0.12)
      pe.add(dedo)
    }
    pata.add(pe)
  }

  // ---- cabeça: bico largo e olhos semicerrados ------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.12, 0.16)
  pata.add(cabeca)
  const cranio = sphere(0.28, PATA, { roughness: 0.8 })
  cranio.scale.set(1, 0.98, 1.02)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const bochecha = sphere(0.14, PATA, { roughness: 0.8 })
    bochecha.position.set(side * 0.13, -0.08, 0.12)
    cabeca.add(bochecha)
  }
  const bicoSup = sphere(0.18, BICO, { roughness: 0.4 })
  bicoSup.scale.set(1.25, 0.34, 1.15)
  bicoSup.position.set(0, -0.06, 0.3)
  cabeca.add(bicoSup)
  const bicoInf = sphere(0.15, BICO_ESC, { roughness: 0.45 })
  bicoInf.scale.set(1.15, 0.26, 1.0)
  bicoInf.position.set(0, -0.12, 0.27)
  cabeca.add(bicoInf)
  for (const side of [-1, 1]) {
    const narina = sphere(0.018, '#8a4510', { roughness: 0.5 })
    narina.scale.set(1.4, 0.6, 1)
    narina.position.set(side * 0.06, -0.01, 0.42)
    cabeca.add(narina)

    const esclera = sphere(0.075, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.14, 0.06, 0.21)
    esclera.scale.z = 0.6
    const pupila = sphere(0.04, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.14, 0.04, 0.248)
    cabeca.add(esclera, pupila)
    // pálpebra pesada: tampa a metade de cima (tédio de rica)
    const palpebra = sphere(0.08, PATA_ESC, { roughness: 0.8 })
    palpebra.scale.set(1.05, 0.62, 0.7)
    palpebra.position.set(side * 0.14, 0.095, 0.215)
    palpebra.rotation.z = side * 0.25
    cabeca.add(palpebra)
    const cilio = capsule(0.012, 0.1, '#2a2a2a', { roughness: 0.5 })
    cilio.rotation.z = Math.PI / 2 + side * 0.25
    cilio.position.set(side * 0.14, 0.058, 0.262)
    cabeca.add(cilio)
  }
  // topete
  const topete = puff(0.07, PATA, 4, 12, { roughness: 0.85 })
  topete.position.set(0, 0.26, 0.02)
  cabeca.add(topete)

  // ---- tiara dourada (filha da cabeça) --------------------------------------
  const tiara = new THREE.Group()
  tiara.position.set(0, 0.2, -0.02)
  tiara.rotation.x = -0.25
  cabeca.add(tiara)
  const aroTiara = new THREE.Mesh(
    new THREE.TorusGeometry(0.21, 0.018, 12, 40, Math.PI),
    mat(OURO, { roughness: 0.25, metalness: 0.85, size: 0.4 }),
  )
  aroTiara.castShadow = true
  aroTiara.rotation.x = -Math.PI / 2
  tiara.add(aroTiara)
  for (const [i, h] of [[-2, 0.07], [-1, 0.1], [0, 0.15], [1, 0.1], [2, 0.07]] as const) {
    const a = Math.PI / 2 + i * 0.42
    const ponta = cone(0.03, h, OURO, { roughness: 0.25, metalness: 0.85 })
    ponta.position.set(Math.cos(a) * 0.21, h / 2 + 0.01, Math.sin(a) * 0.21)
    tiara.add(ponta)
    const gema = sphere(i === 0 ? 0.035 : 0.022, i === 0 ? '#c2324a' : PEROLA, { roughness: 0.2 })
    gema.position.set(Math.cos(a) * 0.215, h + 0.015, Math.sin(a) * 0.215)
    tiara.add(gema)
  }

  // ---- colar de pérolas (filho do corpo) ------------------------------------
  const colar = new THREE.Group()
  colar.position.set(0, 0.5, 0.2) // centro do peito: pérolas assentam na superfície
  pata.add(colar)
  const N = 13
  for (let i = 0; i < N; i++) {
    const u = i / (N - 1) - 0.5 // -0.5..0.5 de um lado ao outro
    const th = u * 2.3
    const ph = 0.42 + Math.abs(u) * 0.75 // desce no meio, sobe para a nuca
    const perola = sphere(0.042, PEROLA, { roughness: 0.18 })
    perola.position.set(Math.sin(th) * Math.cos(ph) * 0.385, Math.sin(ph) * 0.385, Math.cos(th) * Math.cos(ph) * 0.385)
    colar.add(perola)
  }
  const pingente = sphere(0.065, PEROLA, { roughness: 0.15 })
  pingente.scale.set(0.9, 1.15, 0.9)
  pingente.position.set(0, Math.sin(0.27) * 0.4, Math.cos(0.27) * 0.4)
  colar.add(pingente)

  // ---- asa direita: aperta a tecla ------------------------------------------
  const asa = new THREE.Group()
  asa.position.set(0.36, 0.6, 0.08)
  asa.rotation.set(0.2, 0, 0.9) // pose final: estendida até o teclado
  pata.add(asa)
  const asaMesh = sphere(0.3, PATA_ESC, { roughness: 0.82 })
  asaMesh.scale.set(0.34, 0.75, 0.62)
  asaMesh.position.y = -0.22
  asa.add(asaMesh)
  for (let k = 0; k < 3; k++) {
    const pena = capsule(0.045, 0.12, PATA_ESC, { roughness: 0.82 })
    pena.position.set(0, -0.47, -0.08 + k * 0.08)
    asa.add(pena)
  }

  // ---- laptop dourado -------------------------------------------------------
  const laptop = new THREE.Group()
  laptop.position.set(...LAP)
  laptop.rotation.y = -0.55
  laptop.scale.setScalar(1.2)
  root.add(laptop)
  const baseLap = rbox(0.58, 0.03, 0.42, 0.015, OURO, { roughness: 0.25, metalness: 0.85 })
  baseLap.position.y = 0.015
  laptop.add(baseLap)
  const deck = rbox(0.52, 0.006, 0.26, 0.004, '#8a6a22', { roughness: 0.5, metalness: 0.6 })
  deck.position.set(0, 0.031, -0.04)
  laptop.add(deck)
  keyboard(laptop)
  const touch = rbox(0.16, 0.004, 0.09, 0.004, OURO_ESC, { roughness: 0.3, metalness: 0.8 })
  touch.position.set(0, 0.031, 0.15)
  laptop.add(touch)

  const tampa = new THREE.Group()
  tampa.position.set(0, 0.03, -0.2)
  tampa.rotation.x = -0.22 // pose final: aberta, levemente inclinada para trás
  laptop.add(tampa)
  const lid = rbox(0.58, 0.4, 0.022, 0.015, OURO, { roughness: 0.25, metalness: 0.85 })
  lid.position.set(0, 0.2, -0.011)
  tampa.add(lid)
  const tela = rbox(0.52, 0.33, 0.006, 0.004, TELA, { emissive: '#7cc8ea', emissiveIntensity: 0.55, roughness: 0.2 })
  tela.position.set(0, 0.21, 0.002)
  tampa.add(tela)
  // ícone de envelope na tela
  const env = rbox(0.16, 0.11, 0.004, 0.006, '#ffffff', { roughness: 0.4 })
  env.position.set(0, 0.21, 0.007)
  tampa.add(env)
  for (const side of [-1, 1]) {
    const aba = rbox(0.1, 0.012, 0.004, 0.003, '#7aa9c4', { roughness: 0.4 })
    aba.position.set(side * 0.04, 0.235, 0.01)
    aba.rotation.z = side * -0.6
    tampa.add(aba)
  }

  // ---- @ GIGANTE ------------------------------------------------------------
  const arroba = makeArroba(1.25)
  arroba.position.set(...AT)
  arroba.rotation.set(0, -0.25, 0.12)
  root.add(arroba)

  // rastro: bolinhas turquesa da tela até o @
  const rastro = new THREE.Group()
  root.add(rastro)
  const telaPos = new THREE.Vector3(LAP[0] - 0.05, LAP[1] + 0.32, LAP[2] - 0.12)
  const atPos = new THREE.Vector3(...AT)
  for (let i = 1; i <= 4; i++) {
    const k = i / 5
    const p = telaPos.clone().lerp(atPos, k)
    p.y -= Math.sin(k * Math.PI) * 0.12
    const bola = sphere(0.025 + k * 0.03, ARROBA, { roughness: 0.3 })
    bola.position.copy(p)
    rastro.add(bola)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'salao', object: base },
    { name: 'cofre', group: 'cofre', object: cofre },
    { name: 'almofada', group: 'cofre', object: almofada },
    { name: 'pata', group: 'pata', object: pata },
    { name: 'cabeca', group: 'pata', object: cabeca },
    { name: 'asa', group: 'pata', object: asa },
    { name: 'tiara', group: 'rica', object: tiara },
    { name: 'colar', group: 'rica', object: colar },
    { name: 'pilha', group: 'papel', object: pilha },
    { name: 'fita', group: 'papel', object: fita },
    { name: 'laptop', group: 'laptop', object: laptop },
    { name: 'tampa', group: 'laptop', object: tampa },
    { name: 'arroba', group: 'mejl', object: arroba },
    { name: 'rastro', group: 'mejl', object: rastro },
  ]

  const S = (name: string, part: string, at: number, dur: number, from: number, to = 1) =>
    seq(name, part, at, dur, [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)], {
      ease: 'easeOut',
    })

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Num salão de rico, um tapete de veludo vermelho se estende no assoalho…',
    }),
    seq('cofre-rise', 'cofre', 0.9, 0.8, [riseFrom(RY, 1.2)], {
      ease: 'easeOut',
      caption: '…brota um cofre-forte verde, com roda de segredo dourada, e uma almofada roxa em cima.',
    }),
    seq('almofada-cai', 'almofada', 1.5, 0.6, [ch('position.y', CY + 0.9, CY)], { ease: 'easeIn' }),

    seq('pata-cai', 'pata', 2.6, 0.7, [ch('position.y', AY + 1.4, AY)], {
      ease: 'easeIn',
      caption: 'Nela se aboleta a pata mais RICA da cidade — RRÍCA, com o R soprado e o bico em bico.',
    }),
    seq('pata-assenta', 'pata', 3.3, 0.35, [ch('scale.y', 0.85, 1), ch('scale.x', 1.08, 1), ch('scale.z', 1.08, 1)], {
      ease: 'easeOut',
    }),
    seq('asa-abre', 'asa', 2.6, 0.7, [ch('rotation.z', 0.15, 0.15)]),
    S('cabeca-surge', 'cabeca', 3.4, 0.45, 0.01),
    seq('tiara-poe', 'tiara', 4.2, 0.6, [ch('position.y', 0.75, 0.2), ch('rotation.y', 1.5, 0)], {
      ease: 'easeOut',
      caption: 'Tiara dourada, colar de pérolas: RRÍCA de verdade.',
    }),
    S('colar-cresce', 'colar', 4.4, 0.5, 0.01),

    seq('pilha-despenca', 'pilha', 5.4, 0.6, [ch('position.y', RY + 3.2, RY), ch('scale.y', 1.25, 1.25)], {
      ease: 'easeIn',
      caption: 'Na sua frente despenca a papelada dela: uma pilha da altura de uma geladeira…',
    }),
    S('fita-amarra', 'fita', 6.2, 0.5, 0.01),
    seq('fita-lacre', 'fita', 6.2, 0.5, [ch('rotation.y', 0.8, 0)], {
      ease: 'easeOut',
      caption: '…amarrada com fita vermelha e lacrada com cera.',
    }),

    seq('cabeca-vira', 'cabeca', 7.2, 0.5, [ch('rotation.y', 0, -0.35)], {
      ease: 'easeOut',
      caption: 'Você se ajoelha no veludo e implora: CAN-DU, RRÍCA… DÊ, PÔ — MÊIL!',
    }),
    seq('cabeca-bufa', 'cabeca', 8.3, 0.45, [ch('rotation.y', -0.35, 0)], { ease: 'easeInOut' }),

    seq('laptop-surge', 'laptop', 8.4, 0.5, [ch('position.y', LAP[1] + 0.6, LAP[1])], {
      ease: 'easeIn',
      caption: 'Ela bufa e abre um laptop de OURO em cima do cofre…',
    }),
    S('laptop-cresce', 'laptop', 8.4, 0.5, 0.2, 1.2),
    seq('tampa-abre', 'tampa', 8.9, 0.5, [ch('rotation.x', 1.5, -0.22)], { ease: 'easeOut' }),

    seq('asa-ergue', 'asa', 9.3, 0.4, [ch('rotation.z', 0.15, 1.55)], { ease: 'easeOut' }),
    seq('asa-aperta', 'asa', 9.7, 0.25, [ch('rotation.z', 1.55, 0.9)], {
      ease: 'easeIn',
      caption: '…e aperta UMA tecla: um @ gigante sai voando da tela!',
    }),

    seq('arroba-voa', 'arroba', 9.95, 0.9, [
      ch('position.x', telaPos.x, AT[0]),
      ch('position.y', telaPos.y, AT[1]),
      ch('position.z', telaPos.z, AT[2]),
      ch('rotation.z', -2.5, 0.12),
      ch('scale.x', 0.1, 1), ch('scale.y', 0.1, 1), ch('scale.z', 0.1, 1),
    ], { ease: 'easeOut' }),
    S('rastro-aparece', 'rastro', 10.2, 0.5, 0.01),

    seq('pilha-murcha', 'pilha', 11.0, 0.8, [ch('scale.y', 1.25, 1)], {
      ease: 'easeInOut',
      caption: 'Kan du skicka det på mejl? — Você pode me mandar isso por e-mail?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.15, 2.3, 4.75], target: [-0.15, 1.38, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-skicka-det-pa-mejl',
    contexto:
      'Quando alguém explica algo rápido demais em sueco — no telefone com Försäkringskassan, na escola, no balcão, com o chefe — e você quer tudo por escrito.',
    fraseFonte: 'Você pode me mandar isso por e-mail?',
    fraseAlvo: 'Kan du skicka det på mejl?',
    pronuncia:
      "kan dü RRÍK-ka dê pô MÊIL? ('sk' antes de i é o sopro do 'sj' de 'sjuk', com lábios em bico — nunca 'ski' nem o 'ch' de chuva; 'det' = dê; 'på' = pô fechado; 'mejl' = mêil com L de verdade)",
    ponteSonora:
      "CAN-DU, RRÍCA... DÊ, PÔ! MÊIL! (7 sílabas: kan-dü-RRÍK-ka-dê-pô-MÊIL; tônicas em RRÍ e MÊIL; CAN-DU é o 'kan du' de sempre — C+A+N como em 'cana', sem o glide de 'quando', e o DU com bico; RRÍCA é RICA dita à carioca: o R de começo de palavra já sai soprado, e esse sopro é o 'sj' de 'skicka' (o 'sk' antes de I NÃO soa 'sk'); faça com os lábios EM BICO e mais forte, raspado, que o RR leve de RRÁR ('har') — é o mesmo sopro de RRÜÜK ('sjuk') e RRÜTA ('skjuta'), só que aqui o bico não vem de graça na vogal, então segure-o no próprio sopro; com o h leve, sem bico, vira 'hicka' (soluço); o C é um K dobrado e seco, e a força cai no RRÍ; DÊ, PÔ! é o 'dê, pô!' impaciente do português: DÊ fechado = 'det', PÔ FECHADO = 'på', o mesmo PÔ de 'GRÁTIS, PÔ!' ('Grattis på födelsedagen'); MÊIL = o 'e-mail' sem o 'e', com o ÊI de NÊI e M'ÊI e L DE VERDADE no fim, língua no céu da boca — nunca 'mêiu')",
    historia:
      'A pata mais RICA da cidade ainda manda tudo em papel: na sua frente despenca uma pilha da altura de uma geladeira, amarrada com fita vermelha e lacrada com cera. Você se ajoelha no tapete de veludo e implora: CAN-DU, RRICA... DÊ, PÔ — MÊIL! Ela bufa, ajeita a tiara, abre um laptop de ouro em cima do cofre onde está sentada e aperta UMA tecla: um @ gigante sai voando da tela e a pilha começa a murchar. Pronto — a papelada toda foi pro seu e-mail.',
  },
  createScene,
  refine: { organic: ['pata', 'cabeca', 'asa'] },
}

export default card
