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
  mat,
  sphere,
  torus,
} from '../rig/helpers'

/**
 * hej-hur-ar-laget — "Hej! Hur är läget?"
 * O REI (hej~RÊI) URRA (hur är~URRA-É) para o LEGO (läget~LEGO-t) gigante.
 *
 * Paleta: pedra quente (#8f8478/#a89c8d) + roxo real (#6b4596) + verde tapete
 * (#356b46). Acento saturado reservado ao LEGO (#c9342a). Ouro metálico só em
 * coroa/cetro/moedas de verdade.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ================= SALÃO: base do diorama =================
  const base = new THREE.Group()

  // plinto de pedra do salão do trono
  const piso = cylinder(2.55, 2.7, 0.16, '#8f8478', { roughness: 0.9 })
  piso.position.y = 0.08
  base.add(piso)

  // tapete verde estendido do rei até o LEGO
  const tapete = rbox(3.5, 0.06, 1.35, 0.03, '#356b46', { roughness: 0.92 })
  tapete.position.y = 0.19
  base.add(tapete)
  for (const sz of [-1, 1]) {
    const barra = rbox(3.4, 0.025, 0.07, 0.01, '#b08b3e', { metalness: 0.4, roughness: 0.45 })
    barra.position.set(0, 0.215, sz * 0.6)
    base.add(barra)
  }

  // moedas de ouro espalhadas fora do tapete (rng fixo)
  const randMoedas = rng(11)
  for (let i = 0; i < 6; i++) {
    const moeda = cylinder(0.06, 0.06, 0.024, '#e6b24a', { metalness: 0.4, roughness: 0.32 })
    const sz = i % 2 === 0 ? 1 : -1
    moeda.position.set(
      (randMoedas() - 0.5) * 3.4,
      0.171,
      sz * (0.85 + randMoedas() * 0.9),
    )
    moeda.rotation.y = randMoedas() * Math.PI
    base.add(moeda)
  }

  // dois vasos de planta flanqueando o salão
  const perfilVaso: [number, number][] = [
    [0, 0], [0.09, 0], [0.11, 0.02], [0.08, 0.1], [0.09, 0.2], [0.13, 0.26], [0.11, 0.28], [0, 0.28],
  ]
  for (const [px, pz, seed] of [[-2.0, 1.1, 31], [2.0, -1.1, 32]] as const) {
    const vaso = lathe(perfilVaso, '#a65b38', { roughness: 0.7 })
    vaso.position.set(px, 0.16, pz)
    const folhas = puff(0.14, '#4f7d46', 5, seed, { roughness: 0.85 })
    folhas.position.set(px, 0.52, pz)
    base.add(vaso, folhas)
  }
  root.add(base)

  // ---- pilares de pedra com tochas acesas, ao fundo ----
  const pilares = new THREE.Group()
  const perfilPilar: [number, number][] = [
    [0, 0], [0.3, 0], [0.3, 0.07], [0.21, 0.12], [0.16, 0.2], [0.14, 0.8],
    [0.16, 1.4], [0.21, 1.48], [0.3, 1.53], [0.3, 1.6], [0, 1.6],
  ]
  for (const [px, seed] of [[-1.45, 41], [1.45, 42]] as const) {
    const coluna = lathe(perfilPilar, '#a89c8d', { roughness: 0.85 })
    coluna.position.set(px, 0.16, -1.55)
    const bacia = cylinder(0.1, 0.06, 0.08, '#7a6a58', { roughness: 0.8 })
    bacia.position.set(px, 1.8, -1.55)
    const chama = puff(0.07, '#ffb347', 4, seed, {
      emissive: '#ff8c26',
      emissiveIntensity: 1.2,
      roughness: 0.9,
    })
    chama.position.set(px, 1.92, -1.55)
    pilares.add(coluna, bacia, chama)
  }
  root.add(pilares)

  // ================= O REI =================
  const rei = person({ body: '#6b4596', skin: '#e8c39e', height: 1.5, armAngle: 0.55 })
  rei.position.set(-1.25, 0.22, 0) // em pé sobre o tapete
  rei.rotation.y = 1.1 // olha para o LEGO (+x), rosto em 3/4 para a câmera

  // gola de arminho
  const gola = torus(0.2, 0.06, '#efe6da', { roughness: 0.95 })
  gola.rotation.x = Math.PI / 2
  gola.position.y = 0.75
  rei.add(gola)

  // botões de ouro no manto
  for (const by of [0.3, 0.4, 0.5]) {
    const botao = sphere(0.028, '#d9a441', { metalness: 0.8, roughness: 0.3 })
    botao.position.set(0, by, 0.24)
    rei.add(botao)
  }

  // cetro de ouro
  const cetro = new THREE.Group()
  const haste = cylinder(0.024, 0.024, 0.55, '#d9a441', { metalness: 0.8, roughness: 0.28 })
  cetro.add(haste)
  const orbe = sphere(0.06, '#d9a441', { metalness: 0.8, roughness: 0.25 })
  orbe.position.y = 0.3
  cetro.add(orbe)
  cetro.position.set(0, -0.28, 0.08)
  cetro.rotation.x = -0.35
  // na mão do lado da câmera, para o cetro aparecer
  rei.getObjectByName('armL')!.add(cetro)
  root.add(rei)

  const cabecaRei = rei.getObjectByName('head')!

  // ---- coroa: telescopa da cabeça ----
  const coroa = new THREE.Group()
  const aro = cylinder(0.2, 0.22, 0.16, '#d9a441', { metalness: 0.75, roughness: 0.28 })
  aro.position.y = 0.08
  coroa.add(aro)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2
    const ponta = cone(0.05, 0.18, '#d9a441', { metalness: 0.75, roughness: 0.28 })
    ponta.position.set(Math.cos(a) * 0.155, 0.25, Math.sin(a) * 0.155)
    coroa.add(ponta)
    const perola = sphere(0.024, '#f2ede4', { roughness: 0.35 })
    perola.position.set(Math.cos(a) * 0.155, 0.35, Math.sin(a) * 0.155)
    coroa.add(perola)
  }
  const joia = sphere(0.04, '#3a7d5c', { roughness: 0.22 })
  joia.position.set(0, 0.08, 0.21)
  coroa.add(joia)
  coroa.position.y = 0.24 // pose final: assentada no topo do crânio
  cabecaRei.add(coroa)

  // ---- boca do URRO: escancara no rosto ----
  const boca = new THREE.Group()
  const labios = torus(0.11, 0.025, '#b8776a', { roughness: 0.7 })
  labios.position.z = 0.03
  boca.add(labios)
  const goela = sphere(0.115, '#26161a', { roughness: 0.65 })
  goela.scale.set(1, 0.85, 0.5)
  boca.add(goela)
  boca.position.set(0, -0.1, 0.24)
  cabecaRei.add(boca)

  // ---- onda sonora do urro: arcos ))) saindo da boca rumo ao LEGO ----
  const urro = new THREE.Group()
  const ARCO = Math.PI * 0.62
  for (const [ax, ar] of [[0, 0.13], [0.36, 0.21], [0.72, 0.29]] as const) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(ar, 0.028, 12, 32, ARCO),
      mat('#f2d679', { roughness: 0.45, emissive: '#e8b84a', emissiveIntensity: 0.35 }),
    )
    arco.castShadow = true
    arco.position.x = ax - ar * 0.55
    arco.rotation.set(0, 0.35, -ARCO / 2) // arco centrado em +x, de frente p/ câmera
    urro.add(arco)
  }
  urro.position.set(-0.72, 1.16, 0.12) // pose final: saindo da boca do rei
  root.add(urro)

  // ================= O LEGO gigante =================
  const legoBloco = new THREE.Group()
  const bloco = rbox(1.5, 0.95, 1.1, 0.06, '#c9342a', { roughness: 0.35 })
  bloco.position.y = 0.695 // assentado sobre o tapete
  legoBloco.add(bloco)
  // olhos na face voltada para o rei (-x), no padrão esclera+pupila
  for (const sz of [-1, 1]) {
    const olho = sphere(0.09, '#ffffff', { roughness: 0.25 })
    olho.position.set(-0.755, 0.84, sz * 0.2)
    olho.scale.x = 0.55
    const pupila = sphere(0.045, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(-0.8, 0.84, sz * 0.2)
    legoBloco.add(olho, pupila)
  }
  legoBloco.position.x = 1.25
  // sorriso curto e educado, embaixo dos olhos
  const sorriso = new THREE.Mesh(
    new THREE.TorusGeometry(0.13, 0.025, 10, 24, Math.PI),
    mat('#5a1712', { roughness: 0.5 }),
  )
  sorriso.position.set(-0.765, 0.66, 0)
  sorriso.rotation.set(0, Math.PI / 2, Math.PI) // meia-lua para baixo, na face -x
  legoBloco.add(sorriso)
  legoBloco.rotation.y = 0.75 // rosto (face -x) virado entre o rei e a câmera
  root.add(legoBloco)

  const legoPinos = new THREE.Group()
  for (const dx of [-0.37, 0.37]) {
    for (const dz of [-0.27, 0.27]) {
      const pino = cylinder(0.17, 0.17, 0.13, '#d8453a', { roughness: 0.35 })
      pino.position.set(dx, 0, dz)
      legoPinos.add(pino)
    }
  }
  legoPinos.position.set(1.25, 1.215, 0)
  legoPinos.rotation.y = 0.75 // alinhado ao bloco girado
  root.add(legoPinos)

  const parts = [
    { name: 'base', group: 'salao', object: base as THREE.Object3D },
    { name: 'pilares', group: 'salao', object: pilares as THREE.Object3D },
    { name: 'rei', group: 'rei', object: rei as THREE.Object3D },
    { name: 'coroa', group: 'coroa', object: coroa as THREE.Object3D },
    { name: 'boca', group: 'urro', object: boca as THREE.Object3D },
    { name: 'urro', group: 'urro', object: urro as THREE.Object3D },
    { name: 'lego-bloco', group: 'lego', object: legoBloco as THREE.Object3D },
    { name: 'lego-pinos', group: 'lego', object: legoPinos as THREE.Object3D },
  ]

  const build = [
    // 1) O salão do trono brota do subsolo
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Toda manhã o salão do trono se abre: tapete verde estendido no chão…',
    }),
    seq('pilares-rise', 'pilares', 0.15, 0.75, [riseFrom(0, 2.1)], { ease: 'easeOut' }),

    // 2) O REI brota do tapete, já olhando para o lugar do LEGO
    seq('rei-rise', 'rei', 1.7, 0.85, [riseFrom(0.22, 2.4)], {
      ease: 'easeOut',
      caption: '…e brota o REI — "hej" soa RÊI, o rei do cumprimento diário…',
    }),

    // 3) A coroa telescopa de dentro da cabeça
    seq('coroa-pop', 'coroa', 3.3, 0.6, [
      ch('position.y', 0.06, 0.24),
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: 'Coroa dourada no lugar: é o rei em pessoa, educadíssimo.',
    }),

    // 4) A boca escancara (expande do rosto, com overshoot) e o urro atravessa o salão
    seq('boca-pop', 'boca', 4.9, 0.45, [
      ch('scale.x', 0.01, 1.3),
      ch('scale.y', 0.01, 1.3),
      ch('scale.z', 0.01, 1.3),
    ], {
      ease: 'easeOut',
      caption: 'Ele escancara a boca e URRA com rr carioca aspirado: "RÊI! URRA…"',
    }),
    seq('boca-settle', 'boca', 5.35, 0.3, [
      ch('scale.x', 1.3, 1),
      ch('scale.y', 1.3, 1),
      ch('scale.z', 1.3, 1),
    ]),
    seq('urro-cruza', 'urro', 5.55, 0.7, [
      ch('position.x', -0.92, -0.72),
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    // 5) "…É O LEGO?!" — o bloco gigante brota do tapete, de olhos no rei
    seq('lego-bloco-rise', 'lego-bloco', 6.9, 0.85, [riseFrom(0, 1.4)], {
      ease: 'easeOut',
      caption: '"…É O LEGO?!" — o bloco vermelho gigante brota do tapete (lä-GET ~ LEGO-t)…',
    }),
    seq('lego-pinos-rise', 'lego-pinos', 7.85, 0.55, [riseFrom(1.215, 0.5)], { ease: 'easeOut' }),

    // 6) O LEGO dá uma sacudida e ajeita os pininhos para responder
    seq('lego-pinos-ajeita', 'lego-pinos', 9.3, 0.75, [ch('rotation.y', 0.75, 0.75 + Math.PI * 2)], {
      caption: 'O LEGO ajeita os pininhos e responde curto que está tudo bem: "Hej! Hur är läget?"',
    }),
    seq('lego-bloco-squash', 'lego-bloco', 9.3, 0.3, [ch('scale.y', 1, 0.9)], { ease: 'easeOut' }),
    seq('lego-bloco-unsquash', 'lego-bloco', 9.6, 0.35, [ch('scale.y', 0.9, 1)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 2.6, 5.0], target: [0.15, 0.95, 0] },
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
