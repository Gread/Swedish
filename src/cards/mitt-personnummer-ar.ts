import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, sphere, torus, seq, ch, riseFrom } from '../rig/helpers'

/**
 * "Mitt personnummer är ..." — Zeus, o maior MITO, declama sua
 * paiXÃO-NÚMERO no guichê sueco, abraçado a um 0 e um 1 dourados.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ---------------------------------------------------------- cenário
  // Chão da repartição sueca (topo em y = 0.08)
  const chao = box(5, 0.08, 3.4, '#cfd6dd')
  chao.position.set(0, 0.04, 0)
  root.add(chao)

  // Balcão de atendimento (topo em y = 1.08)
  const balcao = box(2.4, 1.0, 0.6, '#8a5a33')
  balcao.position.set(0, 0.58, -1.3)
  root.add(balcao)

  // Placa do guichê: bandeirinha sueca sobre o balcão
  const placa = new THREE.Group()
  const placaFundo = box(0.55, 0.38, 0.06, '#005cbf')
  placa.add(placaFundo)
  const faixaH = box(0.55, 0.09, 0.07, '#ffcd00')
  placa.add(faixaH)
  const faixaV = box(0.09, 0.38, 0.07, '#ffcd00')
  faixaV.position.set(-0.08, 0, 0)
  placa.add(faixaV)
  placa.position.set(0.75, 1.28, -1.28)
  root.add(placa)

  // ---------------------------------------------------------- o MITO
  // Toga branca de Zeus
  const toga = cylinder(0.3, 0.45, 1.1, '#f4f1ea')
  toga.position.set(-0.9, 0.6, 0.4)
  root.add(toga)

  // Cabeça (com olhinhos) prestes a declamar
  const cabeca = new THREE.Group()
  const rosto = sphere(0.3, '#f7cfa0')
  cabeca.add(rosto)
  const olhoE = sphere(0.045, '#2b2b2b')
  olhoE.position.set(-0.11, 0.05, 0.26)
  cabeca.add(olhoE)
  const olhoD = sphere(0.045, '#2b2b2b')
  olhoD.position.set(0.11, 0.05, 0.26)
  cabeca.add(olhoD)
  cabeca.position.set(-0.9, 1.42, 0.4)
  root.add(cabeca)

  // Barba branca que prova que ele é O mito
  const barba = sphere(0.17, '#ffffff')
  barba.position.set(-0.9, 1.24, 0.63)
  root.add(barba)

  // Raio de Zeus (zigue-zague amarelo na mão dele)
  const raio = new THREE.Group()
  const raioAlto = box(0.09, 0.55, 0.09, '#ffd21f')
  raioAlto.position.set(0, 0.18, 0)
  raioAlto.rotation.z = 0.35
  raio.add(raioAlto)
  const raioBaixo = box(0.09, 0.5, 0.09, '#ffd21f')
  raioBaixo.position.set(0.12, -0.22, 0)
  raioBaixo.rotation.z = -0.35
  raio.add(raioBaixo)
  raio.position.set(-1.4, 1.05, 0.45)
  raio.rotation.z = 0.4
  root.add(raio)

  // ---------------------------------------------------------- números
  // O dígito 0: torus dourado gigante, em pé
  const zero = torus(0.42, 0.13, '#f5b301')
  zero.position.set(0.1, 0.62, 0.5)
  root.add(zero)

  // O dígito 1: coluna dourada com serifa diagonal
  const um = new THREE.Group()
  const umCorpo = box(0.26, 1.25, 0.26, '#f5b301')
  um.add(umCorpo)
  const umSerifa = box(0.22, 0.1, 0.26, '#f5b301')
  umSerifa.position.set(-0.16, 0.48, 0)
  umSerifa.rotation.z = 0.6
  um.add(umSerifa)
  um.position.set(0.95, 0.675, 0.5)
  root.add(um)

  // ---------------------------------------------------------- paixão
  // Coração vermelho de cartoon flutuando acima dos números
  const coracao = new THREE.Group()
  const lobEsq = sphere(0.17, '#e63946')
  lobEsq.position.set(-0.12, 0.1, 0)
  coracao.add(lobEsq)
  const lobDir = sphere(0.17, '#e63946')
  lobDir.position.set(0.12, 0.1, 0)
  coracao.add(lobDir)
  const ponta = cone(0.24, 0.35, '#e63946')
  ponta.rotation.z = Math.PI
  ponta.position.set(0, -0.12, 0)
  coracao.add(ponta)
  coracao.position.set(0.5, 2.2, 0.5)
  root.add(coracao)

  const parts = [
    { name: 'chao', group: 'cenario', object: chao },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'placa', group: 'cenario', object: placa },
    { name: 'toga', group: 'mito', object: toga },
    { name: 'cabeca', group: 'mito', object: cabeca },
    { name: 'barba', group: 'mito', object: barba },
    { name: 'raio', group: 'mito', object: raio },
    { name: 'zero', group: 'numeros', object: zero },
    { name: 'um', group: 'numeros', object: um },
    { name: 'coracao', group: 'paixao', object: coracao },
  ]

  const build = [
    // --- cenário: a repartição sueca
    seq('chao-rise', 'chao', 0.0, 0.7, [riseFrom(0.04, 0.6)], {
      caption:
        'Numa repartição sueca — banco, farmácia, Skatteverket — a primeira pergunta é sempre o seu número.',
    }),
    seq('balcao-rise', 'balcao', 0.2, 0.7, [riseFrom(0.58, 1.7)]),
    // placa telescopa de dentro do balcão
    seq('placa-rise', 'placa', 1.0, 0.6, [ch('position.y', 0.83, 1.28)]),

    // --- o MITO chega ao guichê
    seq('toga-rise', 'toga', 2.0, 0.8, [riseFrom(0.6, 1.4)], {
      caption: "Do chão brota ZEUS, o maior MITO da Grécia — MITT, 'meu'…",
    }),
    seq('cabeca-rise', 'cabeca', 2.2, 0.7, [riseFrom(1.42, 1.95)]),
    seq('barba-rise', 'barba', 2.4, 0.6, [riseFrom(1.24, 1.55)]),
    seq('raio-rise', 'raio', 2.6, 0.7, [riseFrom(1.05, 1.7)], {
      caption: '…toga, barba e raio: nem um deus passa no guichê sem ditar o número.',
    }),
    seq('raio-tilt', 'raio', 3.35, 0.5, [ch('rotation.z', 0, 0.4)]),

    // --- os números dourados da paixão
    seq('zero-rise', 'zero', 4.6, 0.8, [riseFrom(0.62, 1.35)], {
      caption: 'Zeus se ajoelha e abraça um 0 e um 1 dourados: os NÚMEROS são sua paiXÃO (pe-XÔN)!',
    }),
    seq('um-rise', 'um', 4.8, 0.8, [riseFrom(0.675, 1.45)]),
    seq('zero-spin', 'zero', 5.7, 0.7, [ch('rotation.y', 0, Math.PI * 2)]),

    // --- a paixão salta do peito
    seq(
      'coracao-pop',
      'coracao',
      6.6,
      0.6,
      [
        ch('position.x', -0.9, 0.5),
        ch('position.y', 1.15, 1.6),
        ch('scale.x', 0.05, 1),
        ch('scale.y', 0.05, 1),
        ch('scale.z', 0.05, 1),
      ],
      {
        caption: "O coração pula para fora do peito: 'MITO, sua paiXÃO-NÚMERO É…?'",
      },
    ),
    seq('coracao-float', 'coracao', 7.3, 0.7, [ch('position.y', 1.6, 2.2)], {
      caption: "E ele declama: 'Mitt personnummer är… 1-9-0-8-0-1!'",
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.4, 3.0, 4.8], target: [0, 1.0, -0.1] },
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
