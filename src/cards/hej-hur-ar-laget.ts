import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, seq, sphere, riseFrom, ch } from '../rig/helpers'

/**
 * hej-hur-ar-laget — "Hej! Hur är läget?"
 * O REI (hej~RÊI) URRA (hur är~URRA-É) para o LEGO (läget~LEGO-t) gigante.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- Cenário: tapete do salão do trono ----
  const tapete = box(4.6, 0.12, 3.0, '#2d6a4f')
  tapete.position.set(0, 0.06, 0)
  root.add(tapete)

  // ---- O REI: manto roxo + cabeça ----
  const manto = cylinder(0.32, 0.5, 1.2, '#6d28a8')
  manto.position.set(-1.3, 0.72, 0)
  root.add(manto)

  // cabeça = grupo (esfera bege + dois olhos), virada para o LEGO (+x)
  const cabeca = new THREE.Group()
  const rosto = sphere(0.35, '#f2c9a0')
  rosto.position.set(0, 0, 0)
  cabeca.add(rosto)
  const olhoEsq = sphere(0.05, '#1d1d1d')
  olhoEsq.position.set(0.3, 0.1, -0.12)
  cabeca.add(olhoEsq)
  const olhoDir = sphere(0.05, '#1d1d1d')
  olhoDir.position.set(0.3, 0.1, 0.12)
  cabeca.add(olhoDir)
  cabeca.position.set(-1.3, 1.62, 0)
  root.add(cabeca)

  // ---- Coroa: base + pontas ----
  const coroaBase = cylinder(0.26, 0.26, 0.16, '#f4b81f')
  coroaBase.position.set(-1.3, 1.95, 0)
  root.add(coroaBase)

  const coroaPontas = new THREE.Group()
  for (const dx of [-0.16, 0, 0.16]) {
    const ponta = cone(0.08, 0.2, '#f4b81f')
    ponta.position.set(dx, 0, 0)
    coroaPontas.add(ponta)
  }
  coroaPontas.position.set(-1.3, 2.13, 0)
  root.add(coroaPontas)

  // ---- Boca do URRO: esfera preta escancarada na frente do rosto ----
  const boca = sphere(0.18, '#141414')
  boca.position.set(-1.0, 1.5, 0)
  root.add(boca)

  // ---- O LEGO gigante: bloco vermelho + pinos ----
  const legoBloco = box(1.5, 0.95, 1.1, '#d02a1e')
  legoBloco.position.set(1.2, 0.595, 0)
  root.add(legoBloco)

  const legoPinos = new THREE.Group()
  for (const dx of [-0.37, 0.37]) {
    for (const dz of [-0.27, 0.27]) {
      const pino = cylinder(0.16, 0.16, 0.14, '#e8443a')
      pino.position.set(dx, 0, dz)
      legoPinos.add(pino)
    }
  }
  legoPinos.position.set(1.2, 1.14, 0)
  root.add(legoPinos)

  const parts = [
    { name: 'tapete', group: 'salao', object: tapete },
    { name: 'manto', group: 'rei', object: manto },
    { name: 'cabeca', group: 'rei', object: cabeca },
    { name: 'coroa-base', group: 'coroa', object: coroaBase },
    { name: 'coroa-pontas', group: 'coroa', object: coroaPontas },
    { name: 'boca', group: 'urro', object: boca },
    { name: 'lego-bloco', group: 'lego', object: legoBloco },
    { name: 'lego-pinos', group: 'lego', object: legoPinos },
  ]

  const build = [
    // 1) Cenário
    seq('tapete-rise', 'tapete', 0, 0.7, [riseFrom(0.06, 0.4)], {
      caption: 'Toda manhã o salão do trono se abre: tapete verde estendido no chão…',
    }),

    // 2) O REI brota do chão; a cabeça telescopa de dentro do manto
    seq('manto-rise', 'manto', 1.6, 0.7, [riseFrom(0.72, 1.5)], {
      caption: '…e brota o REI — "hej" soa RÊI, o rei do cumprimento diário…',
    }),
    seq('cabeca-rise', 'cabeca', 2.4, 0.6, [riseFrom(1.62, 1.3)]),

    // 3) Coroa emerge da cabeça
    seq('coroa-base-rise', 'coroa-base', 3.6, 0.6, [riseFrom(1.95, 0.5)], {
      caption: 'Coroa dourada no lugar: é o rei em pessoa, educadíssimo.',
    }),
    seq('coroa-pontas-rise', 'coroa-pontas', 3.75, 0.6, [riseFrom(2.13, 0.35)]),

    // 4) A boca do URRO escancara (expande do rosto, com overshoot)
    seq('boca-pop', 'boca', 5.4, 0.4, [
      ch('scale.x', 0.01, 1.25),
      ch('scale.y', 0.01, 1.25),
      ch('scale.z', 0.01, 1.25),
    ], {
      caption: 'Ele escancara a boca e URRA com rr carioca aspirado: "RÊI! URRA…"',
    }),
    seq('boca-settle', 'boca', 5.8, 0.3, [
      ch('scale.x', 1.25, 1),
      ch('scale.y', 1.25, 1),
      ch('scale.z', 1.25, 1),
    ]),

    // 5) "…É O LEGO?!" — o bloco gigante brota do tapete
    seq('lego-bloco-rise', 'lego-bloco', 7.4, 0.8, [riseFrom(0.595, 1.3)], {
      caption: '"…É O LEGO?!" — o bloco vermelho gigante brota do tapete (lä-GET ~ LEGO-t)…',
    }),
    seq('lego-pinos-rise', 'lego-pinos', 8.3, 0.5, [riseFrom(1.14, 0.5)]),

    // 6) O LEGO ajeita os pininhos e responde
    seq('lego-pinos-ajeita', 'lego-pinos', 9.8, 0.7, [ch('rotation.y', 0, Math.PI * 2)], {
      caption: 'O LEGO ajeita os pininhos e responde curto que está tudo bem: "Hej! Hur är läget?"',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 3.0, 6.0], target: [0, 1.0, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'hej-hur-ar-laget',
    contexto: 'Cumprimento diário: chegando no trabalho, encontrando vizinho no corredor, no elevador.',
    fraseFonte: 'Oi! Como vão as coisas?',
    fraseAlvo: 'Hej! Hur är läget?',
    pronuncia:
      "rêi! rür é LÊ-guet? ('hej' soa como o 'hey' do inglês; o 'h' sueco é um 'rr' carioca aspirado; o 'u' de 'hur' é com bico, como o 'u' francês)",
    ponteSonora:
      'RÊI! RUR-É-LÊ-GUET ~ "o REI URRA: É O LEGO?!" — fale o \'urra\' com rr carioca aspirado (igualzinho ao \'h\' sueco) e emende: REI-URRA-É-O-LEGO(t)',
    historia:
      'Toda manhã, o REI escancara o salão do trono e URRA para seu bloco de LEGO gigante: "RÊI! URRA... É O LEGO?!" — que na cabeça dele quer dizer "Oi! Como vão as coisas?". O bloco de LEGO treme, ajeita os pininhos e responde curto e educado que está tudo bem. O rei faz isso TODO santo dia, porque rei educado cumprimenta até brinquedo.',
  },
  createScene,
}

export default card
