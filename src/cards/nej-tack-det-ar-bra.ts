import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  person, rbox, capsule, cylinder, sphere, torus, lathe, rock, puff,
  rng, seq, ch, riseFrom,
} from '../rig/helpers'

/**
 * nej-tack-det-ar-bra — "Nej tack, det är bra."
 * O caixa empurra um TACO gigante fumegante por cima do balcão; o cliente de
 * barriga verde estufada ergue a palma espalmada ("NÊI, TACO!") e dá
 * tapinhas na barriga ("DÊ… É BRÁ!").
 *
 * Paleta: creme/madeira clara (piso+balcão) · azul (uniforme/mössa/cestas)
 * · verde (barriga/planta). Acento saturado RESERVADO: dourado #f2b632 do TACO.
 */
const PELE = '#e8c39e'

/**
 * O braço de person() gira pelo MEIO (meio braço sobe acima do ombro quando
 * ele levanta). Aqui o pivô vai para o topo do braço — mesma pose de repouso,
 * mas ao erguer/estender o braço sai inteiro do ombro.
 */
function pivoNoOmbro(arm: THREE.Object3D, height: number) {
  const d = 0.19 * height
  const m = arm as THREE.Mesh
  m.geometry = m.geometry.clone().translate(0, -d, 0)
  m.position.y += d
  for (const c of m.children) c.position.y -= d
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(17)

  // ---------- BASE do diorama: piso de tábuas claras de loja sueca ----------
  const base = new THREE.Group()
  const disco = cylinder(2.55, 2.65, 0.16, '#cfc3ab', { roughness: 0.9 })
  disco.position.y = 0.08
  base.add(disco)

  const tonsTabua = ['#e0d3b8', '#d4c5a5', '#c8b795']
  for (let fila = 0; fila < 10; fila++) {
    const z = -1.62 + fila * 0.36
    let x = -2.1 + rand() * 0.6
    while (x < 2.1) {
      const len = 0.7 + rand() * 0.5
      const cx = x + len / 2
      if (Math.hypot(cx, z) < 2.0) {
        const tabua = rbox(len, 0.035, 0.32, 0.012, tonsTabua[Math.floor(rand() * 3)], { roughness: 0.85 })
        tabua.position.set(cx, 0.175, z)
        base.add(tabua)
      }
      x += len + 0.05
    }
  }

  // adereço 1: vaso de planta (lathe terracota + copa puff)
  const planta = new THREE.Group()
  const vaso = lathe(
    [[0, 0], [0.15, 0], [0.17, 0.04], [0.19, 0.26], [0.15, 0.28], [0, 0.28]],
    '#a2593b', { roughness: 0.75 },
  )
  vaso.position.y = 0.19
  planta.add(vaso)
  const copa = puff(0.26, '#4a8f3c', 6, 23, { roughness: 0.85 })
  copa.position.y = 0.66
  copa.scale.y = 0.85
  planta.add(copa)
  planta.position.set(-1.7, 0, -0.75)
  base.add(planta)

  // adereço 2: pilha de cestas de compras azuis
  const cestas = new THREE.Group()
  const cesta1 = rbox(0.5, 0.15, 0.36, 0.04, '#3f6d8e', { roughness: 0.6 })
  cesta1.position.y = 0.27
  cestas.add(cesta1)
  const cesta2 = rbox(0.5, 0.15, 0.36, 0.04, '#365f7d', { roughness: 0.6 })
  cesta2.position.y = 0.43
  cesta2.rotation.y = 0.18
  cestas.add(cesta2)
  const alca = torus(0.13, 0.018, '#2d4f68', { roughness: 0.55 })
  alca.position.y = 0.53
  cestas.add(alca)
  cestas.position.set(-1.75, 0, 0.35)
  cestas.rotation.y = 0.4
  base.add(cestas)

  // adereço 3: placa de campanha da loja
  const placa = new THREE.Group()
  const pe = cylinder(0.1, 0.13, 0.04, '#7a8590', { roughness: 0.4, metalness: 0.6 })
  pe.position.y = 0.21
  placa.add(pe)
  const haste = cylinder(0.02, 0.02, 0.72, '#7a8590', { roughness: 0.35, metalness: 0.6 })
  haste.position.y = 0.57
  placa.add(haste)
  const quadro = rbox(0.42, 0.3, 0.03, 0.015, '#f5f2ea', { roughness: 0.4 })
  quadro.position.y = 0.97
  placa.add(quadro)
  const selo = cylinder(0.08, 0.08, 0.02, '#4f7d74', { roughness: 0.45 })
  selo.rotation.x = Math.PI / 2
  selo.position.set(-0.09, 0.99, 0.02)
  placa.add(selo)
  placa.position.set(-1.55, 0, 1.0)
  placa.rotation.y = 0.7
  base.add(placa)

  // adereço 4: pirâmide de limas verdes que sobraram de uma promoção
  const limas = new THREE.Group()
  const posLimas: [number, number][] = [[-0.08, 0], [0.08, 0.02], [0, -0.11]]
  for (const [lx, lz] of posLimas) {
    const lima = sphere(0.075, '#6fae53', { roughness: 0.5 })
    lima.position.set(lx + (rand() - 0.5) * 0.02, 0.265, lz)
    limas.add(lima)
  }
  const limaTopo = sphere(0.075, '#7cba5f', { roughness: 0.5 })
  limaTopo.position.set(0, 0.39, -0.03)
  limas.add(limaTopo)
  limas.position.set(-1.55, 0, -1.2)
  base.add(limas)

  base.position.y = 0
  root.add(base)

  // ---------- BALCÃO do caixa (corpo + tampo + terminal de cartão) ----------
  const balcao = new THREE.Group()
  const corpo = rbox(2.3, 0.72, 0.9, 0.05, '#e8dcc8', { roughness: 0.7 })
  corpo.position.y = 0.36
  balcao.add(corpo)
  const tampo = rbox(2.5, 0.08, 1.05, 0.03, '#c79c66', { roughness: 0.5 })
  tampo.position.y = 0.76
  balcao.add(tampo)
  const faixa = rbox(2.32, 0.13, 0.04, 0.015, '#4f7d74', { roughness: 0.6 })
  faixa.position.set(0, 0.18, 0.44)
  balcao.add(faixa)

  const terminal = new THREE.Group()
  const poste = cylinder(0.035, 0.05, 0.1, '#5b6770', { roughness: 0.35, metalness: 0.7 })
  poste.position.y = 0.05
  terminal.add(poste)
  const aparelho = rbox(0.28, 0.2, 0.06, 0.02, '#3d4852', { roughness: 0.45 })
  aparelho.position.y = 0.16
  aparelho.rotation.x = -0.55
  const tela = rbox(0.22, 0.1, 0.02, 0.008, '#9fe8df', {
    roughness: 0.25, emissive: '#7fd8cf', emissiveIntensity: 1.1,
  })
  tela.position.set(0, 0.03, 0.035)
  aparelho.add(tela)
  for (let i = 0; i < 3; i++) {
    const tecla = rbox(0.05, 0.03, 0.015, 0.006, '#8b97a1', { roughness: 0.4 })
    tecla.position.set(-0.07 + i * 0.07, -0.065, 0.033)
    aparelho.add(tecla)
  }
  const recibo = rbox(0.1, 0.14, 0.012, 0.005, '#faf7ef', { roughness: 0.6 })
  recibo.position.set(0, 0.14, -0.03)
  recibo.rotation.x = 0.5
  aparelho.add(recibo)
  terminal.add(aparelho)
  terminal.position.set(-0.75, 0.8, -0.2)
  balcao.add(terminal)

  // a compra do cliente: caixinha de leite já paga
  const leite = rbox(0.16, 0.26, 0.16, 0.02, '#f5f2ea', { roughness: 0.4 })
  leite.position.set(-0.35, 0.93, 0.1)
  balcao.add(leite)
  const tampaLeite = rbox(0.17, 0.06, 0.17, 0.02, '#6d93b8', { roughness: 0.4 })
  tampaLeite.position.set(-0.35, 1.05, 0.1)
  balcao.add(tampaLeite)

  balcao.position.set(0, 0.18, -0.35)
  root.add(balcao)

  // ---------- ATENDENTE atrás do balcão, avental, braço de "toma aqui" ----------
  const atendente = person({ body: '#3f6d8e', skin: PELE, height: 1.42, armAngle: 0.35 })
  const cabecaAt = atendente.getObjectByName('head')!
  const cabelo = puff(0.12, '#5a4632', 5, 12, { roughness: 0.9 })
  cabelo.position.set(0, 0.17, -0.04)
  cabelo.scale.set(1, 0.7, 1)
  cabecaAt.add(cabelo)
  cabecaAt.rotation.x = 0.12 // olhando para o taco no balcão
  const avental = rbox(0.4, 0.48, 0.05, 0.025, '#d9c9a8', { roughness: 0.85 })
  avental.position.set(0, 0.4, 0.235)
  atendente.add(avental)
  const cracha = rbox(0.08, 0.045, 0.012, 0.005, '#f5f2ea', { roughness: 0.35 })
  cracha.position.set(0.11, 0.56, 0.225)
  atendente.add(cracha)
  const bracoOferta = atendente.getObjectByName('armL')!
  bracoOferta.rotation.z = 0.75 // gesto aberto de quem vai oferecer algo
  const bracoCaixa = atendente.getObjectByName('armR')!
  pivoNoOmbro(bracoCaixa, 1.42)
  bracoCaixa.rotation.x = -1.5 // pose final: empurrando o taco
  bracoCaixa.rotation.z = -0.35
  atendente.scale.setScalar(1.22) // alto o bastante para aparecer acima do balcão
  atendente.position.set(0.5, 0.18, -0.95)
  atendente.rotation.y = 0.15 // encarando o cliente
  atendente.rotation.x = 0.12 // pose final: inclinado no empurrão
  root.add(atendente)

  // ---------- CLIENTE de barriga verde estufada, mössa azul ----------
  const cliente = person({ body: '#5f9e4a', skin: PELE, height: 1.58, armAngle: 0.5 })
  const barriga = sphere(0.4, '#6fb757', { roughness: 0.65 })
  barriga.position.set(0, 0.5, 0.28)
  cliente.add(barriga)
  // botões da camisa quase estourando
  const posBotoes: [number, number][] = [[0.34, 0.65], [0.5, 0.69], [0.66, 0.63]]
  for (const [by, bz] of posBotoes) {
    const botao = sphere(0.032, '#f5f2ea', { roughness: 0.35 })
    botao.position.set(0, by, bz)
    cliente.add(botao)
  }
  const cabecaCli = cliente.getObjectByName('head')!
  cabecaCli.rotation.x = 0.06 // encarando o taco
  const mossa = sphere(0.3, '#46628a', { roughness: 0.9 })
  mossa.scale.y = 0.72
  mossa.position.y = 0.17
  cabecaCli.add(mossa)
  const bainha = torus(0.27, 0.045, '#3a5271', { roughness: 0.9 })
  bainha.rotation.x = Math.PI / 2
  bainha.position.y = 0.11
  cabecaCli.add(bainha)
  const pompom = sphere(0.07, '#d9c9a8', { roughness: 0.95 })
  pompom.position.y = 0.4
  cabecaCli.add(pompom)

  // braço da recusa (mão espalmada gigante) — o braço do lado do balcão,
  // erguido entre o rosto e o taco. Dobradiça animada.
  const bracoPare = cliente.getObjectByName('armR')!
  pivoNoOmbro(bracoPare, 1.58)
  bracoPare.rotation.x = -2.6 // pose final: erguido bloqueando o taco
  bracoPare.rotation.z = 0.1
  bracoPare.children[0].visible = false // a palma gigante substitui a mão-luva
  const palma = new THREE.Group()
  const palmaDisco = sphere(0.145, PELE, { roughness: 0.6 })
  palmaDisco.scale.set(1, 1.05, 0.45)
  palma.add(palmaDisco)
  const fanX = [-0.085, -0.03, 0.03, 0.085]
  const fanRot = [0.24, 0.08, -0.08, -0.24]
  for (let i = 0; i < 4; i++) {
    const dedo = capsule(0.033, 0.09, PELE, { roughness: 0.6 })
    dedo.position.set(fanX[i], -0.17, 0)
    dedo.rotation.z = fanRot[i]
    palma.add(dedo)
  }
  const polegar = capsule(0.036, 0.07, PELE, { roughness: 0.6 })
  polegar.position.set(-0.14, -0.03, 0)
  polegar.rotation.z = 1.15
  palma.add(polegar)
  const punho = torus(0.075, 0.025, '#4e8a3c', { roughness: 0.7 })
  punho.rotation.x = Math.PI / 2
  punho.position.y = -0.5
  bracoPare.add(punho)
  palma.position.set(0, -0.68, 0)
  palma.rotation.x = -0.45
  palma.rotation.y = 0.7 // palma virada para a câmera
  palma.scale.setScalar(1.35)
  bracoPare.add(palma)

  // braço do tapinha na barriga (lado da câmera) — dobradiça animada
  const bracoTapinha = cliente.getObjectByName('armL')!
  pivoNoOmbro(bracoTapinha, 1.58)
  bracoTapinha.rotation.x = -1.2 // pose final: mão pousada na barriga
  bracoTapinha.rotation.z = -0.1

  cliente.position.set(0.05, 0.18, 1.2)
  cliente.rotation.y = 2.25 // de frente para o balcão, 3/4 para a câmera
  root.add(cliente)

  // ---------- o TACO gigante de brinde (acento dourado da cena) ----------
  const taco = new THREE.Group()
  const bandeja = cylinder(0.45, 0.5, 0.06, '#f3efe4', { roughness: 0.35 })
  bandeja.position.y = 0.03
  taco.add(bandeja)
  for (const lado of [-1, 1]) {
    const casca = sphere(0.36, '#f2b632', { roughness: 0.5 })
    casca.scale.set(1, 1, 0.16)
    casca.position.set(0, 0.4, lado * 0.115)
    casca.rotation.x = lado * 0.5
    taco.add(casca)
  }
  const carne1 = rock(0.1, '#8a5a3a', 61, { roughness: 0.8 })
  carne1.position.set(-0.14, 0.56, 0.02)
  taco.add(carne1)
  const carne2 = rock(0.09, '#7c4f33', 62, { roughness: 0.8 })
  carne2.position.set(0.1, 0.55, -0.04)
  taco.add(carne2)
  const alface1 = puff(0.09, '#7cba5f', 5, 63, { roughness: 0.85 })
  alface1.position.set(-0.02, 0.6, 0.05)
  taco.add(alface1)
  const alface2 = puff(0.07, '#6fae53', 4, 64, { roughness: 0.85 })
  alface2.position.set(0.18, 0.58, 0.03)
  taco.add(alface2)
  const posTomates: [number, number, number][] = [[0.05, 0.67, -0.02], [-0.13, 0.65, -0.03]]
  for (const [tx, ty, tz] of posTomates) {
    const tomate = sphere(0.055, '#c94f3d', { roughness: 0.45 })
    tomate.position.set(tx, ty, tz)
    taco.add(tomate)
  }
  for (let i = 0; i < 3; i++) {
    const queijo = capsule(0.02, 0.09, '#f6d365', { roughness: 0.5 })
    queijo.position.set(-0.2 + i * 0.17, 0.63, (rand() - 0.5) * 0.08)
    queijo.rotation.z = 1.2 + (rand() - 0.5) * 0.6
    taco.add(queijo)
  }
  taco.position.set(0.28, 0.985, 0.45) // pose final: empurrado sobre a borda
  taco.rotation.y = 0.3
  root.add(taco)

  // vapor quentinho subindo do taco (expande ao servir)
  const vapor = new THREE.Group()
  const nuvem1 = puff(0.1, '#e9eef3', 5, 71, { roughness: 0.95 })
  nuvem1.scale.set(1.2, 0.8, 1.2)
  vapor.add(nuvem1)
  const nuvem2 = puff(0.07, '#eef2f6', 4, 72, { roughness: 0.95 })
  nuvem2.position.set(0.08, 0.22, -0.02)
  vapor.add(nuvem2)
  vapor.position.set(0, 0.86, 0)
  taco.add(vapor)

  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'atendente', group: 'atendente', object: atendente },
    { name: 'braco-caixa', group: 'atendente', object: bracoCaixa },
    { name: 'cliente', group: 'cliente', object: cliente },
    { name: 'braco-pare', group: 'cliente', object: bracoPare },
    { name: 'braco-tapinha', group: 'cliente', object: bracoTapinha },
    { name: 'taco', group: 'taco', object: taco },
    { name: 'vapor', group: 'taco', object: vapor },
  ]

  const build = [
    // ---- cenário ----
    seq('base-rise', 'base', 0.0, 0.7, [riseFrom(0, 1.2)], {
      caption: 'No caixa da loja sueca, hora de pagar e ir embora…',
    }),
    seq('balcao-rise', 'balcao', 0.18, 0.75, [riseFrom(0.18, 1.6)]),

    // ---- atendente ----
    seq('atendente-rise', 'atendente', 1.6, 0.8, [riseFrom(0.18, 1.9)], {
      caption: '…mas o atendente aparece com aquele sorriso de quem vai oferecer algo.',
    }),
    seq('braco-caixa-assenta', 'braco-caixa', 1.62, 0.5, [ch('rotation.z', -1.2, -0.35)], {
      ease: 'easeOut',
    }),

    // ---- cliente infla do chão, barriga estufada ----
    seq('cliente-rise', 'cliente', 3.3, 0.85, [
      riseFrom(0.18, 2.0),
      ch('scale.x', 0.72, 1),
      ch('scale.y', 0.72, 1),
      ch('scale.z', 0.72, 1),
    ], { caption: 'Você chega com a barriga verde estufada — não cabe mais NADA.' }),
    seq('braco-pare-assenta', 'braco-pare', 3.3, 0.5, [ch('rotation.z', 0.9, 0.3)], {
      ease: 'easeOut',
    }),
    seq('braco-tapinha-assenta', 'braco-tapinha', 3.42, 0.5, [ch('rotation.z', -0.9, -0.1)], {
      ease: 'easeOut',
    }),

    // ---- o taco telescopa de dentro do balcão e é empurrado ----
    seq('taco-saca', 'taco', 5.0, 0.8, [ch('position.y', -0.12, 0.985)], {
      ease: 'easeOut',
      caption: 'O caixa saca um TACO mexicano gigante de brinde…',
    }),
    seq('vapor-sobe', 'vapor', 5.2, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('taco-empurra', 'taco', 5.95, 0.7, [ch('position.z', -0.35, 0.45)]),
    seq('atendente-inclina', 'atendente', 5.95, 0.6, [ch('rotation.x', 0, 0.12)]),
    seq('braco-caixa-empurra', 'braco-caixa', 6.0, 0.6, [ch('rotation.x', 0, -1.5)], {
      ease: 'easeOut',
    }),

    // ---- mão espalmada: NÊI, TACO! ----
    seq('braco-pare-ergue', 'braco-pare', 7.4, 0.6, [
      ch('rotation.x', 0, -2.85),
      ch('rotation.z', 0.3, 0.1),
    ], {
      ease: 'easeOut',
      caption: 'Mão espalmada na frente do taco: "NÊI, TACO!" — nej tack, nem taco!',
    }),
    seq('braco-pare-firma', 'braco-pare', 8.15, 0.5, [ch('rotation.x', -2.85, -2.6)]),

    // ---- tapinha na barriga: DÊ… É BRÁ! ----
    seq('braco-tapinha-pousa', 'braco-tapinha', 9.3, 0.6, [ch('rotation.x', 0, -1.2)], {
      caption: 'Tapinha na barriga: "DÊ… É BRÁ!" — tá ótimo assim: Nej tack, det är bra.',
    }),
    seq('tapinha-sobe', 'braco-tapinha', 10.1, 0.35, [ch('rotation.x', -1.2, -0.8)]),
    seq('tapinha-desce', 'braco-tapinha', 10.5, 0.4, [ch('rotation.x', -0.8, -1.2)]),

    // ---- pulinho satisfeito do cliente ----
    seq('cliente-pula', 'cliente', 11.0, 0.35, [ch('position.y', 0.18, 0.32)], {
      ease: 'easeOut',
    }),
    seq('cliente-aterrissa', 'cliente', 11.38, 0.4, [ch('position.y', 0.32, 0.18)], {
      ease: 'easeIn',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.9, 2.25, 1.55], target: [0.15, 1.05, 0.2] },
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
