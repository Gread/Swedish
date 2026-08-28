import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, rock, puff,
} from '../rig/helpers'

/**
 * "Åh, vad tråkigt!" — Ô, VÁ TRÔ-KIT!
 *
 * A morsa mecânica de macacão escorrega pro chão de uma calçada encharcada,
 * abre a boca num Ô enorme e redondo, enfia a nadadeira no KIT de ferramentas
 * e TROCA a sua estrela dourada por uma pedra cinza numa mola. A tampa fecha
 * com um T seco e a estrela AFUNDA na poça.
 *
 * Identidade visual (par negativo de "Vad kul att höra!"): TUDO AFUNDA E
 * ESCORRE. Paleta cinza molhada, nada sobe, o único acento saturado é a
 * estrela dourada — e ela some dentro d'água no fim.
 */

const CONCRETE = '#5c6268' // laje cinza-chumbo
const CONCRETE_DARK = '#3c4148'
const WET = '#5d7686' // água cinza-azulada
const WET_DARK = '#46596a'
const FUR = '#8a8078' // morsa cinza-pardo
const FUR_LIGHT = '#9c9289'
const DENIM = '#4e5f6b' // macacão desbotado
const DENIM_LIGHT = '#5f717d'
const STEEL = '#575e64'
const CHROME = '#9aa1a6'
const IVORY = '#ded6c4' // presas
const RUST = '#8c5f42'
const STONE = '#787f84'
const GOLD = '#f0b429' // ÚNICO acento saturado: a estrela que afunda
const GY = 0.18 // topo da calçada

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(19)

  // ---- base: laje de calçada encharcada -------------------------------------
  const base = new THREE.Group()

  const sub = cylinder(2.58, 2.68, 0.12, CONCRETE_DARK, { roughness: 0.95 })
  sub.position.y = 0.06
  base.add(sub)

  const laje = cylinder(2.5, 2.58, 0.07, CONCRETE, { roughness: 0.8 })
  laje.position.y = 0.145
  base.add(laje)

  // juntas entre as lajes
  for (const [jx, jz, jw, jrot] of [
    [0, -0.9, 3.6, 0],
    [0, 1.5, 3.6, 0],
    [-1.6, 0.2, 3.0, Math.PI / 2],
  ] as const) {
    const seam = rbox(jw, 0.014, 0.055, 0.006, '#474d53', { roughness: 0.9 })
    seam.position.set(jx, 0.182, jz)
    seam.rotation.y = jrot
    base.add(seam)
  }

  // poças menores de ambientação
  for (const [px, pz, pr] of [
    [-1.72, -0.4, 0.32],
    [1.62, -1.05, 0.24],
  ] as const) {
    const spill = cylinder(pr, pr * 0.94, 0.028, WET_DARK, { roughness: 0.08, metalness: 0.55 })
    spill.position.set(px, 0.19, pz)
    spill.rotation.y = rand() * Math.PI
    base.add(spill)
  }

  const pedrinha = rock(0.13, '#6d7378', 31, { roughness: 0.9 })
  pedrinha.position.set(-1.98, 0.24, 0.92)
  pedrinha.rotation.y = rand() * Math.PI
  base.add(pedrinha)

  const mato = puff(0.15, '#5b6357', 5, 32, { roughness: 0.95 })
  mato.position.set(1.92, 0.26, 0.6)
  base.add(mato)

  const jornal = rbox(0.36, 0.03, 0.27, 0.012, '#7b7d78', { roughness: 0.95 })
  jornal.position.set(1.32, 0.2, 1.62)
  jornal.rotation.y = rand() * Math.PI
  base.add(jornal)
  root.add(base)

  // ---- a poça grande: espalha pelo chão -------------------------------------
  const poca = new THREE.Group()
  poca.position.set(-0.15, GY + 0.012, 1.15)

  const agua = cylinder(0.85, 0.8, 0.03, WET, { roughness: 0.06, metalness: 0.6 })
  agua.position.y = 0.015
  poca.add(agua)

  const borda = torus(0.83, 0.035, WET_DARK, { roughness: 0.5 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.012
  borda.scale.y = 0.4
  poca.add(borda)

  for (const [rr, tt] of [[0.42, 0.016], [0.63, 0.012]] as const) {
    const onda = torus(rr, tt, '#8fa7b4', { roughness: 0.1, metalness: 0.4 })
    onda.rotation.x = Math.PI / 2
    onda.position.y = 0.031
    onda.scale.y = 0.35
    poca.add(onda)
  }
  root.add(poca)

  // ---- a morsa de macacão (pose final: já escorregada pro chão) -------------
  const morsa = new THREE.Group()
  morsa.position.set(-0.8, GY, -0.25)
  morsa.rotation.set(0.16, 0.96, 0) // desabada pra frente, olhando pro kit

  const barriga = sphere(0.56, FUR, { roughness: 0.8 })
  barriga.scale.set(1.05, 0.6, 1.15) // espalhada no chão: nada aqui fica em pé
  barriga.position.y = 0.33
  morsa.add(barriga)

  const macacao = cylinder(0.56, 0.63, 0.3, DENIM, { roughness: 0.9 })
  macacao.position.y = 0.19
  morsa.add(macacao)

  const peito = sphere(0.4, FUR, { roughness: 0.8 })
  peito.scale.set(0.95, 0.9, 0.95)
  peito.position.set(0, 0.66, 0.06)
  morsa.add(peito)

  const peitilho = rbox(0.44, 0.34, 0.09, 0.05, DENIM, { roughness: 0.9 })
  peitilho.position.set(0, 0.72, 0.31)
  peitilho.rotation.x = -0.12
  const bolso = rbox(0.18, 0.14, 0.03, 0.02, DENIM_LIGHT, { roughness: 0.9 })
  bolso.position.set(0, -0.05, 0.05)
  peitilho.add(bolso)
  morsa.add(peitilho)

  for (const side of [-1, 1]) {
    const alca = rbox(0.09, 0.44, 0.07, 0.025, DENIM, { roughness: 0.9 })
    alca.position.set(side * 0.15, 0.92, 0.19)
    alca.rotation.x = -0.42
    morsa.add(alca)

    const botao = cylinder(0.036, 0.036, 0.02, CHROME, { roughness: 0.3, metalness: 0.7 })
    botao.rotation.x = Math.PI / 2
    botao.position.set(side * 0.16, 0.85, 0.37)
    morsa.add(botao)
  }

  const cauda = capsule(0.2, 0.16, FUR, { roughness: 0.8 })
  cauda.scale.set(1, 1, 0.4)
  cauda.rotation.x = 1.4
  cauda.position.set(0, 0.13, -0.55)
  morsa.add(cauda)

  // nadadeira esquerda escorregando aberta no chão
  const nadEsq = capsule(0.13, 0.28, FUR, { roughness: 0.8 })
  nadEsq.scale.set(1, 1, 0.55)
  nadEsq.rotation.set(0, -0.3, 1.35)
  nadEsq.position.set(-0.52, 0.11, 0.18)
  morsa.add(nadEsq)

  // nadadeira direita enfiada pra frente, na direção do kit
  const nadDir = capsule(0.12, 0.3, FUR, { roughness: 0.8 })
  nadDir.scale.set(1, 1, 0.6)
  nadDir.rotation.set(2.2, 0, 0)
  nadDir.position.set(0.3, 0.5, 0.28)
  const pingoNad = sphere(0.035, WET, { roughness: 0.08, metalness: 0.5 })
  pingoNad.position.y = -0.29
  nadDir.add(pingoNad)
  morsa.add(nadDir)

  // ---- cabeça (telescopa do corpo; depois afunda) ---------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.88, 0.2)
  cabeca.rotation.x = 0.12 // cabeça baixa

  const cranio = sphere(0.34, FUR, { roughness: 0.8 })
  cranio.scale.set(0.95, 0.88, 1.02)
  cabeca.add(cranio)

  const nariz = sphere(0.055, '#4a4340', { roughness: 0.4 })
  nariz.position.set(0, -0.02, 0.34)
  cabeca.add(nariz)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.19, FUR_LIGHT, { roughness: 0.8 })
    bochecha.scale.set(1, 0.82, 0.85)
    bochecha.position.set(side * 0.14, -0.14, 0.22)
    cabeca.add(bochecha)

    const olho = sphere(0.075, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.15, 0.1, 0.25)
    olho.scale.z = 0.6
    const pupila = sphere(0.036, '#151515', { roughness: 0.2 })
    pupila.position.set(side * 0.15, 0.08, 0.3)
    cabeca.add(olho, pupila)

    // pálpebra pesada cobrindo metade do olho
    const palpebra = sphere(0.083, FUR, { roughness: 0.8 })
    palpebra.scale.set(1, 0.5, 0.62)
    palpebra.position.set(side * 0.15, 0.15, 0.26)
    cabeca.add(palpebra)

    // sobrancelha caída pra fora: cara de "que pena"
    const cenho = rbox(0.15, 0.024, 0.032, 0.01, '#6e675f', { roughness: 0.85 })
    cenho.position.set(side * 0.16, 0.235, 0.27)
    cenho.rotation.z = -side * 0.32
    cabeca.add(cenho)

    // presa apontando pra baixo, pingando
    const presa = cone(0.05, 0.36, IVORY, { roughness: 0.35 })
    presa.position.set(side * 0.26, -0.34, 0.22)
    presa.rotation.set(Math.PI + 0.12, 0, -side * 0.1)
    const pingoPresa = sphere(0.032, WET, { roughness: 0.08, metalness: 0.5 })
    pingoPresa.position.y = 0.21
    presa.add(pingoPresa)
    cabeca.add(presa)

    // bigode escorrido
    for (let j = 0; j < 3; j++) {
      const fio = cylinder(0.008, 0.006, 0.2, '#c9c1b6', { roughness: 0.6 }, 8)
      fio.position.set(side * (0.09 + j * 0.055), -0.22, 0.32 - j * 0.03)
      fio.rotation.set(0.55, 0, side * (0.25 + j * 0.18))
      if (j === 1) {
        const gota = sphere(0.028, WET, { roughness: 0.08, metalness: 0.5 })
        gota.position.y = -0.12
        fio.add(gota)
      }
      cabeca.add(fio)
    }
  }

  // ---- a boca em Ô: toro escuro, grande e redondo ---------------------------
  const boca = new THREE.Group()
  boca.position.set(0, -0.3, 0.29)

  const labio = torus(0.155, 0.062, '#3a2f2a', { roughness: 0.7 })
  boca.add(labio)
  const goela = cylinder(0.152, 0.152, 0.03, '#161210', { roughness: 0.85 })
  goela.rotation.x = Math.PI / 2
  goela.position.z = -0.015
  boca.add(goela)
  cabeca.add(boca)
  morsa.add(cabeca)
  root.add(morsa)

  // ---- kit de ferramentas ---------------------------------------------------
  const kit = new THREE.Group()
  kit.position.set(1.0, GY, 1.0)
  kit.rotation.y = -0.55

  const caixa = rbox(0.76, 0.36, 0.44, 0.05, STEEL, { roughness: 0.45 })
  caixa.position.y = 0.18
  kit.add(caixa)

  const aro = rbox(0.78, 0.05, 0.46, 0.02, '#43494e', { roughness: 0.5 })
  aro.position.y = 0.355
  kit.add(aro)

  for (const side of [-1, 1]) {
    const trava = rbox(0.05, 0.11, 0.03, 0.012, CHROME, { roughness: 0.3, metalness: 0.7 })
    trava.position.set(side * 0.3, 0.3, 0.225)
    kit.add(trava)

    for (const dz of [-1, 1]) {
      const pe = rbox(0.1, 0.05, 0.1, 0.02, '#3d4247', { roughness: 0.6 })
      pe.position.set(side * 0.3, 0.025, dz * 0.15)
      kit.add(pe)
    }
  }

  // chave de boca enferrujada, meio pra fora
  const chave = new THREE.Group()
  chave.position.set(-0.34, 0.33, 0.06)
  chave.rotation.set(0, 0.35, 1.15)
  const haste = rbox(0.06, 0.4, 0.035, 0.02, RUST, { roughness: 0.6, metalness: 0.55 })
  chave.add(haste)
  const bocaChave = rbox(0.12, 0.07, 0.045, 0.015, RUST, { roughness: 0.6, metalness: 0.55 })
  bocaChave.position.y = 0.21
  chave.add(bocaChave)
  for (const side of [-1, 1]) {
    const dente = rbox(0.036, 0.09, 0.045, 0.012, RUST, { roughness: 0.6, metalness: 0.55 })
    dente.position.set(side * 0.04, 0.27, 0)
    chave.add(dente)
  }
  const cabo = rbox(0.09, 0.09, 0.045, 0.02, RUST, { roughness: 0.6, metalness: 0.55 })
  cabo.position.y = -0.21
  chave.add(cabo)
  kit.add(chave)

  // tampa: dobradiça na aresta de trás (pose final = fechada com um T seco)
  const tampa = new THREE.Group()
  tampa.position.set(0, 0.36, -0.22)
  tampa.rotation.x = -0.06

  const tampo = rbox(0.76, 0.09, 0.44, 0.04, STEEL, { roughness: 0.45 })
  tampo.position.set(0, 0.045, 0.22)
  tampa.add(tampo)
  for (const side of [-1, 1]) {
    const poste = rbox(0.032, 0.09, 0.032, 0.012, CHROME, { roughness: 0.3, metalness: 0.7 })
    poste.position.set(side * 0.13, 0.13, 0.22)
    tampa.add(poste)
  }
  const alcaTampa = rbox(0.3, 0.038, 0.038, 0.016, CHROME, { roughness: 0.3, metalness: 0.7 })
  alcaTampa.position.set(0, 0.17, 0.22)
  tampa.add(alcaTampa)
  kit.add(tampa)
  root.add(kit)

  // ---- a troca: pedra cinza montada numa mola --------------------------------
  const pedraMola = new THREE.Group()
  pedraMola.position.set(0.55, GY, 0.55)
  pedraMola.rotation.z = -0.05

  const chapa = cylinder(0.13, 0.15, 0.04, '#4c5257', { roughness: 0.5, metalness: 0.55 })
  chapa.position.y = 0.02
  pedraMola.add(chapa)

  const coilPts: THREE.Vector3[] = []
  for (let i = 0; i <= 60; i++) {
    const t = i / 60
    const a = t * Math.PI * 2 * 4
    coilPts.push(new THREE.Vector3(Math.cos(a) * 0.075, 0.04 + t * 0.28, Math.sin(a) * 0.075))
  }
  const mola = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(coilPts), 90, 0.018, 8, false),
    mat(CHROME, { roughness: 0.35, metalness: 0.7, size: 0.3 }),
  )
  mola.castShadow = true
  mola.receiveShadow = true
  pedraMola.add(mola)

  const pedra = rock(0.17, STONE, 44, { roughness: 0.9 })
  pedra.position.y = 0.46
  pedraMola.add(pedra)
  root.add(pedraMola)

  // ---- a estrela dourada (pose final: meio submersa na poça) ----------------
  const estrela = new THREE.Group()
  estrela.position.set(-0.15, GY + 0.02, 1.15)
  estrela.rotation.set(-Math.PI / 2 + 0.3, 0.5, 0)

  const shape = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? 0.21 : 0.095
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2
    const x = Math.cos(a) * r
    const y = Math.sin(a) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  shape.closePath()
  const starGeo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.05,
    bevelEnabled: true,
    bevelThickness: 0.018,
    bevelSize: 0.018,
    bevelSegments: 2,
  })
  starGeo.center()
  const starMesh = new THREE.Mesh(starGeo, mat(GOLD, { roughness: 0.22, metalness: 0.85, size: 0.42 }))
  starMesh.castShadow = true
  starMesh.receiveShadow = true
  estrela.add(starMesh)
  root.add(estrela)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'poca', group: 'cenario', object: poca },
    { name: 'morsa', group: 'morsa', object: morsa },
    { name: 'cabeca', group: 'morsa', object: cabeca },
    { name: 'boca', group: 'grito', object: boca },
    { name: 'kit', group: 'kit', object: kit },
    { name: 'tampa', group: 'kit', object: tampa },
    { name: 'pedraMola', group: 'troca', object: pedraMola },
    { name: 'estrela', group: 'troca', object: estrela },
  ]

  // ---- montagem --------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Calçada cinza e encharcada: você acaba de contar a má notícia…',
    }),
    seq('poca-spread', 'poca', 1.7, 0.7, [ch('scale.x', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
    }),

    seq('morsa-rise', 'morsa', 3.2, 0.85, [riseFrom(GY + 0.18, 2.0)], {
      ease: 'easeOut',
      caption: '…e chega a morsa de macacão, pesada, molhada, escorregando pro chão…',
    }),
    seq('cabeca-pop', 'cabeca', 3.4, 0.7, [ch('position.y', 0.42, 0.95)], { ease: 'easeOut' }),

    seq(
      'boca-abre',
      'boca',
      5.4,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '…ela abre a boca num Ô enorme e redondo: "Ô, VÁ…"' },
    ),
    seq('morsa-afunda', 'morsa', 5.5, 0.8, [ch('position.y', GY + 0.18, GY), ch('rotation.x', 0, 0.16)], {
      ease: 'easeIn',
    }),
    seq('cabeca-pesa', 'cabeca', 5.6, 0.8, [ch('position.y', 0.95, 0.88), ch('rotation.x', 0, 0.12)], {
      ease: 'easeIn',
    }),

    seq('kit-rise', 'kit', 7.0, 0.85, [riseFrom(GY, 1.2)], {
      ease: 'easeOut',
      caption: '…enfia a nadadeira no KIT de ferramentas: "TRÔ-KIT!" — troque isso aí.',
    }),
    seq('tampa-abre', 'tampa', 7.25, 0.7, [ch('rotation.x', 0, -1.2)], { ease: 'easeOut' }),

    seq('estrela-rise', 'estrela', 8.85, 0.8, [ch('position.y', -0.8, 0.72), ch('rotation.y', -1.6, 0)], {
      ease: 'easeOut',
      caption: '…troca a sua estrela dourada por uma pedra cinza montada numa mola.',
    }),
    seq('pedra-brota', 'pedraMola', 9.0, 0.6, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),
    seq('pedra-bamba', 'pedraMola', 9.65, 0.6, [ch('rotation.z', 0.16, -0.05)]),

    seq('tampa-fecha', 'tampa', 10.4, 0.3, [ch('rotation.x', -1.2, -0.06)], {
      ease: 'easeIn',
      caption: 'A tampa fecha num T seco e a estrela AFUNDA na poça: Åh, vad tråkigt! — "Ah, que pena!"',
    }),
    seq('estrela-afunda', 'estrela', 10.55, 0.9, [ch('position.y', 0.72, GY + 0.02), ch('rotation.y', 0, 0.5)], {
      ease: 'easeIn',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.4, 2.95, 6.0], target: [0.05, 0.8, 0.4] },
  }
}

export const card: Card = {
  meta: {
    id: 'ah-vad-trakigt',
    contexto: 'Alguém conta que ficou doente, perdeu o emprego, o plano foi cancelado.',
    fraseFonte: 'Ah, que pena!',
    fraseAlvo: 'Åh, vad tråkigt!',
    pronuncia: "ô, va TRÔ-kit ('åh' é um ô longo; o -gt final de 'tråkigt' vira só 't')",
    ponteSonora:
      "Ô, VÁ TRÔ-KIT! (4 sílabas, tônica em TRÔ; os dois Ô são fechados e de boca BEM aberta e redonda — o oposto exato do bico apertado de CÜL; TRÔ-KIT = 'troque' com um T seco colado no fim, porque o -gt de tråkigt vira só T, sem 'tchi')",
    historia:
      'Você conta a má notícia e a morsa mecânica de macacão abre a boca num Ô enorme, redondo feito pneu. Ela enfia a nadadeira no kit de ferramentas e faz a única coisa que sabe fazer: Ô, VÁ TRÔ-KIT! — e troca a sua estrelinha dourada por uma pedra cinza montada numa mola. A tampa do kit fecha com um T seco e a estrela afunda na poça.',
  },
  createScene,
}

export default card
