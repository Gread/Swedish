import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, mat, seq, sphere, riseFrom, ch } from '../rig/helpers'

/**
 * Ha det bra! — o dragão carioca porteiro que ruge "RRRÁ!" e ergue a
 * placa de BRAVO enquanto você sai pelo portal vermelho sob ovação.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Cenário ────────────────────────────────────────────────────────────
  // Calçada: chão cinza-claro da saída.
  const calcada = box(4.8, 0.12, 3.6, '#cfd8dc')
  calcada.position.set(0, 0.06, 0)
  root.add(calcada)

  // Tapete vermelho da saída triunfal, atravessando o portal.
  const tapete = box(0.85, 0.06, 2.5, '#d62828')
  tapete.position.set(0, 0.15, 0.45)
  root.add(tapete)

  // ── Portal vermelho ────────────────────────────────────────────────────
  const colunaEsq = box(0.32, 1.8, 0.34, '#8b1e2d')
  colunaEsq.position.set(-0.72, 1.02, -0.75)
  root.add(colunaEsq)

  const colunaDir = box(0.32, 1.8, 0.34, '#8b1e2d')
  colunaDir.position.set(0.72, 1.02, -0.75)
  root.add(colunaDir)

  const travessa = box(1.9, 0.3, 0.4, '#8b1e2d')
  travessa.position.set(0, 2.07, -0.75)
  root.add(travessa)

  // ── Dragão porteiro (corpo) ────────────────────────────────────────────
  const dragaoCorpo = new THREE.Group()
  const corpo = sphere(0.5, '#43a047')
  corpo.position.set(0, 0.55, 0)
  dragaoCorpo.add(corpo)
  const barriga = sphere(0.36, '#a5d6a7')
  barriga.position.set(-0.18, 0.48, 0)
  dragaoCorpo.add(barriga)
  const rabo = cone(0.14, 0.5, '#2e7d32')
  rabo.rotation.z = -Math.PI / 2 // apex aponta para +x (para trás)
  rabo.position.set(0.62, 0.3, 0)
  dragaoCorpo.add(rabo)
  const peEsq = sphere(0.14, '#2e7d32')
  peEsq.position.set(-0.15, 0.12, 0.28)
  dragaoCorpo.add(peEsq)
  const peDir = sphere(0.14, '#2e7d32')
  peDir.position.set(-0.15, 0.12, -0.28)
  dragaoCorpo.add(peDir)
  dragaoCorpo.position.set(1.35, 0, -0.25)
  root.add(dragaoCorpo)

  // ── Cabeça e focinho do dragão ─────────────────────────────────────────
  const dragaoCabeca = new THREE.Group()
  const cabeca = sphere(0.35, '#43a047')
  dragaoCabeca.add(cabeca)
  const focinho = cone(0.16, 0.42, '#66bb6a')
  focinho.rotation.z = Math.PI / 2 // apex aponta para -x (para a saída)
  focinho.position.set(-0.4, -0.06, 0)
  dragaoCabeca.add(focinho)
  const olhoEsq = sphere(0.055, '#212121')
  olhoEsq.position.set(-0.24, 0.16, 0.15)
  dragaoCabeca.add(olhoEsq)
  const olhoDir = sphere(0.055, '#212121')
  olhoDir.position.set(-0.24, 0.16, -0.15)
  dragaoCabeca.add(olhoDir)
  const crista = cone(0.12, 0.3, '#ff8f00')
  crista.position.set(0.06, 0.42, 0)
  dragaoCabeca.add(crista)
  dragaoCabeca.position.set(1.35, 1.3, -0.25)
  root.add(dragaoCabeca)

  // ── Chama do RRÁ (origem no bico; expande a partir da boca) ────────────
  const chama = new THREE.Group()
  const fogoExterno = new THREE.Mesh(
    new THREE.ConeGeometry(0.2, 0.65, 20),
    mat('#ff6d1f', { emissive: '#ff9e3d' }),
  )
  fogoExterno.rotation.z = Math.PI / 2
  fogoExterno.position.set(-0.36, 0, 0)
  chama.add(fogoExterno)
  const fogoInterno = new THREE.Mesh(
    new THREE.ConeGeometry(0.11, 0.45, 20),
    mat('#ffd166', { emissive: '#ffe08a' }),
  )
  fogoInterno.rotation.z = Math.PI / 2
  fogoInterno.position.set(-0.3, 0, 0)
  chama.add(fogoInterno)
  chama.position.set(0.72, 1.24, -0.25)
  root.add(chama)

  // ── Placa BRAVO ────────────────────────────────────────────────────────
  const placa = new THREE.Group()
  const cabo = cylinder(0.045, 0.045, 0.95, '#8d5a2b')
  cabo.position.set(0, 0.475, 0)
  placa.add(cabo)
  const moldura = box(0.9, 0.6, 0.05, '#f2b134')
  moldura.position.set(0, 1.2, 0)
  placa.add(moldura)
  const quadroBranco = box(0.82, 0.52, 0.06, '#ffffff')
  quadroBranco.position.set(0, 1.2, 0.01)
  placa.add(quadroBranco)
  // "Texto" estilizado do BRAVO! (barras escuras)
  const texto1 = box(0.56, 0.09, 0.02, '#37474f')
  texto1.position.set(-0.05, 1.32, 0.06)
  placa.add(texto1)
  const texto2 = box(0.44, 0.09, 0.02, '#37474f')
  texto2.position.set(-0.11, 1.16, 0.06)
  placa.add(texto2)
  const exclamacao = box(0.09, 0.26, 0.02, '#d62828')
  exclamacao.position.set(0.3, 1.16, 0.06)
  placa.add(exclamacao)
  placa.position.set(1.95, 0.3, 0.3)
  placa.rotation.z = -0.12
  root.add(placa)

  // ── Pessoa saindo ──────────────────────────────────────────────────────
  const pessoa = new THREE.Group()
  const corpoPessoa = cylinder(0.2, 0.24, 0.55, '#3a86ff')
  corpoPessoa.position.set(0, 0.4, 0)
  pessoa.add(corpoPessoa)
  const cabecaPessoa = sphere(0.21, '#f1c27d')
  cabecaPessoa.position.set(0, 0.85, 0)
  pessoa.add(cabecaPessoa)
  const mochila = box(0.26, 0.3, 0.12, '#ff5d8f')
  mochila.position.set(0, 0.5, -0.24)
  pessoa.add(mochila)
  pessoa.position.set(0, 0.15, 0.95)
  root.add(pessoa)

  const parts = [
    { name: 'calcada', group: 'cenario', object: calcada },
    { name: 'tapete', group: 'cenario', object: tapete },
    { name: 'coluna-esq', group: 'portal', object: colunaEsq },
    { name: 'coluna-dir', group: 'portal', object: colunaDir },
    { name: 'travessa', group: 'portal', object: travessa },
    { name: 'dragao-corpo', group: 'dragao', object: dragaoCorpo },
    { name: 'dragao-cabeca', group: 'dragao', object: dragaoCabeca },
    { name: 'chama', group: 'rugido', object: chama },
    { name: 'placa', group: 'bravo', object: placa },
    { name: 'pessoa', group: 'saida', object: pessoa },
  ]

  const build = [
    // Cenário
    seq('calcada-rise', 'calcada', 0, 0.7, [riseFrom(0.06, 0.4)], {
      caption: 'Na Suécia, toda saída tem cerimônia: calçada pronta e tapete vermelho estendido…',
    }),
    seq('tapete-rise', 'tapete', 0.2, 0.6, [riseFrom(0.15, 0.45)]),

    // Portal
    seq('coluna-esq-rise', 'coluna-esq', 1.5, 0.7, [riseFrom(1.02, 2.1)], {
      caption: '…e um portal vermelho: ir embora daqui é um espetáculo.',
    }),
    seq('coluna-dir-rise', 'coluna-dir', 1.65, 0.7, [riseFrom(1.02, 2.1)]),
    seq('travessa-hoist', 'travessa', 2.4, 0.8, [ch('position.y', -0.3, 2.07)]),

    // Dragão porteiro
    seq('dragao-corpo-rise', 'dragao-corpo', 3.5, 0.8, [riseFrom(0, 1.3)], {
      caption: 'O porteiro? Um dragão carioca verde, todo simpático, de plantão na porta.',
    }),
    seq('dragao-cabeca-telescope', 'dragao-cabeca', 4.5, 0.6, [ch('position.y', 0.5, 1.3)]),

    // Rugido de fogo
    seq('chama-expand', 'chama', 5.7, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], {
      caption: "Quando você sai, ele solta um RRRÁ! de fogo quentinho — é o 'Ha' aspirado, como o 'rr' carioca.",
    }),

    // Placa BRAVO
    seq('placa-rise', 'placa', 7.2, 0.8, [riseFrom(0.3, 2.0)], {
      caption: 'E ergue a placa branca: DÊ BRÁvo! Aplausos pra quem vai embora.',
    }),
    seq('placa-erguer', 'placa', 8.1, 0.6, [ch('rotation.z', 0.5, -0.12)]),

    // Pessoa saindo sob ovação
    seq('pessoa-rise', 'pessoa', 9.3, 0.7, [riseFrom(0.15, 1.4)]),
    seq('pessoa-walk', 'pessoa', 10.1, 0.9, [ch('position.z', -0.45, 0.95)], {
      caption: 'Você sai ovacionado: RRÁ! DÊ BRÁ! — Ha det bra! (Fica bem!)',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.3, 3.0, 5.3], target: [0.4, 0.9, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'ha-det-bra',
    contexto: 'Despedida geral: encerrando conversa com vizinho, ao telefone, saindo de loja ou consulta.',
    fraseFonte: 'Fica bem! / Se cuida!',
    fraseAlvo: 'Ha det bra!',
    pronuncia:
      "RRÁ dê BRÁ! (o 'h' de 'ha' é aspirado, como o 'rr' carioca — não é mudo como em português; 'det' vira 'dê')",
    ponteSonora:
      'RRÁ DÊ BRÁ! ~ "RRRÁ! DÊ BRÁ(vo)!" — o \'RRÁ\' é o rugido de fogo do dragão carioca (h aspirado), e \'DÊ BRÁ\' é a plateia mandando "dê um BRAVO!"',
    historia:
      "Na porta de saída de qualquer lugar na Suécia trabalha um dragão carioca de porteiro. Quando você vai embora, ele solta um 'RRRÁ!' de fogo quentinho (é o h aspirado de 'Ha') e ergue uma placa branca de 'BRAVO!', te aplaudindo como se sair pela porta fosse um espetáculo. Despedida sueca é isso: ninguém 'fica bem' sem ovação — RRÁ! DÊ BRÁvo!",
  },
  createScene,
}

export default card
