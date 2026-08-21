import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  capsule,
  ch,
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
 * ska-vi-ta-en-fika — "Ska vi ta en fika?"
 * O SKAtista VIu o TÁxi: 'ENtão... FIKA!'
 *
 * Paleta: calçada fria (#9aa2ae / #5b6573) + verde-azulado do skatista
 * (#3f7a63) + madeira quente da fika (#8a5f38). Acento saturado RESERVADO
 * ao TÁxi amarelo (#f0b52e) — o objeto que o skatista VIu.
 */
function createScene(): CardScene {
  const root = new THREE.Group()
  const scatter = rng(23)

  // ================= CALÇADA: base do diorama =================
  const base = new THREE.Group()

  const piso = cylinder(2.7, 2.82, 0.16, '#9aa2ae', { roughness: 0.9 })
  piso.position.y = 0.08
  base.add(piso)

  // juntas de dilatação da calçada
  for (const jx of [-1.3, -0.15]) {
    const junta = rbox(0.03, 0.012, 2.1, 0.005, '#7f8794', { roughness: 0.9 })
    junta.position.set(jx, 0.163, 0.55)
    base.add(junta)
  }

  // faixa de asfalto onde o táxi encosta
  const asfalto = rbox(2.2, 0.06, 1.4, 0.03, '#3d434f', { roughness: 0.95 })
  asfalto.position.set(1.05, 0.165, -0.7)
  base.add(asfalto)
  for (const fx of [0.5, 1.5]) {
    const faixa = rbox(0.32, 0.012, 0.06, 0.005, '#d5d8dd', { roughness: 0.8 })
    faixa.position.set(fx, 0.2, -1.28)
    base.add(faixa)
  }

  // canteiro com arbusto, arbusto solto, pedra e flor (rng fixo)
  const canteiro = rbox(0.34, 0.24, 0.34, 0.05, '#6e6259', { roughness: 0.9 })
  canteiro.position.set(-1.9 + (scatter() - 0.5) * 0.1, 0.28, 0.95)
  base.add(canteiro)
  const arbusto1 = puff(0.19, '#4a7a44', 6, 5, { roughness: 0.88 })
  arbusto1.position.set(canteiro.position.x, 0.52, 0.95)
  base.add(arbusto1)

  const arbusto2 = puff(0.16, '#557f46', 5, 9, { roughness: 0.88 })
  arbusto2.position.set(2.25, 0.3, 0.55 + (scatter() - 0.5) * 0.1)
  base.add(arbusto2)

  const pedra = rock(0.13, '#79818f', 3, { roughness: 0.9 })
  pedra.position.set(-0.4, 0.22, 1.55)
  pedra.rotation.y = scatter() * Math.PI
  base.add(pedra)

  const florCaule = cylinder(0.013, 0.013, 0.17, '#3f6d3a', { roughness: 0.85 })
  florCaule.position.set(-1.45, 0.24, 1.35)
  const florCorola = sphere(0.05, '#c06a94', { roughness: 0.6 })
  florCorola.position.set(-1.45, 0.34, 1.35)
  const florMiolo = sphere(0.022, '#e8d26a', { roughness: 0.5 })
  florMiolo.position.set(-1.45, 0.375, 1.35 + 0.02 * scatter())
  base.add(florCaule, florCorola, florMiolo)
  root.add(base)

  // ================= RAMPA de skate =================
  const rampa = new THREE.Group()
  const plataforma = rbox(0.75, 0.12, 1.0, 0.04, '#5b6573', { roughness: 0.7 })
  plataforma.position.set(-2.2, 1.0, -0.55)
  rampa.add(plataforma)
  const mureta = rbox(0.09, 0.45, 1.0, 0.03, '#49515e', { roughness: 0.75 })
  mureta.position.set(-2.52, 1.28, -0.55)
  rampa.add(mureta)
  for (const lx of [-2.42, -1.98]) {
    for (const lz of [-0.88, -0.22]) {
      const perna = rbox(0.13, 0.86, 0.13, 0.03, '#49515e', { roughness: 0.75 })
      perna.position.set(lx, 0.59, lz)
      rampa.add(perna)
    }
  }
  const descida = rbox(1.5, 0.1, 1.0, 0.04, '#5b6573', { roughness: 0.7 })
  descida.position.set(-1.24, 0.6, -0.55)
  descida.rotation.z = -0.62
  rampa.add(descida)
  const coping = cylinder(0.03, 0.03, 1.02, '#c3c8d0', { metalness: 0.7, roughness: 0.3 })
  coping.rotation.x = Math.PI / 2
  coping.position.set(-1.86, 1.07, -0.55)
  rampa.add(coping)
  root.add(rampa)

  // ================= SKAtista sobre o skate =================
  const skatista = new THREE.Group()

  // skate: rodas brancas, trucks de metal, shape roxo
  for (const wz of [-0.27, 0.27]) {
    for (const wx of [-0.09, 0.09]) {
      const roda = cylinder(0.05, 0.05, 0.05, '#e8e2d6', { roughness: 0.4 })
      roda.rotation.z = Math.PI / 2
      roda.position.set(wx, 0.05, wz)
      skatista.add(roda)
    }
    const truck = rbox(0.18, 0.035, 0.06, 0.012, '#9aa0aa', { metalness: 0.6, roughness: 0.35 })
    truck.position.set(0, 0.083, wz)
    skatista.add(truck)
  }
  const shape = rbox(0.28, 0.055, 0.85, 0.028, '#6d4fa1', { roughness: 0.5 })
  shape.position.set(0, 0.128, 0)
  skatista.add(shape)

  // o SKAtista em pessoa, braços abertos de equilibrista
  const surfista = person({ body: '#3f7a63', skin: '#e8c39e', height: 1.4, armAngle: 1.05 })
  surfista.position.y = 0.155
  const gola = torus(0.12, 0.035, '#2e5c4a', { roughness: 0.9 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = 0.71
  surfista.add(gola)
  const cabecaSkatista = surfista.getObjectByName('head')!
  const capacete = sphere(0.29, '#4c5566', { roughness: 0.45 })
  capacete.scale.y = 0.6
  capacete.position.y = 0.13
  const abaCapacete = rbox(0.22, 0.035, 0.13, 0.015, '#3e4756', { roughness: 0.45 })
  abaCapacete.position.set(0, 0.14, 0.25)
  abaCapacete.rotation.x = 0.3
  const botaoCapacete = sphere(0.045, '#3e4756', { roughness: 0.45 })
  botaoCapacete.position.y = 0.3
  cabecaSkatista.add(capacete, abaCapacete, botaoCapacete)
  skatista.add(surfista)

  // pose FINAL: freado na calçada, meio virado para o táxi
  skatista.position.set(-0.5, 0.16, 0.05)
  skatista.rotation.y = 1.75
  root.add(skatista)

  // ================= TÁxi amarelo (o acento da cena) =================
  const taxi = new THREE.Group()
  for (const wx of [-0.58, 0.58]) {
    for (const wz of [-0.4, 0.4]) {
      const pneu = cylinder(0.17, 0.17, 0.13, '#2b2b31', { roughness: 0.85 })
      pneu.rotation.x = Math.PI / 2
      pneu.position.set(wx, 0.17, wz)
      const calota = cylinder(0.07, 0.07, 0.145, '#c3c8d0', { metalness: 0.7, roughness: 0.3 })
      calota.rotation.x = Math.PI / 2
      calota.position.set(wx, 0.17, wz)
      taxi.add(pneu, calota)
    }
  }
  const carroceria = rbox(1.9, 0.5, 0.98, 0.09, '#f0b52e', { roughness: 0.4 })
  carroceria.position.y = 0.48
  taxi.add(carroceria)
  // xadrez de táxi nas laterais
  for (const sz of [-1, 1]) {
    for (let i = 0; i < 8; i++) {
      const quadro = rbox(0.1, 0.1, 0.03, 0.012, '#2e3138', { roughness: 0.5 })
      quadro.position.set(-0.66 + i * 0.19, i % 2 === 0 ? 0.44 : 0.55, sz * 0.492)
      taxi.add(quadro)
    }
  }
  const vidros = rbox(0.95, 0.34, 0.88, 0.08, '#a9cfe2', { roughness: 0.22 })
  vidros.position.set(-0.08, 0.9, 0)
  taxi.add(vidros)
  const teto = rbox(1.05, 0.1, 0.94, 0.04, '#f0b52e', { roughness: 0.4 })
  teto.position.set(-0.08, 1.1, 0)
  taxi.add(teto)
  for (const sz of [-1, 1]) {
    const farol = sphere(0.055, '#fff2c9', { emissive: '#ffedb0', emissiveIntensity: 1.1, roughness: 0.3 })
    farol.position.set(-0.94, 0.5, sz * 0.3)
    farol.scale.x = 0.6
    const lanterna = sphere(0.045, '#b8443a', { emissive: '#8f2a22', emissiveIntensity: 0.8, roughness: 0.4 })
    lanterna.position.set(0.94, 0.5, sz * 0.3)
    lanterna.scale.x = 0.6
    taxi.add(farol, lanterna)
  }
  for (const bx of [-0.95, 0.95]) {
    const parachoque = rbox(0.12, 0.12, 0.9, 0.05, '#cfd3da', { metalness: 0.65, roughness: 0.3 })
    parachoque.position.set(bx, 0.3, 0)
    taxi.add(parachoque)
  }
  taxi.position.set(1.35, 0.195, -0.75)
  taxi.rotation.y = 0.28 // frente (faróis) apontada para o skatista
  root.add(taxi)

  // luminoso TAXI: telescopa do teto (peça-mãe)
  const luminoso = new THREE.Group()
  const placa = rbox(0.4, 0.15, 0.17, 0.04, '#f6f3ea', {
    emissive: '#fff3cf',
    emissiveIntensity: 0.9,
    roughness: 0.35,
  })
  luminoso.add(placa)
  for (const cx of [-0.19, 0.19]) {
    const tampa = rbox(0.05, 0.11, 0.13, 0.02, '#2e3138', { roughness: 0.5 })
    tampa.position.x = cx
    luminoso.add(tampa)
  }
  luminoso.position.set(1.273, 1.42, -0.728)
  luminoso.rotation.y = 0.28
  root.add(luminoso)

  // ================= Mesinha sagrada da fika =================
  const mesa = new THREE.Group()
  const pedestal = lathe(
    [[0, 0], [0.18, 0], [0.18, 0.03], [0.06, 0.07], [0.035, 0.5], [0.055, 0.55], [0, 0.55]],
    '#4a4f58',
    { metalness: 0.55, roughness: 0.35 },
  )
  mesa.add(pedestal)
  const tampo = cylinder(0.42, 0.42, 0.05, '#8a5f38', { roughness: 0.6 })
  tampo.position.y = 0.575
  mesa.add(tampo)
  const bordaTampo = torus(0.42, 0.018, '#6f4a2a', { roughness: 0.6 })
  bordaTampo.rotation.x = Math.PI / 2
  bordaTampo.position.y = 0.59
  mesa.add(bordaTampo)
  const toalha = rbox(0.5, 0.015, 0.32, 0.008, '#e3dccb', { roughness: 0.92 })
  toalha.position.y = 0.608
  mesa.add(toalha)
  const termo = lathe(
    [
      [0, 0], [0.052, 0], [0.06, 0.02], [0.052, 0.14], [0.06, 0.17],
      [0.03, 0.19], [0.036, 0.235], [0.026, 0.245], [0, 0.245],
    ],
    '#41708c',
    { roughness: 0.3, metalness: 0.4 },
  )
  termo.position.set(-0.08, 0.6, -0.12)
  mesa.add(termo)
  mesa.position.set(0.65, 0.16, 0.8)
  root.add(mesa)

  // ================= O taxista =================
  const taxista = person({ body: '#3a4254', skin: '#e8c39e', height: 1.45, armAngle: 0.5 })
  const cinto = torus(0.255, 0.028, '#2a2e38', { roughness: 0.85 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.4
  taxista.add(cinto)
  const fivela = rbox(0.07, 0.05, 0.02, 0.008, '#d9a441', { metalness: 0.75, roughness: 0.3 })
  fivela.position.set(0, 0.4, 0.255)
  taxista.add(fivela)
  for (const [by, bz] of [[0.5, 0.247], [0.58, 0.235]] as const) {
    const botao = sphere(0.02, '#cfd3da', { metalness: 0.5, roughness: 0.35 })
    botao.position.set(0, by, bz)
    taxista.add(botao)
  }
  const cabecaTaxista = taxista.getObjectByName('head')!
  const quepeCopa = cylinder(0.3, 0.3, 0.12, '#2a2e38', { roughness: 0.5 })
  quepeCopa.position.y = 0.16
  const quepeTopo = cylinder(0.315, 0.315, 0.035, '#2a2e38', { roughness: 0.5 })
  quepeTopo.position.y = 0.225
  const quepeAba = rbox(0.26, 0.03, 0.15, 0.012, '#1c2027', { roughness: 0.45 })
  quepeAba.position.set(0, 0.115, 0.27)
  quepeAba.rotation.x = 0.22
  const quepeBrasao = cylinder(0.03, 0.03, 0.02, '#d9a441', { metalness: 0.75, roughness: 0.3 })
  quepeBrasao.rotation.x = Math.PI / 2
  quepeBrasao.position.set(0, 0.16, 0.3)
  const bigode = capsule(0.022, 0.06, '#5c4630', { roughness: 0.9 })
  bigode.rotation.z = Math.PI / 2
  bigode.position.set(0, -0.05, 0.26)
  cabecaTaxista.add(quepeCopa, quepeTopo, quepeAba, quepeBrasao, bigode)

  taxista.position.set(1.3, 0.16, 0.45)
  taxista.rotation.y = -1.5 // olha para o skatista
  root.add(taxista)

  // braço direito = dobradiça do brinde (pose final: erguido)
  const braco = taxista.getObjectByName('armR')!
  braco.rotation.z = 2.4

  // ================= O convite: xícara + kanelbulle =================
  const xicara = new THREE.Group()
  const pires = cylinder(0.115, 0.09, 0.02, '#f2eee6', { roughness: 0.3 })
  pires.position.y = 0.01
  xicara.add(pires)
  const copo = lathe(
    [[0, 0.02], [0.062, 0.02], [0.08, 0.045], [0.086, 0.1], [0.094, 0.155]],
    '#f2eee6',
    { roughness: 0.3 },
  )
  xicara.add(copo)
  const bordaCopo = torus(0.09, 0.008, '#f2eee6', { roughness: 0.3 })
  bordaCopo.rotation.x = Math.PI / 2
  bordaCopo.position.y = 0.155
  xicara.add(bordaCopo)
  const cafe = cylinder(0.082, 0.082, 0.012, '#4a2c17', { roughness: 0.35 })
  cafe.position.y = 0.148
  xicara.add(cafe)
  const asa = torus(0.05, 0.015, '#f2eee6', { roughness: 0.3 })
  asa.position.set(0.105, 0.09, 0)
  xicara.add(asa)
  const vapor1 = puff(0.035, '#ece7de', 4, 31, { roughness: 0.95 })
  vapor1.position.set(0.005, 0.23, 0)
  const vapor2 = puff(0.027, '#ece7de', 4, 32, { roughness: 0.95 })
  vapor2.position.set(-0.02, 0.31, 0.01)
  xicara.add(vapor1, vapor2)
  // pose FINAL: erguida na mão do taxista (nasce na mesa e sobe até lá)
  xicara.position.set(1.33, 0.9, 0.89)
  root.add(xicara)

  const kanelbulle = new THREE.Group()
  const prato = cylinder(0.15, 0.12, 0.02, '#f2eee6', { roughness: 0.3 })
  prato.position.y = 0.01
  kanelbulle.add(prato)
  const massa = cylinder(0.105, 0.115, 0.055, '#b06f2e', { roughness: 0.75 })
  massa.position.y = 0.048
  kanelbulle.add(massa)
  const espiral = torus(0.062, 0.024, '#8f5a24', { roughness: 0.75 })
  espiral.rotation.x = Math.PI / 2
  espiral.position.y = 0.083
  const miolo = torus(0.022, 0.016, '#8f5a24', { roughness: 0.75 })
  miolo.rotation.x = Math.PI / 2
  miolo.position.y = 0.09
  kanelbulle.add(espiral, miolo)
  const acucar = rng(17)
  for (let i = 0; i < 6; i++) {
    const cristal = sphere(0.009, '#f5f2ea', { roughness: 0.5 })
    const a = acucar() * Math.PI * 2
    const r = 0.03 + acucar() * 0.06
    cristal.position.set(Math.cos(a) * r, 0.1, Math.sin(a) * r)
    kanelbulle.add(cristal)
  }
  kanelbulle.position.set(0.82, 0.76, 0.62) // servido sobre a mesa
  root.add(kanelbulle)

  const parts = [
    { name: 'base', group: 'cenario', object: base as THREE.Object3D },
    { name: 'rampa', group: 'cenario', object: rampa as THREE.Object3D },
    { name: 'skatista', group: 'skatista', object: skatista as THREE.Object3D },
    { name: 'taxi', group: 'taxi', object: taxi as THREE.Object3D },
    { name: 'luminoso', group: 'taxi', object: luminoso as THREE.Object3D },
    { name: 'mesa', group: 'fika', object: mesa as THREE.Object3D },
    { name: 'taxista', group: 'fika', object: taxista as THREE.Object3D },
    { name: 'braco', group: 'fika', object: braco as THREE.Object3D },
    { name: 'xicara', group: 'convite', object: xicara as THREE.Object3D },
    { name: 'kanelbulle', group: 'convite', object: kanelbulle as THREE.Object3D },
  ]

  const build = [
    // 1) A calçada e a rampa brotam do subsolo
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.05)], {
      ease: 'easeOut',
      caption: 'Numa calçada da Suécia, uma rampa de skate se ergue…',
    }),
    seq('rampa-rise', 'rampa', 0.2, 0.85, [riseFrom(0, 1.7)], { ease: 'easeOut' }),

    // 2) O SKAtista brota no topo da rampa e despenca
    seq('skatista-rise', 'skatista', 1.8, 0.7, [riseFrom(1.06, 2.9)], {
      ease: 'easeOut',
      caption: '…e o SKAtista despenca lá de cima a mil por hora!',
    }),
    seq('skatista-rola', 'skatista', 2.7, 0.35, [ch('position.x', -2.1, -1.8)], { ease: 'linear' }),
    seq(
      'skatista-despenca',
      'skatista',
      3.05,
      0.7,
      [ch('position.x', -1.8, -0.5), ch('position.y', 1.06, 0.16), ch('position.z', -0.55, 0.05)],
      { ease: 'easeIn' },
    ),
    seq('skatista-aterrissa', 'skatista', 3.75, 0.25, [ch('scale.y', 1, 0.9)], { ease: 'easeOut' }),
    seq('skatista-firma', 'skatista', 4.0, 0.35, [
      ch('scale.y', 0.9, 1),
      ch('rotation.y', Math.PI / 2, 1.75),
    ]),

    // 3) O TÁxi amarelo brota do asfalto, faróis para o skatista
    seq('taxi-rise', 'taxi', 4.5, 0.85, [riseFrom(0.195, 1.6)], {
      ease: 'easeOut',
      caption: 'De repente ele VIu: um TÁxi amarelo parado no meio da corrida!',
    }),
    seq('luminoso-telescopa', 'luminoso', 5.45, 0.5, [ch('position.y', 1.24, 1.42)], {
      ease: 'easeOut',
    }),

    // 4) A mesinha da fika e o taxista
    seq('mesa-rise', 'mesa', 6.5, 0.75, [riseFrom(0.16, 1.15)], {
      ease: 'easeOut',
      caption: 'Ao lado do TÁxi, o taxista montou a mesinha sagrada da fika.',
    }),
    seq('taxista-rise', 'taxista', 6.7, 0.75, [riseFrom(0.16, 1.75)], { ease: 'easeOut' }),
    seq('braco-pronto', 'braco', 6.7, 0.75, [ch('rotation.z', -0.5, -0.5)]),

    // 5) O convite nasce na mesa
    seq(
      'xicara-pop',
      'xicara',
      8.1,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: 'Ele serve o café fumegante e o kanelbulle…' },
    ),
    seq(
      'kanelbulle-pop',
      'kanelbulle',
      8.3,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    // 6) O brinde: braço-dobradiça sobe e a xícara vai da mesa à mão
    seq('braco-ergue', 'braco', 9.5, 0.7, [ch('rotation.z', -0.5, 2.4)], { ease: 'easeOut' }),
    seq(
      'xicara-ergue',
      'xicara',
      9.55,
      0.8,
      [ch('position.x', 0.5, 1.33), ch('position.y', 0.76, 0.9), ch('position.z', 0.95, 0.89)],
      {
        ease: 'easeInOut',
        caption: "…ergue a xícara e grita: 'ENtão… FIKA!' — Ska vi ta en fika?",
      },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.9, 3.0, 6.2], target: [0, 0.9, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ska-vi-ta-en-fika',
    contexto:
      'Trabalho e vida social: convidar colega para a pausa do café, marcar encontro casual com conhecido.',
    fraseFonte: 'Vamos tomar um café (fazer uma fika)?',
    fraseAlvo: 'Ska vi ta en fika?',
    pronuncia:
      "ska vi ta en FÍ-ka? (pronúncia praticamente transparente para brasileiro — só caprichar no 'í' longo)",
    ponteSonora:
      "ska vi ta en FÍ-ka ~ \"SKAtista VIu o TÁxi: 'ENtão... FIKA!'\" — leia só as sílabas fortes: SKA-VI-TÁ-EN-FI-KA. E 'fika' é literalmente o convite 'FIKA!': quem ouve, fica para o café.",
    historia:
      "O SKAtista desce a rampa a mil e VÊ um TÁxi amarelo parado no meio da corrida, com uma mesinha de fika montada ao lado. O taxista ergue a xícara fumegante e grita: 'ENtão... FIKA!'. Na Suécia até o táxi para tudo pra fika — e recusar um 'ska vi ta en fika?' é crime social.",
  },
  createScene,
}

export default card
