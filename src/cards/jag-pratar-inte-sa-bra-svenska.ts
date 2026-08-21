import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, seq, sphere, riseFrom, ch } from '../rig/helpers'

/**
 * "Jag pratar inte så bra svenska." — Eu não falo sueco muito bem.
 *
 * Cena: um caipira de chapéu de palha deixa cair da boca uma barra de
 * PRATA ÍNTEgra diante de SVEN, o viking SKAtista de capacete com chifres.
 */

const GRASS_TOP = 0.16

function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Cenário ────────────────────────────────────────────────────────────
  const gramado = new THREE.Group()
  const grama = box(5, 0.16, 3.4, '#63c74d')
  grama.position.y = 0.08
  gramado.add(grama)
  const flores: [number, number, string][] = [
    [1.95, -1.25, '#ff6b81'],
    [-1.9, 1.2, '#ffd93d'],
    [0.2, -1.45, '#ff9f43'],
  ]
  for (const [fx, fz, cor] of flores) {
    const talo = cylinder(0.02, 0.02, 0.18, '#3e8e41')
    talo.position.set(fx, GRASS_TOP + 0.09, fz)
    gramado.add(talo)
    const petala = sphere(0.06, cor)
    petala.position.set(fx, GRASS_TOP + 0.2, fz)
    gramado.add(petala)
  }
  gramado.position.set(0, 0, 0)
  root.add(gramado)

  // ── Skate do Sven (x = +1.1, virado para o caipira em -x) ──────────────
  const rodas = new THREE.Group()
  for (const rx of [-0.33, 0.33]) {
    for (const rz of [-0.13, 0.13]) {
      const roda = cylinder(0.09, 0.09, 0.08, '#2b2b2b')
      roda.rotation.x = Math.PI / 2
      roda.position.set(rx, 0.09, rz)
      rodas.add(roda)
    }
  }
  rodas.position.set(1.1, GRASS_TOP, 0)
  root.add(rodas)

  const prancha = box(1.05, 0.07, 0.36, '#a5673f')
  prancha.position.set(1.1, GRASS_TOP + 0.215, 0)
  root.add(prancha)

  // ── Sven, o viking ─────────────────────────────────────────────────────
  const svenCorpo = new THREE.Group()
  const tunica = cylinder(0.26, 0.32, 0.72, '#3b6fd4')
  svenCorpo.add(tunica)
  for (const bz of [-0.32, 0.32]) {
    const braco = cylinder(0.06, 0.06, 0.4, '#3b6fd4')
    braco.position.set(0, 0.05, bz)
    braco.rotation.x = bz > 0 ? -0.45 : 0.45
    svenCorpo.add(braco)
  }
  svenCorpo.position.set(1.1, 0.77, 0)
  root.add(svenCorpo)

  const svenCabeca = new THREE.Group()
  const rostoSven = sphere(0.23, '#f2c79a')
  svenCabeca.add(rostoSven)
  for (const ez of [-0.085, 0.085]) {
    const olho = sphere(0.035, '#26262b')
    olho.position.set(-0.18, 0.04, ez)
    svenCabeca.add(olho)
  }
  const barba = sphere(0.13, '#e3a53c')
  barba.scale.set(0.7, 0.9, 1.1)
  barba.position.set(-0.15, -0.13, 0)
  svenCabeca.add(barba)
  svenCabeca.position.set(1.1, 1.34, 0)
  root.add(svenCabeca)

  const capacete = new THREE.Group()
  const cupula = sphere(0.245, '#9aa5b1')
  cupula.scale.y = 0.7
  capacete.add(cupula)
  for (const hz of [-0.24, 0.24]) {
    const chifre = cone(0.065, 0.3, '#f5f0e6')
    chifre.position.set(0, 0.04, hz)
    chifre.rotation.x = hz > 0 ? Math.PI / 2 : -Math.PI / 2
    capacete.add(chifre)
  }
  capacete.position.set(1.1, 1.52, 0)
  root.add(capacete)

  // ── Você, o caipira (x = -1.1, virado para o Sven em +x) ───────────────
  const caipiraCorpo = new THREE.Group()
  const camisa = cylinder(0.24, 0.3, 0.66, '#d0433b')
  caipiraCorpo.add(camisa)
  for (const bz of [-0.3, 0.3]) {
    const braco = cylinder(0.055, 0.055, 0.38, '#d0433b')
    braco.position.set(0, 0.04, bz)
    braco.rotation.x = bz > 0 ? -0.45 : 0.45
    caipiraCorpo.add(braco)
  }
  caipiraCorpo.position.set(-1.1, 0.49, 0)
  root.add(caipiraCorpo)

  const caipiraCabeca = new THREE.Group()
  const rostoCaipira = sphere(0.22, '#f2c79a')
  caipiraCabeca.add(rostoCaipira)
  for (const ez of [-0.08, 0.08]) {
    const olho = sphere(0.035, '#26262b')
    olho.position.set(0.17, 0.05, ez)
    caipiraCabeca.add(olho)
  }
  const boca = sphere(0.065, '#4a231a')
  boca.scale.set(0.6, 1, 1)
  boca.position.set(0.2, -0.06, 0)
  caipiraCabeca.add(boca)
  caipiraCabeca.position.set(-1.1, 1.02, 0)
  root.add(caipiraCabeca)

  const chapeu = new THREE.Group()
  const aba = cylinder(0.36, 0.38, 0.045, '#eac54f')
  chapeu.add(aba)
  const copa = cone(0.27, 0.24, '#f0d264')
  copa.position.y = 0.14
  chapeu.add(copa)
  chapeu.position.set(-1.1, 1.22, 0)
  chapeu.rotation.z = 0.15
  root.add(chapeu)

  // ── A barra de PRATA ÍNTEgra, despencando da boca ──────────────────────
  const prata = box(0.7, 0.17, 0.2, '#c9d1d9')
  prata.position.set(-0.74, 0.66, 0)
  prata.rotation.z = -0.9
  root.add(prata)

  const parts = [
    { name: 'gramado', group: 'cenario', object: gramado },
    { name: 'rodas', group: 'skate', object: rodas },
    { name: 'prancha', group: 'skate', object: prancha },
    { name: 'sven-corpo', group: 'sven', object: svenCorpo },
    { name: 'sven-cabeca', group: 'sven', object: svenCabeca },
    { name: 'capacete', group: 'sven', object: capacete },
    { name: 'caipira-corpo', group: 'caipira', object: caipiraCorpo },
    { name: 'caipira-cabeca', group: 'caipira', object: caipiraCabeca },
    { name: 'chapeu', group: 'caipira', object: chapeu },
    { name: 'prata', group: 'prata', object: prata },
  ]

  const build = [
    // Cenário
    seq('gramado-rise', 'gramado', 0, 0.7, [riseFrom(0, 0.8)], {
      caption: 'Num gramado tranquilo, você ouve rodinhas se aproximando…',
    }),

    // Skate (o "SKA" de svenSKA)
    seq('rodas-rise', 'rodas', 1.6, 0.6, [riseFrom(GRASS_TOP, 0.7)], {
      caption: '…é um SKAte! E quem vem parado em cima dele?',
    }),
    seq('prancha-rise', 'prancha', 1.75, 0.6, [riseFrom(GRASS_TOP + 0.215, 0.9)]),

    // Sven, o viking
    seq('sven-corpo-rise', 'sven-corpo', 3.3, 0.7, [riseFrom(0.77, 1.4)], {
      caption: 'SVÉN, o viking SKAtista — o sueco que você quer impressionar.',
    }),
    seq('sven-cabeca-rise', 'sven-cabeca', 3.5, 0.6, [riseFrom(1.34, 1.8)]),
    seq('capacete-rise', 'capacete', 3.7, 0.6, [riseFrom(1.52, 1.9)]),

    // Você, o caipira
    seq('caipira-corpo-rise', 'caipira-corpo', 5.2, 0.7, [riseFrom(0.49, 1.1)], {
      caption: 'Você, de chapéu de palha, corre pra trocar uma PRATA (um papo)…',
    }),
    seq('caipira-cabeca-rise', 'caipira-cabeca', 5.4, 0.6, [riseFrom(1.02, 1.5)]),
    seq('chapeu-rise', 'chapeu', 5.6, 0.6, [riseFrom(1.22, 1.7)]),

    // A barra de prata sai da boca em vez de palavras
    seq(
      'prata-emerge',
      'prata',
      7.4,
      0.6,
      [
        ch('position.x', -0.91, -0.82),
        ch('position.y', 0.96, 0.86),
        ch('scale.x', 0.15, 1),
        ch('scale.y', 0.15, 1),
        ch('scale.z', 0.15, 1),
      ],
      {
        caption: '…mas da boca despenca uma barra de PRÁTA ÍNTEgra: maciça, pesada, MUDA.',
      },
    ),
    seq('prata-drop', 'prata', 8.1, 0.6, [
      ch('position.x', -0.82, -0.74),
      ch('position.y', 0.86, 0.66),
      ch('rotation.z', -0.3, -0.9),
    ]),

    // O caipira levanta o chapéu e admite
    seq('chapeu-tip', 'chapeu', 9.0, 0.7, [ch('rotation.z', 0, 0.15)], {
      caption:
        'Você ergue o chapéu: "IÁ… PRÁTA ÍNTEgra, SÔ BRÁ… SVÉN SKAtista!" — Jag pratar inte så bra svenska.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.4, 3.0, 5.6], target: [0, 0.9, 0] },
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
