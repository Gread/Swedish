import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  ch,
  cone,
  cylinder,
  lathe,
  person,
  puff,
  rbox,
  riseFrom,
  rng,
  rock,
  seq,
  sphere,
  torus,
} from '../rig/helpers'

/**
 * jag-skulle-vilja-boka-en-tid
 * Cena: na pracinha da VÍLIA, o barbeiro viking carimba, com a BÚca de uma
 * garrafa de SKOL LEve, a hora da sua parTÍD no mostrador do relógio da
 * torre, enquanto você observa ao telefone.
 *
 * Montagem: base do diorama → torre + relógio → barbeiro viking (vira-se
 * para a torre) → garrafa sobe e carimba → marca da búca → você ao telefone.
 */

// Altura do topo da base do diorama — todo mundo pisa aqui.
const CHAO = 0.14

function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Grupo 1: a base da pracinha da VÍLIA ─────────────────────────────
  const base = new THREE.Group()

  const grama = cylinder(2.55, 2.7, CHAO, '#4a8f3c', { roughness: 0.9 })
  grama.position.y = CHAO / 2
  base.add(grama)

  const praca = cylinder(0.82, 0.9, 0.06, '#95897a', { roughness: 0.85 })
  praca.position.set(-1.25, CHAO + 0.02, -0.35)
  base.add(praca)

  const pedra1 = rock(0.17, '#8b8f98', 3, { roughness: 0.9 })
  pedra1.position.set(1.95, CHAO + 0.07, -0.75)
  base.add(pedra1)

  const pedra2 = rock(0.11, '#7d838e', 8, { roughness: 0.9 })
  pedra2.position.set(-0.5, CHAO + 0.045, 1.8)
  base.add(pedra2)

  const arbusto1 = puff(0.2, '#3c7a33', 6, 5, { roughness: 0.9 })
  arbusto1.position.set(2.1, CHAO + 0.15, 0.35)
  arbusto1.scale.set(1, 0.8, 1)
  base.add(arbusto1)

  const arbusto2 = puff(0.16, '#57853d', 5, 9, { roughness: 0.9 })
  arbusto2.position.set(-1.95, CHAO + 0.12, 0.75)
  base.add(arbusto2)

  const rand = rng(17)
  const coresFlor = ['#d9789a', '#e8b04b', '#b07bd9']
  for (let i = 0; i < 3; i++) {
    const angulo = -0.5 + i * 1.15 + rand() * 0.35
    const raio = 1.65 + rand() * 0.5
    const flor = new THREE.Group()
    const talo = cylinder(0.014, 0.02, 0.16, '#3c7a33', { roughness: 0.85 })
    talo.position.y = 0.08
    const petalas = sphere(0.05, coresFlor[i], { roughness: 0.6 })
    petalas.scale.y = 0.8
    petalas.position.y = 0.18
    flor.add(talo, petalas)
    flor.position.set(Math.cos(angulo) * raio, CHAO, Math.sin(angulo) * raio)
    base.add(flor)
  }

  // poste listrado de barbearia: a barbearia da VÍLIA é aqui
  const poste = new THREE.Group()
  const posteBase = cylinder(0.11, 0.13, 0.12, '#2e3340', { metalness: 0.5, roughness: 0.4 })
  posteBase.position.y = 0.06
  const posteTubo = cylinder(0.075, 0.075, 0.8, '#f6f1e4', { roughness: 0.35 })
  posteTubo.position.y = 0.52
  const posteTopo = sphere(0.1, '#c9cfd6', { metalness: 0.7, roughness: 0.25 })
  posteTopo.position.y = 0.95
  poste.add(posteBase, posteTubo, posteTopo)
  for (let i = 0; i < 7; i++) {
    const faixa = torus(0.076, 0.018, i % 2 === 0 ? '#c9372c' : '#2f5fa8', { roughness: 0.4 })
    faixa.rotation.set(Math.PI / 2 + 0.45, 0, 0)
    faixa.position.y = 0.2 + i * 0.105
    poste.add(faixa)
  }
  poste.position.set(0.3, CHAO, -1.05)
  base.add(poste)

  root.add(base)

  // ── Grupo 2: torre do relógio ────────────────────────────────────────
  const torre = new THREE.Group()
  torre.position.set(-1.4, 0.17, -0.55)

  const plinto = cylinder(0.52, 0.58, 0.2, '#7c8794', { roughness: 0.75 })
  plinto.position.y = 0.1
  const fuste = cylinder(0.3, 0.42, 1.45, '#9aa7b4', { roughness: 0.8 })
  fuste.position.y = 0.925
  const anel = torus(0.36, 0.035, '#7c8794', { roughness: 0.7 })
  anel.rotation.x = Math.PI / 2
  anel.position.y = 0.55
  const cornija = cylinder(0.44, 0.34, 0.16, '#7c8794', { roughness: 0.75 })
  cornija.position.y = 1.73
  const telhado = cone(0.48, 0.55, '#5b6b7d', { roughness: 0.55 })
  telhado.position.y = 2.08
  const agulha = sphere(0.055, '#c9a24b', { metalness: 0.8, roughness: 0.25 })
  agulha.position.y = 2.38
  torre.add(plinto, fuste, anel, cornija, telhado, agulha)
  root.add(torre)

  const relogio = new THREE.Group()
  relogio.position.set(-1.4, 1.45, -0.22)

  const mostrador = cylinder(0.48, 0.48, 0.07, '#f6f1e4', { roughness: 0.3 })
  mostrador.rotation.x = Math.PI / 2
  relogio.add(mostrador)

  const aro = torus(0.48, 0.055, '#39404a', { metalness: 0.7, roughness: 0.3 })
  relogio.add(aro)

  for (let i = 0; i < 12; i++) {
    const angulo = (i / 12) * Math.PI * 2
    const maior = i % 3 === 0
    const marca = rbox(maior ? 0.05 : 0.03, maior ? 0.09 : 0.055, 0.02, 0.008, '#2e3340', {
      roughness: 0.45,
    })
    marca.position.set(Math.sin(angulo) * 0.38, Math.cos(angulo) * 0.38, 0.045)
    marca.rotation.z = -angulo
    relogio.add(marca)
  }

  const ponteiroMinuto = rbox(0.045, 0.32, 0.022, 0.01, '#232833', { roughness: 0.4 })
  ponteiroMinuto.position.set(0, 0.12, 0.058)
  relogio.add(ponteiroMinuto)

  const ponteiroHora = rbox(0.045, 0.24, 0.022, 0.01, '#232833', { roughness: 0.4 })
  ponteiroHora.position.set(0.084, 0.054, 0.052)
  ponteiroHora.rotation.z = -1.0
  relogio.add(ponteiroHora)

  const pino = cylinder(0.035, 0.035, 0.05, '#c9a24b', { metalness: 0.8, roughness: 0.25 })
  pino.rotation.x = Math.PI / 2
  pino.position.z = 0.06
  relogio.add(pino)

  root.add(relogio)

  // ── Grupo 3: o barbeiro viking ───────────────────────────────────────
  const barbeiro = person({ body: '#c94f3d', skin: '#e8c39e', height: 1.55, armAngle: 0.45 })
  barbeiro.position.set(-0.5, CHAO, -0.49)
  barbeiro.rotation.y = -1.25 // encara o relógio, rosto e barba em 3/4 para a câmera

  // listras de avental de barbeiro
  for (const alturaListra of [0.32, 0.5]) {
    const listra = torus(0.27, 0.032, '#f2e8d5', { roughness: 0.85 })
    listra.rotation.x = Math.PI / 2
    listra.position.y = alturaListra
    barbeiro.add(listra)
  }

  const cabecaBarbeiro = barbeiro.getObjectByName('head')!

  const capacete = new THREE.Group()
  const domo = sphere(0.31, '#98a3ad', { metalness: 0.65, roughness: 0.3 })
  domo.scale.set(1, 0.62, 1)
  domo.position.y = 0.13
  const aroCapacete = torus(0.295, 0.032, '#6e7a87', { metalness: 0.6, roughness: 0.35 })
  aroCapacete.rotation.x = Math.PI / 2
  aroCapacete.position.y = 0.1
  capacete.add(domo, aroCapacete)
  for (const lado of [-1, 1]) {
    const chifre = cone(0.075, 0.3, '#f2ead8', { roughness: 0.5 })
    chifre.position.set(lado * 0.3, 0.28, 0)
    chifre.rotation.z = -lado * 0.65 // chifres para cima: silhueta viking
    capacete.add(chifre)
  }
  cabecaBarbeiro.add(capacete)

  const barba = puff(0.14, '#c4762b', 5, 7, { roughness: 0.9 })
  barba.position.set(0, -0.19, 0.16)
  barba.scale.set(1, 0.8, 0.7)
  cabecaBarbeiro.add(barba)

  // braço do lado da câmera erguido para a frente, segurando a garrafa
  const bracoGarrafa = barbeiro.getObjectByName('armR')!
  bracoGarrafa.rotation.z = 0
  bracoGarrafa.rotation.x = -2.0

  root.add(barbeiro)

  // ── Grupo 4: a garrafa de SKOL LEve (acento da cena) e o carimbo ─────
  // Aponta +y no espaço local, base na mão do barbeiro; ao inclinar
  // (rotation.z: 0.3 → 0.9) a búca (y local 0.78) toca o mostrador em
  // (-1.2, 1.3) e depois ergue um pouco (0.9 → 0.65) para mostrar a marca.
  const garrafa = new THREE.Group()
  garrafa.position.set(-0.59, 0.82, -0.12)
  garrafa.rotation.z = 0.65

  const vidro = lathe(
    [
      [0, 0],
      [0.09, 0.008],
      [0.115, 0.06],
      [0.115, 0.4],
      [0.095, 0.47],
      [0.052, 0.58],
      [0.046, 0.7],
      [0.058, 0.72],
      [0.058, 0.78],
      [0, 0.78],
    ],
    '#e8971f',
    { roughness: 0.25 },
  )
  garrafa.add(vidro)

  const rotulo = cylinder(0.121, 0.121, 0.15, '#f7ecc8', { roughness: 0.65 })
  rotulo.position.y = 0.26
  garrafa.add(rotulo)

  const buca = torus(0.052, 0.017, '#8a5a13', { roughness: 0.35 })
  buca.rotation.x = Math.PI / 2
  buca.position.y = 0.775
  garrafa.add(buca)

  root.add(garrafa)

  // Marca carimbada no mostrador, exatamente onde a búca encosta.
  const carimbo = new THREE.Group()
  const carimboAro = torus(0.065, 0.022, '#e0841a', { roughness: 0.4 })
  const carimboMiolo = cylinder(0.05, 0.05, 0.008, '#f3b552', { roughness: 0.5 })
  carimboMiolo.rotation.x = Math.PI / 2
  carimbo.add(carimboAro, carimboMiolo)
  carimbo.position.set(-1.2, 1.3, -0.172)
  root.add(carimbo)

  // ── Grupo 5: você ao telefone ────────────────────────────────────────
  const voce = person({ body: '#3f6fa8', skin: '#e8c39e', height: 1.45, armAngle: 0.35 })
  voce.position.set(0.8, CHAO, 0.45)
  voce.rotation.y = -1.15 // olha para o barbeiro, 3/4 para a câmera

  const cabecaVoce = voce.getObjectByName('head')!

  const cabelo = puff(0.16, '#4a3728', 6, 11, { roughness: 0.9 })
  cabelo.position.set(0, 0.14, -0.06)
  cabelo.scale.set(1.2, 0.75, 1.15)
  cabecaVoce.add(cabelo)

  const telefone = rbox(0.085, 0.16, 0.03, 0.012, '#2b2f36', { roughness: 0.3 })
  telefone.position.set(0.24, -0.03, 0.09)
  telefone.rotation.set(0, 0.35, -0.15)
  cabecaVoce.add(telefone)

  // braço direito erguido segurando o telefone
  voce.getObjectByName('armR')!.rotation.z = -2.6

  root.add(voce)

  const parts = [
    { name: 'base', group: 'vilia', object: base },
    { name: 'torre', group: 'torre', object: torre },
    { name: 'relogio', group: 'torre', object: relogio },
    { name: 'barbeiro', group: 'barbeiro', object: barbeiro },
    { name: 'garrafa', group: 'skol', object: garrafa },
    { name: 'carimbo', group: 'skol', object: carimbo },
    { name: 'voce', group: 'voce', object: voce },
  ]

  const build = [
    seq('base-rise', 'base', 0.0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'IÁ! Bem-vindo à pracinha da VÍLIA, onde nada acontece sem hora marcada…',
    }),
    seq('torre-rise', 'torre', 1.7, 0.85, [riseFrom(0.17, 3.1)], {
      ease: 'easeOut',
      caption: '…a torre do relógio da VÍLIA guarda o horário de cada parTÍD.',
    }),
    seq('relogio-grow', 'relogio', 2.6, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('barbeiro-rise', 'barbeiro', 3.9, 0.8, [riseFrom(CHAO, 1.9)], {
      ease: 'easeOut',
      caption: "O barbeiro viking só marca horário mediante pedágio: 'uma SKOL LEve!'",
    }),
    seq('barbeiro-turn', 'barbeiro', 4.8, 0.5, [ch('rotation.y', -0.6, -1.25)]),
    seq('garrafa-rise', 'garrafa', 5.7, 0.8, [riseFrom(0.82, 2.5)], {
      ease: 'easeOut',
      caption: "Você paga a SKOL LEve ('skulle')…",
    }),
    seq('garrafa-stamp', 'garrafa', 6.7, 0.55, [ch('rotation.z', 0.3, 0.9)]),
    seq('garrafa-ergue', 'garrafa', 7.35, 0.4, [ch('rotation.z', 0.9, 0.65)], { ease: 'easeOut' }),
    seq('carimbo-pop', 'carimbo', 7.2, 0.45, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: '…e a BÚca da garrafa carimba no mostrador a hora EN ponto da sua parTÍD!',
    }),
    seq('voce-rise', 'voce', 8.7, 0.8, [riseFrom(CHAO, 1.7)], {
      ease: 'easeOut',
      caption: "Ao telefone, você pede: 'Jag skulle vilja boka en tid.' — Eu queria marcar um horário.",
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.4, 4.6], target: [-0.45, 1.15, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-skulle-vilja-boka-en-tid',
    contexto:
      "Ligar para a vårdcentral, dentista, banco, cabeleireiro — tudo na Suécia funciona com 'tid' marcada.",
    fraseFonte: 'Eu queria marcar um horário.',
    fraseAlvo: 'Jag skulle vilja boka en tid.',
    pronuncia: "iá SKÚL-le VÍL-ia BÚ-ka en TÍD ('boka' com u longo: 'búka'; 'tid' com i longo)",
    ponteSonora:
      'iá SKÚL-le VÍL-ia BÚ-ka en TÍD ~ "IÁ! uma SKOL LEve, VÍLIA... a BÚca marca EN... parTÍD!" — sílabas fortes: IÁ-SKOL-LE-VÍLIA-BÚca-EN-TÍD. \'VÍLIA\' dito como o fim de \'faMÍLIA\' trocando o m por v; \'búca\' à caipira, com u; \'parTÍD\' com d final — nunca \'tic\'.',
    historia:
      "Você liga para a barbearia da VÍLIA, mas o barbeiro viking só marca horário mediante pedágio: 'uma SKOL LEve!'. Paga a cerveja, e ele carimba no mostrador do relógio da torre, com a BÚca da garrafa, a hora exata da sua parTÍDa. 'IÁ... SKOL-LE... VÍLIA... BÚca... EN... parTÍD!' — eu queria marcar um horário.",
  },
  createScene,
}

export default card
