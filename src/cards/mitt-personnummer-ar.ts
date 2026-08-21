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
  seq,
  sphere,
  torus,
} from '../rig/helpers'

/**
 * "Mitt personnummer är ..." — Zeus, o maior MITO, declama sua
 * paiXÃO-NÚMERO no guichê sueco, abraçado a um 0 e um 1 dourados.
 *
 * Diorama: piso de bétula de repartição sueca, balcão com bandeirinha,
 * atendente de camisa azul, máquina de "nummerlapp", vasos de planta.
 * Acento dourado reservado aos objetos da ponte sonora: os dígitos
 * (e o raio, atributo do mito). Coração vermelho = a paixão.
 */

const OURO = '#e0a63a'
const PELE = '#e8c39e'
const CREME = '#f2ede0'

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(2026)

  const ouroMetal = { roughness: 0.25, metalness: 0.9 }

  // ------------------------------------------------------- base do diorama
  // Piso de bétula da repartição + tapete de fila
  const base = new THREE.Group()
  const piso = cylinder(2.5, 2.6, 0.16, '#c2a37a', { roughness: 0.75 })
  piso.position.y = 0.08
  base.add(piso)
  const tapete = rbox(1.5, 0.03, 0.9, 0.015, '#5d718a', { roughness: 0.92 })
  tapete.position.set(0, 0.175, -0.4)
  base.add(tapete)
  base.position.y = 0
  root.add(base)

  // Vasos de planta (ambientação escandinava)
  const plantas = new THREE.Group()
  const vagaPlantas: [number, number, number][] = [
    [1.9, -0.9, 1],
    [-1.85, -0.75, 0.8],
  ]
  for (const [px, pz, s] of vagaPlantas) {
    const planta = new THREE.Group()
    const vaso = lathe(
      [
        [0, 0],
        [0.12, 0.02],
        [0.14, 0.1],
        [0.16, 0.26],
        [0.13, 0.3],
      ],
      '#b6a58f',
      { roughness: 0.5 },
    )
    planta.add(vaso)
    const copa = puff(0.17, '#4c8a45', 7, 40 + Math.floor(rand() * 100), { roughness: 0.85 })
    copa.position.y = 0.42
    planta.add(copa)
    planta.scale.setScalar(s)
    planta.rotation.y = rand() * Math.PI
    planta.position.set(px, 0, pz)
    plantas.add(planta)
  }
  plantas.position.y = 0.16
  root.add(plantas)

  // Máquina de nummerlapp (senha de fila) — muito sueca
  const automato = new THREE.Group()
  const poste = cylinder(0.032, 0.045, 0.95, '#55606e', { roughness: 0.5, metalness: 0.4 })
  poste.position.y = 0.475
  automato.add(poste)
  const cabecote = rbox(0.3, 0.32, 0.2, 0.05, '#3f556e', { roughness: 0.45 })
  cabecote.position.y = 1.0
  automato.add(cabecote)
  const visor = rbox(0.16, 0.1, 0.02, 0.008, '#dfe6ee', { roughness: 0.3 })
  visor.position.set(0, 1.05, 0.1)
  automato.add(visor)
  const senha = rbox(0.09, 0.016, 0.12, 0.005, '#f5f2e8', { roughness: 0.7 })
  senha.position.set(0, 0.9, 0.12)
  automato.add(senha)
  automato.rotation.y = 0.5
  automato.position.set(-1.55, 0.16, 0.75)
  root.add(automato)

  // ------------------------------------------------------- guichê sueco
  const balcao = new THREE.Group()
  const corpoBalcao = rbox(2.3, 0.85, 0.55, 0.06, '#8a5f3a', { roughness: 0.6 })
  corpoBalcao.position.y = 0.425
  balcao.add(corpoBalcao)
  const painelFrente = rbox(2.05, 0.5, 0.06, 0.02, '#9a6b42', { roughness: 0.65 })
  painelFrente.position.set(0, 0.42, 0.28)
  balcao.add(painelFrente)
  const tampo = rbox(2.5, 0.09, 0.72, 0.04, '#a9825a', { roughness: 0.35 })
  tampo.position.y = 0.895
  balcao.add(tampo)
  // papelada e sineta de balcão
  const papelada = rbox(0.3, 0.02, 0.22, 0.008, '#f2efe6', { roughness: 0.8 })
  papelada.position.set(-0.55, 0.95, 0.06)
  papelada.rotation.y = 0.25
  balcao.add(papelada)
  const sineta = sphere(0.055, '#c3c9d1', { metalness: 0.85, roughness: 0.25 })
  sineta.scale.y = 0.72
  sineta.position.set(0.42, 0.955, 0.1)
  balcao.add(sineta)
  const botaoSineta = sphere(0.018, '#c3c9d1', { metalness: 0.85, roughness: 0.25 })
  botaoSineta.position.set(0.42, 1.0, 0.1)
  balcao.add(botaoSineta)
  // bandeirinha sueca no mastro
  const mastro = cylinder(0.022, 0.022, 0.55, '#8f979f', { metalness: 0.6, roughness: 0.35 })
  mastro.position.set(0.8, 1.17, 0)
  balcao.add(mastro)
  const bandeira = new THREE.Group()
  const pano = rbox(0.5, 0.34, 0.045, 0.01, '#2a5ca8', { roughness: 0.5 })
  bandeira.add(pano)
  const cruzH = rbox(0.5, 0.085, 0.055, 0.01, '#e0b23f', { roughness: 0.5 })
  bandeira.add(cruzH)
  const cruzV = rbox(0.085, 0.34, 0.055, 0.01, '#e0b23f', { roughness: 0.5 })
  cruzV.position.x = -0.07
  bandeira.add(cruzV)
  bandeira.position.set(0.8, 1.3, 0.04)
  balcao.add(bandeira)
  balcao.position.set(0, 0.16, -1.1)
  root.add(balcao)

  // Atendente sueca de camisa azul, olhando para a fila
  const atendente = person({ body: '#4a7aa6', skin: PELE, height: 1.4, armAngle: 0.35 })
  const cabeloAtendente = puff(0.085, '#5d4630', 5, 31, { roughness: 0.9 })
  cabeloAtendente.position.set(0, 0.16, -0.03)
  cabeloAtendente.scale.set(1.15, 0.75, 1.15)
  atendente.getObjectByName('head')!.add(cabeloAtendente)
  atendente.position.set(0.1, 0.16, -1.6)
  root.add(atendente)

  // ------------------------------------------------------- o MITO
  const zeus = person({ body: CREME, skin: PELE, height: 1.55, armAngle: 0.55 })
  const cabecaZeus = zeus.getObjectByName('head')!
  const barba = puff(0.1, '#f7f3e9', 6, 21, { roughness: 0.85 })
  barba.position.set(0, -0.17, 0.18)
  barba.scale.set(1.15, 1.3, 0.8)
  cabecaZeus.add(barba)
  const cabeloZeus = puff(0.09, '#f7f3e9', 5, 22, { roughness: 0.85 })
  cabeloZeus.position.set(0, 0.2, -0.06)
  cabeloZeus.scale.set(1.1, 0.7, 1.1)
  cabecaZeus.add(cabeloZeus)
  const louro = torus(0.27, 0.032, OURO, ouroMetal)
  louro.rotation.x = Math.PI / 2
  louro.position.y = 0.16
  cabecaZeus.add(louro)
  const cinto = torus(0.27, 0.022, OURO, ouroMetal)
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.34
  zeus.add(cinto)
  const bracoDireito = zeus.getObjectByName('armR')!
  bracoDireito.rotation.z = -2.25

  // pose final: virado para os números, curvado no abraço
  zeus.position.set(-0.55, 0.16, 0.35)
  zeus.rotation.set(0.12, 0.85, 0)
  zeus.scale.y = 0.88
  root.add(zeus)

  // Raio de Zeus, brotando na mão erguida (expansão a partir do punho)
  const raio = new THREE.Group()
  const raioAlto = rbox(0.085, 0.5, 0.085, 0.02, OURO, {
    roughness: 0.35,
    metalness: 0.3,
    emissive: '#ffcf5e',
    emissiveIntensity: 1.1,
  })
  raioAlto.position.set(-0.05, 0.21, 0)
  raioAlto.rotation.z = 0.38
  raio.add(raioAlto)
  const raioBaixo = rbox(0.085, 0.46, 0.085, 0.02, OURO, {
    roughness: 0.35,
    metalness: 0.3,
    emissive: '#ffcf5e',
    emissiveIntensity: 1.1,
  })
  raioBaixo.position.set(0.07, -0.17, 0)
  raioBaixo.rotation.z = -0.38
  raio.add(raioBaixo)
  const raioPonta = cone(0.06, 0.16, OURO, {
    roughness: 0.35,
    metalness: 0.3,
    emissive: '#ffcf5e',
    emissiveIntensity: 1.1,
  })
  raioPonta.rotation.z = Math.PI - 0.38
  raioPonta.position.set(0.16, -0.44, 0)
  raio.add(raioPonta)
  raio.position.set(0, -0.3, 0.02)
  raio.rotation.z = 2.1
  bracoDireito.add(raio)

  // ------------------------------------------------------- números dourados
  // O dígito 0: aro dourado polido, em pé sobre o piso
  const zero = torus(0.4, 0.13, OURO, ouroMetal)
  zero.position.set(0.5, 0.69, 0.5)
  root.add(zero)

  // O dígito 1: coluna dourada com serifa e pedestal
  const um = new THREE.Group()
  const umCorpo = rbox(0.24, 1.25, 0.24, 0.05, OURO, ouroMetal)
  um.add(umCorpo)
  const umSerifa = rbox(0.2, 0.09, 0.24, 0.03, OURO, ouroMetal)
  umSerifa.position.set(-0.15, 0.5, 0)
  umSerifa.rotation.z = 0.6
  um.add(umSerifa)
  const umPedestal = rbox(0.44, 0.1, 0.32, 0.03, OURO, ouroMetal)
  umPedestal.position.y = -0.6
  um.add(umPedestal)
  um.rotation.y = -0.2
  um.position.set(1.15, 0.81, 0.35)
  root.add(um)

  // ------------------------------------------------------- a paixão
  // Coração vermelho que salta do peito do mito
  const coracao = new THREE.Group()
  for (const lado of [-1, 1]) {
    const lobo = sphere(0.16, '#c94f3d', { roughness: 0.4 })
    lobo.position.set(lado * 0.115, 0.09, 0)
    lobo.scale.z = 0.78
    coracao.add(lobo)
  }
  const ponta = cone(0.23, 0.34, '#c94f3d', { roughness: 0.4 })
  ponta.rotation.z = Math.PI
  ponta.position.y = -0.1
  ponta.scale.z = 0.78
  coracao.add(ponta)
  coracao.rotation.y = 0.3
  coracao.position.set(0.35, 2.3, 0.6)
  root.add(coracao)

  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'plantas', group: 'cenario', object: plantas },
    { name: 'automato', group: 'cenario', object: automato },
    { name: 'balcao', group: 'guiche', object: balcao },
    { name: 'atendente', group: 'guiche', object: atendente },
    { name: 'zeus', group: 'mito', object: zeus },
    { name: 'raio', group: 'mito', object: raio },
    { name: 'zero', group: 'numeros', object: zero },
    { name: 'um', group: 'numeros', object: um },
    { name: 'coracao', group: 'paixao', object: coracao },
  ]

  const build = [
    // --- cenário: a repartição sueca brota do chão
    seq('base-rise', 'base', 0.0, 0.7, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption:
        'Numa repartição sueca — banco, farmácia, Skatteverket — a primeira pergunta é sempre o seu número.',
    }),
    seq('plantas-rise', 'plantas', 0.15, 0.6, [riseFrom(0.16, 1.0)], { ease: 'easeOut' }),
    seq('automato-rise', 'automato', 0.3, 0.6, [riseFrom(0.16, 1.5)], { ease: 'easeOut' }),

    // --- o guichê e a atendente
    seq('balcao-rise', 'balcao', 1.4, 0.8, [riseFrom(0.16, 1.8)], { ease: 'easeOut' }),
    seq('atendente-rise', 'atendente', 1.65, 0.7, [riseFrom(0.16, 1.8)], { ease: 'easeOut' }),

    // --- o MITO chega ao guichê (de frente para a atendente)
    seq('zeus-rise', 'zeus', 3.0, 0.9, [riseFrom(0.16, 1.9)], {
      ease: 'easeOut',
      caption: "Do chão brota ZEUS, o maior MITO da Grécia — MITT, 'meu'…",
    }),
    seq(
      'raio-pop',
      'raio',
      3.9,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…toga, barba e raio: nem um deus passa no guichê sem ditar o número.',
      },
    ),

    // --- os números dourados da paixão
    seq('zero-rise', 'zero', 4.8, 0.8, [riseFrom(0.69, 1.4)], {
      ease: 'easeOut',
      caption: 'Zeus se ajoelha e abraça um 0 e um 1 dourados: os NÚMEROS são sua paiXÃO (pe-XÔN)!',
    }),
    seq('um-rise', 'um', 5.0, 0.8, [riseFrom(0.81, 1.7)], { ease: 'easeOut' }),
    seq('zeus-vira', 'zeus', 5.0, 0.7, [ch('rotation.y', 2.95, 0.85)]),
    seq('zeus-abraca', 'zeus', 5.8, 0.6, [ch('rotation.x', 0, 0.12), ch('scale.y', 1, 0.88)]),
    seq('zero-spin', 'zero', 5.9, 0.7, [ch('rotation.y', 0, Math.PI * 2)]),

    // --- a paixão salta do peito
    seq(
      'coracao-pop',
      'coracao',
      6.8,
      0.6,
      [
        ch('position.x', -0.45, 0.35),
        ch('position.y', 1.05, 1.75),
        ch('position.z', 0.55, 0.6),
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
      ],
      {
        ease: 'easeOut',
        caption: "O coração pula para fora do peito: 'MITO, sua paiXÃO-NÚMERO É…?'",
      },
    ),
    seq('coracao-float', 'coracao', 7.5, 0.8, [ch('position.y', 1.75, 2.3)], {
      caption: "E ele declama: 'Mitt personnummer är… 1-9-0-8-0-1!'",
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.9, 3.0, 4.7], target: [0.1, 1.0, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'mitt-personnummer-ar',
    contexto:
      'Absolutamente tudo: vårdcentral, Skatteverket, banco, farmácia, telefone. Primeira pergunta de qualquer atendimento.',
    fraseFonte: 'Meu número pessoal (personnummer) é ...',
    fraseAlvo: 'Mitt personnummer är ...',
    pronuncia:
      "mit pe-XÔN-nu-mer É ('rs' de 'person' vira 'x' de 'xarope', com ô fechado longo: 'pexôn'; 'är' vira só 'é')",
    ponteSonora:
      "mit pe-XÔN-nu-mer É ~ \"MITO, sua paiXÃO-NÚMERO É...?\" — MIT(o) + peXÔN (quase 'paiXÃO', com ô fechado: o 'rs' sueco vira 'x' de xarope) + NÚMER (número) + É ('är' vira só 'é'). O MITO tem uma PAIXÃO por NÚMEROS.",
    historia:
      'Zeus, o maior MITO da Grécia, chega no guichê sueco e o atendente faz a pergunta de sempre: o número. Zeus se ajoelha, abraça um 0 e um 1 dourados gigantes, o coração pulando para fora do peito, e declama: "Minha paiXÃO-NÚMERO É... 1-9-0-8-0-1!". Na Suécia até os deuses só existem depois de ditar o personnummer — e você recita os dígitos junto com ele.',
  },
  createScene,
}

export default card
