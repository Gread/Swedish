import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Är tåget försenat eller inställt?" — o VAGÃO-TEATRO.
 *
 * O trem (É TÔ-GUET) está parado nos trilhos. No teto do vagão azul alguém
 * pregou um palquinho dourado de cortinas carmim. Um sopro FÖ abre as cortinas
 * e entra a LHAMA de óculos, a XENA do vagão, com um T de tábua pregado no
 * escudo: FÖ-XÊ-NAT. Se é só atraso, ela empurra o livro dizendo É-LER até a
 * ampulheta virar; se foi cancelado, puxa a alavanca vermelha do disjuntor e o
 * palco fecha: ÍNS-TELT!
 */

const TEAL = '#1f5560' // vagão azul-petróleo
const TEAL_DARK = '#173f48'
const SLATE = '#6f7c84' // tablado cinza-azulado
const SLATE_DARK = '#4c575e'
const CREAM = '#e6d7b8' // lhama
const CREAM_DARK = '#cbb98f'
const WOOD = '#6a5236'
const BRASS = '#b98f3a'
const CRIMSON = '#b8323a' // acento reservado: cortinas + alavanca do disjuntor
const GLASS = '#dfe9ee'
const SAND = '#d9a441'

const GY = 0.18 // topo do tablado
const RAIL_Y = 0.09 // topo do trilho, medido a partir de GY
const WAGON_Y = GY + RAIL_Y // 0.27
const ROOF_TOP = 1.12 // topo do vagão, em coordenadas locais do vagão
const STAGE_Y = WAGON_Y + ROOF_TOP // 1.39 — piso do palquinho
const TRACK_ROT = -0.2 // via, vagão e palco compartilham o mesmo eixo

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- tablado da plataforma -----------------------------------------------
  const tablado = new THREE.Group()

  const soil = cylinder(2.58, 2.68, 0.12, SLATE_DARK, { roughness: 0.95 })
  soil.position.y = 0.06
  tablado.add(soil)

  const deck = cylinder(2.5, 2.58, 0.07, SLATE, { roughness: 0.9 })
  deck.position.y = 0.145
  tablado.add(deck)

  // via férrea alinhada com o vagão
  const via = new THREE.Group()
  via.position.set(0.15, GY, -0.05)
  via.rotation.y = TRACK_ROT

  const brita = cylinder(0.9, 1.0, 0.04, '#5d666c', { roughness: 0.95 })
  brita.position.y = 0.02
  brita.scale.x = 2.4
  via.add(brita)

  for (let i = -4; i <= 4; i++) {
    const dormente = rbox(0.16, 0.05, 1.15, 0.02, WOOD, { roughness: 0.85 })
    dormente.position.set(i * 0.52, 0.045, 0)
    dormente.rotation.y = (rand() - 0.5) * 0.04
    via.add(dormente)
  }
  for (const side of [-1, 1]) {
    const trilho = rbox(4.5, 0.05, 0.09, 0.02, '#8d949a', { roughness: 0.35, metalness: 0.6 })
    trilho.position.set(0, 0.065, side * 0.42)
    via.add(trilho)
  }
  tablado.add(via)

  // adereços de plataforma
  const pedraA = rock(0.15, '#78838a', 31, { roughness: 0.95 })
  pedraA.position.set(-1.95, GY + 0.05, 0.95)
  pedraA.rotation.y = rand() * Math.PI
  tablado.add(pedraA)

  const pedraB = rock(0.1, '#6b767d', 32, { roughness: 0.95 })
  pedraB.position.set(1.75, GY + 0.03, 1.3)
  pedraB.rotation.y = rand() * Math.PI
  tablado.add(pedraB)

  const mato = puff(0.19, '#4a7040', 6, 33, { roughness: 0.9 })
  mato.position.set(-1.5, GY + 0.12, -1.55)
  tablado.add(mato)

  // poste com lâmpada apagada da estação
  const poste = new THREE.Group()
  poste.position.set(2.05, GY, -0.55)
  const mastro = cylinder(0.05, 0.07, 1.5, SLATE_DARK, { roughness: 0.6, metalness: 0.4 })
  mastro.position.y = 0.75
  const braco = rbox(0.42, 0.07, 0.07, 0.03, SLATE_DARK, { roughness: 0.6, metalness: 0.4 })
  braco.position.set(-0.2, 1.48, 0)
  const cupula = lathe(
    [[0, 0], [0.14, -0.02], [0.16, -0.1], [0.05, -0.16], [0.045, 0]],
    BRASS,
    { roughness: 0.3, metalness: 0.7 },
  )
  cupula.position.set(-0.38, 1.46, 0)
  poste.add(mastro, braco, cupula)
  tablado.add(poste)

  root.add(tablado)

  // ---- vagão azul-petróleo -------------------------------------------------
  const vagao = new THREE.Group()
  vagao.position.set(0.15, WAGON_Y, -0.05)
  vagao.rotation.y = TRACK_ROT

  const chassi = rbox(2.3, 0.12, 0.9, 0.04, '#39434a', { roughness: 0.7, metalness: 0.35 })
  chassi.position.y = 0.36
  vagao.add(chassi)

  const caixa = rbox(2.2, 0.62, 0.96, 0.1, TEAL, { roughness: 0.45 })
  caixa.position.y = 0.73
  vagao.add(caixa)

  const faixa = rbox(2.22, 0.09, 0.98, 0.03, CREAM_DARK, { roughness: 0.6 })
  faixa.position.y = 0.5
  vagao.add(faixa)

  const teto = rbox(2.28, 0.1, 1.02, 0.045, TEAL_DARK, { roughness: 0.5 })
  teto.position.y = 1.07
  vagao.add(teto)

  for (const jx of [-0.72, -0.24, 0.24]) {
    for (const jz of [0.49, -0.49]) {
      const janela = rbox(0.34, 0.28, 0.04, 0.05, '#9ec6cf', { roughness: 0.15 })
      janela.position.set(jx, 0.8, jz)
      vagao.add(janela)
    }
  }

  for (const side of [-1, 1]) {
    const rodape = rbox(2.24, 0.06, 0.06, 0.02, TEAL_DARK, { roughness: 0.6 })
    rodape.position.set(0, 0.44, side * 0.48)
    vagao.add(rodape)
  }

  for (const wx of [-0.74, 0.74]) {
    for (const wz of [-0.4, 0.4]) {
      const roda = cylinder(0.17, 0.17, 0.1, '#2c343a', { roughness: 0.55, metalness: 0.5 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(wx, 0.17, wz)
      const cubo = cylinder(0.06, 0.06, 0.12, BRASS, { roughness: 0.3, metalness: 0.8 })
      cubo.rotation.x = Math.PI / 2
      cubo.position.set(wx, 0.17, wz)
      vagao.add(roda, cubo)
    }
  }

  // caixa do disjuntor, parafusada na lateral do vagão
  const disjuntor = rbox(0.26, 0.36, 0.12, 0.04, '#37424a', { roughness: 0.5, metalness: 0.45 })
  disjuntor.position.set(0.82, 0.72, 0.5)
  const guia = rbox(0.05, 0.24, 0.05, 0.02, '#20272c', { roughness: 0.6 })
  guia.position.set(0, 0.02, 0.07)
  disjuntor.add(guia)
  vagao.add(disjuntor)

  root.add(vagao)

  // alavanca vermelha (peça própria: arma pra cima, depois é puxada)
  const alavanca = new THREE.Group()
  alavanca.position.set(0.82, 0.7, 0.58)
  alavanca.rotation.z = -1.0 // pose final: puxada = ÍNS-TELT
  const haste = capsule(0.028, 0.24, CRIMSON, { roughness: 0.4 })
  haste.position.y = 0.15
  const pomo = sphere(0.06, CRIMSON, { roughness: 0.35 })
  pomo.position.y = 0.3
  const pivo = cylinder(0.05, 0.05, 0.08, BRASS, { roughness: 0.3, metalness: 0.8 })
  pivo.rotation.x = Math.PI / 2
  alavanca.add(haste, pomo, pivo)
  vagao.add(alavanca)

  // ---- palquinho dourado no teto do vagão ----------------------------------
  const palco = new THREE.Group()
  palco.position.set(0.15, STAGE_Y, -0.05)
  palco.rotation.y = TRACK_ROT

  const tabuas = rbox(2.0, 0.09, 1.0, 0.03, WOOD, { roughness: 0.75 })
  tabuas.position.y = 0.045
  palco.add(tabuas)

  const fundo = rbox(1.94, 1.18, 0.07, 0.03, '#26333a', { roughness: 0.85 })
  fundo.position.set(0, 0.68, -0.44)
  palco.add(fundo)

  for (const side of [-1, 1]) {
    const coluna = rbox(0.11, 1.2, 0.11, 0.04, BRASS, { roughness: 0.3, metalness: 0.75 })
    coluna.position.set(side * 0.95, 0.69, 0.4)
    palco.add(coluna)

    const colunaTras = rbox(0.09, 1.2, 0.09, 0.035, BRASS, { roughness: 0.3, metalness: 0.75 })
    colunaTras.position.set(side * 0.95, 0.69, -0.42)
    palco.add(colunaTras)
  }

  const arquitrave = rbox(2.12, 0.16, 1.06, 0.05, BRASS, { roughness: 0.3, metalness: 0.75 })
  arquitrave.position.y = 1.37
  palco.add(arquitrave)

  const bando = rbox(1.9, 0.22, 0.07, 0.04, CRIMSON, { roughness: 0.9 })
  bando.position.set(0, 1.24, 0.44)
  palco.add(bando)

  for (const fx of [-0.55, 0, 0.55]) {
    const franja = sphere(0.05, BRASS, { roughness: 0.3, metalness: 0.7 })
    franja.position.set(fx, 1.12, 0.44)
    palco.add(franja)
  }

  // ribalta: luzinhas na boca de cena
  for (const lx of [-0.7, -0.35, 0, 0.35, 0.7]) {
    const luz = sphere(0.04, '#ffd58a', { roughness: 0.4, emissive: '#ffb648', emissiveIntensity: 1.1 })
    luz.position.set(lx, 0.13, 0.46)
    palco.add(luz)
  }

  root.add(palco)

  // ---- cortinas carmim (pivô nas colunas, abrem encolhendo pra fora) --------
  function cortina(side: number) {
    const g = new THREE.Group()
    g.position.set(side * 0.92, 1.27, 0.36)
    for (const dx of [0.1, 0.28, 0.46, 0.64]) {
      const prega = capsule(0.085, 0.95, dx > 0.4 ? CRIMSON : '#a02b33', { roughness: 0.92 })
      prega.position.set(side * dx, -0.58, 0)
      prega.scale.z = 0.55
      g.add(prega)
    }
    const varao = rbox(0.78, 0.07, 0.1, 0.03, '#8f2a31', { roughness: 0.92 })
    varao.position.set(side * 0.37, -0.02, 0)
    g.add(varao)
    g.scale.x = 0.6 // pose final: meio fechada (ÍNS-TELT)
    return g
  }
  const cortinaL = cortina(-1)
  const cortinaR = cortina(1)
  palco.add(cortinaL, cortinaR)

  // ---- sopro FÖ ------------------------------------------------------------
  const sopro = new THREE.Group()
  sopro.position.set(-1.25, 1.95, 0.45)
  const bafo = puff(0.24, GLASS, 6, 41, { roughness: 0.35 })
  sopro.add(bafo)
  for (const [sx, sy, sr] of [[-0.34, -0.1, 0.11], [-0.55, -0.02, 0.07]] as const) {
    const gota = sphere(sr, GLASS, { roughness: 0.35 })
    gota.position.set(sx, sy, 0.05)
    sopro.add(gota)
  }
  root.add(sopro)

  // ---- lhama de óculos (sobe pelo alçapão do palco) ------------------------
  const lhama = new THREE.Group()
  lhama.position.set(0.05, 0.09, 0.05)
  lhama.rotation.y = 0.25

  for (const lx of [-0.13, 0.13]) {
    for (const lz of [-0.18, 0.18]) {
      const perna = capsule(0.048, 0.22, CREAM_DARK, { roughness: 0.9 })
      perna.position.set(lx, 0.16, lz)
      const casco = sphere(0.055, '#4c4034', { roughness: 0.8 })
      casco.position.y = -0.15
      casco.scale.y = 0.6
      perna.add(casco)
      lhama.add(perna)
    }
  }

  const tronco = capsule(0.17, 0.3, CREAM, { roughness: 0.92 })
  tronco.rotation.x = Math.PI / 2
  tronco.position.y = 0.46
  lhama.add(tronco)

  const rabo = capsule(0.045, 0.1, CREAM_DARK, { roughness: 0.92 })
  rabo.position.set(0, 0.56, -0.31)
  rabo.rotation.x = 0.7
  lhama.add(rabo)

  const pescoco = capsule(0.07, 0.34, CREAM, { roughness: 0.92 })
  pescoco.position.set(0, 0.72, 0.13)
  pescoco.rotation.x = -0.28
  lhama.add(pescoco)

  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.97, 0.22)
  cabeca.rotation.x = 0.12

  const cranio = sphere(0.115, CREAM, { roughness: 0.92 })
  cranio.scale.set(0.92, 1, 1.05)
  cabeca.add(cranio)

  const focinho = capsule(0.058, 0.08, CREAM_DARK, { roughness: 0.92 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.045, 0.12)
  cabeca.add(focinho)

  const narina = sphere(0.02, '#4c4034', { roughness: 0.4 })
  narina.position.set(0, -0.03, 0.2)
  cabeca.add(narina)

  for (const side of [-1, 1]) {
    const olho = sphere(0.036, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.06, 0.03, 0.085)
    olho.scale.z = 0.6
    const pupila = sphere(0.017, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.06, 0.03, 0.107)
    cabeca.add(olho, pupila)

    // óculos redondos escuros
    const aro = torus(0.052, 0.011, BRASS, { roughness: 0.3, metalness: 0.8 })
    aro.position.set(side * 0.062, 0.03, 0.125)
    const lente = cylinder(0.05, 0.05, 0.012, '#2b3138', { roughness: 0.12 })
    lente.rotation.x = Math.PI / 2
    lente.position.set(side * 0.062, 0.03, 0.122)
    const haste2 = cylinder(0.008, 0.008, 0.11, BRASS, { roughness: 0.3, metalness: 0.8 })
    haste2.rotation.z = Math.PI / 2
    haste2.position.set(side * 0.105, 0.035, 0.075)
    haste2.rotation.y = side * 0.9
    cabeca.add(aro, lente, haste2)

    const orelha = capsule(0.025, 0.09, CREAM, { roughness: 0.92 })
    orelha.position.set(side * 0.06, 0.15, -0.01)
    orelha.rotation.z = -side * 0.22
    orelha.scale.z = 0.55
    cabeca.add(orelha)
  }
  lhama.add(cabeca)

  // livro verde-musgo num atril de latão, na boca de cena
  const atril = new THREE.Group()
  atril.position.set(0.02, 0, 0.38)
  const pe = cylinder(0.09, 0.11, 0.03, BRASS, { roughness: 0.3, metalness: 0.75 })
  pe.position.y = 0.015
  const mastro2 = cylinder(0.022, 0.026, 0.4, BRASS, { roughness: 0.3, metalness: 0.75 })
  mastro2.position.y = 0.22
  atril.add(pe, mastro2)
  for (const side of [-1, 1]) {
    const folha = rbox(0.15, 0.02, 0.14, 0.01, '#4d6b3a', { roughness: 0.8 })
    folha.position.set(side * 0.078, 0.44, 0)
    folha.rotation.set(-0.5, 0, -side * 0.16)
    atril.add(folha)
  }
  const lombada = rbox(0.03, 0.03, 0.15, 0.012, '#3c5730', { roughness: 0.8 })
  lombada.position.set(0, 0.45, 0)
  lombada.rotation.x = -0.5
  atril.add(lombada)
  lhama.add(atril)

  palco.add(lhama)

  // ---- escudo dourado com o T de tábua (FÖ-XÊ-NAT) -------------------------
  const escudo = new THREE.Group()
  escudo.position.set(-0.27, 0.5, 0.24)
  escudo.rotation.set(0.1, 0.35, 0.12)

  const disco = lathe(
    [[0, -0.03], [0.14, -0.03], [0.2, 0], [0.205, 0.03], [0.14, 0.07], [0.06, 0.09], [0, 0.09]],
    BRASS,
    { roughness: 0.25, metalness: 0.85 },
  )
  disco.rotation.x = Math.PI / 2
  escudo.add(disco)

  const rebite = torus(0.15, 0.014, '#8a6a2a', { roughness: 0.3, metalness: 0.8 })
  rebite.position.z = 0.05
  escudo.add(rebite)

  // T de tábua pregado no escudo
  const barraT = rbox(0.22, 0.05, 0.03, 0.012, WOOD, { roughness: 0.8 })
  barraT.position.set(0, 0.07, 0.1)
  const pernaT = rbox(0.05, 0.19, 0.03, 0.012, WOOD, { roughness: 0.8 })
  pernaT.position.set(0, -0.04, 0.1)
  escudo.add(barraT, pernaT)
  for (const nx of [-0.08, 0.08]) {
    const prego = sphere(0.016, '#8d949a', { roughness: 0.3, metalness: 0.7 })
    prego.position.set(nx, 0.07, 0.125)
    escudo.add(prego)
  }
  lhama.add(escudo)

  // ---- ampulheta de areia âmbar --------------------------------------------
  const ampulheta = new THREE.Group()
  ampulheta.position.set(0.76, 0.26, 0.26)
  ampulheta.rotation.z = Math.PI // pose final: já virada

  for (const side of [-1, 1]) {
    const tampa = cylinder(0.1, 0.11, 0.03, BRASS, { roughness: 0.3, metalness: 0.8 })
    tampa.position.y = side * 0.155
    ampulheta.add(tampa)

    const bulbo = cone(0.085, 0.13, GLASS, { roughness: 0.12 })
    bulbo.position.y = side * 0.075
    bulbo.rotation.x = side > 0 ? Math.PI : 0
    ampulheta.add(bulbo)

    const areia = cone(0.06, 0.07, SAND, { roughness: 0.9 })
    areia.position.y = side * 0.107
    areia.rotation.x = side > 0 ? Math.PI : 0
    ampulheta.add(areia)
  }
  for (const a of [0, 2.1, 4.2]) {
    const coluna = cylinder(0.012, 0.012, 0.31, BRASS, { roughness: 0.3, metalness: 0.8 })
    coluna.position.set(Math.cos(a) * 0.095, 0, Math.sin(a) * 0.095)
    ampulheta.add(coluna)
  }
  palco.add(ampulheta)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'tablado', group: 'cenario', object: tablado },
    { name: 'vagao', group: 'vagao', object: vagao },
    { name: 'alavanca', group: 'vagao', object: alavanca },
    { name: 'palco', group: 'palco', object: palco },
    { name: 'cortinaL', group: 'palco', object: cortinaL },
    { name: 'cortinaR', group: 'palco', object: cortinaR },
    { name: 'sopro', group: 'lhama', object: sopro },
    { name: 'lhama', group: 'lhama', object: lhama },
    { name: 'escudo', group: 'lhama', object: escudo },
    { name: 'ampulheta', group: 'final', object: ampulheta },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('tablado-rise', 'tablado', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Na plataforma brota um tablado com trilhos — e nenhum trem chegando…',
    }),

    seq('vagao-rise', 'vagao', 1.8, 0.9, [riseFrom(WAGON_Y, 1.7)], {
      ease: 'easeOut',
      caption: '…só um vagão azul parado nos trilhos: É TÔ-GUET, o tåget que não sai.',
    }),
    seq('alavanca-arma', 'alavanca', 2.6, 0.6, [ch('rotation.z', -1.0, 0.9)], { ease: 'easeOut' }),

    seq(
      'palco-grow',
      'palco',
      3.6,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('cortinaL-grow', 'cortinaL', 4.15, 0.6, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),
    seq('cortinaR-grow', 'cortinaR', 4.3, 0.6, [ch('scale.x', 0.01, 1)], { ease: 'easeOut' }),

    seq('sopro-rise', 'sopro', 5.4, 0.8, [riseFrom(1.95, 2.6)], {
      ease: 'easeOut',
      caption: 'Um sopro FÖ vem de fora e escancara as cortinas do palquinho…',
    }),
    seq('sopro-push', 'sopro', 6.2, 0.6, [ch('position.x', -2.05, -1.25)]),
    seq('cortinaL-open', 'cortinaL', 6.35, 0.7, [ch('scale.x', 1, 0.35)]),
    seq('cortinaR-open', 'cortinaR', 6.5, 0.7, [ch('scale.x', 1, 0.35)]),

    seq('lhama-rise', 'lhama', 7.5, 0.9, [riseFrom(0.09, 1.5)], {
      ease: 'easeOut',
      caption: '…e entra em cena a LHAMA de óculos escuros, a XENA do vagão…',
    }),
    seq(
      'escudo-pop',
      'escudo',
      8.1,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '…com um T de tábua pregado no escudo dourado: FÖ-XÊ-NAT!' },
    ),

    seq('ampulheta-rise', 'ampulheta', 9.2, 0.7, [riseFrom(0.26, 0.75)], {
      ease: 'easeOut',
      caption: 'Só atrasado? Ela empurra o livro na sua cara — É-LER — até a ampulheta virar.',
    }),
    seq('lhama-empurra', 'lhama', 9.45, 0.5, [ch('position.z', 0.05, 0.19)], { ease: 'easeOut' }),
    seq('lhama-volta', 'lhama', 9.95, 0.5, [ch('position.z', 0.19, 0.05)]),
    seq('ampulheta-vira', 'ampulheta', 10.0, 0.7, [ch('rotation.z', 0, Math.PI)]),

    seq('lhama-inclina', 'lhama', 10.8, 0.5, [ch('rotation.z', 0, -0.16)]),
    seq('alavanca-puxa', 'alavanca', 10.95, 0.6, [ch('rotation.z', 0.9, -1.0)], {
      ease: 'easeIn',
      caption: 'Cancelado? Ela puxa com os dentes a alavanca do disjuntor: ÍNS-TELT!',
    }),
    seq('lhama-endireita', 'lhama', 11.45, 0.5, [ch('rotation.z', -0.16, 0)]),

    seq('cortinaL-fecha', 'cortinaL', 11.9, 0.7, [ch('scale.x', 0.35, 0.6)], {
      caption: 'Är tåget försenat eller inställt? — "O trem está atrasado ou foi cancelado?"',
    }),
    seq('cortinaR-fecha', 'cortinaR', 12.0, 0.7, [ch('scale.x', 0.35, 0.6)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.9, 3.2, 6.2], target: [0.05, 1.2, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ar-taget-forsenat-eller-installt',
    contexto:
      "Perguntando na estação quando o trem não aparece. Serve trocando 'tåget' por 'bussen'.",
    fraseFonte: 'O trem está atrasado ou foi cancelado?',
    fraseAlvo: 'Är tåget försenat eller inställt?',
    pronuncia: 'É TÔ-guet för-SÊ-nat É-ler ÍN-stelt?',
    ponteSonora:
      "É TÔ-GUET, FÖ-XÊ-NAT... É-LER, ÍNS-TELT! (10 sílabas; TÔ-GUET com o T final de pé; FÖ é boca de Ô soltando Ê, e o 'rs' de 'försenat' escorrega pra X de xarope — FÖ-XÊ-NAT, com Ê FECHADO e o T final; 'eller' = É-LER com a tônica no É; 'inställt' tem tônica no ÍN — ÍNS-telt: o É de -telt é ABERTO mas ÁTONO, nunca 'ins-TÉLT')",
    historia:
      'O trem TÔ-GUET não vem, e num vagão azul parado alguém pregou um palquinho de teatro. Um sopro FÖ abre a cortina e entra a LHAMA de óculos fantasiada de XENA, com um T de tábua pregado no escudo: FÖ-XÊ-NAT. Se o trem está só atrasado, ela não explica nada, só empurra um livro na sua cara dizendo É-LER até a ampulheta virar. Se foi cancelado, ela puxa com os dentes a alavanca do disjuntor e o palco apaga: ÍNS-TELT!',
  },
  createScene,
}

export default card
