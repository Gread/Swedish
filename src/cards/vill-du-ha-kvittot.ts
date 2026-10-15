import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vill du ha kvittot?" — VIL DÜ RRÁ... QÜÍTO-T?
 *
 * No caixa da loja quem atende é uma avestruz VIL (vilã de máscara de bandido
 * e capa vinho). Ela estica o pescoção por cima do balcão — DÜ? — solta UMA
 * gargalhada, RRÁ!, e a registradora cospe um recibo enorme carimbado QUITO.
 * A bicada seca na ponta da fita é o T final: KVÍT-tut.
 *
 * Diorama: piso xadrez, balcão cinza-claro, registradora bege de gaveta
 * aberta à esquerda; a avestruz atrás do balcão, à direita, com o pescoço
 * curvado até a ponta da fita que sobe em sanfona da registradora.
 * Acento saturado RESERVADO: o carimbo vermelho QUITO.
 */

const TILE_A = '#e9e5dc'
const TILE_B = '#34343a'
const SOLO = '#2a2a2e'
const BALCAO = '#cdd1d5'
const BALCAO_TAMPO = '#9aa3ab'
const BALCAO_ESC = '#5e666d'
const BEGE = '#d8c79f'
const BEGE_ESC = '#b9a77e'
const TECLA = '#f2ecdc'
const PAPEL = '#f7f4ec'
const TINTA = '#b9b5ab'
const PENA = '#28252b'
const PENA_CLARA = '#f1eee6'
const PELE = '#d9a39c'
const PELE_ESC = '#c58c86'
const BICO = '#e39a4a'
const BICO_ESC = '#c47c33'
const MASCARA = '#141317'
const VINHO = '#6f2134'
const VINHO_ESC = '#561827'
const VERMELHO = '#d8262d' // acento reservado: carimbo QUITO
const CREME = '#fbf3df'

const GY = 0.17 // topo do piso
const TOP = 1.09 // tampo do balcão

const CORPO_POS: [number, number, number] = [0.5, 0, -0.78]
const CABECA_POS = new THREE.Vector3(-0.32, 2.72, 0.38)
const CABECA_YAW = -0.62
const CABECA_PITCH = 0.5

/** Traço de letra do carimbo: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.025, 0.006, CREME, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Q U I T O — letras de traço grosso. */
function letter(which: 'Q' | 'U' | 'I' | 'T' | 'O') {
  const g = new THREE.Group()
  const t = 0.03
  const H = 0.16
  if (which === 'O' || which === 'Q') {
    g.add(stroke(t, H, -0.043, 0))
    g.add(stroke(t, H, 0.043, 0))
    g.add(stroke(0.1, t, 0, H / 2 - t / 2))
    g.add(stroke(0.1, t, 0, -H / 2 + t / 2))
    if (which === 'Q') g.add(stroke(t, 0.075, 0.045, -0.075, 0.75))
  } else if (which === 'U') {
    g.add(stroke(t, H, -0.043, 0))
    g.add(stroke(t, H, 0.043, 0))
    g.add(stroke(0.1, t, 0, -H / 2 + t / 2))
  } else if (which === 'I') {
    g.add(stroke(t, H, 0, 0))
  } else {
    g.add(stroke(0.12, t, 0, H / 2 - t / 2))
    g.add(stroke(t, H, 0, 0))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- loja: piso quadriculado preto e branco -------------------------------
  const base = new THREE.Group()
  const solo = cylinder(2.62, 2.72, 0.12, SOLO, { roughness: 0.9 })
  solo.position.y = 0.06
  base.add(solo)
  const piso = cylinder(2.55, 2.6, 0.04, TILE_A, { roughness: 0.6 })
  piso.position.y = 0.14
  base.add(piso)
  for (let ix = -5; ix <= 5; ix++) {
    for (let iz = -5; iz <= 5; iz++) {
      if ((ix + iz) % 2 === 0) continue
      const x = ix * 0.42
      const z = iz * 0.42
      if (Math.hypot(x, z) > 2.3) continue
      const tile = rbox(0.4, 0.02, 0.4, 0.008, TILE_B, { roughness: 0.55 })
      tile.position.set(x, GY + 0.002, z)
      base.add(tile)
    }
  }

  // cestinha de compras no chão, à frente
  const cesta = new THREE.Group()
  const cestaCorpo = rbox(0.5, 0.26, 0.34, 0.05, '#3f7f8a', { roughness: 0.7 })
  cestaCorpo.position.y = 0.13
  cesta.add(cestaCorpo)
  const cestaBorda = rbox(0.54, 0.04, 0.38, 0.02, '#2f6670', { roughness: 0.7 })
  cestaBorda.position.y = 0.26
  cesta.add(cestaBorda)
  for (const s of [-1, 1]) {
    const alca = torus(0.12, 0.016, '#2f6670', { roughness: 0.6 })
    alca.position.set(s * 0.1, 0.3, 0)
    alca.rotation.y = Math.PI / 2
    alca.rotation.z = s * 0.4
    cesta.add(alca)
  }
  for (const [fx, fz, cor] of [[-0.12, 0.03, '#e3a33f'], [0.02, -0.05, '#86b24f'], [0.13, 0.04, '#c9533f']] as const) {
    const fruta = sphere(0.075, cor, { roughness: 0.45 })
    fruta.position.set(fx, 0.29, fz)
    cesta.add(fruta)
  }
  cesta.position.set(1.45, GY, 1.35)
  cesta.rotation.y = -0.4
  base.add(cesta)

  // caixote de laranjas, atrás à esquerda
  const caixote = rbox(0.5, 0.32, 0.4, 0.03, '#8a6a48', { roughness: 0.85 })
  caixote.position.set(-1.75, GY + 0.16, -1.0)
  caixote.rotation.y = 0.3
  base.add(caixote)
  for (let i = 0; i < 5; i++) {
    const laranja = sphere(0.075, '#e08f3a', { roughness: 0.5 })
    laranja.position.set(-1.75 + (rand() - 0.5) * 0.3, GY + 0.37, -1.0 + (rand() - 0.5) * 0.2)
    base.add(laranja)
  }
  root.add(base)

  // ---- balcão do caixa ------------------------------------------------------
  const balcao = new THREE.Group()
  const BH = TOP - 0.05 - GY
  const corpoBalcao = rbox(2.7, BH, 0.85, 0.05, BALCAO, { roughness: 0.6 })
  corpoBalcao.position.set(0, GY + BH / 2, 0.25)
  balcao.add(corpoBalcao)
  const tampo = rbox(2.85, 0.07, 1.0, 0.03, BALCAO_TAMPO, { roughness: 0.4 })
  tampo.position.set(0, TOP - 0.035, 0.25)
  balcao.add(tampo)
  const rodape = rbox(2.65, 0.09, 0.8, 0.03, BALCAO_ESC, { roughness: 0.7 })
  rodape.position.set(0, GY + 0.045, 0.28)
  balcao.add(rodape)
  // frisos horizontais na frente
  const faixa = rbox(2.62, 0.16, 0.02, 0.01, '#7f96a3', { roughness: 0.55 })
  faixa.position.set(0, 0.78, 0.68)
  balcao.add(faixa)
  for (const fy of [0.68, 0.88]) {
    const friso = rbox(2.62, 0.025, 0.025, 0.01, '#e4e7ea', { roughness: 0.5 })
    friso.position.set(0, fy, 0.685)
    balcao.add(friso)
  }
  // esteira preta + divisória
  const esteira = rbox(1.15, 0.025, 0.55, 0.01, '#232427', { roughness: 0.8 })
  esteira.position.set(0.72, TOP + 0.012, 0.3)
  balcao.add(esteira)
  for (const ex of [0.14, 1.3]) {
    const rolo = cylinder(0.03, 0.03, 0.56, '#7d858c', { roughness: 0.3, metalness: 0.7 })
    rolo.rotation.x = Math.PI / 2
    rolo.position.set(ex, TOP + 0.02, 0.3)
    balcao.add(rolo)
  }
  const divisoria = rbox(0.06, 0.06, 0.5, 0.02, '#e6e1d4', { roughness: 0.5 })
  divisoria.position.set(0.55, TOP + 0.055, 0.3)
  balcao.add(divisoria)
  // compras na esteira: caixa de leite e pão
  const leite = new THREE.Group()
  const leiteCorpo = rbox(0.14, 0.26, 0.14, 0.015, '#f3f1ea', { roughness: 0.5 })
  leiteCorpo.position.y = 0.13
  leite.add(leiteCorpo)
  const leiteFaixa = rbox(0.145, 0.07, 0.145, 0.012, '#3d78b8', { roughness: 0.5 })
  leiteFaixa.position.y = 0.12
  leite.add(leiteFaixa)
  const leiteTopo = cone(0.1, 0.07, '#f3f1ea', { roughness: 0.5 }, 4)
  leiteTopo.position.y = 0.295
  leiteTopo.rotation.y = Math.PI / 4
  leite.add(leiteTopo)
  leite.position.set(0.95, TOP + 0.025, 0.42)
  leite.rotation.y = 0.4
  balcao.add(leite)
  const pao = capsule(0.07, 0.22, '#c98d4c', { roughness: 0.75 })
  pao.rotation.z = Math.PI / 2
  pao.rotation.y = -0.3
  pao.position.set(0.9, TOP + 0.1, 0.12)
  balcao.add(pao)
  root.add(balcao)

  // ---- registradora bege de gaveta aberta ------------------------------------
  const registradora = new THREE.Group()
  registradora.position.set(-0.78, TOP, 0.28)
  registradora.rotation.y = 0.18

  const caixaBase = rbox(0.72, 0.2, 0.56, 0.035, BEGE, { roughness: 0.45 })
  caixaBase.position.y = 0.1
  registradora.add(caixaBase)
  // gaveta aberta, saindo para a frente do balcão
  const gaveta = rbox(0.62, 0.13, 0.42, 0.02, BEGE_ESC, { roughness: 0.5 })
  gaveta.position.set(0, 0.075, 0.4)
  registradora.add(gaveta)
  const bandeja = rbox(0.56, 0.02, 0.36, 0.006, '#3a342e', { roughness: 0.8 })
  bandeja.position.set(0, 0.137, 0.4)
  registradora.add(bandeja)
  for (let i = 0; i < 4; i++) {
    const nota = rbox(0.11, 0.02, 0.15, 0.006, '#8db487', { roughness: 0.8 })
    nota.position.set(-0.2 + i * 0.135, 0.15, 0.33)
    registradora.add(nota)
    const moeda = cylinder(0.035, 0.035, 0.015, '#cdbb86', { roughness: 0.35, metalness: 0.6 }, 20)
    moeda.position.set(-0.2 + i * 0.135, 0.152, 0.5)
    registradora.add(moeda)
  }
  const puxador = rbox(0.18, 0.035, 0.03, 0.012, '#8c7c58', { roughness: 0.4 })
  puxador.position.set(0, 0.075, 0.625)
  registradora.add(puxador)
  // corpo de cima e teclado inclinado
  const corpoReg = rbox(0.66, 0.26, 0.4, 0.04, BEGE, { roughness: 0.45 })
  corpoReg.position.set(0, 0.33, -0.06)
  registradora.add(corpoReg)
  const teclado = new THREE.Group()
  teclado.position.set(0, 0.36, 0.17)
  teclado.rotation.x = 0.55
  const placaTecla = rbox(0.64, 0.05, 0.28, 0.02, BEGE_ESC, { roughness: 0.5 })
  teclado.add(placaTecla)
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 5; c++) {
      const tecla = rbox(0.085, 0.035, 0.065, 0.012, c === 4 ? '#8a9a7a' : TECLA, { roughness: 0.4 })
      tecla.position.set(-0.23 + c * 0.115, 0.035, -0.08 + r * 0.08)
      teclado.add(tecla)
    }
  }
  registradora.add(teclado)
  // torre do visor
  const torre = rbox(0.34, 0.2, 0.16, 0.03, BEGE, { roughness: 0.45 })
  torre.position.set(0.12, 0.55, -0.18)
  registradora.add(torre)
  const visor = rbox(0.26, 0.09, 0.02, 0.01, '#2e4a3b', { roughness: 0.3 })
  visor.position.set(0.12, 0.57, -0.095)
  registradora.add(visor)
  // fenda do recibo, no topo
  const fenda = rbox(0.3, 0.025, 0.07, 0.01, '#3b3530', { roughness: 0.8 })
  fenda.position.set(-0.14, 0.465, -0.04)
  registradora.add(fenda)
  const manivela = cylinder(0.02, 0.02, 0.18, '#8c7c58', { roughness: 0.35, metalness: 0.5 })
  manivela.rotation.z = Math.PI / 2
  manivela.position.set(0.42, 0.3, -0.04)
  registradora.add(manivela)
  const pomo = sphere(0.04, '#8c7c58', { roughness: 0.35, metalness: 0.5 })
  pomo.position.set(0.52, 0.3, -0.04)
  registradora.add(pomo)
  root.add(registradora)

  // ---- AVESTRUZ: corpo de penas pretas atrás do balcão ------------------------
  const corpo = new THREE.Group()
  corpo.position.set(...CORPO_POS)
  root.add(corpo)

  const tronco = sphere(0.56, PENA, { roughness: 0.92 })
  tronco.scale.set(1.25, 0.82, 1.0)
  tronco.position.y = 1.58
  corpo.add(tronco)
  const fofo = puff(0.38, PENA, 7, 12, { roughness: 0.92 })
  fofo.position.set(0.1, 1.78, -0.05)
  fofo.scale.set(1.3, 0.8, 1.1)
  corpo.add(fofo)
  for (const [px, py, pz] of [[-0.5, 1.5, 0.3], [0.5, 1.48, 0.32], [0.62, 1.55, -0.2]] as const) {
    const tufo = sphere(0.24, PENA, { roughness: 0.92 })
    tufo.position.set(px, py, pz)
    tufo.scale.set(1, 0.8, 1)
    corpo.add(tufo)
  }
  // base do pescoço (encaixe)
  const colarinho = sphere(0.2, PELE, { roughness: 0.75 })
  colarinho.position.set(-0.48, 1.86, 0.26)
  corpo.add(colarinho)

  // ---- pernas rosadas ---------------------------------------------------------
  const pernas = new THREE.Group()
  pernas.position.set(CORPO_POS[0], 0, CORPO_POS[2])
  root.add(pernas)
  for (const s of [-1, 1]) {
    const coxa = capsule(0.11, 0.18, PELE_ESC, { roughness: 0.75 })
    coxa.position.set(s * 0.24, 1.16, 0)
    pernas.add(coxa)
    const canela = capsule(0.06, 0.78, PELE, { roughness: 0.7 })
    canela.position.set(s * 0.24, GY + 0.5, 0.02)
    pernas.add(canela)
    for (const [dx, dl] of [[-0.05, 0.22], [0.06, 0.15]] as const) {
      const dedo = capsule(0.045, dl, PELE_ESC, { roughness: 0.7 })
      dedo.rotation.x = Math.PI / 2
      dedo.position.set(s * 0.24 + dx, GY + 0.045, 0.02 + dl / 2 + 0.05)
      pernas.add(dedo)
    }
  }

  // ---- cauda de penas brancas arrepiada (filha do corpo) ----------------------
  const cauda = new THREE.Group()
  cauda.position.set(0.62, 1.72, -0.25)
  corpo.add(cauda)
  const caudaBase = puff(0.2, PENA_CLARA, 6, 77, { roughness: 0.9 })
  cauda.add(caudaBase)
  for (let i = 0; i < 7; i++) {
    const a = -0.9 + i * 0.3
    const pluma = cone(0.075, 0.42, PENA_CLARA, { roughness: 0.9 })
    pluma.position.set(Math.sin(a) * 0.12 + 0.1, Math.cos(a) * 0.2 + 0.08, -0.05 + (i % 2) * 0.08)
    pluma.rotation.z = -a - 0.5
    pluma.rotation.x = -0.3
    cauda.add(pluma)
  }

  // ---- asa com plumas brancas apontando para você (filha do corpo) -----------
  const asa = new THREE.Group()
  asa.position.set(-0.2, 1.5, 0.5)
  asa.rotation.set(0, -0.5, 0)
  corpo.add(asa)
  const asaBase = sphere(0.2, PENA, { roughness: 0.92 })
  asaBase.scale.set(1.2, 0.75, 0.8)
  asa.add(asaBase)
  for (let i = 0; i < 5; i++) {
    const leque = new THREE.Group()
    leque.rotation.set(-0.15 + (i % 2) * 0.12, -0.55 + i * 0.22, 0)
    const pluma = cone(0.085, 0.55, PENA_CLARA, { roughness: 0.9 })
    pluma.rotation.x = -Math.PI / 2
    pluma.position.z = 0.32
    pluma.scale.set(1, 1, 0.55)
    leque.add(pluma)
    asa.add(leque)
  }

  // ---- capa vinho de vilão caída sobre as costas (filha do corpo) -------------
  const capa = new THREE.Group()
  capa.position.set(0.05, 2.05, -0.05)
  corpo.add(capa)
  const capaGeo = new THREE.SphereGeometry(0.74, 40, 24, Math.PI * 0.55, Math.PI * 1.3, 0, Math.PI * 0.52)
  const capaMat = mat(VINHO, { roughness: 0.85, size: 1.4 })
  capaMat.side = THREE.DoubleSide
  const capaMesh = new THREE.Mesh(capaGeo, capaMat)
  capaMesh.castShadow = true
  capaMesh.receiveShadow = true
  capaMesh.scale.set(1.0, 0.85, 0.82)
  capaMesh.position.y = -0.35
  capa.add(capaMesh)
  const gola = torus(0.2, 0.05, VINHO_ESC, { roughness: 0.8 })
  gola.position.set(-0.5, -0.14, 0.3)
  gola.rotation.set(Math.PI / 2 + 0.3, 0.5, 0)
  capa.add(gola)
  const broche = sphere(0.055, '#c9b37a', { roughness: 0.3, metalness: 0.7 })
  broche.position.set(-0.4, -0.17, 0.48)
  capa.add(broche)

  // ---- pescoço longo rosado, curvado para a frente ----------------------------
  const neckBase = new THREE.Vector3(CORPO_POS[0] - 0.48, 1.86, CORPO_POS[2] + 0.26)
  const pescoco = new THREE.Group()
  pescoco.position.copy(neckBase)
  root.add(pescoco)
  const headLocal = CABECA_POS.clone().sub(neckBase)
  const ctrl = new THREE.Vector3(headLocal.x * 0.1, headLocal.y * 1.05, headLocal.z * 0.1)
  const curva = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, 0, 0), ctrl, headLocal)
  const NECK_N = 16
  for (let i = 0; i <= NECK_N; i++) {
    const k = i / NECK_N
    const p = curva.getPoint(k * 0.92)
    const r = 0.16 - 0.06 * k
    const gomo = sphere(r, PELE, { roughness: 0.75 })
    gomo.position.copy(p)
    pescoco.add(gomo)
  }

  // ---- cabeça: máscara de bandido e olhos arregalados -------------------------
  const cabeca = new THREE.Group()
  cabeca.rotation.order = 'YXZ'
  cabeca.position.copy(CABECA_POS)
  cabeca.rotation.set(CABECA_PITCH, CABECA_YAW, 0)
  cabeca.scale.setScalar(1.4)
  root.add(cabeca)

  const cranio = sphere(0.17, PELE, { roughness: 0.75 })
  cranio.scale.set(1, 0.92, 1.15)
  cabeca.add(cranio)
  const topete = puff(0.07, '#5a5358', 4, 9, { roughness: 0.92 })
  topete.position.set(0, 0.16, -0.02)
  cabeca.add(topete)
  // máscara: faixa preta em volta dos olhos + nó atrás
  const mascara = lathe(
    [[0.168, -0.055], [0.186, -0.03], [0.19, 0.0], [0.186, 0.035], [0.166, 0.06]],
    MASCARA,
    { roughness: 0.5 },
  )
  mascara.position.y = 0.04
  mascara.scale.set(1, 1, 1.15)
  cabeca.add(mascara)
  for (const s of [-1, 1]) {
    const ponta = rbox(0.05, 0.13, 0.02, 0.01, MASCARA, { roughness: 0.5 })
    ponta.position.set(s * 0.04, -0.02, -0.21)
    ponta.rotation.set(0.4, 0, s * 0.5)
    cabeca.add(ponta)
  }
  const no = sphere(0.04, MASCARA, { roughness: 0.5 })
  no.position.set(0, 0.04, -0.205)
  cabeca.add(no)
  for (const s of [-1, 1]) {
    const olho = sphere(0.075, '#ffffff', { roughness: 0.2 })
    olho.position.set(s * 0.1, 0.05, 0.12)
    olho.scale.z = 0.7
    cabeca.add(olho)
    const pupila = sphere(0.032, '#111111', { roughness: 0.2 })
    pupila.position.set(s * 0.09, 0.04, 0.17)
    cabeca.add(pupila)
    const brilho = sphere(0.011, '#ffffff', { roughness: 0.1 })
    brilho.position.set(s * 0.08, 0.06, 0.195)
    cabeca.add(brilho)
    // sobrancelha de vilã, em V
    const sobrancelha = rbox(0.11, 0.025, 0.03, 0.01, MASCARA, { roughness: 0.5 })
    sobrancelha.position.set(s * 0.09, 0.14, 0.13)
    sobrancelha.rotation.z = s * 0.45
    cabeca.add(sobrancelha)
  }

  // ---- bico laranja aberto (filho da cabeça) ----------------------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.04, 0.15)
  cabeca.add(bico)
  const superior = sphere(0.1, BICO, { roughness: 0.4 })
  superior.scale.set(0.85, 0.3, 1.6)
  superior.position.set(0, 0.025, 0.13)
  superior.rotation.x = -0.12
  bico.add(superior)
  const inferior = sphere(0.09, BICO_ESC, { roughness: 0.45 })
  inferior.scale.set(0.8, 0.26, 1.5)
  inferior.position.set(0, -0.06, 0.11)
  inferior.rotation.x = 0.35
  bico.add(inferior)
  const narina = sphere(0.012, '#7a4a22', { roughness: 0.5 })
  narina.position.set(0.03, 0.06, 0.12)
  bico.add(narina)

  // ---- fita de recibo em sanfona: da fenda até o bico -------------------------
  root.updateMatrixWorld(true)
  const slot = fenda.localToWorld(new THREE.Vector3(0, 0, 0))
  const bite = bico.localToWorld(new THREE.Vector3(0, -0.02, 0.16))
  const dir = bite.clone().sub(slot)
  const L = dir.length()
  dir.normalize()

  const fita = new THREE.Group()
  fita.position.copy(slot)
  fita.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir)
  root.add(fita)

  const DOBRA = 0.5
  const N = Math.max(4, Math.round(L / 0.17))
  const ph = L / (N * Math.cos(DOBRA))
  for (let i = 0; i < N; i++) {
    const painel = new THREE.Group()
    painel.position.y = (i + 0.5) * ph * Math.cos(DOBRA)
    painel.rotation.x = i % 2 === 0 ? DOBRA : -DOBRA
    const folha = box(0.26, ph, 0.01, PAPEL)
    painel.add(folha)
    for (let l = 0; l < 3; l++) {
      const linha = rbox(0.12 + ((i + l) % 3) * 0.035, 0.012, 0.004, 0.002, TINTA, { roughness: 0.8 })
      linha.position.set(-0.05 + ((i + l) % 2) * 0.03, -ph * 0.28 + l * ph * 0.28, 0.007)
      painel.add(linha)
    }
    fita.add(painel)
  }

  // ---- carimbo vermelho QUITO no meio da fita ---------------------------------
  const meio = slot.clone().lerp(bite, 0.45)
  const carimbo = new THREE.Group()
  carimbo.position.set(meio.x, meio.y, meio.z + 0.14)
  carimbo.rotation.set(-0.08, 0.12, 0.1)
  root.add(carimbo)
  const chapa = rbox(0.74, 0.28, 0.04, 0.03, VERMELHO, { roughness: 0.45 })
  carimbo.add(chapa)
  const moldura = rbox(0.68, 0.22, 0.01, 0.02, '#a81c22', { roughness: 0.5 })
  moldura.position.z = 0.017
  carimbo.add(moldura)
  const fundo = rbox(0.64, 0.19, 0.01, 0.02, VERMELHO, { roughness: 0.45 })
  fundo.position.z = 0.022
  carimbo.add(fundo)
  const letras: ['Q' | 'U' | 'I' | 'T' | 'O', number][] = [
    ['Q', -0.25], ['U', -0.125], ['I', -0.025], ['T', 0.075], ['O', 0.22],
  ]
  for (const [g, lx] of letras) {
    const l = letter(g)
    l.position.set(lx, 0, 0.032)
    carimbo.add(l)
  }

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'loja', object: base },
    { name: 'balcao', group: 'loja', object: balcao },
    { name: 'registradora', group: 'caixa', object: registradora },
    { name: 'pernas', group: 'avestruz', object: pernas },
    { name: 'corpo', group: 'avestruz', object: corpo },
    { name: 'cauda', group: 'avestruz', object: cauda },
    { name: 'capa', group: 'avestruz', object: capa },
    { name: 'asa', group: 'avestruz', object: asa },
    { name: 'pescoco', group: 'pescoco', object: pescoco },
    { name: 'cabeca', group: 'pescoco', object: cabeca },
    { name: 'bico', group: 'pescoco', object: bico },
    { name: 'fita', group: 'recibo', object: fita },
    { name: 'carimbo', group: 'recibo', object: carimbo },
  ]

  // cabeça começa recolhida junto ao corpo (pescoço em 30%)
  const headStart = neckBase.clone().add(headLocal.clone().multiplyScalar(0.3))
  const CP = carimbo.position.clone()

  // ---- montagem ------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Numa loja de piso xadrez, sobe o balcão do caixa…',
    }),
    seq('balcao-rise', 'balcao', 0.25, 0.9, [riseFrom(0, 1.4)], { ease: 'easeOut' }),
    seq('registradora-rise', 'registradora', 1.4, 0.7, [riseFrom(TOP, 0.7)], {
      ease: 'easeOut',
      caption: '…com uma registradora bege, gaveta aberta.',
    }),

    seq('pernas-rise', 'pernas', 2.6, 0.8, [riseFrom(0, 1.6)], {
      ease: 'easeOut',
      caption: 'Quem atende é uma avestruz VIL — vilã das bravas, de máscara de bandido.',
    }),
    seq('corpo-rise', 'corpo', 2.7, 0.9, [riseFrom(0, 2.4)], { ease: 'easeOut' }),
    seq('cauda-arrepia', 'cauda', 3.5, 0.5, [
      ch('scale.x', 0.2, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1),
    ], { ease: 'easeOut' }),
    seq('asa-abre', 'asa', 3.8, 0.5, [ch('rotation.y', 0.8, -0.5)], { ease: 'easeOut' }),
    seq('capa-cai', 'capa', 3.7, 0.6, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),

    seq('pescoco-estica', 'pescoco', 4.9, 1.0, [
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], {
      ease: 'easeInOut',
      caption: 'Ela estica o pescoção por cima do balcão até o seu nariz: DÜ?',
    }),
    seq('cabeca-estica', 'cabeca', 4.9, 1.0, [
      ch('position.x', headStart.x, CABECA_POS.x),
      ch('position.y', headStart.y, CABECA_POS.y),
      ch('position.z', headStart.z, CABECA_POS.z),
    ], { ease: 'easeInOut' }),
    seq('bico-cresce', 'bico', 5.0, 0.5, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),
    seq('cabeca-gargalha', 'cabeca', 6.2, 0.35, [ch('rotation.x', CABECA_PITCH, -0.35)], {
      ease: 'easeOut',
      caption: '…e solta UMA gargalhada: RRÁ!',
    }),
    seq('cabeca-volta', 'cabeca', 6.6, 0.4, [ch('rotation.x', -0.35, CABECA_PITCH)], { ease: 'easeIn' }),

    seq('fita-sai', 'fita', 7.4, 1.1, [ch('scale.y', 0.02, 1)], {
      ease: 'easeOut',
      caption: 'A registradora cospe um recibo de três metros…',
    }),
    seq('carimbo-bate', 'carimbo', 8.7, 0.45, [
      ch('position.z', CP.z + 0.9, CP.z),
      ch('scale.x', 2.0, 1), ch('scale.y', 2.0, 1), ch('scale.z', 2.0, 1),
    ], {
      ease: 'easeIn',
      caption: '…carimbado QUITO — você QUITOU: QÜÍTO, com V de verdade.',
    }),

    seq('bico-abre', 'bico', 10.0, 0.3, [ch('rotation.x', 0, -0.4)], {
      ease: 'easeOut',
      caption: 'Demorou pra responder? Bicada seca na ponta do papel — T! KVÍT-tut.',
    }),
    seq('bico-morde', 'bico', 10.35, 0.18, [ch('rotation.x', -0.4, 0)], { ease: 'easeIn' }),

    seq('carimbo-treme', 'carimbo', 11.4, 0.5, [ch('rotation.z', -0.06, 0.1)], {
      ease: 'easeOut',
      caption: 'Vill du ha kvittot? — Quer o recibo?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.25, 2.7, 5.15], target: [0.0, 1.74, 0.05] },
  }
}

function box(w: number, h: number, d: number, color: string) {
  return rbox(w, h, d, 0.003, color, { roughness: 0.7 })
}

export const card: Card = {
  meta: {
    id: 'vill-du-ha-kvittot',
    contexto:
      "Compras: é o que o caixa pergunta depois de toda compra, muitas vezes rápido e já com a mão na impressora. Responda 'Ja tack' (sim, obrigado) ou 'Nej tack' (não, obrigado).",
    fraseFonte: 'Quer o recibo?',
    fraseAlvo: 'Vill du ha kvittot?',
    pronuncia:
      "vil dü rrá KVÍT-tut? (a força está no KVÍT; 'vill' com I curto e L de verdade; 'du' com bico de pato; 'ha' com h soprado tipo RR carioca, leve; 'kvittot' com K e V colados — o V de verdade, dente no lábio —, I curto, e o -tot final curtinho e sem força, entre Ó e U)",
    ponteSonora:
      "VIL DÜ RRÁ... QÜÍTO-T? (5 sílabas: vil-dü-rrá-KVÍT-tut; a pancada forte é no KVÍT; VIL DÜ RRÁ é o MESMO começo da bruxa de 'Vill du ha något att dricka?' — VIL com L DE VERDADE, língua no céu da boca; DÜ com bico de pato; RRÁ = UMA gargalhada só, soprada e leve; QÜÍTO = 'quito', do verbo QUITAR (o recibo é a prova de que você quitou), lido com o QÜ de trema de 'tranqüilo': o K solta um V colado — KVÍ, nunca o 'KÍ' seco —, e esse U de 'tranqüilo' aperta até virar V DE VERDADE, dente de cima no lábio de baixo, como o V de VIL, I CURTO, e o -to sai 'tu'; fecha com o T EXTRA da bicada que corta o papel: KVÍT-tut — esse T final é o 'o' de 'O recibo'; sem ele sobra 'kvitto', um recibo qualquer)",
    historia:
      "No caixa da loja quem atende é uma avestruz VIL — vilã das bravas —, de máscara preta de bandido e capa vinho. Ela estica o pescoção por cima do balcão até encostar no seu nariz, aponta uma pena: DÜ? — e solta uma gargalhada só, RRÁ!, enquanto a registradora cospe um recibo de três metros carimbado QUITO. Se você demorar a responder, ela corta o papel com uma bicada seca — T! — e engole tudo. Por isso, quando o caixa sueco perguntar se você quer o recibo, responda rápido: 'Ja tack' ou 'Nej tack'.",
  },
  createScene,
  refine: { organic: ['corpo', 'pescoco'] },
}

export default card
