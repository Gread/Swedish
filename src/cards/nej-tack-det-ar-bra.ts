import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, seq, sphere, riseFrom, ch } from '../rig/helpers'

/**
 * "Nej tack, det är bra." — Não, obrigado, está bom assim.
 * Cena: o caixa empurra um TACO gigante por cima do balcão; o cliente de
 * barriga verde estufada levanta a mão espalmada ("NÊI, TACO!") e dá um
 * tapinha na barriga ("DÊ… É BRÁ!").
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- cenário -------------------------------------------------------
  const chao = box(4.2, 0.12, 3.4, '#d9d9d9')
  chao.position.set(0, 0.06, 0.15)
  root.add(chao)

  const balcao = box(2.4, 0.9, 0.7, '#9b6a3f')
  balcao.position.set(0, 0.57, -0.2)
  root.add(balcao)

  // ---- atendente (atrás do balcão) -----------------------------------
  const corpoAtendente = cylinder(0.34, 0.4, 0.9, '#3b82f6')
  corpoAtendente.position.set(0, 0.57, -1.0)
  root.add(corpoAtendente)

  const cabecaAtendente = sphere(0.28, '#f6c9a0')
  cabecaAtendente.position.set(0, 1.26, -1.0)
  root.add(cabecaAtendente)

  // ---- cliente (na frente do balcão) ---------------------------------
  const barrigaCliente = sphere(0.55, '#43c34f')
  barrigaCliente.position.set(0, 0.67, 1.2)
  root.add(barrigaCliente)

  const cabecaCliente = sphere(0.26, '#f6c9a0')
  cabecaCliente.position.set(0, 1.48, 1.2)
  root.add(cabecaCliente)

  // ---- o TACO de brinde (deitado, ponta para o cliente) --------------
  const taco = cone(0.28, 0.9, '#ffd24a')
  taco.rotation.x = Math.PI / 2 // ponta (+y) vira +z, apontando para o cliente
  taco.position.set(0, 1.32, 0.35)
  root.add(taco)

  const recheioTaco = sphere(0.22, '#e63946')
  recheioTaco.position.set(0, 1.32, -0.12) // transbordando na boca do cone
  root.add(recheioTaco)

  // ---- a recusa educada ----------------------------------------------
  const maoPare = box(0.36, 0.44, 0.09, '#f6c9a0')
  maoPare.position.set(0, 1.32, 0.92) // espalmada, bloqueando a ponta do taco
  root.add(maoPare)

  const maoTapinha = box(0.28, 0.3, 0.09, '#f6c9a0')
  maoTapinha.position.set(0.3, 0.95, 0.8) // apoiada na frente da barriga
  maoTapinha.rotation.x = -0.35
  root.add(maoTapinha)

  const parts = [
    { name: 'chao', group: 'cenario', object: chao },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'corpo-atendente', group: 'atendente', object: corpoAtendente },
    { name: 'cabeca-atendente', group: 'atendente', object: cabecaAtendente },
    { name: 'barriga-cliente', group: 'cliente', object: barrigaCliente },
    { name: 'cabeca-cliente', group: 'cliente', object: cabecaCliente },
    { name: 'taco', group: 'taco', object: taco },
    { name: 'recheio-taco', group: 'taco', object: recheioTaco },
    { name: 'mao-pare', group: 'recusa', object: maoPare },
    { name: 'mao-tapinha', group: 'recusa', object: maoTapinha },
  ]

  const build = [
    // cenário
    seq('chao-rise', 'chao', 0.0, 0.6, [riseFrom(0.06, 0.5)], {
      caption: 'No caixa da loja sueca, hora de pagar e ir embora…',
    }),
    seq('balcao-rise', 'balcao', 0.15, 0.7, [riseFrom(0.57, 1.3)]),

    // atendente
    seq('corpo-atendente-rise', 'corpo-atendente', 1.6, 0.7, [riseFrom(0.57, 1.3)], {
      caption: '…mas o atendente aparece com aquele sorriso de quem vai oferecer algo.',
    }),
    seq('cabeca-atendente-rise', 'cabeca-atendente', 1.75, 0.7, [riseFrom(1.26, 1.8)]),

    // cliente de barriga cheia (sobe inflando)
    seq(
      'barriga-rise',
      'barriga-cliente',
      3.4,
      0.8,
      [riseFrom(0.67, 1.5), ch('scale.x', 0.7, 1), ch('scale.y', 0.7, 1), ch('scale.z', 0.7, 1)],
      { caption: 'Você chega com a barriga verde estufada — não cabe mais NADA.' },
    ),
    seq('cabeca-cliente-rise', 'cabeca-cliente', 3.55, 0.7, [riseFrom(1.48, 1.9)]),

    // o taco brota do balcão e é empurrado para o cliente
    seq('taco-rise', 'taco', 5.2, 0.7, [ch('position.y', -0.48, 1.32)], {
      caption: 'O caixa saca um TACO mexicano gigante de brinde…',
    }),
    seq('recheio-rise', 'recheio-taco', 5.35, 0.7, [ch('position.y', -0.48, 1.32)]),
    seq('taco-push', 'taco', 6.15, 0.6, [ch('position.z', -0.2, 0.35)]),
    seq('recheio-push', 'recheio-taco', 6.15, 0.6, [ch('position.z', -0.67, -0.12)]),

    // mão espalmada: NÊI, TACO!
    seq('mao-pare-rise', 'mao-pare', 7.5, 0.7, [riseFrom(1.32, 1.7)], {
      caption: 'Mão espalmada na frente do taco: "NÊI, TACO!" — nej tack, nem taco!',
    }),
    seq('mao-pare-thrust', 'mao-pare', 8.3, 0.5, [ch('position.z', 1.04, 0.92)]),

    // tapinha na barriga: DÊ… É BRÁ!
    seq('mao-tapinha-rise', 'mao-tapinha', 9.0, 0.6, [riseFrom(0.95, 1.3)], {
      caption: 'Tapinha na barriga: "DÊ… É BRÁ!" — tá ótimo assim: Nej tack, det är bra.',
    }),
    seq('mao-tapinha-in', 'mao-tapinha', 9.7, 0.5, [ch('position.z', 0.8, 0.9)]),
    seq('mao-tapinha-out', 'mao-tapinha', 10.2, 0.5, [ch('position.z', 0.9, 0.8)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [4.0, 3.0, 4.4], target: [0, 0.9, 0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'nej-tack-det-ar-bra',
    contexto: "Caixa: recusar recibo, cupom, oferta de sócio ('Har du medlemskort?'), ajuda em loja.",
    fraseFonte: 'Não, obrigado, está bom assim.',
    fraseAlvo: 'Nej tack, det är bra.',
    pronuncia: "nêi TAK, dê é BRÁ ('det' se fala 'dê'; 'är' vira só 'é')",
    ponteSonora:
      `"Nej tack, det är bra" ~ "NÊI TAC, DÊ É BRÁ" — "NEM TACO! Dê... é BRÁ(bo) de bom": recusa o taco dando tapinha na barriga, tá brá assim`,
    historia:
      `O caixa te empurra um TACO mexicano gigante de brinde, mas sua barriga já está esférica de tão cheia. Você levanta a mão espalmada: "NÊI, TACO!" (nej tack) e dá um tapinha na barriga verde estufada: "DÊ... É BRÁ!" — tá brá, tá ótimo, não cabe mais nada. Recusar com educação na Suécia = nem taco, tá brá assim.`,
  },
  createScene,
}

export default card
