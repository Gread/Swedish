import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, seq, sphere, torus, riseFrom, ch } from '../rig/helpers'

/**
 * jag-skulle-vilja-boka-en-tid
 * Cena: o barbeiro viking da VÍLIA carimba, com a BÚca de uma garrafa de
 * SKOL LEve, a hora da sua parTÍD no mostrador do relógio da torre,
 * enquanto você observa ao telefone.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ── Grupo 1: a pracinha da VÍLIA ─────────────────────────────────────
  const chao = box(5.2, 0.12, 3.6, '#7ec850')
  chao.position.set(0, -0.06, 0)
  root.add(chao)

  // ── Grupo 2: torre do relógio ────────────────────────────────────────
  const torre = cylinder(0.32, 0.44, 1.9, '#a8b2bd')
  torre.position.set(-1.35, 0.95, -0.55)
  root.add(torre)

  const relogio = new THREE.Group()
  relogio.position.set(-1.35, 2.0, -0.2)

  const mostrador = cylinder(0.5, 0.5, 0.08, '#ffffff')
  mostrador.rotation.x = Math.PI / 2
  relogio.add(mostrador)

  const aro = torus(0.5, 0.07, '#2f2f2f')
  aro.position.set(0, 0, 0.02)
  relogio.add(aro)

  const ponteiroMinuto = box(0.05, 0.36, 0.03, '#222222')
  ponteiroMinuto.position.set(0, 0.13, 0.055)
  relogio.add(ponteiroMinuto)

  const ponteiroHora = box(0.05, 0.26, 0.03, '#222222')
  ponteiroHora.position.set(0.084, 0.054, 0.055)
  ponteiroHora.rotation.z = -1.0
  relogio.add(ponteiroHora)

  root.add(relogio)

  // ── Grupo 3: o barbeiro viking ───────────────────────────────────────
  const barbeiroCorpo = new THREE.Group()
  barbeiroCorpo.position.set(-0.35, 0, -0.05)

  const avental = cylinder(0.26, 0.33, 0.85, '#e63946')
  avental.position.set(0, 0.43, 0)
  barbeiroCorpo.add(avental)

  const listra1 = torus(0.3, 0.035, '#ffffff')
  listra1.rotation.x = Math.PI / 2
  listra1.position.set(0, 0.28, 0)
  barbeiroCorpo.add(listra1)

  const listra2 = torus(0.285, 0.035, '#ffffff')
  listra2.rotation.x = Math.PI / 2
  listra2.position.set(0, 0.52, 0)
  barbeiroCorpo.add(listra2)

  const braco = box(0.09, 0.55, 0.09, '#e63946')
  braco.position.set(-0.22, 1.0, 0.06)
  braco.rotation.z = 0.12
  barbeiroCorpo.add(braco)

  const mao = sphere(0.07, '#f6cfa0')
  mao.position.set(-0.26, 1.28, 0.06)
  barbeiroCorpo.add(mao)

  root.add(barbeiroCorpo)

  const barbeiroCabeca = new THREE.Group()
  barbeiroCabeca.position.set(-0.35, 1.05, -0.05)

  const rosto = sphere(0.21, '#f6cfa0')
  barbeiroCabeca.add(rosto)

  const barba = cone(0.15, 0.28, '#d9822b')
  barba.position.set(0, -0.16, 0.1)
  barba.rotation.x = Math.PI
  barbeiroCabeca.add(barba)

  const olhoBarbeiro1 = sphere(0.03, '#222222')
  olhoBarbeiro1.position.set(-0.09, 0.04, 0.17)
  barbeiroCabeca.add(olhoBarbeiro1)

  const olhoBarbeiro2 = sphere(0.03, '#222222')
  olhoBarbeiro2.position.set(-0.17, 0.04, 0.09)
  barbeiroCabeca.add(olhoBarbeiro2)

  root.add(barbeiroCabeca)

  const capacete = new THREE.Group()
  capacete.position.set(-0.35, 1.22, -0.05)

  const domo = sphere(0.22, '#8d99ae')
  domo.scale.set(1, 0.7, 1)
  capacete.add(domo)

  const chifreDireito = cone(0.06, 0.22, '#f5f0e6')
  chifreDireito.position.set(0.26, 0.08, 0)
  chifreDireito.rotation.z = -1.2
  capacete.add(chifreDireito)

  const chifreEsquerdo = cone(0.06, 0.22, '#f5f0e6')
  chifreEsquerdo.position.set(-0.26, 0.08, 0)
  chifreEsquerdo.rotation.z = 1.2
  capacete.add(chifreEsquerdo)

  root.add(capacete)

  // ── Grupo 4: a garrafa de SKOL LEve e o carimbo da BÚca ─────────────
  // Aponta +y no espaço local; inclinada (rotation.z = 0.9) a búca toca
  // o mostrador do relógio em (-1.15, 1.84).
  const garrafa = new THREE.Group()
  garrafa.position.set(-0.72, 1.5, -0.1)
  garrafa.rotation.z = 0.9

  const corpoGarrafa = cylinder(0.11, 0.11, 0.5, '#d98e2b')
  garrafa.add(corpoGarrafa)

  const rotulo = cylinder(0.115, 0.115, 0.16, '#f4d35e')
  rotulo.position.set(0, -0.02, 0)
  garrafa.add(rotulo)

  const gargalo = cylinder(0.05, 0.1, 0.2, '#d98e2b')
  gargalo.position.set(0, 0.34, 0)
  garrafa.add(gargalo)

  const buca = cone(0.06, 0.12, '#8a5a13')
  buca.position.set(0, 0.5, 0)
  garrafa.add(buca)

  root.add(garrafa)

  // Marca carimbada no mostrador, exatamente onde a búca encosta.
  const carimbo = torus(0.09, 0.03, '#e8a020')
  carimbo.position.set(-1.15, 1.84, -0.13)
  root.add(carimbo)

  // ── Grupo 5: você ao telefone ────────────────────────────────────────
  const voce = new THREE.Group()
  voce.position.set(1.35, 0, 0.75)

  const corpoVoce = cylinder(0.22, 0.28, 0.8, '#2a6fdb')
  corpoVoce.position.set(0, 0.4, 0)
  voce.add(corpoVoce)

  const cabecaVoce = sphere(0.2, '#f6cfa0')
  cabecaVoce.position.set(0, 0.98, 0)
  voce.add(cabecaVoce)

  const cabelo = sphere(0.21, '#4a3728')
  cabelo.position.set(0, 1.04, -0.02)
  cabelo.scale.set(1, 0.75, 1)
  voce.add(cabelo)

  const olhoVoce1 = sphere(0.03, '#222222')
  olhoVoce1.position.set(-0.18, 1.03, 0.06)
  voce.add(olhoVoce1)

  const olhoVoce2 = sphere(0.03, '#222222')
  olhoVoce2.position.set(-0.18, 1.03, -0.06)
  voce.add(olhoVoce2)

  const bracoVoce = box(0.08, 0.3, 0.08, '#2a6fdb')
  bracoVoce.position.set(0, 0.85, 0.12)
  bracoVoce.rotation.x = -0.4
  voce.add(bracoVoce)

  const telefone = box(0.08, 0.22, 0.14, '#222222')
  telefone.position.set(0, 1.0, 0.17)
  voce.add(telefone)

  root.add(voce)

  const parts = [
    { name: 'chao', group: 'vilia', object: chao },
    { name: 'torre', group: 'torre', object: torre },
    { name: 'relogio', group: 'torre', object: relogio },
    { name: 'barbeiro-corpo', group: 'barbeiro', object: barbeiroCorpo },
    { name: 'barbeiro-cabeca', group: 'barbeiro', object: barbeiroCabeca },
    { name: 'capacete', group: 'barbeiro', object: capacete },
    { name: 'garrafa', group: 'skol', object: garrafa },
    { name: 'carimbo', group: 'skol', object: carimbo },
    { name: 'voce', group: 'voce', object: voce },
  ]

  const build = [
    seq('chao-rise', 'chao', 0.0, 0.7, [riseFrom(-0.06, 0.5)], {
      caption: 'IÁ! Bem-vindo à pracinha da VÍLIA, onde nada acontece sem hora marcada…',
    }),
    seq('torre-rise', 'torre', 1.5, 0.8, [riseFrom(0.95, 2.1)], {
      caption: '…a torre do relógio da VÍLIA guarda o horário de cada parTÍD.',
    }),
    seq('relogio-grow', 'relogio', 2.35, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ]),
    seq('barbeiro-corpo-rise', 'barbeiro-corpo', 3.6, 0.8, [riseFrom(0, 1.6)], {
      caption: "O barbeiro viking só marca horário mediante pedágio: 'uma SKOL LEve!'",
    }),
    seq('barbeiro-cabeca-rise', 'barbeiro-cabeca', 3.8, 0.7, [riseFrom(1.05, 1.4)]),
    seq('capacete-rise', 'capacete', 4.0, 0.7, [riseFrom(1.22, 1.6)]),
    seq('garrafa-rise', 'garrafa', 5.6, 0.8, [riseFrom(1.5, 2.3)], {
      caption: "Você paga a SKOL LEve ('skulle')…",
    }),
    seq('garrafa-stamp', 'garrafa', 6.5, 0.6, [ch('rotation.z', 0.35, 0.9)]),
    seq('carimbo-pop', 'carimbo', 7.05, 0.45, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], {
      caption: '…e a BÚca da garrafa carimba no mostrador a hora EN ponto da sua parTÍD!',
    }),
    seq('voce-rise', 'voce', 8.4, 0.8, [riseFrom(0, 1.4)], {
      caption: "Ao telefone, você pede: 'Jag skulle vilja boka en tid.' — Eu queria marcar um horário.",
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [2.4, 3.0, 5.0], target: [-0.1, 1.1, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-skulle-vilja-boka-en-tid',
    contexto:
      "Ligar para a vårdcentral, dentista, banco, cabeleireiro — tudo na Suécia funciona com 'tid' marcada.",
    fraseFonte: 'Eu queria marcar um horário.',
    fraseAlvo: 'Jag skulle vilja boka en tid.',
    pronuncia: "iá SKÚL-le VÍL-ia BÚ-ka en TÍD ('boka' com u longo: 'búka'; 'tid' com i longo)",
    ponteSonora:
      'iá SKÚL-le VÍL-ia BÚ-ka en TÍD ~ "IÁ! uma SKOL LEve, VÍLIA... a BÚca marca EN... parTÍD!" — sílabas fortes: IÁ-SKOL-LE-VÍLIA-BÚca-EN-TÍD. \'VÍLIA\' dito como o fim de \'faMÍLIA\' trocando o m por v; \'búca\' à caipira, com u; \'parTÍD\' com d final — nunca \'tic\'.',
    historia:
      "Você liga para a barbearia da VÍLIA, mas o barbeiro viking só marca horário mediante pedágio: 'uma SKOL LEve!'. Paga a cerveja, e ele carimba no mostrador do relógio da torre, com a BÚca da garrafa, a hora exata da sua parTÍDa. 'IÁ... SKOL-LE... VÍLIA... BÚca... EN... parTÍD!' — eu queria marcar um horário.",
  },
  createScene,
}

export default card
