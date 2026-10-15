import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Kan du ta det en gång till?" — o KANGURU (kan-du) surdo grita "TÁ? DÊ!"
 * e taca a baqueta no GONGO dourado com um TIL (~) preto no centro.
 *
 * Diorama: gramado de recepção; canguru recepcionista à esquerda (crachá no
 * peito, pata erguida), gongo de latão pendurado num pórtico de madeira à
 * direita, baqueta que arma, taca e faz o gongo balançar.
 */

const FUR = '#a9672f'
const FUR_LIGHT = '#c98a4b'
const SKIN = '#e8c39e'
const PAW = '#8a5228'
const WOOD = '#6e4a28'
const WOOD_LIGHT = '#8a6a42'
const GOLD = '#f0b429' // acento reservado: o GONGO
const BRASS = '#c8922e'
const GY = 0.18 // topo da base do diorama

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(7)

  // ---- base do diorama -----------------------------------------------------
  const base = new THREE.Group()

  const soil = cylinder(2.62, 2.72, 0.12, '#6b5138', { roughness: 0.95 })
  soil.position.y = 0.06
  base.add(soil)

  const grass = cylinder(2.55, 2.62, 0.07, '#4a8f3c', { roughness: 0.9 })
  grass.position.y = 0.145
  base.add(grass)

  // tablado de madeira sob o gongo
  const deck = cylinder(0.95, 1.02, 0.05, WOOD_LIGHT, { roughness: 0.8 })
  deck.position.set(1.35, GY + 0.005, -0.15)
  base.add(deck)

  // adereços espalhados com rng fixo
  const rockA = rock(0.16, '#8d9296', 11, { roughness: 0.9 })
  rockA.position.set(-2.05, GY + 0.06, 0.75)
  rockA.rotation.y = rand() * Math.PI
  base.add(rockA)

  const rockB = rock(0.1, '#7e8489', 12, { roughness: 0.9 })
  rockB.position.set(1.85, GY + 0.04, 1.35)
  rockB.rotation.y = rand() * Math.PI
  base.add(rockB)

  const bushA = puff(0.2, '#3f7d33', 6, 13, { roughness: 0.9 })
  bushA.position.set(-0.9, GY + 0.14, -1.75)
  base.add(bushA)

  const bushB = puff(0.16, '#457f38', 5, 14, { roughness: 0.9 })
  bushB.position.set(2.0, GY + 0.12, -1.05)
  base.add(bushB)

  for (const [fx, fz] of [[-1.85, -0.85], [0.55, 1.7]] as const) {
    const stem = cylinder(0.012, 0.018, 0.22, '#3f7d33', { roughness: 0.9 })
    stem.position.set(fx, GY + 0.11, fz)
    stem.rotation.z = (rand() - 0.5) * 0.25
    const head = sphere(0.05, '#efe6d4', { roughness: 0.7 })
    head.position.y = 0.13
    const core = sphere(0.024, FUR_LIGHT, { roughness: 0.6 })
    core.position.y = 0.16
    stem.add(head, core)
    base.add(stem)
  }
  root.add(base)

  // ---- canguru recepcionista (olha para o gongo, +z local) -----------------
  const canguru = new THREE.Group()
  canguru.position.set(-1.25, GY, 0.1)
  canguru.rotation.y = 0.95 // três-quartos: barriga e crachá para a plateia

  const torso = capsule(0.29, 0.47, FUR, { roughness: 0.75 })
  torso.position.y = 0.68
  canguru.add(torso)

  const belly = capsule(0.17, 0.26, SKIN, { roughness: 0.8 })
  belly.position.set(0, 0.62, 0.165)
  belly.scale.z = 0.55
  canguru.add(belly)

  // crachá de recepcionista
  const tag = rbox(0.14, 0.1, 0.03, 0.012, '#3b5a78', { roughness: 0.35 })
  tag.position.set(0.11, 0.88, 0.25)
  tag.rotation.y = 0.35
  const tagLine = rbox(0.09, 0.02, 0.012, 0.005, '#e8e4da', { roughness: 0.4 })
  tagLine.position.z = 0.015
  tag.add(tagLine)
  canguru.add(tag)

  const tail = capsule(0.11, 0.52, FUR, { roughness: 0.75 })
  tail.position.set(0, 0.3, -0.46)
  tail.rotation.x = -1.15
  canguru.add(tail)

  for (const side of [-1, 1]) {
    const haunch = sphere(0.2, FUR, { roughness: 0.75 })
    haunch.position.set(side * 0.235, 0.3, 0)
    haunch.scale.set(0.8, 1.15, 1)
    canguru.add(haunch)

    const foot = capsule(0.08, 0.24, PAW, { roughness: 0.8 })
    foot.position.set(side * 0.21, 0.09, 0.22)
    foot.rotation.x = Math.PI / 2
    canguru.add(foot)
  }

  // braço esquerdo caído, braço direito erguido segurando a baqueta
  const armL = capsule(0.065, 0.22, FUR, { roughness: 0.75 })
  armL.position.set(-0.32, 0.74, 0.09)
  armL.rotation.set(0.25, 0, 0.45)
  const handL = sphere(0.075, PAW, { roughness: 0.75 })
  handL.position.y = -0.17
  armL.add(handL)
  canguru.add(armL)

  const armR = capsule(0.065, 0.22, FUR, { roughness: 0.75 })
  armR.position.set(0.32, 0.8, 0.11)
  armR.rotation.set(0.95, 0, -0.25)
  const handR = sphere(0.075, PAW, { roughness: 0.75 })
  handR.position.y = 0.17
  armR.add(handR)
  canguru.add(armR)

  // cabeça telescopa de dentro do tronco (peça própria)
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.38, 0.12)
  cabeca.rotation.y = 0.55 // o olhar vai para o gongo

  const skull = sphere(0.27, FUR, { roughness: 0.75 })
  skull.scale.set(0.92, 1, 0.95)
  cabeca.add(skull)

  const muzzle = sphere(0.145, FUR_LIGHT, { roughness: 0.75 })
  muzzle.position.set(0, -0.07, 0.21)
  muzzle.scale.set(0.85, 0.72, 1.15)
  cabeca.add(muzzle)

  const nose = sphere(0.045, '#3a2a20', { roughness: 0.35 })
  nose.position.set(0, -0.015, 0.36)
  cabeca.add(nose)

  // olhos no padrão person(): esclera achatada + pupila
  for (const side of [-1, 1]) {
    const eye = sphere(0.062, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.115, 0.065, 0.23)
    eye.scale.z = 0.6
    const pupil = sphere(0.03, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.115, 0.065, 0.275)
    cabeca.add(eye, pupil)

    const ear = capsule(0.062, 0.25, FUR, { roughness: 0.75 })
    ear.position.set(side * 0.145, 0.4, -0.03)
    ear.rotation.set(-0.15, 0, -side * 0.28)
    ear.scale.z = 0.6
    const inner = capsule(0.03, 0.14, SKIN, { roughness: 0.8 })
    inner.position.set(0, 0.02, 0.05)
    ear.add(inner)
    cabeca.add(ear)
  }
  canguru.add(cabeca)
  root.add(canguru)

  // ---- pórtico do gongo ----------------------------------------------------
  const gongoRoot = new THREE.Group()
  gongoRoot.position.set(1.35, GY, -0.15)
  gongoRoot.rotation.y = -0.95
  root.add(gongoRoot)

  const moldura = new THREE.Group()
  for (const side of [-1, 1]) {
    const post = rbox(0.18, 2.35, 0.18, 0.05, WOOD, { roughness: 0.8 })
    post.position.set(side * 0.95, 1.175, 0)
    moldura.add(post)

    const footPad = rbox(0.42, 0.12, 0.42, 0.04, WOOD, { roughness: 0.85 })
    footPad.position.set(side * 0.95, 0.06, 0)
    moldura.add(footPad)

    const finial = sphere(0.11, BRASS, { roughness: 0.35, metalness: 0.6 })
    finial.position.set(side * 0.95, 2.56, 0)
    moldura.add(finial)
  }
  const crossbar = rbox(2.25, 0.18, 0.18, 0.05, WOOD, { roughness: 0.8 })
  crossbar.position.set(0, 2.38, 0)
  moldura.add(crossbar)
  gongoRoot.add(moldura)

  // gongo pendurado: pivô na travessa, cresce dela e balança nela
  const gongo = new THREE.Group()
  gongo.position.set(0, 2.38, 0)
  moldura.add(gongo)

  for (const side of [-1, 1]) {
    const cord = cylinder(0.028, 0.028, 0.26, '#4a3a24', { roughness: 0.9 })
    cord.position.set(side * 0.3, -0.14, 0)
    gongo.add(cord)
  }

  // disco do gongo: sólido de revolução com aro rolado e domo central
  const disc = lathe(
    [
      [0, -0.06], [0.4, -0.06], [0.75, -0.04], [0.78, 0.04],
      [0.72, 0.12], [0.62, 0.07], [0.45, 0.06], [0.2, 0.1],
      [0.1, 0.13], [0, 0.13],
    ],
    GOLD,
    { roughness: 0.3, metalness: 0.5 }, // menos espelho: lê ouro claro, não bronze escuro
  )
  disc.rotation.x = Math.PI / 2
  disc.position.set(0, -1.02, 0)
  gongo.add(disc)

  // ---- o TIL (~) preto, pintado bem no centro ------------------------------
  const til = new THREE.Group()
  til.position.set(0, -1.02, 0.12)
  // ~ de verdade: um período de seno, suave, corcova à esquerda
  const TIL_W = 0.62
  const TIL_A = 0.085
  const tildeCurve = new THREE.CatmullRomCurve3(
    Array.from({ length: 17 }, (_, i) => {
      const x = -TIL_W / 2 + (i / 16) * TIL_W
      return new THREE.Vector3(x, -TIL_A * Math.sin((2 * Math.PI * x) / TIL_W), 0)
    }),
  )
  const tilde = new THREE.Mesh(
    new THREE.TubeGeometry(tildeCurve, 64, 0.058, 14, false),
    mat('#1f1f1f', { roughness: 0.5 }),
  )
  tilde.castShadow = true
  tilde.receiveShadow = true
  til.add(tilde)
  for (const end of [-1, 1]) {
    const cap = sphere(0.058, '#1f1f1f', { roughness: 0.5 })
    cap.position.set((end * TIL_W) / 2, 0, 0)
    til.add(cap)
  }
  gongo.add(til)

  // ---- baqueta na pata do canguru ------------------------------------------
  const baqueta = new THREE.Group()
  baqueta.position.set(-0.84, 1.08, -0.05) // na pata direita erguida
  baqueta.rotation.z = -0.3 // pose final: erguida bem alto, apontando o gongo

  const pawGrip = sphere(0.12, FUR, { roughness: 0.75 })
  baqueta.add(pawGrip)
  for (const side of [-1, 1]) {
    const finger = sphere(0.045, PAW, { roughness: 0.75 })
    finger.position.set(side * 0.06, 0.07, 0.07)
    baqueta.add(finger)
  }
  const handle = cylinder(0.04, 0.048, 0.88, '#d9c29a', { roughness: 0.5 })
  handle.position.y = 0.44
  baqueta.add(handle)
  const grip = cylinder(0.05, 0.05, 0.12, WOOD, { roughness: 0.7 })
  grip.position.y = 0.14
  baqueta.add(grip)
  const tip = sphere(0.13, '#8f3b31', { roughness: 0.9 })
  tip.position.y = 0.93
  baqueta.add(tip)
  root.add(baqueta)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'canguru', group: 'canguru', object: canguru },
    { name: 'cabeca', group: 'canguru', object: cabeca },
    { name: 'moldura', group: 'gongo', object: moldura },
    { name: 'gongo', group: 'gongo', object: gongo },
    { name: 'til', group: 'detalhe', object: til },
    { name: 'baqueta', group: 'detalhe', object: baqueta },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.75)], {
      ease: 'easeOut',
      caption: 'Na recepção, brota um gramado verde do chão…',
    }),

    seq('canguru-rise', 'canguru', 1.6, 0.8, [riseFrom(GY, 1.5)], {
      ease: 'easeOut',
      caption: '…e sobe o KANGURU recepcionista (KAN-DU), surdo como uma porta…',
    }),
    seq('cabeca-pop', 'cabeca', 1.75, 0.6, [ch('position.y', 0.85, 1.38)], {
      ease: 'easeOut',
    }),

    seq('moldura-rise', 'moldura', 3.3, 0.8, [riseFrom(0, 3.0)], { ease: 'easeOut' }),
    seq(
      'gongo-grow',
      'gongo',
      3.5,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…ele grita "TÁ?! DÊ!" e ergue-se um GONGO dourado gigante (gång = GONGO)…',
      },
    ),

    seq(
      'til-pop',
      'til',
      5.1,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '…com um TIL (~) preto pintado bem no centro: en gång TILL!' },
    ),
    seq('baqueta-rise', 'baqueta', 5.25, 0.8, [riseFrom(1.08, 2.3)], { ease: 'easeOut' }),

    seq('baqueta-cock', 'baqueta', 6.7, 0.7, [ch('rotation.z', 0.1, 0.85)], {
      caption: '…baqueta erguida pra tacar no gongo DE NOVO — toca o GONGO mais uma vez!',
    }),

    seq('canguru-hop-up', 'canguru', 7.75, 0.5, [ch('position.y', GY, 0.34)], { ease: 'easeOut' }),
    seq(
      'baqueta-strike',
      'baqueta',
      7.9,
      0.5,
      [
        ch('rotation.z', 0.85, -0.85),
        ch('position.x', -0.84, 0.3),
        ch('position.y', 1.08, 0.92),
      ],
      { ease: 'easeIn' },
    ),
    seq('canguru-hop-down', 'canguru', 8.25, 0.5, [ch('position.y', 0.34, GY)], { ease: 'easeIn' }),

    seq('gongo-ring-a', 'gongo', 8.4, 0.5, [ch('rotation.x', 0, 0.18)], {
      ease: 'easeOut',
      caption: 'Kan du ta det en gång till? — "Você pode repetir (mais uma vez)?"',
    }),
    seq(
      'baqueta-recoil',
      'baqueta',
      8.45,
      0.8,
      [
        ch('rotation.z', -0.85, -0.3),
        ch('position.x', 0.3, -0.84),
        ch('position.y', 0.92, 1.08),
      ],
      { ease: 'easeOut' },
    ),
    seq('gongo-ring-b', 'gongo', 8.9, 0.55, [ch('rotation.x', 0.18, -0.08)]),
    seq('gongo-settle', 'gongo', 9.45, 0.6, [ch('rotation.x', -0.08, 0)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.8, 5.35], target: [0.05, 1.3, -0.1] },
  }
}

export const card: Card = {
  refine: { organic: ['canguru', 'cabeca'] },
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
