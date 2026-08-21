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
 * "Jag pratar inte så bra svenska." — Eu não falo sueco muito bem.
 *
 * Diorama: num gramado redondo, SVEN — viking SKAtista de capacete com
 * chifres — desliza até você, o caipira de chapéu de palha. Você tenta
 * trocar uma PRATA (um papo), mas da boca despenca uma barra de PRATA
 * ÍNTEgra, polida e muda, que aterrissa num baque de poeira.
 *
 * Paleta: verdes do gramado + azul do viking + palha/terra quentes.
 * Acento saturado: o shape vermelho #c94f3d do SKAte (svenSKA).
 * A barra de prata é o único metal polido da cena — a estrela material.
 */

const BASE_TOP = 0.18
const DECK_TOP = BASE_TOP + 0.245

function createScene(): CardScene {
  const root = new THREE.Group()
  const scatter = rng(42)

  // ── Terreno: base de diorama + ambientação ─────────────────────────────
  const terreno = new THREE.Group()

  const solo = cylinder(2.56, 2.68, 0.13, '#5b4632', { roughness: 0.92 })
  solo.position.y = 0.065
  terreno.add(solo)

  const grama = cylinder(2.52, 2.56, 0.06, '#4a8f3c', { roughness: 0.88 })
  grama.position.y = 0.15
  terreno.add(grama)

  const pedra = rock(0.16, '#8b8474', 11, { roughness: 0.85 })
  pedra.position.set(1.55 + (scatter() - 0.5) * 0.2, 0.22, 1.35 + (scatter() - 0.5) * 0.2)
  pedra.rotation.y = scatter() * Math.PI
  terreno.add(pedra)

  const arbusto = puff(0.24, '#3f7a33', 6, 5, { roughness: 0.9 })
  arbusto.position.set(-0.75 + (scatter() - 0.5) * 0.2, 0.34, 1.75 + (scatter() - 0.5) * 0.2)
  terreno.add(arbusto)

  const flores: [number, number, string][] = [
    [1.25, -1.6, '#c96a80'],
    [0.35, -1.85, '#d9a13d'],
  ]
  for (const [fx, fz, cor] of flores) {
    const x = fx + (scatter() - 0.5) * 0.25
    const z = fz + (scatter() - 0.5) * 0.25
    const talo = cylinder(0.015, 0.022, 0.16, '#3e8e41', { roughness: 0.8 })
    talo.position.set(x, BASE_TOP + 0.08, z)
    terreno.add(talo)
    const corola = sphere(0.052, cor, { roughness: 0.6 })
    corola.position.set(x, BASE_TOP + 0.18, z)
    terreno.add(corola)
  }
  root.add(terreno)

  // ── Skate do Sven (acento vermelho: o SKA de svenSKA) ──────────────────
  const skate = new THREE.Group()
  for (const tx of [-0.33, 0.33]) {
    const truck = rbox(0.1, 0.06, 0.3, 0.02, '#9aa1a9', { metalness: 0.7, roughness: 0.35 })
    truck.position.set(tx, 0.14, 0)
    skate.add(truck)
    for (const wz of [-0.16, 0.16]) {
      const roda = cylinder(0.085, 0.085, 0.09, '#e8ddc8', { roughness: 0.45 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(tx, 0.085, wz)
      skate.add(roda)
    }
  }
  const shape = rbox(1.15, 0.07, 0.4, 0.035, '#c94f3d', { roughness: 0.5 })
  shape.position.y = 0.21
  skate.add(shape)
  const listra = rbox(0.88, 0.016, 0.12, 0.007, '#e8ddc8', { roughness: 0.5 })
  listra.position.y = 0.253
  skate.add(listra)
  skate.position.set(1.05, BASE_TOP, 0)
  root.add(skate)

  // ── Sven, o viking SKAtista (olha para -x, onde você chega) ────────────
  const sven = person({ body: '#46689c', skin: '#e8c39e', height: 1.55, armAngle: 0.6 })
  sven.position.set(1.05, DECK_TOP, 0)
  sven.rotation.y = -Math.PI / 2

  const cabecaSven = sven.getObjectByName('head')!
  const narizSven = sphere(0.05, '#e8c39e', { roughness: 0.6 })
  narizSven.position.set(0, -0.02, 0.28)
  cabecaSven.add(narizSven)

  const barba = puff(0.13, '#cf9b46', 5, 9, { roughness: 0.9 })
  barba.scale.set(1, 0.85, 0.7)
  barba.position.set(0, -0.17, 0.19)
  cabecaSven.add(barba)

  const capacete = new THREE.Group()
  const cupulaPerfil: [number, number][] = [
    [0.3, 0],
    [0.295, 0.1],
    [0.26, 0.19],
    [0.17, 0.26],
    [0, 0.3],
  ]
  const cupula = lathe(cupulaPerfil, '#97a1ad', { metalness: 0.75, roughness: 0.3 })
  cupula.position.y = 0.02
  capacete.add(cupula)
  const aro = torus(0.295, 0.028, '#7c848d', { metalness: 0.8, roughness: 0.35 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.04
  capacete.add(aro)
  for (const lado of [-1, 1]) {
    const chifre = cone(0.06, 0.26, '#f0e6d2', { roughness: 0.6 })
    chifre.position.set(lado * 0.34, 0.15, 0)
    chifre.rotation.z = -lado * 1.25
    capacete.add(chifre)
  }
  capacete.position.y = 0.1
  cabecaSven.add(capacete)
  root.add(sven)

  // braço direito: acena a saudação viking (pose final = braço erguido)
  const bracoSven = sven.getObjectByName('armR')!
  bracoSven.rotation.z = -2.3

  // ── Você, o caipira (olha para +x, na direção do Sven) ─────────────────
  const caipira = person({ body: '#6f7d3f', skin: '#e8c39e', height: 1.45, armAngle: 0.5 })
  caipira.position.set(-1.05, BASE_TOP, 0)
  caipira.rotation.y = Math.PI / 2

  for (const lado of [-1, 1]) {
    const alca = rbox(0.07, 0.34, 0.025, 0.01, '#4f6785', { roughness: 0.85 })
    alca.position.set(lado * 0.09, 0.52, 0.245)
    alca.rotation.x = -0.15
    caipira.add(alca)
  }

  const cabecaCaipira = caipira.getObjectByName('head')!
  cabecaCaipira.rotation.x = 0.26 // pose final: olhar baixo, envergonhado
  const narizCaipira = sphere(0.046, '#e8c39e', { roughness: 0.6 })
  narizCaipira.position.set(0, -0.02, 0.26)
  cabecaCaipira.add(narizCaipira)
  const boca = sphere(0.07, '#5c2e22', { roughness: 0.8 })
  boca.scale.set(1, 1.15, 0.55)
  boca.position.set(0, -0.11, 0.24)
  cabecaCaipira.add(boca)
  root.add(caipira)

  // ── Chapéu de palha (peça própria: ergue e reassenta de banda) ─────────
  const chapeu = new THREE.Group()
  const palhaPerfil: [number, number][] = [
    [0.15, 0.015],
    [0.44, 0],
    [0.44, 0.03],
    [0.28, 0.05],
    [0.24, 0.065],
    [0.21, 0.25],
    [0.12, 0.3],
    [0, 0.31],
  ]
  const palha = lathe(palhaPerfil, '#d9b45c', { roughness: 0.9 })
  chapeu.add(palha)
  const fita = torus(0.235, 0.022, '#8a4b32', { roughness: 0.8 })
  fita.rotation.x = Math.PI / 2
  fita.position.y = 0.09
  chapeu.add(fita)
  chapeu.position.set(-1.05, 1.38, 0) // pose final: reassentado de banda
  chapeu.rotation.z = 0.12
  root.add(chapeu)

  // ── A barra de PRATA ÍNTEgra — único metal polido da cena ──────────────
  const prata = rbox(0.62, 0.16, 0.2, 0.045, '#d7dde4', { metalness: 0.95, roughness: 0.22 })
  prata.position.set(-0.48, 0.26, 0.02)
  prata.rotation.z = -6.36 // um giro completo na queda, pousa quase reta
  root.add(prata)

  const poeira = puff(0.13, '#c2b89b', 5, 17, { roughness: 0.95 })
  poeira.position.set(-0.46, 0.3, 0.1)
  root.add(poeira)

  const parts = [
    { name: 'terreno', group: 'cenario', object: terreno },
    { name: 'skate', group: 'skate', object: skate },
    { name: 'sven', group: 'sven', object: sven },
    { name: 'sven-braco', group: 'sven', object: bracoSven },
    { name: 'caipira', group: 'caipira', object: caipira },
    { name: 'caipira-cabeca', group: 'caipira', object: cabecaCaipira },
    { name: 'chapeu', group: 'caipira', object: chapeu },
    { name: 'prata', group: 'prata', object: prata },
    { name: 'poeira', group: 'prata', object: poeira },
  ]

  const build = [
    // Cenário
    seq('terreno-rise', 'terreno', 0, 0.8, [riseFrom(0, 1.1)], {
      ease: 'easeOut',
      caption: 'Num gramado tranquilo, você ouve rodinhas se aproximando…',
    }),

    // Skate: brota e rola até o centro do gramado
    seq('skate-rise', 'skate', 1.6, 0.6, [riseFrom(BASE_TOP, 0.9)], {
      ease: 'easeOut',
      caption: '…é um SKAte! E quem vem parado em cima dele?',
    }),
    seq('skate-rola', 'skate', 2.3, 0.8, [ch('position.x', 1.5, 1.05)], { ease: 'easeOut' }),

    // Sven brota sobre o shape e abre o braço em saudação
    seq('sven-rise', 'sven', 3.6, 0.8, [riseFrom(DECK_TOP, 2.1)], {
      ease: 'easeOut',
      caption: 'SVÉN, o viking SKAtista — o sueco que você quer impressionar.',
    }),
    seq('sven-braco-abre', 'sven-braco', 3.8, 0.5, [ch('rotation.z', 0, -0.6)], {
      ease: 'easeOut',
    }),

    // Você, o caipira
    seq('caipira-rise', 'caipira', 5.4, 0.8, [riseFrom(BASE_TOP, 1.7)], {
      ease: 'easeOut',
      caption: 'Você, de chapéu de palha, corre pra trocar uma PRATA (um papo)…',
    }),
    seq('caipira-cabeca-encaixa', 'caipira-cabeca', 5.6, 0.5, [ch('position.y', 1.208, 0.988)], {
      ease: 'easeOut',
    }),
    seq('chapeu-rise', 'chapeu', 5.7, 0.6, [riseFrom(1.36, 1.95)], { ease: 'easeOut' }),

    // Sven ergue o braço: "hej!"
    seq('sven-acena', 'sven-braco', 6.7, 0.6, [ch('rotation.z', -0.6, -2.3)], {
      ease: 'easeInOut',
    }),

    // A barra de prata brota da boca e despenca girando
    seq(
      'prata-emerge',
      'prata',
      7.4,
      0.6,
      [
        ch('scale.x', 0.05, 1),
        ch('scale.y', 0.05, 1),
        ch('scale.z', 0.05, 1),
        ch('position.x', -0.8, -0.68),
        ch('position.y', 1.07, 1.0),
        ch('rotation.z', -0.15, -0.55),
      ],
      {
        ease: 'easeOut',
        caption: '…mas da boca despenca uma barra de PRÁTA ÍNTEgra: maciça, pesada, MUDA.',
      },
    ),
    seq(
      'prata-despenca',
      'prata',
      8.1,
      0.65,
      [
        ch('position.x', -0.68, -0.48),
        ch('position.y', 1.0, 0.26),
        ch('rotation.z', -0.55, -6.36),
      ],
      { ease: 'easeIn' },
    ),
    seq(
      'poeira-baque',
      'poeira',
      8.8,
      0.45,
      [
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
        ch('position.y', 0.24, 0.3),
      ],
      { ease: 'easeOut' },
    ),

    // Você ergue o chapéu, baixa a cabeça e admite
    seq(
      'chapeu-ergue',
      'chapeu',
      9.9,
      0.5,
      [ch('position.y', 1.36, 1.66), ch('rotation.z', 0, 0.38)],
      {
        ease: 'easeOut',
        caption:
          'Você ergue o chapéu: "IÁ… PRÁTA ÍNTEgra, SÔ BRÁ… SVÉN SKAtista!" — Jag pratar inte så bra svenska.',
      },
    ),
    seq('caipira-cabeca-baixa', 'caipira-cabeca', 10.1, 0.7, [ch('rotation.x', 0, 0.26)], {
      ease: 'easeInOut',
    }),
    seq(
      'chapeu-reassenta',
      'chapeu',
      10.5,
      0.5,
      [ch('position.y', 1.66, 1.38), ch('rotation.z', 0.38, 0.12)],
      { ease: 'easeInOut' },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.5, 3.0, 6.0], target: [0, 0.95, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-pratar-inte-sa-bra-svenska',
    contexto: 'Qualquer atendimento: Skatteverket, banco, médico, telefone. Geralmente é a primeira coisa a dizer.',
    fraseFonte: 'Eu não falo sueco muito bem.',
    fraseAlvo: 'Jag pratar inte så bra svenska.',
    pronuncia:
      "iá PRÁ-tar ÍN-te sô brá SVÉN-ska ('jag' no dia a dia vira 'iá', o g é mudo; 'så' com ô fechado)",
    ponteSonora:
      'iá PRÁ-tar ÍN-te sô brá SVÉN-ska ~ "IÁ! PRÁTA ÍNTEgra?! SÔ BRÁ... SVÉN SKAtista!" — lendo só as sílabas fortes sai IÁ-PRÁTA-ÍNTE-SÔ-BRÁ-SVÉN-SKA, sem sílabas parasitas; \'ÍNTEgra\' força o acento certo de \'ÍN-te\'.',
    historia:
      "Sven, o viking SKAtista de capacete com chifres, passa deslizando e você corre pra trocar uma PRATA (um papo). Mas da sua boca, em vez de palavras suecas, despenca uma barra de PRATA ÍNTEgra — maciça, pesada, muda. Você levanta o chapéu de palha e admite: 'IÁ... PRÁTA ÍNTEgra, SÔ BRÁ... SVÉN SKAtista!' — eu não falo sueco muito bem.",
  },
  createScene,
}

export default card
