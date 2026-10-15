import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  rbox, cylinder, sphere, capsule, lathe, rock, puff, torus, person,
  seq, ch, riseFrom, rng,
} from '../rig/helpers'

/**
 * "Går den här till T-Centralen?" — GOLDEN RÉR, TIL TÊ-CENTRÁLEN?
 * Diorama da plataforma da tunnelbana: o trem azul encosta, o maquinista
 * se debruça na janela da cabine, e um golden retriever de crachá do SL
 * aponta o focinho pro trem sob a placa branca com o T azul.
 *
 * Paleta: concretos frios (#9096a0/#b6bcc6), azuis temperados do SL
 * (#2f66b5/#1d55c0), asfalto escuro — e o DOURADO saturado (#dfa142)
 * reservado ao golden, o objeto-chave da ponte sonora.
 */
// placa do T: no fundo à esquerda do golden, sem tapar o cachorro nem o trem
const PLACA_X = -0.6
const PLACA_Z = 0.05
const POSTE_H = 1.45
const POSTE_Y = 0.52 + POSTE_H / 2
const PLACA_Y = 0.52 + POSTE_H + 0.35
// golden maior que o blockout: é o protagonista; patas apoiadas no piso (0.52)
const DOG_S = 1.35
const DOG_Y = 0.52 - 0.045 * DOG_S

function createScene(): CardScene {
  const root = new THREE.Group()

  const OURO = '#dfa142'
  const OURO_CLARO = '#e6b968'
  const OURO_ESCURO = '#b5761d'
  const AZUL_SL = '#1d55c0'
  const VIDRO = { roughness: 0.18, emissive: '#9dc4f5', emissiveIntensity: 0.8 } as const

  // ── Base do diorama: laje da estação + leito dos trilhos ──────────
  const base = new THREE.Group()
  const pedestal = cylinder(2.75, 2.85, 0.16, '#9096a0', { roughness: 0.9 })
  pedestal.position.y = 0.08
  base.add(pedestal)

  const leito = rbox(4.0, 0.1, 0.9, 0.03, '#3a3f46', { roughness: 0.95 })
  leito.position.set(0, 0.21, -1.5)
  base.add(leito)
  for (let i = 0; i < 7; i++) {
    const dormente = rbox(0.13, 0.03, 0.78, 0.01, '#5a4a3a', { roughness: 0.9 })
    dormente.position.set(-1.65 + i * 0.55, 0.275, -1.5)
    base.add(dormente)
  }
  for (const z of [-1.72, -1.28]) {
    const trilho = rbox(4.0, 0.07, 0.06, 0.02, '#8b9099', { roughness: 0.3, metalness: 0.8 })
    trilho.position.set(0, 0.3, z)
    base.add(trilho)
  }
  const brita = rng(11)
  for (let i = 0; i < 6; i++) {
    const pedra = rock(0.035 + brita() * 0.03, '#565b63', 20 + i, { roughness: 0.95 })
    pedra.position.set(-1.7 + i * 0.68 + (brita() - 0.5) * 0.2, 0.27, -1.5 + (brita() - 0.5) * 0.55)
    base.add(pedra)
  }

  const laje = rbox(4.1, 0.36, 1.9, 0.06, '#b6bcc6', { roughness: 0.85 })
  laje.position.set(0, 0.34, 0.5)
  base.add(laje)
  const faixaAmarela = rbox(4.1, 0.035, 0.18, 0.012, '#d9b545', { roughness: 0.8 })
  faixaAmarela.position.set(0, 0.535, -0.33)
  base.add(faixaAmarela)
  root.add(base)

  // ── Ambientação: banco, lixeira, copo esquecido ───────────────────
  const adereco = new THREE.Group()
  const banco = new THREE.Group()
  for (const sx of [-0.5, 0.5]) {
    const perna = rbox(0.06, 0.24, 0.4, 0.02, '#3c444e', { roughness: 0.45, metalness: 0.4 })
    perna.position.set(sx, 0.12, 0)
    banco.add(perna)
  }
  const assento = rbox(1.2, 0.07, 0.42, 0.03, '#8a6a48', { roughness: 0.75 })
  assento.position.set(0, 0.27, 0)
  banco.add(assento)
  const encosto = rbox(1.2, 0.3, 0.06, 0.03, '#8a6a48', { roughness: 0.75 })
  encosto.position.set(0, 0.5, 0.19)
  encosto.rotation.x = -0.15
  banco.add(encosto)
  const copo = lathe([[0.0, 0], [0.042, 0], [0.052, 0.1], [0.046, 0.105]], '#e8e2d6', { roughness: 0.4 })
  copo.position.set(0.35, 0.305, 0.02)
  banco.add(copo)
  banco.position.set(-1.5, 0.52, 1.0)
  adereco.add(banco)

  const lixeira = lathe(
    [[0.0, 0], [0.12, 0], [0.135, 0.05], [0.145, 0.3], [0.115, 0.34]],
    '#4c5a66', { roughness: 0.5, metalness: 0.3 },
  )
  lixeira.position.set(-2.0, 0.52, 0.35)
  adereco.add(lixeira)
  const aro = torus(0.12, 0.018, '#37424c', { roughness: 0.45, metalness: 0.3 })
  aro.rotation.x = Math.PI / 2
  aro.position.set(-2.0, 0.86, 0.35)
  adereco.add(aro)
  root.add(adereco)

  // ── Trem azul do SL (den här) — origem no topo do trilho ──────────
  const trem = new THREE.Group()
  const chassi = rbox(3.2, 0.16, 0.6, 0.05, '#26303c', { roughness: 0.8 })
  chassi.position.set(0, 0.2, 0)
  trem.add(chassi)
  const carroceria = rbox(3.3, 0.85, 0.7, 0.12, '#2f66b5', { roughness: 0.45 })
  carroceria.position.set(0, 0.66, 0)
  trem.add(carroceria)
  const teto = rbox(3.22, 0.16, 0.6, 0.08, '#4a72b0', { roughness: 0.5 })
  teto.position.set(0, 1.12, 0)
  trem.add(teto)
  const arCondicionado = rbox(0.5, 0.09, 0.38, 0.03, '#6f8bb0', { roughness: 0.55 })
  arCondicionado.position.set(0.35, 1.23, 0)
  trem.add(arCondicionado)
  for (const sx of [-0.8, 0.8]) {
    const porta = rbox(0.36, 0.62, 0.06, 0.02, '#24509c', { roughness: 0.4 })
    porta.position.set(sx, 0.6, 0.34)
    trem.add(porta)
    const janelaPorta = rbox(0.24, 0.2, 0.03, 0.01, '#cfe2fb', VIDRO)
    janelaPorta.position.set(sx, 0.78, 0.375)
    trem.add(janelaPorta)
  }
  const janelaCentral = rbox(0.9, 0.26, 0.05, 0.02, '#cfe2fb', VIDRO)
  janelaCentral.position.set(0, 0.82, 0.34)
  trem.add(janelaCentral)
  const janelaTraseira = rbox(0.5, 0.26, 0.05, 0.02, '#cfe2fb', VIDRO)
  janelaTraseira.position.set(-1.28, 0.82, 0.34)
  trem.add(janelaTraseira)
  const janelaCabine = rbox(0.42, 0.3, 0.04, 0.015, '#17263d', { roughness: 0.6 })
  janelaCabine.position.set(1.25, 0.82, 0.34)
  trem.add(janelaCabine)
  for (const sx of [-1.25, -0.9, 0.9, 1.25]) {
    for (const sz of [-0.26, 0.26]) {
      const roda = cylinder(0.13, 0.13, 0.08, '#23272e', { roughness: 0.4, metalness: 0.5 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(sx, 0.13, sz)
      trem.add(roda)
    }
  }
  for (const sz of [-0.2, 0.2]) {
    const farol = sphere(0.045, '#ffd98f', { roughness: 0.3, emissive: '#ffca66', emissiveIntensity: 1.3 })
    farol.scale.x = 0.6
    farol.position.set(1.66, 0.5, sz)
    trem.add(farol)
  }
  trem.position.set(0, 0.33, -1.5)
  root.add(trem)

  // ── Maquinista: debruça na janela da cabine, de quepe do SL ───────
  const maquinista = person({ body: '#2c3a52', skin: '#e8c39e', height: 0.85, armAngle: 0.25 })
  const cabecaMaquinista = maquinista.getObjectByName('head')!
  const quepe = cylinder(0.17, 0.17, 0.06, '#22304a', { roughness: 0.5 })
  quepe.position.y = 0.12
  cabecaMaquinista.add(quepe)
  const aba = rbox(0.16, 0.02, 0.1, 0.008, '#1a2438', { roughness: 0.4 })
  aba.position.set(0, 0.09, 0.15)
  cabecaMaquinista.add(aba)
  maquinista.position.set(1.25, 0.28, 0.3)
  maquinista.rotation.y = -0.2
  trem.add(maquinista)

  // ── Golden RÉR: corpo, crachá do SL, patas ────────────────────────
  const corpo = new THREE.Group()
  const tronco = capsule(0.21, 0.3, OURO, { roughness: 0.8 })
  tronco.rotation.x = Math.PI / 2
  tronco.position.set(0, 0.42, 0)
  corpo.add(tronco)
  const peito = puff(0.09, OURO_CLARO, 4, 5, { roughness: 0.85 })
  peito.position.set(0, 0.34, 0.28)
  corpo.add(peito)
  for (const sx of [-0.12, 0.12]) {
    for (const sz of [-0.22, 0.22]) {
      if (sx < 0 && sz > 0) continue // a pata dianteira do lado da câmera aponta pro trem
      const pata = capsule(0.055, 0.14, OURO, { roughness: 0.8 })
      pata.position.set(sx, 0.17, sz)
      corpo.add(pata)
    }
  }
  // pata apontando: pivô no ombro, erguida para a frente (na direção do trem)
  const ombro = new THREE.Group()
  ombro.position.set(-0.13, 0.33, 0.2)
  ombro.rotation.set(-1.45, 0, 0.12)
  const pataErguida = capsule(0.055, 0.2, OURO, { roughness: 0.8 })
  pataErguida.position.y = -0.14
  ombro.add(pataErguida)
  const almofada = sphere(0.06, OURO_CLARO, { roughness: 0.85 })
  almofada.position.y = -0.27
  almofada.scale.set(1, 0.8, 1)
  ombro.add(almofada)
  corpo.add(ombro)
  const coleira = torus(0.17, 0.035, '#a8402f', { roughness: 0.6 })
  coleira.position.set(0, 0.44, 0.3)
  corpo.add(coleira)
  const cracha = rbox(0.09, 0.11, 0.03, 0.012, '#f2f4f7', { roughness: 0.35 })
  cracha.position.set(0, 0.3, 0.33)
  corpo.add(cracha)
  const chipSL = rbox(0.055, 0.045, 0.016, 0.006, AZUL_SL, { roughness: 0.3 })
  chipSL.position.set(0, 0.295, 0.345)
  corpo.add(chipSL)
  corpo.scale.setScalar(DOG_S)
  corpo.position.set(0.45, DOG_Y, 0.6)
  corpo.rotation.y = Math.PI - 1.25 // de perfil pra câmera, focinho e pata apontando a cabine do trem
  root.add(corpo)

  // ── Golden: cabeça (telescopa do corpo), olhos esclera+pupila ─────
  const cabeca = new THREE.Group()
  const cranio = sphere(0.17, OURO, { roughness: 0.8 })
  cabeca.add(cranio)
  const focinho = capsule(0.07, 0.08, OURO_CLARO, { roughness: 0.8 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.05, 0.15)
  cabeca.add(focinho)
  const nariz = sphere(0.035, '#3a2a1d', { roughness: 0.3 })
  nariz.position.set(0, -0.02, 0.24)
  cabeca.add(nariz)
  for (const side of [-1, 1]) {
    const esclera = sphere(0.042, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.072, 0.05, 0.135)
    esclera.scale.z = 0.6
    const pupila = sphere(0.02, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.072, 0.05, 0.162)
    cabeca.add(esclera, pupila)
  }
  const lingua = rbox(0.05, 0.015, 0.09, 0.007, '#d97b8a', { roughness: 0.6 })
  lingua.position.set(0, -0.115, 0.16)
  lingua.rotation.x = 0.25
  cabeca.add(lingua)
  cabeca.position.set(0, 0.66, 0.42)
  cabeca.rotation.x = -0.15 // pose final: focinho apontado pro trem
  corpo.add(cabeca)

  // ── Golden: orelhas caídas (filhas da cabeça) ─────────────────────
  const orelhas = new THREE.Group()
  for (const side of [-1, 1]) {
    const orelha = rbox(0.06, 0.2, 0.12, 0.028, OURO_ESCURO, { roughness: 0.85 })
    orelha.position.set(side * 0.155, -0.01, -0.01)
    orelha.rotation.z = -side * 0.18
    orelha.rotation.x = -0.1
    orelhas.add(orelha)
  }
  cabeca.add(orelhas)

  // ── Golden: rabo felpudo abanando (RÉR!) ──────────────────────────
  const rabo = new THREE.Group()
  const hasteRabo = capsule(0.045, 0.16, OURO, { roughness: 0.85 })
  hasteRabo.rotation.x = -0.85
  hasteRabo.position.set(0, 0.06, -0.05)
  rabo.add(hasteRabo)
  const pontaRabo = puff(0.05, OURO_CLARO, 4, 9, { roughness: 0.85 })
  pontaRabo.position.set(0, 0.14, -0.13)
  rabo.add(pontaRabo)
  rabo.position.set(0, 0.5, -0.33)
  corpo.add(rabo)

  // ── Poste da placa ────────────────────────────────────────────────
  const poste = cylinder(0.045, 0.055, POSTE_H, '#7d838a', { roughness: 0.4, metalness: 0.6 })
  poste.position.set(PLACA_X, POSTE_Y, PLACA_Z)
  root.add(poste)

  // ── O osso enterrado bem debaixo do T: rachadura no piso + osso aflorando ─
  const osso = new THREE.Group()
  const terra = rbox(0.5, 0.03, 0.3, 0.012, '#6d5440', { roughness: 0.95 })
  terra.position.y = 0.005
  osso.add(terra)
  const ossoBranco = '#efe6cf'
  const haste = capsule(0.03, 0.26, ossoBranco, { roughness: 0.6 })
  haste.rotation.z = Math.PI / 2
  haste.position.y = 0.035
  osso.add(haste)
  for (const ex of [-0.17, 0.17]) {
    for (const ez of [-0.035, 0.035]) {
      const no = sphere(0.045, ossoBranco, { roughness: 0.6 })
      no.position.set(ex, 0.04, ez)
      osso.add(no)
    }
  }
  const torroes = rng(7)
  for (let i = 0; i < 4; i++) {
    const torrao = rock(0.035 + torroes() * 0.025, '#5a4636', 60 + i, { roughness: 0.95 })
    torrao.position.set(-0.2 + i * 0.13, 0.03, (i % 2 ? 1 : -1) * 0.12)
    osso.add(torrao)
  }
  osso.position.set(PLACA_X + 0.12, 0.52, PLACA_Z + 0.32)
  osso.rotation.y = 0.5
  root.add(osso)

  // ── Placa branca polida com o T azul da TÊ-CENTRÁLEN ──────────────
  const placa = new THREE.Group()
  const disco = cylinder(0.42, 0.42, 0.07, '#f4f6f9', { roughness: 0.22 })
  disco.rotation.x = Math.PI / 2
  placa.add(disco)
  const aroPlaca = torus(0.42, 0.02, AZUL_SL, { roughness: 0.3 })
  placa.add(aroPlaca)
  for (const face of [-1, 1]) {
    const tHorizontal = rbox(0.44, 0.12, 0.05, 0.015, AZUL_SL, { roughness: 0.3 })
    tHorizontal.position.set(0, 0.12, face * 0.045)
    const tVertical = rbox(0.12, 0.36, 0.05, 0.015, AZUL_SL, { roughness: 0.3 })
    tVertical.position.set(0, -0.08, face * 0.045)
    placa.add(tHorizontal, tVertical)
  }
  placa.position.set(PLACA_X, PLACA_Y, PLACA_Z)
  placa.rotation.y = 0.65
  root.add(placa)

  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'adereco', group: 'cenario', object: adereco },
    { name: 'trem', group: 'trem', object: trem },
    { name: 'maquinista', group: 'trem', object: maquinista },
    { name: 'golden-corpo', group: 'golden', object: corpo },
    { name: 'golden-cabeca', group: 'golden', object: cabeca },
    { name: 'golden-orelhas', group: 'golden', object: orelhas },
    { name: 'golden-rabo', group: 'golden', object: rabo },
    { name: 'poste', group: 'placa', object: poste },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'osso', group: 'placa', object: osso },
  ]

  const build = [
    // Cenário: a estação brota do subsolo
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.75)], {
      ease: 'easeOut',
      caption: 'Na plataforma da tunnelbana, os trilhos brotam do chão…',
    }),
    seq('adereco-rise', 'adereco', 0.2, 0.8, [riseFrom(0, 1.3)], { ease: 'easeOut' }),

    // Trem: sobe fora da estação e desliza até encostar
    seq('trem-rise', 'trem', 1.7, 0.8, [riseFrom(0.33, 1.7)], {
      ease: 'easeOut',
      caption: '…e ESTE trem azul aqui (den här) encosta na estação…',
    }),
    seq('trem-slide', 'trem', 2.55, 0.85, [ch('position.x', -0.7, 0)]),
    seq('maquinista-out', 'maquinista', 3.45, 0.6, [ch('position.y', -0.05, 0.28)], {
      ease: 'easeOut',
    }),

    // Golden retriever
    seq('corpo-rise', 'golden-corpo', 4.6, 0.8, [riseFrom(DOG_Y, 1.2)], {
      ease: 'easeOut',
      caption: '…um GOLDEN retriever chamado RÉR, de crachá do SL no pescoço, sobe na plataforma…',
    }),
    seq('cabeca-out', 'golden-cabeca', 5.45, 0.6, [ch('position.z', 0.14, 0.42)], {
      ease: 'easeOut',
    }),
    seq('orelhas-grow', 'golden-orelhas', 5.6, 0.5, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
      ch('scale.z', 0.05, 1),
    ]),
    seq('rabo-grow', 'golden-rabo', 5.75, 0.5, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
      ch('scale.z', 0.05, 1),
    ]),
    seq('cabeca-tilt', 'golden-cabeca', 6.2, 0.5, [ch('rotation.x', 0, -0.15)], {
      caption: '…e aponta o focinho pro trem: ele só embarca se ESTE aqui for ATÉ (\'TIL) onde enterrou o osso…',
    }),
    seq('rabo-wag-1', 'golden-rabo', 6.8, 0.3, [ch('rotation.z', 0, 0.4)]),
    seq('rabo-wag-2', 'golden-rabo', 7.1, 0.35, [ch('rotation.z', 0.4, -0.4)]),
    seq('rabo-wag-3', 'golden-rabo', 7.45, 0.35, [ch('rotation.z', -0.4, 0)]),

    // Placa da estação
    seq('poste-rise', 'poste', 8.2, 0.7, [riseFrom(POSTE_Y, 2.8)], {
      ease: 'easeOut',
      caption: '…o osso está enterrado bem debaixo do grande T azul da TÊ-CENTRÁLEN…',
    }),
    seq('placa-up', 'placa', 8.95, 0.9, [ch('position.y', -0.6, PLACA_Y)], { ease: 'easeOut' }),
    seq('osso-pop', 'osso', 9.3, 0.5, [
      ch('scale.x', 0.05, 1),
      ch('scale.y', 0.05, 1),
      ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),
    seq('placa-spin', 'placa', 9.95, 0.7, [ch('rotation.y', 0.65 - Math.PI * 2, 0.65)], {
      caption: 'Antes das portas fecharem, ele late: GOLDEN-RÉR, TIL TÊ-CENTRÁLEN? — "Går den här till T-Centralen?"',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [2.6, 2.5, 4.5], target: [-0.05, 1.3, -0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'gar-den-har-till-t-centralen',
    contexto: 'Transporte SL: plataforma da tunnelbana, ponto de ônibus, pendeltåg.',
    fraseFonte: 'Este aqui vai para a T-Centralen?',
    fraseAlvo: 'Går den här till T-Centralen?',
    pronuncia: "gôr den RRÉR til tê-sen-TRÁ-len ('går' = 'gôr'; 'här' com h aspirado carioca e r final: 'rrér')",
    ponteSonora:
      '"GOLDEN RÉR, TIL TÊ-CENTRÁLEN?" — "Går den här" soa quase "GOL-DEN-RRÉR", o começo de GOLDEN retriever (só troque o L por R: "gôr-den-rrér", com RR carioca no "här"); "till" é o \'til\' de até, e T-Centralen fala-se "tê-sen-TRÁ-len".',
    historia:
      'Na plataforma da tunnelbana, um GOLDEN retriever chamado RÉR, de crachá do SL no pescoço, aponta a pata para o trem azul que acabou de chegar. Ele só embarca se ESTE trem aqui for ATÉ (\'til) a TÊ-CENTRAL, porque foi lá que ele enterrou o osso, bem debaixo da placa do grande T azul. Antes das portas fecharem, ele late a pergunta pro maquinista: "GOLDEN-RÉR? TIL TÊ-CENTRÁLEN?"',
  },
  createScene,
  refine: { organic: ['golden-corpo', 'golden-cabeca', 'golden-orelhas', 'golden-rabo'] },
}

export default card
