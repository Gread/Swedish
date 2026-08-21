import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, sphere, torus, seq, ch, riseFrom } from '../rig/helpers'

/**
 * "Kan du ta det en gång till?" — o KANGURU (kan-du) surdo grita "TÁ? DÊ!"
 * e taca a baqueta no GONGO dourado com um TIL (~) preto no centro.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- cenário -------------------------------------------------------------
  const chao = box(5.0, 0.2, 3.6, '#5fbf4a')
  chao.position.set(0, -0.1, 0)
  root.add(chao)

  // ---- canguru (à esquerda, virado para o gongo em +x) ---------------------
  const corpo = new THREE.Group()
  const tronco = cone(0.6, 1.5, '#a9672f')
  tronco.position.set(0, 0.75, 0)
  corpo.add(tronco)
  const barriga = sphere(0.26, '#e2bd8c')
  barriga.position.set(0.3, 0.62, 0)
  barriga.scale.set(0.7, 1.1, 0.9)
  corpo.add(barriga)
  const rabo = cone(0.15, 0.6, '#a9672f')
  rabo.position.set(-0.55, 0.15, 0)
  rabo.rotation.z = 1.2
  corpo.add(rabo)
  corpo.position.set(-1.3, 0, 0)
  root.add(corpo)

  const cabeca = new THREE.Group()
  const cranio = sphere(0.4, '#a9672f')
  cabeca.add(cranio)
  const focinho = sphere(0.18, '#c98a4b')
  focinho.position.set(0.32, -0.05, 0)
  cabeca.add(focinho)
  const nariz = sphere(0.06, '#1a1a1a')
  nariz.position.set(0.48, -0.03, 0)
  cabeca.add(nariz)
  const olhoEsq = sphere(0.06, '#1a1a1a')
  olhoEsq.position.set(0.33, 0.14, 0.17)
  cabeca.add(olhoEsq)
  const olhoDir = sphere(0.06, '#1a1a1a')
  olhoDir.position.set(0.33, 0.14, -0.17)
  cabeca.add(olhoDir)
  cabeca.position.set(-1.3, 1.7, 0)
  root.add(cabeca)

  const orelhas = new THREE.Group()
  const orelhaFrente = cone(0.12, 0.5, '#a9672f')
  orelhaFrente.position.set(-0.05, 0.25, 0.2)
  orelhaFrente.rotation.x = 0.3
  orelhas.add(orelhaFrente)
  const orelhaFundo = cone(0.12, 0.5, '#a9672f')
  orelhaFundo.position.set(-0.05, 0.25, -0.2)
  orelhaFundo.rotation.x = -0.3
  orelhas.add(orelhaFundo)
  orelhas.position.set(-1.3, 2.0, 0)
  root.add(orelhas)

  // ---- portal do gongo (à direita) -----------------------------------------
  const moldura = new THREE.Group()
  const posteEsq = box(0.16, 2.3, 0.16, '#7a4a21')
  posteEsq.position.set(-0.85, 1.15, 0)
  moldura.add(posteEsq)
  const posteDir = box(0.16, 2.3, 0.16, '#7a4a21')
  posteDir.position.set(0.85, 1.15, 0)
  moldura.add(posteDir)
  const travessa = box(1.86, 0.16, 0.16, '#7a4a21')
  travessa.position.set(0, 2.33, 0)
  moldura.add(travessa)
  moldura.position.set(1.35, 0, 0)
  root.add(moldura)

  const gongo = new THREE.Group()
  const disco = cylinder(0.75, 0.75, 0.12, '#f0b429', 40)
  disco.rotation.x = Math.PI / 2
  disco.position.set(0, 1.35, 0)
  gongo.add(disco)
  const cordaEsq = cylinder(0.025, 0.025, 0.24, '#5a3617', 10)
  cordaEsq.position.set(-0.3, 2.14, 0)
  gongo.add(cordaEsq)
  const cordaDir = cylinder(0.025, 0.025, 0.24, '#5a3617', 10)
  cordaDir.position.set(0.3, 2.14, 0)
  gongo.add(cordaDir)
  gongo.position.set(1.35, 0, 0)
  root.add(gongo)

  // ---- detalhes finais: o TIL no gongo e a baqueta do canguru --------------
  const til = torus(0.2, 0.055, '#1a1a1a')
  til.position.set(1.35, 1.35, 0.09)
  root.add(til)

  const baqueta = new THREE.Group()
  const pata = sphere(0.12, '#a9672f')
  baqueta.add(pata)
  const cabo = cylinder(0.05, 0.05, 0.95, '#e8d5a8', 12)
  cabo.position.set(0, 0.45, 0)
  baqueta.add(cabo)
  const ponta = sphere(0.14, '#e03131')
  ponta.position.set(0, 0.95, 0)
  baqueta.add(ponta)
  baqueta.position.set(-0.6, 1.2, 0.3)
  baqueta.rotation.z = -0.7
  root.add(baqueta)

  const parts = [
    { name: 'chao', group: 'cenario', object: chao },
    { name: 'corpo_canguru', group: 'canguru', object: corpo },
    { name: 'cabeca_canguru', group: 'canguru', object: cabeca },
    { name: 'orelhas', group: 'canguru', object: orelhas },
    { name: 'moldura_gongo', group: 'gongo', object: moldura },
    { name: 'gongo', group: 'gongo', object: gongo },
    { name: 'til', group: 'detalhe', object: til },
    { name: 'baqueta', group: 'detalhe', object: baqueta },
  ]

  const build = [
    seq('chao-rise', 'chao', 0, 0.7, [riseFrom(-0.1, 0.7)], {
      caption: 'Na recepção, brota um gramado verde do chão…',
    }),
    seq('corpo-rise', 'corpo_canguru', 1.6, 0.8, [riseFrom(0, 1.7)], {
      caption: '…e sobe o KANGURU recepcionista (KAN-DU), surdo como uma porta…',
    }),
    seq('cabeca-rise', 'cabeca_canguru', 1.75, 0.8, [riseFrom(1.7, 2.4)]),
    seq('orelhas-rise', 'orelhas', 1.95, 0.6, [riseFrom(2.0, 2.8)]),
    seq('moldura-rise', 'moldura_gongo', 3.4, 0.8, [riseFrom(0, 2.6)]),
    seq('gongo-rise', 'gongo', 3.55, 0.9, [riseFrom(0, 2.5)], {
      caption: '…ele grita "TÁ?! DÊ!" e ergue-se um GONGO dourado gigante (gång = GONGO)…',
    }),
    seq(
      'til-pop',
      'til',
      5.4,
      0.6,
      [ch('scale.x', 0, 1), ch('scale.y', 0, 1), ch('scale.z', 0, 1)],
      { caption: '…com um TIL (~) preto pintado bem no centro: en gång TILL!' },
    ),
    seq('baqueta-rise', 'baqueta', 5.55, 0.8, [riseFrom(1.2, 2.6)]),
    seq('baqueta-cock', 'baqueta', 6.9, 0.7, [ch('rotation.z', 0, -0.7)], {
      caption: '…baqueta erguida pra tacar no gongo DE NOVO — toca o GONGO mais uma vez!',
    }),
    seq('gongo-ring-a', 'gongo', 8.1, 0.5, [ch('rotation.y', 0, 0.12)], {
      caption: 'Kan du ta det en gång till? — "Você pode repetir (mais uma vez)?"',
    }),
    seq('gongo-ring-b', 'gongo', 8.6, 0.5, [ch('rotation.y', 0.12, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 3.0, 6.0], target: [0.1, 1.1, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-ta-det-en-gang-till',
    contexto: 'Qualquer conversa: caixa, balcão, telefone com banco, número ditado rápido demais.',
    fraseFonte: 'Você pode repetir (mais uma vez)?',
    fraseAlvo: 'Kan du ta det en gång till?',
    pronuncia: "kan dü TÁ dê en GONG til ('du' com u de bico: 'dü'; 'gång' soa como 'gong' de sino)",
    ponteSonora:
      '"Kan du ta det en gång till" ~ "KAN-DU, TÁ? DÊ EN GONGO, TIL!" — o KANGURU (kan-du) surdo grita "TÁ? DÊ!" e taca no GONGO (gång) que tem um TIL (~) pintado no meio',
    historia:
      'Um canguru recepcionista é surdo como uma porta. Toda vez que alguém fala com ele, ele grita "KAN-DU?! TÁ? DÊ!" e taca a baqueta num GONGO dourado gigante com um TIL (~) preto no centro. O gongo soando é o sinal universal de "repete tudo, mais uma vez!". Bater o gongo de novo (en GONG til) = "pode repetir mais uma vez?".',
  },
  createScene,
}

export default card
