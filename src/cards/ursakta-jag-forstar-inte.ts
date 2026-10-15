import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  capsule,
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
 * ursäkta-jag-förstår-inte — "Desculpa, eu não entendo."
 * Diorama: saguão de guichê com tapete de fila e pilastras de corda.
 * O turista pisa no pé do THOR, se vira e estende um cheque de desculpas
 * ("ÜÜÜ... CHEQUE-ta!"). Thor dispara pela boca um FEIXE dourado de runas
 * que atravessa a cabeça oca do turista e sai ÍNTEgro do outro lado.
 *
 * Paleta: azul-ardósia (piso/Thor/metal), verde dessaturado (turista/
 * plantas), madeira/terracota quente (cabo, vasos, tapete). Acento ouro
 * (#f2a93b) reservado ao feixe de runas — a ponte sonora FEIXE-THOR.
 */
const PELE = '#e8c39e'
const OURO = '#f2a93b'

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(1907)

  // ─── base do diorama: piso de terminal + tapete da fila ────────────────
  const base = new THREE.Group()
  const piso = cylinder(2.6, 2.6, 0.16, '#858d9b', { roughness: 0.4 })
  piso.position.y = 0.08
  base.add(piso)
  const tapete = rbox(3.3, 0.045, 1.15, 0.02, '#7a4038', { roughness: 0.92 })
  tapete.position.set(0, 0.18, 0)
  base.add(tapete)
  root.add(base)

  // ─── adereços de ambientação: vasos de planta + mala de rodinhas ───────
  const aderecos = new THREE.Group()
  const vaso = (x: number, z: number, escala: number, semente: number) => {
    const g = new THREE.Group()
    const pote = lathe(
      [
        [0.1, 0],
        [0.125, 0.04],
        [0.105, 0.18],
        [0.14, 0.22],
        [0.135, 0.25],
      ],
      '#a86b4c',
      { roughness: 0.85 },
    )
    g.add(pote)
    const folhas = puff(0.16, '#4a8f3c', 6, semente, { roughness: 0.8 })
    folhas.position.y = 0.36
    g.add(folhas)
    g.position.set(x, 0.16, z)
    g.scale.setScalar(escala)
    g.rotation.y = rand() * Math.PI * 2
    return g
  }
  aderecos.add(vaso(-2.05, -0.45, 1.0, 21))
  aderecos.add(vaso(2.02, 0.85, 0.85, 22))

  const mala = new THREE.Group()
  const casco = rbox(0.4, 0.56, 0.2, 0.05, '#4e6e8e', { roughness: 0.65 })
  casco.position.y = 0.34
  mala.add(casco)
  const faixaMala = rbox(0.41, 0.08, 0.21, 0.02, '#3f5a75', { roughness: 0.65 })
  faixaMala.position.y = 0.42
  mala.add(faixaMala)
  const alca = rbox(0.18, 0.1, 0.045, 0.02, '#3a4150', { roughness: 0.5 })
  alca.position.y = 0.66
  mala.add(alca)
  for (const lado of [-1, 1]) {
    const roda = sphere(0.038, '#2a2f3a', { roughness: 0.35 })
    roda.position.set(lado * 0.13, 0.04, -0.06)
    mala.add(roda)
  }
  mala.position.set(1.85, 0.16, -0.62)
  mala.rotation.y = -0.5 + (rand() - 0.5) * 0.4
  aderecos.add(mala)
  root.add(aderecos)

  // ─── fila: pilastras de metal + corda de veludo ────────────────────────
  const fila = new THREE.Group()
  for (const x of [-1.3, 1.3]) {
    const pilastra = new THREE.Group()
    const pe = cylinder(0.12, 0.15, 0.05, '#4a5262', { roughness: 0.3, metalness: 0.7 })
    pe.position.y = 0.025
    pilastra.add(pe)
    const haste = cylinder(0.032, 0.032, 0.62, '#4a5262', { roughness: 0.3, metalness: 0.7 })
    haste.position.y = 0.36
    pilastra.add(haste)
    const topo = sphere(0.052, '#5d6673', { roughness: 0.25, metalness: 0.75 })
    topo.position.y = 0.69
    pilastra.add(topo)
    pilastra.position.set(x, 0.16, -0.62)
    fila.add(pilastra)
  }
  const corda = capsule(0.03, 2.55, '#8f4340', { roughness: 0.92 })
  corda.rotation.z = Math.PI / 2
  corda.position.set(0, 0.82, -0.62)
  fila.add(corda)
  root.add(fila)

  // ─── Thor: túnica azul, elmo alado, barba ruiva, boca aberta ───────────
  const thor = person({ body: '#3b5a8f', skin: PELE, height: 1.6, armAngle: 0.7 })
  const cabecaThor = thor.getObjectByName('head')!
  const elmo = lathe(
    [
      [0.32, 0],
      [0.315, 0.06],
      [0.27, 0.16],
      [0.16, 0.24],
      [0.001, 0.28],
    ],
    '#aeb8c4',
    { roughness: 0.55, metalness: 0.45 },
  )
  elmo.position.y = 0.02
  cabecaThor.add(elmo)
  for (const lado of [-1, 1]) {
    // asa de três penas em leque, presa na lateral do elmo
    const asa = new THREE.Group()
    asa.position.set(lado * 0.29, 0.14, -0.02)
    for (let i = 0; i < 3; i++) {
      const pena = capsule(0.05, 0.3 - i * 0.07, i === 0 ? '#f2eee6' : '#ddd8cc', { roughness: 0.5 })
      pena.scale.z = 0.32
      pena.rotation.z = -lado * (0.35 + i * 0.32)
      pena.position.set(lado * (0.1 + i * 0.03), 0.12 - i * 0.05, -0.03 * i)
      asa.add(pena)
    }
    cabecaThor.add(asa)
    const sobrancelha = rbox(0.13, 0.035, 0.03, 0.012, '#7a4a26', { roughness: 0.85 })
    sobrancelha.position.set(lado * 0.115, 0.11, 0.268)
    sobrancelha.rotation.z = lado * 0.42
    cabecaThor.add(sobrancelha)
  }
  const bocaThor = sphere(0.075, '#4a2317', { roughness: 0.6 })
  bocaThor.scale.set(1, 0.8, 0.5)
  bocaThor.position.set(0, -0.085, 0.267)
  cabecaThor.add(bocaThor)
  const barba = puff(0.09, '#a85a32', 6, 11, { roughness: 0.9 })
  barba.position.set(0, -0.22, 0.16)
  barba.scale.set(1.3, 0.8, 0.8)
  cabecaThor.add(barba)
  const cinto = torus(0.29, 0.045, '#8b5a2b', { roughness: 0.8 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.36
  thor.add(cinto)
  const capa = rbox(0.62, 0.78, 0.05, 0.025, '#7c352e', { roughness: 0.92 })
  capa.position.set(0, 0.52, -0.28)
  capa.rotation.x = 0.1
  thor.add(capa)
  thor.position.set(-0.8, 0.16, 0)
  thor.rotation.y = 1.15 // encara o turista, abrindo o rosto para a câmera
  root.add(thor)

  // ─── Mjölnir: fincado de pé ao lado do Thor ────────────────────────────
  // cabeçote no chão, cabo para cima — como o Mjölnir que ninguém levanta
  const martelo = new THREE.Group()
  const cabecote = rbox(0.5, 0.3, 0.3, 0.06, '#87909f', { roughness: 0.4, metalness: 0.65 })
  cabecote.position.y = 0.15
  martelo.add(cabecote)
  for (const lado of [-1, 1]) {
    const cinta = rbox(0.06, 0.32, 0.32, 0.02, '#5d6673', { roughness: 0.4, metalness: 0.6 })
    cinta.position.set(lado * 0.17, 0.15, 0)
    martelo.add(cinta)
  }
  const cabo = cylinder(0.045, 0.05, 0.62, '#8b5a2b', { roughness: 0.8 })
  cabo.position.y = 0.6
  martelo.add(cabo)
  for (let i = 0; i < 3; i++) {
    const tira = torus(0.05, 0.012, '#5a3a1d', { roughness: 0.85 })
    tira.rotation.x = Math.PI / 2
    tira.position.y = 0.72 + i * 0.06
    martelo.add(tira)
  }
  const pomo = sphere(0.06, '#6e4522', { roughness: 0.75 })
  pomo.position.y = 0.93
  martelo.add(pomo)
  martelo.position.set(-1.45, 0.16, 0.5)
  martelo.rotation.y = 0.4
  root.add(martelo)

  // ─── turista: jaqueta verde, cabelo, câmera no peito, boca aflita ──────
  const turista = person({ body: '#55795b', skin: PELE, height: 1.45, armAngle: 0.45 })
  const cabecaTurista = turista.getObjectByName('head')!
  const cabelo = puff(0.14, '#5b3a29', 6, 31, { roughness: 0.9 })
  cabelo.position.set(0, 0.15, -0.04)
  cabelo.scale.set(1.1, 0.75, 1.05)
  cabecaTurista.add(cabelo)
  const bocaTurista = sphere(0.05, '#6b3b2a', { roughness: 0.6 })
  bocaTurista.scale.set(1, 1.2, 0.5)
  bocaTurista.position.set(0, -0.096, 0.245)
  cabecaTurista.add(bocaTurista)
  for (const lado of [-1, 1]) {
    const sobrancelha = rbox(0.1, 0.028, 0.026, 0.01, '#5b3a29', { roughness: 0.85 })
    sobrancelha.position.set(lado * 0.105, 0.115, 0.24)
    sobrancelha.rotation.z = -lado * 0.28 // arqueadas de aflição
    cabecaTurista.add(sobrancelha)
  }
  const camera = new THREE.Group()
  const corpoCam = rbox(0.16, 0.1, 0.06, 0.02, '#3a4150', { roughness: 0.4 })
  camera.add(corpoCam)
  const lente = cylinder(0.034, 0.034, 0.05, '#2a2f3a', { roughness: 0.25 })
  lente.rotation.x = Math.PI / 2
  lente.position.z = 0.05
  camera.add(lente)
  camera.position.set(0, 0.6, 0.24)
  turista.add(camera)
  turista.position.set(0.8, 0.16, 0)
  turista.rotation.y = -1.15 // virado para o Thor, rosto aberto para a câmera
  root.add(turista)

  // braço que estende o cheque — dobradiça no próprio ombro do turista
  const bracoCheque = turista.getObjectByName('armR')!
  bracoCheque.rotation.x = -1.4

  // ─── cheque de desculpas: papel com linhas, assinatura e carimbo ───────
  const cheque = new THREE.Group()
  const papel = rbox(0.6, 0.4, 0.035, 0.012, '#f6f1e4', { roughness: 0.8 })
  cheque.add(papel)
  for (const [y, w] of [
    [0.07, 0.42],
    [-0.02, 0.42],
  ] as const) {
    const linha = rbox(w, 0.03, 0.014, 0.006, '#4a5262', { roughness: 0.7 })
    linha.position.set(0.02, y, 0.016)
    cheque.add(linha)
  }
  const assinatura = rbox(0.2, 0.045, 0.014, 0.006, '#22406e', { roughness: 0.7 })
  assinatura.position.set(0.13, -0.13, 0.016)
  cheque.add(assinatura)
  const carimbo = cylinder(0.045, 0.045, 0.014, '#7a4038', { roughness: 0.7 })
  carimbo.rotation.x = Math.PI / 2
  carimbo.position.set(-0.18, -0.11, 0.016)
  cheque.add(carimbo)
  cheque.position.set(0.6, 0.85, 0.42)
  cheque.rotation.y = -0.95 // papel de frente para o Thor e para a câmera
  cheque.rotation.z = 0.26
  root.add(cheque)

  // ─── feixe de runas: telescopa da boca do Thor (acento ouro) ───────────
  const feixe = new THREE.Group()
  const anel = torus(0.17, 0.028, '#f7c948', { emissive: '#ffb703', emissiveIntensity: 1.0 })
  anel.rotation.y = Math.PI / 2
  anel.position.x = 0.06
  feixe.add(anel)
  const jato = cylinder(0.105, 0.105, 2.1, OURO, {
    roughness: 0.3,
    emissive: '#ff9e00',
    emissiveIntensity: 1.1,
  })
  jato.rotation.z = -Math.PI / 2
  jato.position.x = 1.05
  feixe.add(jato)
  const ponta = cone(0.2, 0.36, '#f7c948', { emissive: '#ffb703', emissiveIntensity: 1.3 })
  ponta.rotation.z = -Math.PI / 2
  ponta.position.x = 2.22
  feixe.add(ponta)
  for (const x of [0.42, 0.95, 1.85]) {
    const runa = rbox(0.15, 0.15, 0.15, 0.035, '#d97b29', {
      emissive: '#b45309',
      emissiveIntensity: 0.9,
    })
    runa.rotation.x = Math.PI / 4
    runa.rotation.z = (rand() - 0.5) * 0.6
    runa.position.x = x
    feixe.add(runa)
  }
  feixe.position.set(-0.56, 1.165, 0.11) // boca do Thor
  feixe.rotation.y = 0.08 // mira no centro da cabeça do turista
  root.add(feixe)

  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'aderecos', group: 'cenario', object: aderecos },
    { name: 'fila', group: 'cenario', object: fila },
    { name: 'thor', group: 'thor', object: thor },
    { name: 'martelo', group: 'thor', object: martelo },
    { name: 'turista', group: 'turista', object: turista },
    { name: 'braco', group: 'turista', object: bracoCheque },
    { name: 'cheque', group: 'cheque', object: cheque },
    { name: 'feixe', group: 'feixe', object: feixe },
  ]

  const build = [
    // cenário
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      caption: 'Na FILA do guichê, você dá um passo para trás… e pisa no pé de alguém enorme.',
    }),
    seq('aderecos-sobem', 'aderecos', 0.2, 0.7, [riseFrom(0, 1.1)]),
    seq('fila-sobe', 'fila', 0.4, 0.7, [riseFrom(0, 1.2)]),

    // Thor
    seq('thor-sobe', 'thor', 2.0, 0.85, [riseFrom(0.16, 2.0)], {
      caption: 'É o THOR — martelo em punho, um deus nórdico que só fala sueco.',
    }),
    seq('martelo-sobe', 'martelo', 2.2, 0.8, [riseFrom(0.16, 1.4)]),
    seq('thor-vira', 'thor', 2.9, 0.55, [ch('rotation.y', 0, 1.15)]),

    // turista
    seq('turista-sobe', 'turista', 3.9, 0.8, [riseFrom(0.16, 1.9)], {
      caption: 'Você, o turista arrependido, se vira para pedir desculpas…',
    }),
    seq('braco-prepara', 'braco', 3.9, 0.8, [ch('rotation.x', 0, 0)]),
    seq('turista-vira', 'turista', 4.65, 0.6, [ch('rotation.y', 0, -1.15)]),

    // cheque
    seq('braco-estende', 'braco', 5.6, 0.6, [ch('rotation.x', 0, -1.4)]),
    seq('cheque-sobe', 'cheque', 5.75, 0.6, [riseFrom(0.85, 1.3)], {
      caption: "…geme ÜÜÜ… e estende um cheque: 'CHEQUE-ta!' — ÜÜ-shék-ta: ursäkta!",
    }),
    seq('cheque-inclina', 'cheque', 6.3, 0.5, [ch('rotation.z', 0, 0.26)]),

    // feixe
    seq('feixe-dispara', 'feixe', 7.6, 0.7, [ch('scale.x', 0.02, 1)], {
      ease: 'easeOut',
      caption:
        'Thor responde disparando pela boca um FEIXE dourado de runas: FEIXE-THÔR — fö-SHTÔR: förstår!',
    }),
    seq('thor-recua', 'thor', 7.6, 0.35, [ch('rotation.z', 0, 0.09)]),
    seq('thor-volta', 'thor', 7.95, 0.35, [ch('rotation.z', 0.09, 0)]),

    // reação: o feixe atravessa e sai íntegro
    seq('turista-treme-1', 'turista', 9.0, 0.4, [ch('rotation.z', 0, 0.15)], {
      caption:
        "O feixe atravessa a cabeça oca e sai ÍNTEgro — nada ficou dentro! 'IÁ… FEIXE-THÔR… ÍN-te!' — Ursäkta, jag förstår inte.",
    }),
    seq('turista-treme-2', 'turista', 9.4, 0.4, [ch('rotation.z', 0.15, 0)]),
    seq('cheque-balanca-1', 'cheque', 9.7, 0.4, [ch('rotation.z', 0.26, 0.42)]),
    seq('cheque-balanca-2', 'cheque', 10.1, 0.4, [ch('rotation.z', 0.42, 0.26)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 1.95, 4.4], target: [0.1, 0.8, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'ursakta-jag-forstar-inte',
    contexto: 'Quando o atendente dispara uma explicação e você se perde — presencial ou por telefone.',
    fraseFonte: 'Desculpa, eu não entendo.',
    fraseAlvo: 'Ursäkta, jag förstår inte.',
    pronuncia:
      "ÜÜ-shék-ta, iá fö-SHTÔR ÍN-te (força no ÜÜ longo de lábios em bico; o 'rs' de 'ursäkta' e de 'förstår' vira um 'ch'/'x': 'üüchékta', 'föchtôr'; o å de 'står' é Ô fechado)",
    ponteSonora:
      "ÜÜ-shék-ta, iá fö-SHTÔR ÍN-te ~ \"ÜÜÜ... CHEQUE-ta! ... IÁ... FEIXE-THÔR... ÍN-te!\" — o ÜÜÜ é o gemido envergonhado, LONGO, lábios em bico e língua pra frente, e leva a força; CHEQUE-ta numa palavra só, CHÉK-ta, sem o 'i' de 'chéki' e com o -ta fraquinho; 'FEIXE-THÔR' emendado sai 'fei-sh-TÔR' ≈ 'fö-SHTÔR', com o chiado certo do 'rs' e o Ô fechado; o feixe atravessa ÍNTEgro, cravando o acento de 'ÍN-te'.",
    historia:
      "Na fila, você pisa no pé do THOR, solta um gemido envergonhado — ÜÜÜ... — e se desculpa estendendo um cheque: 'CHEQUE-ta!' (ursäkta). Thor responde disparando pela boca um FEIXE dourado de runas — sueco puro — que atravessa sua cabeça oca e sai do outro lado ÍNTEgro: nada ficou dentro. Você só consegue balbuciar: 'IÁ... FEIXE-THÔR... ÍN-te!' — desculpa, eu não entendo.",
  },
  createScene,
}

export default card
