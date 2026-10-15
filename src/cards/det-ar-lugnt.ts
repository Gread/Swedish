import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { capsule, ch, cylinder, lathe, mat, puff, rbox, riseFrom, rng, seq, sphere } from '../rig/helpers'

/**
 * det-ar-lugnt — "Det är lugnt." (Tranquilo. / Sem problema.)
 * Diorama: padaria sobre um plinto de piso cor de creme. À esquerda, o acidente —
 * bandeja de metal tombada, pães espatifados e um "poof" de farinha. Atrás da mesa,
 * a preguiça padeira de touca branca unta a fôrma em câmera lenta, pincel dourado
 * de manteiga (o acento da cena) gotejando sem pressa nenhuma.
 * Ponte sonora: "DÊÊ... éLE UNTA..." ≈ "det är lugnt".
 */
function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(17)

  // Paleta
  const MADEIRA_CLARA = '#b0763f'
  const MADEIRA_ESCURA = '#8a5a33'
  const PELO = '#8d7b68'
  const PELO_ESCURO = '#7a6957'
  const MANCHA = '#584634'
  const FOCINHO = '#cbb59a'
  const CREME = '#f4efe6'
  const ACO = '#b9c3cc'
  const MANTEIGA = '#f0b429' // acento reservado: a manteiga que ela UNTA

  // ── Base do diorama: piso da padaria + ambientação ───────────────────
  const base = new THREE.Group()

  const piso = cylinder(2.55, 2.65, 0.16, '#dcc7a1', { roughness: 0.9 })
  piso.position.y = 0.08
  base.add(piso)

  // Saco de farinha encostado ao fundo
  const saco = new THREE.Group()
  const sacoCorpo = rbox(0.46, 0.56, 0.38, 0.14, '#e3d7c0', { roughness: 0.95 })
  sacoCorpo.position.y = 0.28
  const sacoGola = cylinder(0.11, 0.14, 0.12, '#d5c7ac', { roughness: 0.95 })
  sacoGola.position.y = 0.58
  const sacoNo = sphere(0.075, '#cbbfa4', { roughness: 0.95 })
  sacoNo.position.y = 0.66
  saco.add(sacoCorpo, sacoGola, sacoNo)
  saco.position.set(-1.45, 0.16, -0.55)
  saco.rotation.z = 0.07
  base.add(saco)

  // Caixote de pães do dia
  const caixote = new THREE.Group()
  const caixa = rbox(0.52, 0.28, 0.4, 0.03, MADEIRA_ESCURA, { roughness: 0.8 })
  caixa.position.y = 0.14
  caixote.add(caixa)
  for (let i = 0; i < 2; i++) {
    const paoCaixa = capsule(0.085, 0.16, i === 0 ? '#c8873f' : '#d9a05b', { roughness: 0.85 })
    paoCaixa.position.set(-0.1 + i * 0.19, 0.3, (i === 0 ? 1 : -1) * 0.05)
    paoCaixa.rotation.z = 0.9 - i * 0.35
    paoCaixa.rotation.x = 0.2
    caixote.add(paoCaixa)
  }
  caixote.position.set(1.72, 0.16, 0.85)
  caixote.rotation.y = -0.4
  base.add(caixote)

  // Poeira de farinha espalhada no piso (rng fixo)
  for (let i = 0; i < 3; i++) {
    const poeira = sphere(0.035 + rand() * 0.02, '#efe8da', { roughness: 0.95 })
    poeira.scale.y = 0.35
    const a = rand() * Math.PI * 2
    const r = 1.0 + rand() * 1.1
    poeira.position.set(Math.cos(a) * r, 0.17, Math.sin(a) * r)
    base.add(poeira)
  }
  root.add(base)

  // ── Mesa de trabalho da padeira ──────────────────────────────────────
  const mesa = new THREE.Group()
  const tampo = rbox(1.7, 0.14, 0.95, 0.05, MADEIRA_CLARA, { roughness: 0.5 })
  tampo.position.y = 0.72
  mesa.add(tampo)
  const saia = rbox(1.34, 0.14, 0.68, 0.03, MADEIRA_ESCURA, { roughness: 0.6 })
  saia.position.y = 0.615
  mesa.add(saia)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const perna = rbox(0.11, 0.66, 0.11, 0.03, MADEIRA_ESCURA, { roughness: 0.6 })
      perna.position.set(sx * 0.6, 0.33, sz * 0.28)
      mesa.add(perna)
    }
  }
  // Rolo de massa esquecido num canto
  const rolo = new THREE.Group()
  const roloCorpo = cylinder(0.05, 0.05, 0.42, '#c08a52', { roughness: 0.45 })
  roloCorpo.rotation.z = Math.PI / 2
  rolo.add(roloCorpo)
  for (const s of [-1, 1]) {
    const cabo = cylinder(0.022, 0.022, 0.1, MADEIRA_ESCURA, { roughness: 0.45 })
    cabo.rotation.z = Math.PI / 2
    cabo.position.x = s * 0.26
    rolo.add(cabo)
  }
  rolo.position.set(-0.55, 0.84, -0.32)
  rolo.rotation.y = 0.25
  mesa.add(rolo)
  // Farinha polvilhada no tampo
  const farinhaTampo = sphere(0.13, '#efe8da', { roughness: 0.95 })
  farinhaTampo.scale.y = 0.07
  farinhaTampo.position.set(0.35, 0.795, 0.22)
  mesa.add(farinhaTampo)
  mesa.position.set(0.68, 0.16, 0.12)
  root.add(mesa)

  // ── O acidente: bandeja tombada, pães, poof de farinha ───────────────
  const bandeja = new THREE.Group()
  const chapa = rbox(0.85, 0.05, 0.6, 0.02, ACO, { roughness: 0.42, metalness: 0.45 })
  bandeja.add(chapa)
  for (const s of [-1, 1]) {
    const borda = rbox(0.85, 0.07, 0.05, 0.02, ACO, { roughness: 0.42, metalness: 0.45 })
    borda.position.set(0, 0.03, s * 0.275)
    bandeja.add(borda)
  }
  bandeja.position.set(-0.98, 0.36, 0.72)
  bandeja.rotation.y = -0.3
  bandeja.rotation.z = 0.5 // caída de lado, apoiada nos pães
  root.add(bandeja)

  const paes = new THREE.Group()
  const paoInteiro = capsule(0.095, 0.2, '#d9a05b', { roughness: 0.85 })
  paoInteiro.rotation.z = Math.PI / 2
  paoInteiro.rotation.y = 0.4
  paoInteiro.position.set(0.12, 0.095, -0.05)
  const paoEspatifado = sphere(0.13, '#c8873f', { roughness: 0.9 })
  paoEspatifado.scale.set(1.3, 0.45, 1.3)
  paoEspatifado.position.set(-0.52, 0.058, 0.08)
  const paoRedondo = sphere(0.105, '#dcaa63', { roughness: 0.85 })
  paoRedondo.position.set(0.3, 0.1, 0.32)
  paes.add(paoInteiro, paoEspatifado, paoRedondo)
  for (let i = 0; i < 3; i++) {
    const migalha = sphere(0.02 + rand() * 0.015, '#c8873f', { roughness: 0.9 })
    migalha.position.set((rand() - 0.5) * 0.9, 0.03, (rand() - 0.5) * 0.8)
    paes.add(migalha)
  }
  paes.position.set(-0.62, 0.16, 0.78)
  root.add(paes)

  const farinha = puff(0.15, '#efe8da', 5, 11, { roughness: 0.95 })
  farinha.position.set(-1.32, 0.3, 1.0)
  root.add(farinha)

  // ── A preguiça padeira ───────────────────────────────────────────────
  const preguica = new THREE.Group()

  const tronco = capsule(0.32, 0.5, PELO)
  tronco.position.y = 0.6
  preguica.add(tronco)

  for (const s of [-1, 1]) {
    const pe = sphere(0.12, PELO_ESCURO)
    pe.scale.set(1, 0.55, 1.3)
    pe.position.set(s * 0.15, 0.055, 0.16)
    preguica.add(pe)
  }

  // Avental de padeira
  const avental = rbox(0.36, 0.44, 0.05, 0.025, CREME, { roughness: 0.9 })
  avental.position.set(0, 0.5, 0.315)
  avental.rotation.x = -0.08
  preguica.add(avental)
  const alcaAvental = capsule(0.015, 0.26, CREME, { roughness: 0.9 })
  alcaAvental.rotation.z = Math.PI / 2
  alcaAvental.position.set(0, 0.76, 0.31)
  preguica.add(alcaAvental)

  // Braço esquerdo pendurado, mole de sono
  const bracoL = capsule(0.095, 0.34, PELO_ESCURO)
  bracoL.position.set(0.38, 0.52, 0.06)
  bracoL.rotation.z = 0.22
  const maoL = sphere(0.1, PELO)
  maoL.position.y = -0.26
  bracoL.add(maoL)
  for (const s of [-1, 1]) {
    const garraL = capsule(0.016, 0.06, '#e8dcc8')
    garraL.position.set(s * 0.032, -0.35, 0.015)
    bracoL.add(garraL)
  }
  preguica.add(bracoL)

  // Braço direito: dobradiça no ombro, desdobra e segura o pincel
  const bracoR = new THREE.Group()
  const bracoRCorpo = capsule(0.095, 0.42, PELO_ESCURO)
  bracoRCorpo.position.y = 0.27
  bracoR.add(bracoRCorpo)
  const maoR = sphere(0.1, PELO)
  maoR.position.y = 0.56
  bracoR.add(maoR)
  for (const s of [-1, 1]) {
    const garraR = capsule(0.016, 0.06, '#e8dcc8')
    garraR.position.set(s * 0.035, 0.63, 0.01)
    bracoR.add(garraR)
  }
  bracoR.position.set(-0.3, 0.8, 0.12)
  bracoR.rotation.x = 1.05
  bracoR.rotation.z = -0.15
  preguica.add(bracoR)

  // Cabeça: telescopa do tronco; olhos de esclera branca sob pálpebras zen
  const cabeca = new THREE.Group()
  const cranio = sphere(0.28, PELO)
  cabeca.add(cranio)
  const focinho = sphere(0.22, FOCINHO)
  focinho.scale.set(1.0, 1.05, 0.55)
  focinho.position.set(0, -0.02, 0.13)
  cabeca.add(focinho)
  for (const s of [-1, 1]) {
    const mancha = sphere(0.07, MANCHA)
    mancha.scale.set(1.0, 2.0, 0.5)
    mancha.rotation.z = s * 0.4 // listra desce pra fora: cara mansa (ao contrário lia como cenho bravo)
    mancha.position.set(s * 0.135, 0.03, 0.22)
    cabeca.add(mancha)
    const esclera = sphere(0.062, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(s * 0.115, 0.02, 0.245)
    const pupila = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(s * 0.115, 0.012, 0.295)
    // pálpebra clara caindo pra fora: olho meio fechado de sono feliz
    // (escura e reta lia como sobrancelha franzida)
    const palpebra = sphere(0.068, FOCINHO)
    palpebra.scale.set(1.12, 0.62, 0.78)
    palpebra.position.set(s * 0.115, 0.05, 0.252)
    palpebra.rotation.z = -s * 0.28
    cabeca.add(esclera, pupila, palpebra)
  }
  const nariz = sphere(0.045, '#463626')
  nariz.scale.set(1.3, 0.8, 0.7)
  nariz.position.set(0, -0.075, 0.26)
  cabeca.add(nariz)
  // sorrisinho curvo (meio toro virado pra baixo)
  const sorriso = new THREE.Mesh(
    new THREE.TorusGeometry(0.05, 0.011, 8, 20, Math.PI),
    mat('#463626', { roughness: 0.5, size: 0.1 }),
  )
  sorriso.rotation.z = Math.PI
  sorriso.position.set(0, -0.12, 0.262)
  cabeca.add(sorriso)
  const touca = lathe(
    [
      [0.27, 0],
      [0.29, 0.05],
      [0.27, 0.11],
      [0.34, 0.19],
      [0.31, 0.27],
      [0.19, 0.33],
      [0.0, 0.36],
    ],
    CREME,
    { roughness: 0.9 },
  )
  touca.position.y = 0.09
  cabeca.add(touca)
  cabeca.position.set(0, 1.26, 0.04)
  cabeca.rotation.z = 0.12 // cabecinha tombada de sono
  preguica.add(cabeca)

  preguica.position.set(0.75, 0.16, -0.66)
  preguica.rotation.y = -0.2 // olhando para a fôrma
  root.add(preguica)

  // ── A untada: fôrma amanteigada + pincel dourado ─────────────────────
  const forma = new THREE.Group()
  const assadeira = rbox(0.72, 0.16, 0.52, 0.05, '#8b98a8', { roughness: 0.3, metalness: 0.65 })
  assadeira.position.y = 0.08
  forma.add(assadeira)
  const camadaManteiga = rbox(0.56, 0.06, 0.38, 0.03, MANTEIGA, { roughness: 0.3 })
  camadaManteiga.position.y = 0.155
  forma.add(camadaManteiga)
  const pires = lathe(
    [
      [0.02, 0],
      [0.14, 0.012],
      [0.16, 0.04],
      [0.125, 0.055],
    ],
    '#eef0ee',
    { roughness: 0.25 },
  )
  pires.position.set(0.56, 0, -0.04)
  forma.add(pires)
  const tablete = rbox(0.16, 0.09, 0.11, 0.025, MANTEIGA, { roughness: 0.35 })
  tablete.position.set(0.56, 0.1, -0.04)
  tablete.rotation.y = 0.35
  forma.add(tablete)
  forma.position.set(0.42, 0.95, 0.16)
  root.add(forma)

  const pincel = new THREE.Group()
  const cerdas = rbox(0.15, 0.13, 0.1, 0.035, MANTEIGA, { roughness: 0.35 })
  pincel.add(cerdas)
  const gota = sphere(0.035, MANTEIGA, { roughness: 0.25 })
  gota.scale.set(1, 1.5, 1)
  gota.position.set(0.02, -0.11, 0.02)
  pincel.add(gota)
  const virola = cylinder(0.045, 0.055, 0.09, '#c9cdd4', { roughness: 0.25, metalness: 0.8 })
  virola.position.y = 0.1
  pincel.add(virola)
  const caboPincel = lathe(
    [
      [0.045, 0],
      [0.05, 0.06],
      [0.035, 0.18],
      [0.03, 0.3],
      [0.045, 0.38],
      [0.04, 0.44],
      [0.015, 0.47],
      [0.0, 0.48],
    ],
    '#8b5a2b',
    { roughness: 0.5 },
  )
  caboPincel.position.y = 0.13
  pincel.add(caboPincel)
  pincel.position.set(0.47, 1.19, 0.14)
  pincel.rotation.x = -0.9 // caído sobre a fôrma, na mão frouxa da preguiça
  root.add(pincel)

  // ── Peças e montagem ─────────────────────────────────────────────────
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'mesa', group: 'cenario', object: mesa },
    { name: 'bandeja', group: 'acidente', object: bandeja },
    { name: 'paes', group: 'acidente', object: paes },
    { name: 'farinha', group: 'acidente', object: farinha },
    { name: 'preguica', group: 'preguica', object: preguica },
    { name: 'cabeca', group: 'preguica', object: cabeca },
    { name: 'bracoR', group: 'preguica', object: bracoR },
    { name: 'forma', group: 'untada', object: forma },
    { name: 'pincel', group: 'untada', object: pincel },
  ]

  const build = [
    // Cenário: o piso da padaria brota com a ambientação, depois a mesa
    seq('base-rise', 'base', 0.0, 0.7, [riseFrom(0, 0.9)], {
      caption: 'Na padaria, você esbarra na preguiça padeira…',
    }),
    seq('mesa-rise', 'mesa', 0.3, 0.75, [riseFrom(0.16, 1.3)]),

    // O acidente: bandeja sobe rasa, tomba; pães e poof de farinha
    seq('bandeja-rise', 'bandeja', 1.6, 0.6, [ch('position.y', -0.18, 0.185)], {
      caption: '…e derruba a bandeja dela: pães espatifados no chão!',
    }),
    seq('bandeja-tomba', 'bandeja', 2.3, 0.7, [
      ch('rotation.z', 0, 0.5),
      ch('position.y', 0.185, 0.36),
    ]),
    seq('paes-caem', 'paes', 2.45, 0.6, [riseFrom(0.16, 0.6)]),
    seq('farinha-poof', 'farinha', 2.55, 0.55, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    // A preguiça: brota, a cabeça telescopa, o braço desdobra, e… sono
    seq('preguica-rise', 'preguica', 3.5, 0.85, [riseFrom(0.16, 1.45)], {
      caption: 'Ela nem pisca. Zen total, tudo em câmera lenta…',
    }),
    seq('cabeca-telescopa', 'cabeca', 4.0, 0.6, [ch('position.y', 0.98, 1.26)], {
      ease: 'easeOut',
    }),
    seq('braco-desdobra', 'bracoR', 4.25, 0.6, [ch('rotation.x', 2.6, 1.05)]),
    seq('cabeca-tomba-de-sono', 'cabeca', 4.85, 0.6, [ch('rotation.z', 0, 0.12)]),

    // A untada eterna: fôrma e pincel telescopam da mesa, braço acompanha
    seq('forma-telescopa', 'forma', 5.4, 0.65, [ch('position.y', 0.78, 0.95)], {
      caption: "…e ela segue no dela, murmurando fanha: 'DÊÊ… éLE UNTA…'",
    }),
    seq('pincel-telescopa', 'pincel', 5.9, 0.65, [ch('position.y', 0.92, 1.19)]),
    seq('pincel-unta-ida', 'pincel', 7.0, 0.9, [
      ch('position.x', 0.47, 0.72),
      ch('rotation.z', 0, -0.18),
    ], { caption: 'O pincel goteja manteiga, sem pressa nenhuma…' }),
    seq('braco-unta-ida', 'bracoR', 7.0, 0.9, [ch('rotation.z', -0.15, -0.43)]),
    seq('pincel-unta-volta', 'pincel', 8.1, 0.9, [
      ch('position.x', 0.72, 0.47),
      ch('rotation.z', -0.18, 0),
    ], {
      caption: "Quem UNTA devagar não se estressa: 'Det är lugnt.' — tranquilo, sem problema.",
    }),
    seq('braco-unta-volta', 'bracoR', 8.1, 0.9, [ch('rotation.z', -0.43, -0.15)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.45, 4.45], target: [0.1, 0.85, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-lugnt',
    contexto: 'Universal: alguém esbarra, pede desculpa, avisa de atraso, pergunta se algo incomoda.',
    fraseFonte: 'Tranquilo. / Sem problema.',
    fraseAlvo: 'Det är lugnt.',
    pronuncia: "dê é LÚNGT ('det' se fala 'dê'; 'är' vira só 'é'; em 'lugnt' o g quase some: 'lúngt')",
    ponteSonora:
      "dê é LÚNT ~ \"DÊÊ... éLE UNTA...\" — emendado, 'é-LUN-ta' ≈ 'är lugnt': o nasal 'un' de 'UNTA' é exatamente o ú nasal de 'lugnt' (solte o 'a' final e o g some sozinho). Nada de 'longo': é UNTA, com u.",
    historia:
      "Você esbarra na preguiça padeira e derruba a bandeja de pães dela no chão. Ela nem pisca: continua UNTANDO a fôrma em câmera lenta, pincel gotejando manteiga, e murmura fanha: 'dêê... éLE UNTA...'. Quem unta devagar não se estressa com nada — tranquilo, sem problema.",
  },
  createScene,
  refine: { organic: ['preguica', 'cabeca', 'bracoR'] },
}

export default card
