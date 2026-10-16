import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, rock,
} from '../rig/helpers'

/**
 * "Jag är mätt." — IÁ! É MÉT(a)!
 *
 * Concurso de comilança no terreiro: a META é bicar o milho da mesa comprida
 * até o último grão. O galo comilão come tudo, a barriga pesa, ele tomba de
 * costas e cruza a chegada escorregando. A faixa amarela (o acento saturado
 * da cena) arrebenta sobre a barriga e fica só MET — o A sai rolando pelo
 * chão. De pés pro ar, ele canta a vitória no lugar do cocoricó: IÁ! É MÉT!
 *
 * Diorama: disco de terra batida, mesa comprida de tábuas claras correndo
 * para o fundo com uns grãos esparsos, dois postinhos brancos na ponta; o
 * galo ruivo deitado de costas no meio, a cauda verde-escura caindo pela
 * borda esquerda, a cabeça erguida à direita, o A vermelho no chão à frente.
 */

const TERRA = '#b38b5e'
const TERRA_ESC = '#9a7650'
const PEDRA = '#8f8578'
const PALHA = '#d8c07a'
const TABUA = '#d9b383'
const TABUA_2 = '#cda673'
const TABUA_ESC = '#a8794a'
const BRANCO = '#f3efe6'
const RUIVO = '#c4582a'
const RUIVO_CLARO = '#d97a34'
const RUIVO_ESC = '#8c3a1d'
const CREME = '#f0dcb4'
const CRISTA = '#d3232b'
const BICO = '#f0a62a'
const PERNA = '#e9a93a'
const CAUDA_VERDE = '#1f5544'
const CAUDA_PRETA = '#1d2124'
const MILHO = '#e6b140'
const FAIXA = '#ffc414' // acento reservado: a faixa da META
const LETRA = '#b5141f'
const SOM = '#fff1b8'

const GY = 0.14 // topo do terreiro
const TOP = GY + 0.58 // tampo da mesa
const GALO_Z = 0.05
const POSTE_X = 1.22
const POSTE_Z = 0.36
const POSTE_H = 1.2

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot: number, cor: string, d: number) {
  const s = rbox(w, h, d, Math.min(w, d) * 0.3, cor, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** M, E, T, A — traço grosso, centradas na origem, altura 1 (escale o grupo). */
function letter(which: 'M' | 'E' | 'T' | 'A', cor: string, d: number) {
  const g = new THREE.Group()
  const t = 0.2
  if (which === 'M') {
    g.add(stroke(t, 1, -0.36, 0, 0, cor, d))
    g.add(stroke(t, 1, 0.36, 0, 0, cor, d))
    g.add(stroke(t * 0.95, 0.6, -0.17, 0.18, 0.55, cor, d))
    g.add(stroke(t * 0.95, 0.6, 0.17, 0.18, -0.55, cor, d))
  } else if (which === 'E') {
    g.add(stroke(t, 1, -0.24, 0, 0, cor, d))
    g.add(stroke(0.58, t, 0.0, 0.4, 0, cor, d))
    g.add(stroke(0.48, t * 0.95, -0.05, 0, 0, cor, d))
    g.add(stroke(0.58, t, 0.0, -0.4, 0, cor, d))
  } else if (which === 'T') {
    g.add(stroke(0.7, t, 0, 0.4, 0, cor, d))
    g.add(stroke(t, 1, 0, 0, 0, cor, d))
  } else {
    g.add(stroke(t, 1.08, -0.18, 0, -0.36, cor, d))
    g.add(stroke(t, 1.08, 0.18, 0, 0.36, cor, d))
    g.add(stroke(0.42, t * 0.9, 0, -0.16, 0, cor, d))
  }
  return g
}

/** Pena de foice: arco de toro saindo da base, subindo e caindo para a esquerda. */
function sickle(r: number, tube: number, arc: number, start: number, cor: string) {
  const geo = new THREE.TorusGeometry(r, tube, 10, 40, arc)
  const m = new THREE.Mesh(geo, mat(cor, { roughness: 0.28, metalness: 0.15, size: r * 2 }))
  m.castShadow = true
  m.receiveShadow = true
  m.rotation.z = start
  // a base da pena (ângulo inicial do arco) fica na origem do grupo
  m.position.set(-r * Math.cos(start), -r * Math.sin(start), 0)
  const g = new THREE.Group()
  g.add(m)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- terreiro: disco de terra batida ------------------------------------
  const base = new THREE.Group()
  const solo = cylinder(2.7, 2.8, 0.1, TERRA_ESC, { roughness: 0.95 })
  solo.position.y = 0.05
  base.add(solo)
  const terra = cylinder(2.64, 2.7, 0.05, TERRA, { roughness: 0.95 })
  terra.position.y = GY - 0.025
  base.add(terra)

  // manchas de terra mais escura e pedrinhas
  for (const [mx, mz, mr] of [[-1.6, 1.2, 0.5], [1.7, -0.6, 0.45], [0.4, 1.9, 0.38]] as const) {
    const mancha = cylinder(mr, mr, 0.008, TERRA_ESC, { roughness: 0.95 })
    mancha.position.set(mx, GY + 0.004, mz)
    base.add(mancha)
  }
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.4 + rand() * 1.0
    const p = rock(0.05 + rand() * 0.05, PEDRA, 10 + i, { roughness: 0.9 })
    p.position.set(Math.cos(a) * d, GY + 0.02, Math.sin(a) * d)
    p.scale.y = 0.6
    base.add(p)
  }
  // tufos de palha seca
  for (const [px, pz] of [[-2.0, 0.4], [1.9, 0.9], [-1.2, -1.9], [2.1, -1.5]] as const) {
    const tufo = new THREE.Group()
    for (let k = 0; k < 6; k++) {
      const fio = cylinder(0.012, 0.016, 0.22 + rand() * 0.12, PALHA, { roughness: 0.85 })
      fio.position.y = 0.12
      fio.rotation.set((rand() - 0.5) * 0.9, 0, (rand() - 0.5) * 0.9)
      tufo.add(fio)
    }
    tufo.position.set(px, GY, pz)
    base.add(tufo)
  }
  // duas penas soltas no chão, caídas da corrida
  for (const [fx, fz, fr, cor] of [[-0.95, 1.05, 0.6, RUIVO_CLARO], [1.55, 0.35, -0.9, RUIVO]] as const) {
    const pena = capsule(0.035, 0.16, cor, { roughness: 0.8 })
    pena.scale.z = 0.35
    pena.rotation.set(Math.PI / 2, 0, fr)
    pena.position.set(fx, GY + 0.015, fz)
    base.add(pena)
  }
  root.add(base)

  // tudo o que é da corrida gira junto: a mesa foge para o fundo à esquerda,
  // e a trilha de milho aparece atrás do galo
  const arena = new THREE.Group()
  arena.rotation.y = 0.38
  arena.position.set(0.05, 0, -0.1)
  root.add(arena)

  // ---- mesa comprida de tábuas claras --------------------------------------
  const mesa = new THREE.Group()
  const Z0 = -2.25
  const Z1 = 0.6
  const LEN = Z1 - Z0
  const ZC = (Z0 + Z1) / 2
  for (let i = 0; i < 4; i++) {
    const tabua = rbox(0.355, 0.06, LEN, 0.018, i % 2 === 0 ? TABUA : TABUA_2, { roughness: 0.7 })
    tabua.position.set(-0.555 + i * 0.37, TOP - 0.03, ZC)
    mesa.add(tabua)
  }
  for (const sx of [-1, 1]) {
    const travessa = rbox(0.06, 0.11, LEN - 0.2, 0.02, TABUA_ESC, { roughness: 0.75 })
    travessa.position.set(sx * 0.66, TOP - 0.115, ZC)
    mesa.add(travessa)
    for (const pz of [Z1 - 0.14, ZC, Z0 + 0.14]) {
      const perna = rbox(0.1, TOP - GY - 0.06, 0.1, 0.02, TABUA_ESC, { roughness: 0.75 })
      perna.position.set(sx * 0.64, GY + (TOP - GY - 0.06) / 2, pz)
      mesa.add(perna)
    }
  }
  for (const pz of [Z1 - 0.14, Z0 + 0.14]) {
    const cabeceira = rbox(1.24, 0.1, 0.06, 0.02, TABUA_ESC, { roughness: 0.75 })
    cabeceira.position.set(0, TOP - 0.115, pz)
    mesa.add(cabeceira)
  }
  arena.add(mesa)

  // ---- trilha de milho: quase vazia, uns grãos esparsos atrás do galo -------
  const milho = new THREE.Group()
  milho.position.y = TOP
  arena.add(milho)
  for (let i = 0; i < 14; i++) {
    const z = -2.05 + i * 0.095 + (rand() - 0.5) * 0.05
    if (i % 3 === 1) continue // falhas: o galo já bicou
    const grao = sphere(0.05, MILHO, { roughness: 0.45 }, 14)
    grao.scale.set(1, 0.65, 0.85)
    grao.position.set(-0.4 + Math.sin(i * 0.9) * 0.14 + (rand() - 0.5) * 0.06, 0.03, z)
    grao.rotation.y = rand() * Math.PI
    milho.add(grao)
  }

  // ---- postinhos brancos da chegada + pontas rompidas da faixa -------------
  const postes = new THREE.Group()
  arena.add(postes)
  for (const sx of [-1, 1]) {
    const pe = rbox(0.2, 0.06, 0.2, 0.02, BRANCO, { roughness: 0.6 })
    pe.position.set(sx * POSTE_X, GY + 0.03, POSTE_Z)
    postes.add(pe)
    const haste = cylinder(0.045, 0.05, POSTE_H, BRANCO, { roughness: 0.5 })
    haste.position.set(sx * POSTE_X, GY + POSTE_H / 2, POSTE_Z)
    postes.add(haste)
    const bola = sphere(0.075, BRANCO, { roughness: 0.4 })
    bola.position.set(sx * POSTE_X, GY + POSTE_H + 0.04, POSTE_Z)
    postes.add(bola)

    // ponta da faixa amarrada no alto, pendendo para dentro
    const ponta = new THREE.Group()
    ponta.position.set(sx * POSTE_X, GY + POSTE_H - 0.08, POSTE_Z + 0.03)
    ponta.rotation.z = sx * 0.38
    const no = sphere(0.06, FAIXA, { roughness: 0.6 })
    no.scale.set(1, 0.8, 0.8)
    ponta.add(no)
    const tira = rbox(0.17, 0.4, 0.014, 0.006, FAIXA, { roughness: 0.6 })
    tira.position.y = -0.21
    ponta.add(tira)
    for (let k = 0; k < 3; k++) {
      const fiapo = cone(0.03, 0.08, FAIXA, { roughness: 0.6 }, 8)
      fiapo.rotation.z = Math.PI
      fiapo.scale.z = 0.25
      fiapo.position.set(-0.055 + k * 0.055, -0.44, 0)
      ponta.add(fiapo)
    }
    postes.add(ponta)
  }

  // ---- letra A vermelha, arrancada, rolando no chão -------------------------
  const letraA = new THREE.Group()
  letraA.position.set(1.05, GY + 0.2, 0.72)
  letraA.rotation.set(-0.15, -0.25, -0.32)
  const aMesh = letter('A', LETRA, 0.3)
  aMesh.scale.setScalar(0.42)
  letraA.add(aMesh)
  root.add(letraA)

  // ---- GALO de costas -------------------------------------------------------
  const galo = new THREE.Group()
  galo.position.set(0, TOP, GALO_Z)
  arena.add(galo)

  const corpo = sphere(0.5, RUIVO, { roughness: 0.8 })
  corpo.scale.set(1.1, 0.72, 0.82)
  corpo.position.set(0, 0.36, 0)
  galo.add(corpo)

  const barriga = sphere(0.44, CREME, { roughness: 0.85 })
  barriga.scale.set(1.0, 0.82, 0.86)
  barriga.position.set(-0.03, 0.5, 0.02)
  galo.add(barriga)

  // asas meio abertas, coladas nos flancos, com as rêmiges em camadas
  for (const sz of [-1, 1]) {
    const asa = new THREE.Group()
    asa.position.set(-0.02, 0.32, sz * 0.36)
    asa.rotation.x = sz * 1.15
    galo.add(asa)
    const cobertura = sphere(0.3, RUIVO_ESC, { roughness: 0.8 })
    cobertura.scale.set(1.15, 0.26, 0.6)
    asa.add(cobertura)
    for (let k = 0; k < 3; k++) {
      const remige = sphere(0.2, k === 1 ? '#6e2c16' : RUIVO_ESC, { roughness: 0.8 })
      remige.scale.set(1.35, 0.18, 0.42)
      remige.position.set(-0.12 - k * 0.05, 0.035, sz * (0.04 + k * 0.05))
      remige.rotation.y = sz * (0.18 + k * 0.12)
      asa.add(remige)
    }
  }

  // pescoço de penas douradas subindo para a cabeça
  const pescoco = capsule(0.16, 0.3, RUIVO_CLARO, { roughness: 0.8 })
  pescoco.position.set(0.56, 0.52, 0.1)
  pescoco.rotation.set(0.3, 0, -0.75)
  galo.add(pescoco)
  const gola = sphere(0.22, RUIVO_CLARO, { roughness: 0.8 })
  gola.scale.set(1, 0.9, 1.05)
  gola.position.set(0.46, 0.4, 0.05)
  galo.add(gola)

  // ---- cabeça erguida, virada para a câmera, cantando -----------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0.76, 0.8, 0.2)
  cabeca.rotation.set(-0.42, 0.5, 0)
  galo.add(cabeca)

  const cranio = sphere(0.2, RUIVO_CLARO, { roughness: 0.75 })
  cranio.scale.set(0.9, 1, 1.08)
  cabeca.add(cranio)

  // crista alta e serrilhada
  const dentes: [number, number, number][] = [
    [0.12, 0.23, 0.058], [0.05, 0.29, 0.07], [-0.03, 0.32, 0.078], [-0.11, 0.3, 0.072], [-0.18, 0.24, 0.06],
  ]
  for (const [z, y, r] of dentes) {
    const dente = sphere(r, CRISTA, { roughness: 0.5 })
    dente.scale.x = 0.55
    dente.position.set(0, y, z)
    cabeca.add(dente)
  }
  const pecaCrista = capsule(0.05, 0.22, CRISTA, { roughness: 0.5 })
  pecaCrista.rotation.x = Math.PI / 2
  pecaCrista.scale.x = 0.6
  pecaCrista.position.set(0, 0.2, -0.02)
  cabeca.add(pecaCrista)

  // barbela
  for (const sx of [-1, 1]) {
    const barbela = sphere(0.045, CRISTA, { roughness: 0.5 })
    barbela.scale.set(0.8, 1.5, 0.8)
    barbela.position.set(sx * 0.035, -0.15, 0.15)
    cabeca.add(barbela)
  }

  // olhos
  for (const sx of [-1, 1]) {
    const olho = sphere(0.052, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(sx * 0.11, 0.07, 0.13)
    const pupila = sphere(0.027, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(sx * 0.115, 0.08, 0.162)
    cabeca.add(olho, pupila)
  }

  // ---- bico bem aberto (rígido, fora do refine) ------------------------------
  const bico = new THREE.Group()
  cabeca.add(bico)
  const bicoSup = cone(0.07, 0.19, BICO, { roughness: 0.4 })
  bicoSup.rotation.x = Math.PI / 2 - 0.45
  bicoSup.scale.x = 1.1
  bicoSup.position.set(0, 0.06, 0.26)
  bico.add(bicoSup)
  const bicoInf = cone(0.058, 0.15, BICO, { roughness: 0.4 })
  bicoInf.rotation.x = Math.PI / 2 + 0.4
  bicoInf.position.set(0, -0.05, 0.23)
  bico.add(bicoInf)
  const goela = sphere(0.06, '#5a1a1e', { roughness: 0.5 })
  goela.position.set(0, 0.0, 0.2)
  bico.add(goela)
  const lingua = sphere(0.03, '#e07a84', { roughness: 0.4 })
  lingua.scale.set(1, 0.5, 1.4)
  lingua.position.set(0, -0.03, 0.25)
  bico.add(lingua)

  // ---- anéis de som saindo do bico (IÁ!) ------------------------------------
  const aneis = new THREE.Group()
  aneis.position.set(0, 0.2, 0.36)
  cabeca.add(aneis)
  const dirSom = new THREE.Vector3(0, 0.55, 0.83).normalize()
  for (let k = 0; k < 3; k++) {
    const anel = torus(0.085 + k * 0.05, 0.02, SOM, { emissive: '#ffd45a', emissiveIntensity: 0.55, roughness: 0.4 })
    anel.position.copy(dirSom.clone().multiplyScalar(k * 0.16))
    anel.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirSom)
    aneis.add(anel)
  }

  // ---- pernas finas pro ar, dedos abertos ------------------------------------
  const pernas = new THREE.Group()
  pernas.position.set(0, 0.8, -0.06)
  galo.add(pernas)
  for (const [lx, lean] of [[-0.24, 0.16], [0.14, -0.12]] as const) {
    const coxa = sphere(0.12, RUIVO, { roughness: 0.8 })
    coxa.scale.set(1, 1.15, 1)
    coxa.position.set(lx, 0.02, 0)
    pernas.add(coxa)

    const perna = new THREE.Group()
    perna.position.set(lx, 0.08, 0)
    perna.rotation.z = lean
    pernas.add(perna)
    const canela = capsule(0.036, 0.42, PERNA, { roughness: 0.5 })
    canela.position.y = 0.27
    perna.add(canela)
    for (let k = 0; k < 3; k++) {
      const dedo = capsule(0.022, 0.12, PERNA, { roughness: 0.5 })
      const a = (k - 1) * 0.55
      dedo.rotation.set(0.5, 0, a)
      dedo.position.set(-Math.sin(a) * 0.07, 0.55 + Math.cos(a) * 0.05, 0.035)
      perna.add(dedo)
    }
    const esporao = capsule(0.02, 0.07, PERNA, { roughness: 0.5 })
    esporao.rotation.x = -0.9
    esporao.position.set(0, 0.5, -0.05)
    perna.add(esporao)
  }

  // ---- cauda em foice, verde-escura e preta, caindo pela borda da mesa ------
  const cauda = new THREE.Group()
  cauda.position.set(-0.5, 0.36, 0)
  galo.add(cauda)
  const penas: [number, number, number, number, string][] = [
    // raio, ângulo inicial, arco, z, cor
    [0.42, -0.25, 2.55, 0.12, CAUDA_VERDE],
    [0.36, -0.15, 2.45, 0.0, CAUDA_PRETA],
    [0.46, -0.35, 2.5, -0.1, CAUDA_VERDE],
    [0.3, -0.05, 2.35, -0.2, CAUDA_PRETA],
    [0.34, -0.3, 2.4, 0.22, CAUDA_PRETA],
  ]
  for (const [r, st, arc, z, cor] of penas) {
    const p = sickle(r, 0.034, arc, st, cor)
    p.position.z = z
    p.rotation.y = z * 0.6
    cauda.add(p)
  }
  const sobre = sphere(0.13, CAUDA_VERDE, { roughness: 0.35 })
  sobre.scale.set(1, 0.8, 1.5)
  sobre.position.set(0.1, 0.0, 0)
  cauda.add(sobre)

  // ---- faixa rompida caída sobre a barriga: MET ------------------------------
  const faixa = new THREE.Group()
  faixa.position.set(-0.03, 0.8, 0.26)
  faixa.rotation.x = 0.85
  galo.add(faixa)
  const meio = rbox(0.5, 0.016, 0.2, 0.006, FAIXA, { roughness: 0.6 })
  faixa.add(meio)
  for (const sx of [-1, 1]) {
    const aba = new THREE.Group()
    aba.position.set(sx * 0.25, 0, 0)
    aba.rotation.z = -sx * 0.95
    const tiraAba = rbox(0.3, 0.016, 0.2, 0.006, FAIXA, { roughness: 0.6 })
    tiraAba.position.x = sx * 0.15
    aba.add(tiraAba)
    for (let k = 0; k < 3; k++) {
      const fiapo = cone(0.03, 0.07, FAIXA, { roughness: 0.6 }, 8)
      fiapo.rotation.z = -sx * Math.PI / 2
      fiapo.scale.x = 0.25
      fiapo.position.set(sx * 0.32, 0, -0.06 + k * 0.06)
      aba.add(fiapo)
    }
    faixa.add(aba)
  }
  const palavra = new THREE.Group()
  palavra.rotation.x = -Math.PI / 2
  palavra.position.y = 0.012
  faixa.add(palavra)
  const letras: ['M' | 'E' | 'T', number][] = [['M', -0.14], ['E', 0.0], ['T', 0.13]]
  for (const [l, x] of letras) {
    const g = letter(l, '#8f0d18', 0.1)
    g.scale.set(0.13, 0.13, 0.12)
    g.position.x = x
    palavra.add(g)
  }

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'terreiro', object: base },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'milho', group: 'mesa', object: milho },
    { name: 'postes', group: 'chegada', object: postes },
    { name: 'galo', group: 'galo', object: galo },
    { name: 'cabeca', group: 'galo', object: cabeca },
    { name: 'bico', group: 'galo', object: bico },
    { name: 'cauda', group: 'galo', object: cauda },
    { name: 'pernas', group: 'galo', object: pernas },
    { name: 'faixa', group: 'met', object: faixa },
    { name: 'letraA', group: 'met', object: letraA },
    { name: 'aneis', group: 'canto', object: aneis },
  ]

  // ---- montagem ------------------------------------------------------------------
  const A_POS = letraA.position.clone()
  const A_ROT = letraA.rotation.clone()
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um terreiro de terra batida sobe do chão: hoje tem concurso de comilança.',
    }),

    seq('mesa-rise', 'mesa', 1.0, 0.7, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Na mesa comprida, uma trilha de milho: a META é bicar até o último grão.',
    }),
    seq('milho-cai', 'milho', 1.5, 0.5, [ch('position.y', TOP + 0.7, TOP)], { ease: 'easeIn' }),

    seq('postes-rise', 'postes', 2.7, 0.7, [riseFrom(0, 1.7)], {
      ease: 'easeOut',
      caption: 'Na ponta da mesa, dois postinhos brancos: a linha de chegada, com a faixa amarela da META.',
    }),

    seq('galo-escorrega', 'galo', 4.1, 1.2, [
      ch('position.z', -1.8, GALO_Z),
      ch('rotation.y', -0.35, 0),
    ], {
      ease: 'easeOut',
      caption: 'Lá vem o galo comilão! A barriga pesa tanto que ele tomba de costas e cruza a chegada escorregando.',
    }),
    seq('cabeca-vira', 'cabeca', 4.1, 1.2, [ch('rotation.y', -0.1, 0.5)], { ease: 'easeOut' }),
    seq('bico-cresce', 'bico', 4.1, 0.4, [ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1)]),
    seq('cauda-abre', 'cauda', 4.1, 1.2, [ch('rotation.z', 0.6, 0)], { ease: 'easeOut' }),
    seq('pernas-sobem', 'pernas', 5.0, 0.5, [ch('scale.y', 0.15, 1)], { ease: 'easeOut' }),

    seq('faixa-cai', 'faixa', 6.0, 0.55, [
      ch('position.y', 1.5, 0.8),
      ch('rotation.z', 0.4, 0),
    ], {
      ease: 'easeIn',
      caption: 'A faixa da META arrebenta em cima da barriga dele: só sobra MET…',
    }),
    seq('a-rola', 'letraA', 6.9, 1.0, [
      ch('position.x', 0.55, A_POS.x),
      ch('position.y', TOP + 0.25, A_POS.y),
      ch('position.z', 0.45, A_POS.z),
      ch('rotation.z', A_ROT.z + Math.PI * 2, A_ROT.z),
    ], {
      ease: 'easeOut',
      caption: '…e a letra A, arrancada, sai rolando pelo chão.',
    }),

    seq('aneis-cantam', 'aneis', 8.4, 0.6, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], {
      ease: 'easeOut',
      caption: 'De pés pro ar, sem conseguir levantar, ele canta a vitória no lugar do cocoricó: IÁ! É MÉT!',
    }),
    seq('cabeca-canta', 'cabeca', 8.4, 0.5, [ch('rotation.x', -0.15, -0.42)], { ease: 'easeOut' }),
    seq('aneis-pulsam', 'aneis', 10.4, 0.5, [
      ch('scale.x', 1.25, 1), ch('scale.y', 1.25, 1), ch('scale.z', 1.25, 1),
    ], {
      ease: 'easeOut',
      caption: 'Jag är mätt. — Estou satisfeito.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.9, 4.05], target: [-0.15, 0.95, -0.45] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-matt',
    contexto:
      "À mesa: quando o anfitrião ou a sogra oferece mais uma rodada ('Vill du ha mer?', 'Ta lite till!'), ou no almoço do trabalho, empurrando o prato. Costuma vir colado num 'Tack, det var jättegott!'.",
    fraseFonte: 'Estou satisfeito.',
    fraseAlvo: 'Jag är mätt.',
    pronuncia:
      "iá é MÉT ('jag' = iá, o -g não soa; 'är' = é, aberto e curto; 'mätt' com a força toda, É ABERTO de 'pé' e CURTO, e o TT seco no fim — a língua bate atrás dos dentes e para, sem soltar 'tchi'; nunca MÁÁT, com A longo, que é 'mat', comida)",
    ponteSonora:
      "IÁ! É MÉT(a)! (3 batidas: iá-é-MÉT; a força toda no MÉT; IÁ é o 'jag' de sempre — o MESMO de 'Jag är trött', 'Jag är hungrig' e 'Jag är klar' —, aqui o canto de vitória do galo no lugar do cocoricó: I de IOGA, nunca o J chiado de 'já'; É = 'är', aberto e curto, o mesmo de 'Jag är sjuk' e 'Jag är på väg'; MÉT = a META sem o -A, que a barriga do galo arrancou da faixa: o português já fala 'MÉ-ta' com o É ABERTO de 'pé' e a força no lugar certo — é só NÃO dizer o -A: o É sai CURTO e a língua bate atrás dos dentes e para, T seco, nunca 'MÉ-tchi'; com o -A de volta vira 'mätta' (saciar), outra palavra; e nada de A no lugar do É: MÁÁT, de A longo, é 'mat', a COMIDA — o galo acabou com a comida, não virou ela; e SEM bico: de bico vira o TRÖTT da treta do cowboy ('Jag är trött', cansado) ou o MÖÖ-te do meteoro ('möte', reunião) — aqui a boca escancara no canto de vitória)",
    historia:
      'No concurso de comilança do terreiro, a META é bicar até o último grão de uma trilha de milho que atravessa a mesa comprida. O galo dispara bicando e, a cada grão, a barriga pesa mais — no último, pesa tanto que ele tomba de costas e cruza a linha de chegada escorregando de pés pro ar. A faixa amarela escrita META arrebenta em cima da barriga dele, e a letra A, arrancada, sai rolando pelo chão. Deitado de costas, sem conseguir nem se levantar, ele solta o canto de vitória no lugar do cocoricó: IÁ! É MÉT! Bateu a meta — de barriga cheia, não cabe mais nada.',
  },
  createScene,
  refine: { organic: ['galo', 'cabeca'] },
}

export default card
