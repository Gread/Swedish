import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cylinder, sphere, cone, mat, seq, ch, riseFrom } from '../rig/helpers'

/**
 * ursäkta-jag-förstår-inte — "Desculpa, eu não entendo."
 * Cena: na fila, o turista pisa no pé do Thor e estende um cheque de
 * desculpas ("o CHEQUE, TÁ?!"). Thor dispara pela boca um FEIXE dourado
 * de runas que atravessa a cabeça oca do turista e sai ÍNTEgro.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ─── cenário: chão da fila com pilastras e corda ───────────────────────
  const chao = new THREE.Group()
  const piso = box(4.6, 0.12, 2.6, '#a5a8b0')
  piso.position.set(0, 0.06, 0)
  chao.add(piso)
  const pilastraL = cylinder(0.05, 0.08, 0.7, '#c1121f')
  pilastraL.position.set(-0.9, 0.47, -1.0)
  chao.add(pilastraL)
  const pilastraR = cylinder(0.05, 0.08, 0.7, '#c1121f')
  pilastraR.position.set(0.9, 0.47, -1.0)
  chao.add(pilastraR)
  const corda = cylinder(0.03, 0.03, 1.8, '#ffd166')
  corda.rotation.z = Math.PI / 2
  corda.position.set(0, 0.72, -1.0)
  chao.add(corda)
  chao.position.set(0, 0, 0)
  root.add(chao)

  // ─── Thor: corpo azul largo ────────────────────────────────────────────
  const corpoThor = cylinder(0.5, 0.55, 1.1, '#2f6fdb')
  corpoThor.position.set(-1.3, 0.67, 0)
  root.add(corpoThor)

  // ─── Thor: cabeça com elmo alado, olhos bravos e boca aberta ──────────
  const cabecaThor = new THREE.Group()
  const craneoThor = sphere(0.38, '#f2c894')
  cabecaThor.add(craneoThor)
  const elmo = sphere(0.4, '#8d99ae')
  elmo.scale.set(1, 0.55, 1)
  elmo.position.set(0, 0.12, 0)
  cabecaThor.add(elmo)
  const asaL = cone(0.09, 0.3, '#f1f3f5')
  asaL.position.set(0, 0.24, 0.34)
  asaL.rotation.x = 0.7
  cabecaThor.add(asaL)
  const asaR = cone(0.09, 0.3, '#f1f3f5')
  asaR.position.set(0, 0.24, -0.34)
  asaR.rotation.x = -0.7
  cabecaThor.add(asaR)
  const olhoThorA = sphere(0.045, '#212529')
  olhoThorA.position.set(0.3, 0.14, 0.14)
  cabecaThor.add(olhoThorA)
  const olhoThorB = sphere(0.045, '#212529')
  olhoThorB.position.set(0.3, 0.14, -0.14)
  cabecaThor.add(olhoThorB)
  const bocaThor = cylinder(0.11, 0.11, 0.08, '#5c2e0d')
  bocaThor.rotation.z = Math.PI / 2
  bocaThor.position.set(0.36, 0, 0)
  cabecaThor.add(bocaThor)
  cabecaThor.position.set(-1.3, 1.5, 0)
  root.add(cabecaThor)

  // ─── Mjölnir: cabo fino + cabeçote cinza, de pé ao lado do Thor ───────
  const martelo = new THREE.Group()
  const cabo = cylinder(0.055, 0.055, 0.85, '#8b5a2b')
  cabo.position.set(0, 0.5, 0)
  martelo.add(cabo)
  const cabecote = box(0.55, 0.34, 0.34, '#7d8597')
  cabecote.position.set(0, 1.05, 0)
  martelo.add(cabecote)
  martelo.position.set(-2.0, 0, 0.15)
  root.add(martelo)

  // ─── turista: corpo verde com braço estendido e mão ───────────────────
  const corpoTurista = new THREE.Group()
  const tronco = cylinder(0.38, 0.42, 1.1, '#43a047')
  tronco.position.set(0, 0.67, 0)
  corpoTurista.add(tronco)
  const braco = cylinder(0.085, 0.085, 0.68, '#43a047')
  braco.rotation.z = Math.PI / 2
  braco.position.set(-0.52, 1.05, 0.14)
  corpoTurista.add(braco)
  const mao = sphere(0.11, '#f2c894')
  mao.position.set(-0.86, 1.05, 0.14)
  corpoTurista.add(mao)
  corpoTurista.position.set(1.3, 0, 0)
  root.add(corpoTurista)

  // ─── turista: cabeça oca (o feixe entra e sai) ────────────────────────
  const cabecaTurista = new THREE.Group()
  const craneoTurista = sphere(0.36, '#f2c894')
  cabecaTurista.add(craneoTurista)
  const cabelo = sphere(0.37, '#5b3a29')
  cabelo.scale.set(1, 0.45, 1)
  cabelo.position.set(0, 0.14, 0)
  cabecaTurista.add(cabelo)
  const olhoTuristaA = sphere(0.05, '#212529')
  olhoTuristaA.position.set(-0.3, 0.1, 0.13)
  cabecaTurista.add(olhoTuristaA)
  const olhoTuristaB = sphere(0.05, '#212529')
  olhoTuristaB.position.set(-0.3, 0.1, -0.13)
  cabecaTurista.add(olhoTuristaB)
  const bocaTurista = sphere(0.055, '#5c2e0d')
  bocaTurista.position.set(-0.32, -0.1, 0.05)
  cabecaTurista.add(bocaTurista)
  cabecaTurista.position.set(1.3, 1.5, 0)
  root.add(cabecaTurista)

  // ─── cheque de desculpas: papel branco com linhas, inclinado ao Thor ──
  const cheque = new THREE.Group()
  const papel = box(0.66, 0.44, 0.045, '#f8f9fa')
  cheque.add(papel)
  const linhaA = box(0.45, 0.035, 0.012, '#343a40')
  linhaA.position.set(0.02, 0.07, 0.028)
  cheque.add(linhaA)
  const linhaB = box(0.45, 0.035, 0.012, '#343a40')
  linhaB.position.set(0.02, -0.02, 0.028)
  cheque.add(linhaB)
  const assinatura = box(0.2, 0.05, 0.012, '#1d3557')
  assinatura.position.set(0.14, -0.14, 0.028)
  cheque.add(assinatura)
  cheque.position.set(0.45, 1.05, 0.2)
  cheque.rotation.z = 0.3
  root.add(cheque)

  // ─── feixe de runas: telescopa da boca do Thor (origem no grupo) ──────
  const feixe = new THREE.Group()
  const jato = new THREE.Mesh(
    new THREE.CylinderGeometry(0.13, 0.13, 2.65, 20),
    mat('#ffc300', { emissive: '#ff9e00' }),
  )
  jato.rotation.z = -Math.PI / 2
  jato.position.set(1.325, 0, 0)
  feixe.add(jato)
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.4, 20), mat('#ffd60a', { emissive: '#ffb703' }))
  ponta.rotation.z = -Math.PI / 2
  ponta.position.set(2.85, 0, 0)
  feixe.add(ponta)
  const runaA = box(0.17, 0.17, 0.17, '#e85d04')
  runaA.rotation.x = Math.PI / 4
  runaA.position.set(0.7, 0, 0)
  feixe.add(runaA)
  const runaB = box(0.17, 0.17, 0.17, '#e85d04')
  runaB.rotation.x = Math.PI / 4
  runaB.position.set(1.9, 0, 0)
  feixe.add(runaB)
  feixe.position.set(-0.92, 1.5, 0) // boca do Thor
  root.add(feixe)

  const parts = [
    { name: 'chao-fila', group: 'cenario', object: chao },
    { name: 'corpo-thor', group: 'thor', object: corpoThor },
    { name: 'cabeca-thor', group: 'thor', object: cabecaThor },
    { name: 'martelo', group: 'thor', object: martelo },
    { name: 'corpo-turista', group: 'turista', object: corpoTurista },
    { name: 'cabeca-turista', group: 'turista', object: cabecaTurista },
    { name: 'cheque', group: 'cheque', object: cheque },
    { name: 'feixe', group: 'feixe', object: feixe },
  ]

  const build = [
    seq('fila-rise', 'chao-fila', 0, 0.7, [riseFrom(0, 1.0)], {
      caption: 'Na FILA do guichê, você dá um passo para trás… e pisa no pé de alguém enorme.',
    }),

    seq('thor-corpo-rise', 'corpo-thor', 1.8, 0.7, [riseFrom(0.67, 1.4)], {
      caption: 'É o THOR — martelo em punho, um deus nórdico que só fala sueco.',
    }),
    seq('thor-cabeca-rise', 'cabeca-thor', 1.95, 0.7, [riseFrom(1.5, 2.1)]),
    seq('martelo-rise', 'martelo', 2.15, 0.8, [riseFrom(0, 1.5)]),

    seq('turista-corpo-rise', 'corpo-turista', 3.6, 0.7, [riseFrom(0, 1.5)], {
      caption: 'Você, o turista arrependido, se vira para pedir desculpas…',
    }),
    seq('turista-cabeca-rise', 'cabeca-turista', 3.75, 0.7, [riseFrom(1.5, 2.1)]),

    seq('cheque-rise', 'cheque', 5.4, 0.6, [riseFrom(1.05, 1.5)], {
      caption: "…e estende um cheque: 'o CHEQUE, TÁ?!' — u-CHÉK-ta: ursäkta!",
    }),
    seq('cheque-tilt', 'cheque', 6.0, 0.5, [ch('rotation.z', 0, 0.3)]),

    seq('feixe-dispara', 'feixe', 7.4, 0.7, [ch('scale.x', 0.02, 1)], {
      caption: 'Thor responde disparando pela boca um FEIXE dourado de runas: FEIXE-THOR — fêsh-TÓR: förstår!',
    }),

    seq('cabeca-treme-1', 'cabeca-turista', 8.8, 0.35, [ch('rotation.z', 0, 0.22)], {
      caption:
        "O feixe atravessa a cabeça oca e sai ÍNTEgro — nada ficou dentro! 'IÁ… FEIXE-THOR… ÍN-te!' — Ursäkta, jag förstår inte.",
    }),
    seq('cabeca-treme-2', 'cabeca-turista', 9.15, 0.35, [ch('rotation.z', 0.22, 0)]),
    seq('cheque-balanca-1', 'cheque', 9.7, 0.4, [ch('rotation.z', 0.3, 0.45)]),
    seq('cheque-balanca-2', 'cheque', 10.1, 0.4, [ch('rotation.z', 0.45, 0.3)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 3.0, 6.4], target: [0, 1.0, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ursakta-jag-forstar-inte',
    contexto: 'Quando o atendente dispara uma explicação e você se perde — presencial ou por telefone.',
    fraseFonte: 'Desculpa, eu não entendo.',
    fraseAlvo: 'Ursäkta, jag förstår inte.',
    pronuncia:
      "u-CHÉK-ta, iá fêsh-TÓR ÍN-te (o 'rs' de 'ursäkta' e de 'förstår' vira som de 'ch'/'x': 'uchékta', 'fêshtór')",
    ponteSonora:
      "u-CHÉK-ta, iá fêsh-TÓR ÍN-te ~ \"o CHEQUE, TÁ?! ... IÁ... FEIXE-THOR... ÍN-te!\" — 'o CHEQUE, TÁ' dá 'u-CHÉK-ta'; 'FEIXE-THOR' emendado sai 'fei-sh-TÓR' ≈ 'fêsh-TÓR', com o chiado certo do 'rs'; o feixe atravessa ÍNTEgro, cravando o acento de 'ÍN-te'.",
    historia:
      "Na fila, você pisa no pé do THOR e se desculpa estendendo um cheque: 'o CHEQUE, TÁ?!' (ursäkta). Thor responde disparando pela boca um FEIXE dourado de runas — sueco puro — que atravessa sua cabeça oca e sai do outro lado ÍNTEgro: nada ficou dentro. Você só consegue balbuciar: 'IÁ... FEIXE-THOR... ÍN-te!' — desculpa, eu não entendo.",
  },
  createScene,
}

export default card
