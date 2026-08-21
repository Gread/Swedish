import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  capsule, ch, cone, cylinder, lathe, person, puff, rbox, riseFrom, rock, rng, seq, sphere,
} from '../rig/helpers'

/**
 * Ha det bra! — diorama da saída cerimonial: calçada com tapete vermelho,
 * portal vinho com lampiões, o dragão carioca porteiro que ruge "RRRÁ!" de
 * fogo, ergue a placa dourada de BRAVO! e ovaciona quem vai embora.
 *
 * Paleta: vinho (#7e2130/#a32633), verde-dragão (#4f9a52), cinza-azulado
 * (#b9c2cc) — acento dourado (#e8a33d) reservado à placa BRAVO da ponte sonora.
 */
function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(11)

  // ── Base do diorama: calçada circular + tapete vermelho + ambientação ──
  const base = new THREE.Group()

  const solo = cylinder(2.5, 2.62, 0.16, '#b9c2cc', { roughness: 0.9 })
  solo.position.y = 0.08
  base.add(solo)

  const tapete = rbox(0.85, 0.05, 3.2, 0.02, '#a32633', { roughness: 0.92 })
  tapete.position.set(0, 0.185, 0.35)
  base.add(tapete)

  const arbusto1 = puff(0.16, '#3c7d42', 5, 3, { roughness: 0.85 })
  arbusto1.position.set(-1.75 + (rand() - 0.5) * 0.2, 0.26, -0.6 + (rand() - 0.5) * 0.2)
  base.add(arbusto1)

  const arbusto2 = puff(0.12, '#4a8f3c', 4, 8, { roughness: 0.85 })
  arbusto2.position.set(1.6 + (rand() - 0.5) * 0.2, 0.23, 1.45 + (rand() - 0.5) * 0.2)
  base.add(arbusto2)

  const pedra1 = rock(0.14, '#8b95a3', 5, { roughness: 0.9 })
  pedra1.position.set(-1.5, 0.22, 1.3)
  pedra1.rotation.y = rand() * Math.PI * 2
  base.add(pedra1)

  const pedra2 = rock(0.09, '#9aa3b0', 9, { roughness: 0.9 })
  pedra2.position.set(2.05, 0.19, -0.75)
  pedra2.rotation.y = rand() * Math.PI * 2
  base.add(pedra2)

  const flor = new THREE.Group()
  const caule = cylinder(0.012, 0.016, 0.24, '#3c7d42', { roughness: 0.8 })
  caule.position.y = 0.12
  const petalas = sphere(0.055, '#f0e6d8', { roughness: 0.7 })
  petalas.position.y = 0.26
  const miolo = sphere(0.026, '#c94f3d', { roughness: 0.6 })
  miolo.position.y = 0.3
  flor.add(caule, petalas, miolo)
  flor.position.set(-1.1, 0.16, 1.75)
  base.add(flor)

  base.position.y = 0
  root.add(base)

  // ── Portal vinho da saída triunfal ─────────────────────────────────────
  function coluna(): THREE.Group {
    const g = new THREE.Group()
    const plinto = rbox(0.5, 0.2, 0.52, 0.05, '#5f1722', { roughness: 0.7 })
    plinto.position.y = 0.1
    const fuste = rbox(0.34, 1.66, 0.36, 0.1, '#7e2130', { roughness: 0.6 })
    fuste.position.y = 1.02
    const capitel = rbox(0.46, 0.14, 0.5, 0.05, '#5f1722', { roughness: 0.7 })
    capitel.position.y = 1.9
    g.add(plinto, fuste, capitel)
    return g
  }

  const colunaEsq = coluna()
  colunaEsq.position.set(-0.85, 0.14, -0.75)
  root.add(colunaEsq)

  const colunaDir = coluna()
  colunaDir.position.set(0.85, 0.14, -0.75)
  root.add(colunaDir)

  const travessa = new THREE.Group()
  const viga = rbox(2.4, 0.34, 0.5, 0.1, '#7e2130', { roughness: 0.6 })
  const cimalha = rbox(2.62, 0.12, 0.62, 0.05, '#5f1722', { roughness: 0.7 })
  cimalha.position.y = 0.23
  travessa.add(viga, cimalha)
  for (const side of [-1, 1]) {
    const cordinha = cylinder(0.012, 0.012, 0.12, '#5f1722', { roughness: 0.8 })
    cordinha.position.set(side * 0.75, -0.22, 0.12)
    const lampiao = sphere(0.09, '#ffd489', {
      roughness: 0.3, emissive: '#ffb84d', emissiveIntensity: 1.0,
    })
    lampiao.position.set(side * 0.75, -0.33, 0.12)
    travessa.add(cordinha, lampiao)
  }
  travessa.position.set(0, 2.25, -0.75)
  root.add(travessa)

  // ── Dragão carioca porteiro (corpo, voltado à saída) ───────────────────
  const VERDE = '#4f9a52'
  const VERDE_ESCURO = '#3c7d42'
  const BARRIGA = '#b7dba4'
  const CREME = '#e9dcc0'

  const dragaoCorpo = new THREE.Group()

  const corpo = capsule(0.38, 0.3, VERDE, { roughness: 0.55 })
  corpo.position.y = 0.56
  dragaoCorpo.add(corpo)

  const barriga = capsule(0.28, 0.26, BARRIGA, { roughness: 0.6 })
  barriga.position.set(0, 0.5, 0.16)
  barriga.scale.z = 0.75
  dragaoCorpo.add(barriga)

  for (const side of [-1, 1]) {
    const perna = capsule(0.1, 0.14, VERDE_ESCURO)
    perna.position.set(side * 0.2, 0.16, 0.04)
    const pata = sphere(0.12, VERDE_ESCURO)
    pata.position.set(side * 0.2, 0.07, 0.14)
    pata.scale.set(1, 0.55, 1.15)
    dragaoCorpo.add(perna, pata)

    const braco = capsule(0.08, 0.2, VERDE, { roughness: 0.55 })
    braco.position.set(side * 0.4, 0.72, 0.1)
    braco.rotation.z = -side * 0.85
    const mao = sphere(0.09, BARRIGA)
    mao.position.y = -0.2
    braco.add(mao)
    dragaoCorpo.add(braco)

    const asa = cone(0.26, 0.5, '#2f6e3b', { roughness: 0.6 })
    asa.scale.z = 0.16
    asa.position.set(side * 0.42, 0.88, -0.12)
    asa.rotation.z = -side * 1.0
    dragaoCorpo.add(asa)
  }

  const rabo = new THREE.Group()
  const raboSeg = capsule(0.12, 0.42, VERDE_ESCURO)
  raboSeg.position.y = 0.26
  const raboTip = cone(0.09, 0.22, CREME, { roughness: 0.6 })
  raboTip.position.y = 0.66
  rabo.add(raboSeg, raboTip)
  rabo.position.set(0, 0.32, -0.36)
  rabo.rotation.x = -1.15
  dragaoCorpo.add(rabo)

  const espinhosDorso: [number, number, number][] = [
    [1.02, -0.3, -0.75],
    [0.82, -0.4, -0.95],
    [0.58, -0.44, -1.1],
  ]
  for (const [y, z, rx] of espinhosDorso) {
    const espinho = cone(0.07, 0.16, CREME, { roughness: 0.6 })
    espinho.position.set(0, y, z)
    espinho.rotation.x = rx
    dragaoCorpo.add(espinho)
  }

  dragaoCorpo.position.set(1.35, 0.16, -0.2)
  dragaoCorpo.rotation.y = -0.55 // olha na direção da saída
  root.add(dragaoCorpo)

  // ── Cabeça do dragão (telescopa do corpo; olhos ao padrão person()) ────
  const dragaoCabeca = new THREE.Group()
  const cranio = sphere(0.3, VERDE, { roughness: 0.55 })
  dragaoCabeca.add(cranio)

  const focinho = capsule(0.15, 0.14, BARRIGA, { roughness: 0.6 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.07, 0.28)
  dragaoCabeca.add(focinho)

  for (const side of [-1, 1]) {
    const narina = sphere(0.028, VERDE_ESCURO)
    narina.position.set(side * 0.06, -0.01, 0.46)
    dragaoCabeca.add(narina)

    const esclera = sphere(0.085, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.12, 0.1, 0.255)
    esclera.scale.z = 0.6
    const pupila = sphere(0.04, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.12, 0.1, 0.3)
    dragaoCabeca.add(esclera, pupila)

    const chifre = cone(0.055, 0.16, CREME, { roughness: 0.6 })
    chifre.position.set(side * 0.13, 0.27, -0.03)
    chifre.rotation.z = -side * 0.3
    dragaoCabeca.add(chifre)
  }

  const crista = cone(0.07, 0.2, CREME, { roughness: 0.6 })
  crista.position.set(0, 0.22, -0.2)
  crista.rotation.x = -0.6
  dragaoCabeca.add(crista)

  dragaoCabeca.position.set(1.32, 1.36, -0.14)
  dragaoCabeca.rotation.y = -0.8 // encara quem está saindo
  root.add(dragaoCabeca)

  // ── Chama do RRRÁ (expande a partir da boca) ───────────────────────────
  const chama = new THREE.Group()
  const fogoExterno = cone(0.17, 0.55, '#e0662f', {
    roughness: 0.4, emissive: '#ff8a3d', emissiveIntensity: 1.2,
  })
  fogoExterno.rotation.x = Math.PI / 2
  fogoExterno.position.z = 0.3
  const fogoMeio = cone(0.11, 0.4, '#f7a53c', {
    roughness: 0.4, emissive: '#ffc266', emissiveIntensity: 1.3,
  })
  fogoMeio.rotation.x = Math.PI / 2
  fogoMeio.position.z = 0.26
  const fogoInterno = cone(0.06, 0.28, '#ffe08a', {
    roughness: 0.35, emissive: '#fff1bd', emissiveIntensity: 1.5,
  })
  fogoInterno.rotation.x = Math.PI / 2
  fogoInterno.position.z = 0.2
  chama.add(fogoExterno, fogoMeio, fogoInterno)

  const faisca1 = sphere(0.035, '#ffd166', { emissive: '#ffe08a', emissiveIntensity: 1.4 })
  faisca1.position.set(0.06, 0.08, 0.62)
  const faisca2 = sphere(0.025, '#ffd166', { emissive: '#ffe08a', emissiveIntensity: 1.4 })
  faisca2.position.set(-0.05, -0.04, 0.56)
  chama.add(faisca1, faisca2)

  const fumaca = puff(0.07, '#aab3bf', 4, 21, { roughness: 0.95 })
  fumaca.position.set(0.03, 0.16, 0.6)
  chama.add(fumaca)

  chama.position.set(0.96, 1.29, 0.21)
  chama.rotation.set(0.12, -0.8, 0)
  root.add(chama)

  // ── Placa BRAVO! (acento dourado da ponte sonora) ──────────────────────
  const placa = new THREE.Group()
  const cabo = cylinder(0.04, 0.05, 1.0, '#8d5a2b', { roughness: 0.7 })
  cabo.position.y = 0.5
  placa.add(cabo)

  const moldura = rbox(0.95, 0.65, 0.07, 0.03, '#e8a33d', { roughness: 0.3, metalness: 0.35 })
  moldura.position.y = 1.28
  const quadro = rbox(0.84, 0.54, 0.08, 0.02, '#f7f2e7', { roughness: 0.4 })
  quadro.position.y = 1.28
  placa.add(moldura, quadro)

  const texto1 = rbox(0.5, 0.09, 0.02, 0.01, '#3b4252', { roughness: 0.6 })
  texto1.position.set(-0.06, 1.38, 0.05)
  const texto2 = rbox(0.4, 0.09, 0.02, 0.01, '#3b4252', { roughness: 0.6 })
  texto2.position.set(-0.1, 1.22, 0.05)
  const exclamacaoBarra = rbox(0.08, 0.17, 0.02, 0.01, '#c94f3d', { roughness: 0.6 })
  exclamacaoBarra.position.set(0.27, 1.36, 0.05)
  const exclamacaoPonto = rbox(0.08, 0.07, 0.02, 0.01, '#c94f3d', { roughness: 0.6 })
  exclamacaoPonto.position.set(0.27, 1.16, 0.05)
  placa.add(texto1, texto2, exclamacaoBarra, exclamacaoPonto)

  placa.position.set(1.8, 0.16, 0.35)
  placa.rotation.y = -0.45
  placa.rotation.z = -0.08 // pose final: erguida
  root.add(placa)

  // ── Pessoa saindo ovacionada ───────────────────────────────────────────
  const pessoa = person({ body: '#3f6db5', skin: '#e8c39e', height: 1.5 })

  const mochila = rbox(0.32, 0.4, 0.16, 0.05, '#c94f3d', { roughness: 0.85 })
  mochila.position.set(0, 0.55, -0.3)
  pessoa.add(mochila)

  const cabecaPessoa = pessoa.getObjectByName('head')!
  const gorro = lathe(
    [[0.295, 0], [0.305, 0.07], [0.26, 0.17], [0.15, 0.26], [0.001, 0.3]],
    '#9c2b38',
    { roughness: 0.9 },
  )
  gorro.position.y = 0.04
  const pompom = sphere(0.06, '#f0e6d8', { roughness: 0.95 })
  pompom.position.y = 0.38
  cabecaPessoa.add(gorro, pompom)

  const bracoAceno = pessoa.getObjectByName('armR')!
  bracoAceno.rotation.z = -2.3 // acena tchau para o dragão

  pessoa.position.set(0, 0.21, 1.1)
  pessoa.rotation.y = 0.15
  root.add(pessoa)

  // ── Peças e montagem ───────────────────────────────────────────────────
  const parts = [
    { name: 'base', group: 'cenario', object: base },
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
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Na Suécia, toda saída tem cerimônia: calçada pronta e tapete vermelho estendido…',
    }),

    // Portal
    seq('coluna-esq-rise', 'coluna-esq', 1.3, 0.7, [riseFrom(0.14, 2.2)], {
      caption: '…e um portal vermelho: ir embora daqui é um espetáculo.',
    }),
    seq('coluna-dir-rise', 'coluna-dir', 1.45, 0.7, [riseFrom(0.14, 2.2)]),
    seq('travessa-hoist', 'travessa', 2.3, 0.8, [ch('position.y', -0.6, 2.25)]),

    // Dragão porteiro
    seq('dragao-corpo-rise', 'dragao-corpo', 3.3, 0.8, [riseFrom(0.16, 1.6)], {
      caption: 'O porteiro? Um dragão carioca verde, todo simpático, de plantão na porta.',
    }),
    seq('dragao-cabeca-telescope', 'dragao-cabeca', 4.2, 0.6, [ch('position.y', 0.75, 1.36)], {
      ease: 'easeOut',
    }),

    // Rugido de fogo
    seq('chama-expand', 'chama', 5.3, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: "Quando você sai, ele solta um RRRÁ! de fogo quentinho — é o 'Ha' aspirado, como o 'rr' carioca.",
    }),

    // Placa BRAVO
    seq('placa-rise', 'placa', 6.9, 0.8, [riseFrom(0.16, 2.0)], {
      caption: 'E ergue a placa branca: DÊ BRÁvo! Aplausos pra quem vai embora.',
    }),
    seq('placa-erguer', 'placa', 7.8, 0.6, [ch('rotation.z', 0.85, -0.08)], { ease: 'easeOut' }),

    // Pessoa saindo sob ovação
    seq('pessoa-rise', 'pessoa', 8.9, 0.7, [riseFrom(0.21, 1.9)]),
    seq('pessoa-walk', 'pessoa', 9.7, 0.9, [ch('position.z', -0.5, 1.1)], {
      caption: 'Você sai ovacionado: RRÁ! DÊ BRÁ! — Ha det bra! (Fica bem!)',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.7, 3.0, 5.5], target: [0.55, 1.0, 0.1] },
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
