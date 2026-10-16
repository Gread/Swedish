import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat, shoulderPivot,
  rbox, box, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Kan jag få mer?" — Hércules devorou o jantar da sogra sueca e segue com
 * fome: ergue a clava de CANA (CA-NIÁ!), estufa as bochechas e sopra na panela
 * vazia (FÔÔ) e depois a ESPREMER (espre-MÊR) até cair uma única almôndega no
 * prato raspado.
 *
 * Diorama: piso de pinho claro; mesa de toalha xadrez azul e branca na frente;
 * Hércules enorme sentado atrás, num banquinho pequeno demais, com a panela
 * de ferro amassada nas mãos; clava de cana (o acento) encostada na mesa.
 */

const PINE = '#dcbf8f'
const PINE_LINE = '#b8935e'
const WOOD = '#9c6a3c'
const WOOD_DARK = '#74492a'
const CLOTH = '#f4f2ec'
const CHECK = '#3d64a6'
const PLATE = '#fbfaf6'
const METAL = '#a7adb3'
const SKIN = '#c98a5e'
const TUNIC = '#f2eee4'
const GOLD = '#c9a13b'
const HAIR = '#5a3a22'
const LAUREL = '#5d8a3a'
const IRON = '#2b2b2e'
const IRON_IN = '#151517'
const MEAT = '#7a4526'
const LINGON = '#8e2f35'
const CANE = '#b8d82a' // acento saturado RESERVADO: a clava de cana (CA-NIÁ)
const CANE_NODE = '#7c9a1c'
const CANE_LEAF = '#6f9e2e'

const GY = 0.12 // topo do piso
const SEAT = 0.44 // topo do banquinho
const TOP = 0.88 // superfície da toalha
const HZ = -0.3 // Hércules, atrás da mesa
const TZ = 0.66 // centro da mesa
const H = 2.0 // Hércules é grande
const POT = new THREE.Vector3(0, 1.2, 0.36)
const BALL = new THREE.Vector3(0, 1.06, 0.76)
const BALL_FROM = new THREE.Vector3(0, 1.3, 0.5)

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: piso de tábuas de pinho -----------------------------------------
  const base = new THREE.Group()
  const floor = cylinder(2.15, 2.22, GY, PINE, { roughness: 0.7 })
  floor.position.y = GY / 2
  base.add(floor)
  for (let i = -6; i <= 6; i++) {
    const z = i * 0.32
    const half = Math.sqrt(Math.max(0, 2.13 * 2.13 - z * z))
    if (half < 0.2) continue
    const line = box(half * 2, 0.006, 0.018, PINE_LINE, { roughness: 0.8 })
    line.position.set(0, GY + 0.002, z)
    base.add(line)
  }
  root.add(base)

  // ---- mesa com toalha xadrez ----------------------------------------------------
  const mesa = new THREE.Group()
  const TW = 1.5
  const TD = 1.0
  const tabletop = rbox(TW, 0.07, TD, 0.025, WOOD, { roughness: 0.6 })
  tabletop.position.set(0, TOP - 0.047, TZ)
  mesa.add(tabletop)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.045, 0.035, TOP - 0.08 - GY, WOOD_DARK, { roughness: 0.6 })
      leg.position.set(sx * (TW / 2 - 0.1), GY + (TOP - 0.08 - GY) / 2, TZ + sz * (TD / 2 - 0.1))
      mesa.add(leg)
    }
  }
  const cloth = rbox(TW + 0.08, 0.014, TD + 0.08, 0.006, CLOTH, { roughness: 0.92 })
  cloth.position.set(0, TOP - 0.007, TZ)
  mesa.add(cloth)
  const CS = 0.2
  const nx = Math.floor((TW + 0.08) / CS)
  const nz = Math.floor((TD + 0.08) / CS)
  for (let ix = 0; ix < nx; ix++) {
    for (let iz = 0; iz < nz; iz++) {
      if ((ix + iz) % 2) continue
      const sq = box(CS, 0.004, CS, CHECK, { roughness: 0.92 })
      sq.position.set(-(nx * CS) / 2 + CS / 2 + ix * CS, TOP + 0.001, TZ - (nz * CS) / 2 + CS / 2 + iz * CS)
      mesa.add(sq)
    }
  }
  // barra caída da toalha (frente e laterais), com listras
  const DROP = 0.16
  const front = rbox(TW + 0.1, DROP, 0.014, 0.006, CLOTH, { roughness: 0.92 })
  front.position.set(0, TOP - DROP / 2, TZ + TD / 2 + 0.045)
  mesa.add(front)
  for (let i = 0; i < nx; i += 2) {
    const st = box(CS, DROP, 0.004, CHECK, { roughness: 0.92 })
    st.position.set(-(nx * CS) / 2 + CS / 2 + i * CS, TOP - DROP / 2, TZ + TD / 2 + 0.054)
    mesa.add(st)
  }
  for (const sx of [-1, 1]) {
    const side = rbox(0.014, DROP, TD + 0.1, 0.006, CLOTH, { roughness: 0.92 })
    side.position.set(sx * (TW / 2 + 0.045), TOP - DROP / 2, TZ)
    mesa.add(side)
    for (let i = 0; i < nz; i += 2) {
      const st = box(0.004, DROP, CS, CHECK, { roughness: 0.92 })
      st.position.set(sx * (TW / 2 + 0.054), TOP - DROP / 2, TZ - (nz * CS) / 2 + CS / 2 + i * CS)
      mesa.add(st)
    }
  }
  root.add(mesa)

  // ---- prato vazio e raspado + talheres -----------------------------------------
  const prato = new THREE.Group()
  prato.position.set(0, TOP, 0.88)
  const dish = lathe(
    [[0, 0], [0.16, 0], [0.18, 0.012], [0.25, 0.03], [0.28, 0.045], [0.27, 0.05], [0.24, 0.038], [0.17, 0.022], [0, 0.022]],
    PLATE,
    { roughness: 0.2 },
  )
  prato.add(dish)
  for (const [x, z, r] of [[0.06, 0.03, 0.035], [-0.05, -0.05, 0.028], [0.0, 0.08, 0.022]] as const) {
    const smear = sphere(r, '#8a5a36', { roughness: 0.5 })
    smear.position.set(x, 0.024, z)
    smear.scale.set(1.6, 0.12, 0.7)
    prato.add(smear)
  }
  const fork = rbox(0.035, 0.012, 0.36, 0.005, METAL, { roughness: 0.3, metalness: 0.8 })
  fork.position.set(-0.36, 0.008, 0)
  prato.add(fork)
  const knife = rbox(0.04, 0.012, 0.38, 0.005, METAL, { roughness: 0.3, metalness: 0.8 })
  knife.position.set(0.36, 0.008, 0)
  prato.add(knife)
  root.add(prato)

  // tigela de geleia de lingon, raspada também
  const tigela = new THREE.Group()
  tigela.position.set(-0.52, TOP, 0.62)
  const bowl = lathe(
    [[0, 0], [0.07, 0], [0.1, 0.04], [0.11, 0.08], [0.1, 0.085], [0.09, 0.045], [0.06, 0.015], [0, 0.015]],
    PLATE,
    { roughness: 0.2 },
  )
  tigela.add(bowl)
  const jam = sphere(0.04, LINGON, { roughness: 0.3 })
  jam.position.set(0.02, 0.02, 0)
  jam.scale.set(1.2, 0.2, 0.8)
  tigela.add(jam)
  root.add(tigela)

  // ---- banquinho pequeno demais -----------------------------------------------
  const banquinho = new THREE.Group()
  banquinho.position.set(0, 0, HZ)
  const stoolSeat = cylinder(0.2, 0.19, 0.06, WOOD, { roughness: 0.6 })
  stoolSeat.position.y = SEAT - 0.03
  banquinho.add(stoolSeat)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    const legH = SEAT - 0.06 - GY
    const leg = cylinder(0.025, 0.03, legH + 0.02, WOOD_DARK, { roughness: 0.6 })
    leg.position.set(Math.cos(a) * 0.15, GY + legH / 2, Math.sin(a) * 0.15)
    leg.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18)
    banquinho.add(leg)
  }
  root.add(banquinho)

  // ---- Hércules -----------------------------------------------------------------
  const hercules = new THREE.Group()
  hercules.position.set(0, SEAT, HZ)
  root.add(hercules)

  const corpo = person({ body: TUNIC, skin: SKIN, height: H, armAngle: 0.2 })
  hercules.add(corpo)

  // faixa dourada na cintura e alça de ombro da túnica
  const belt = cylinder(0.352, 0.352, 0.08, GOLD, { roughness: 0.35, metalness: 0.5 })
  belt.position.y = 0.42
  corpo.add(belt)
  const strap = rbox(0.09, 0.62, 0.05, 0.02, GOLD, { roughness: 0.35, metalness: 0.5 })
  strap.position.set(0.05, 0.78, 0.27)
  strap.rotation.z = 0.55
  corpo.add(strap)

  // pernas por baixo da mesa: coxas pra frente, canelas até o chão, sandálias
  for (const side of [-1, 1]) {
    const thigh = capsule(0.13, 0.34, TUNIC, { roughness: 0.85 })
    thigh.position.set(side * 0.18, 0.1, 0.2)
    thigh.rotation.x = Math.PI / 2
    hercules.add(thigh)
    const shin = capsule(0.1, 0.24, SKIN, { roughness: 0.6 })
    shin.position.set(side * 0.19, -0.13, 0.44)
    hercules.add(shin)
    const sandal = rbox(0.17, 0.06, 0.28, 0.025, '#6b4426', { roughness: 0.7 })
    sandal.position.set(side * 0.19, SEAT - GY > 0 ? -(SEAT - GY) + 0.03 : 0, 0.5)
    hercules.add(sandal)
  }

  // braços nus e musculosos, esticados até a panela
  for (const [name, side] of [['armL', -1], ['armR', 1]] as const) {
    const arm = corpo.getObjectByName(name) as THREE.Mesh
    shoulderPivot(arm, H)
    arm.material = mat(SKIN, { roughness: 0.55 })
    arm.scale.set(1.35, 1, 1.35)
    arm.rotation.set(-1.2, 0, -side * 0.13)
    const cap = sphere(0.17, TUNIC, { roughness: 0.85 })
    cap.position.set(0, 0.02, 0)
    cap.scale.set(1 / 1.35, 1, 1 / 1.35)
    arm.add(cap)
  }

  const head = corpo.getObjectByName('head')!
  const HR = 0.19 * H

  // cabelo encaracolado
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2
    const curl = sphere(0.11, HAIR, { roughness: 0.9 })
    const back = Math.cos(a) // >0: pra trás
    curl.position.set(Math.sin(a) * HR * 0.9, HR * 0.45 + (back > 0 ? -0.05 : 0.05), -Math.abs(back) * HR * 0.55 - (back > 0 ? 0.08 : -0.02))
    head.add(curl)
  }
  const crown = puff(0.2, HAIR, 7, 11, { roughness: 0.9 })
  crown.position.set(0, HR * 0.62, -0.06)
  crown.scale.set(1.4, 0.7, 1.3)
  head.add(crown)

  // barba
  const beard = puff(0.15, HAIR, 7, 23, { roughness: 0.9 })
  beard.position.set(0, -HR * 0.62, HR * 0.5)
  beard.scale.set(1.45, 1, 0.85)
  head.add(beard)
  for (const side of [-1, 1]) {
    const burn = sphere(0.09, HAIR, { roughness: 0.9 })
    burn.position.set(side * HR * 0.8, -HR * 0.2, HR * 0.25)
    burn.scale.set(0.6, 1.3, 0.9)
    head.add(burn)
  }

  // bochechas estufadas + biquinho soprando (FÔÔ)
  const bochechas = new THREE.Group()
  head.add(bochechas)
  for (const side of [-1, 1]) {
    const cheek = sphere(0.13, '#d48f66', { roughness: 0.55 })
    cheek.position.set(side * HR * 0.5, -HR * 0.22, HR * 0.72)
    bochechas.add(cheek)
  }
  const lips = torus(0.04, 0.022, '#a5503f', { roughness: 0.5 })
  lips.position.set(0, -HR * 0.36, HR * 0.95)
  bochechas.add(lips)

  // coroa de louros
  const louros = new THREE.Group()
  louros.position.set(0, HR * 0.42, -0.02)
  louros.rotation.x = -0.18
  head.add(louros)
  const ring = torus(HR * 0.98, 0.018, LAUREL, { roughness: 0.7 })
  ring.rotation.x = Math.PI / 2
  louros.add(ring)
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2
    if (Math.cos(a) < -0.7) continue // atrás, escondido pelo cabelo
    const leaf = sphere(0.07, LAUREL, { roughness: 0.6 })
    leaf.position.set(Math.sin(a) * HR * 1.0, 0.03, Math.cos(a) * HR * 1.0)
    leaf.rotation.set(0, a, 0.9)
    leaf.scale.set(0.4, 1, 0.18)
    louros.add(leaf)
  }

  // ---- panela de ferro espremida no meio -----------------------------------------
  const panela = new THREE.Group()
  panela.position.copy(POT)
  panela.rotation.x = 0.9 // boca virada pro prato
  root.add(panela)
  const potBody = lathe(
    [
      [0, -0.16], [0.21, -0.16], [0.245, -0.12], [0.19, -0.02], [0.18, 0.03], [0.245, 0.12],
      [0.27, 0.16], [0.255, 0.172], [0.235, 0.145], [0.163, 0.03], [0.172, -0.02], [0.215, -0.12], [0, -0.13],
    ],
    IRON,
    { roughness: 0.55, metalness: 0.6 },
  )
  potBody.scale.x = 0.85
  panela.add(potBody)
  const inside = cylinder(0.2, 0.2, 0.01, IRON_IN, { roughness: 0.9 })
  inside.position.y = -0.12
  inside.scale.x = 0.85
  panela.add(inside)
  for (const sz of [-1, 1]) {
    const lug = torus(0.05, 0.016, IRON, { roughness: 0.5, metalness: 0.6 })
    lug.position.set(0, 0.13, sz * 0.27)
    panela.add(lug)
  }

  // ---- a única almôndega, caindo --------------------------------------------------
  const almondega = new THREE.Group()
  almondega.position.copy(BALL)
  const ball = sphere(0.085, MEAT, { roughness: 0.75 })
  almondega.add(ball)
  root.add(almondega)

  // ---- clava de cana-de-açúcar, encostada na mesa ----------------------------------
  const clava = new THREE.Group()
  clava.position.set(1.15, GY, 0.32)
  clava.rotation.z = 0.3
  root.add(clava)
  const SEG = 0.27
  for (let i = 0; i < 4; i++) {
    const r0 = 0.065 + i * 0.012
    const segm = cylinder(r0 + 0.012, r0, SEG, CANE, { roughness: 0.45 })
    segm.position.y = SEG / 2 + i * SEG
    clava.add(segm)
    const node = torus(r0 + 0.012, 0.016, CANE_NODE, { roughness: 0.5 })
    node.rotation.x = Math.PI / 2
    node.position.y = (i + 1) * SEG
    clava.add(node)
  }
  for (const [rz, ry] of [[0.5, 0], [-0.45, 0.6], [0.2, 2.2]] as const) {
    const blade = cone(0.05, 0.42, CANE_LEAF, { roughness: 0.6 })
    blade.position.set(Math.sin(-rz) * -0.18, 4 * SEG + 0.18, 0)
    blade.rotation.set(0, ry, rz)
    blade.scale.z = 0.3
    clava.add(blade)
  }

  // ---- peças -----------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'mesa', object: base },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'prato', group: 'mesa', object: prato },
    { name: 'tigela', group: 'mesa', object: tigela },
    { name: 'banquinho', group: 'hercules', object: banquinho },
    { name: 'hercules', group: 'hercules', object: hercules },
    { name: 'louros', group: 'hercules', object: louros },
    { name: 'clava', group: 'cana', object: clava },
    { name: 'panela', group: 'sopro', object: panela },
    { name: 'bochechas', group: 'sopro', object: bochechas },
    { name: 'almondega', group: 'espremer', object: almondega },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]

  // ---- montagem ------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Jantar na casa da sogra sueca: toalha xadrez azul e branca… e o prato já raspado.',
    }),
    seq('mesa-rise', 'mesa', 0.5, 0.8, [riseFrom(0, 1.4)], { ease: 'easeOut' }),
    seq('prato-grow', 'prato', 1.1, 0.5, grow(), { ease: 'easeOut' }),
    seq('tigela-grow', 'tigela', 1.3, 0.5, grow(), { ease: 'easeOut' }),

    seq('banquinho-rise', 'banquinho', 2.4, 0.6, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Chega Hércules, faminto de semideus, espremido num banquinho pequeno demais.',
    }),
    seq('hercules-rise', 'hercules', 2.7, 0.9, [riseFrom(SEAT, 2.6)], { ease: 'easeOut' }),
    seq('louros-grow', 'louros', 3.5, 0.5, grow(), { ease: 'easeOut' }),

    seq('clava-up', 'clava', 4.6, 0.8, [ch('position.y', GY - 1.4, GY + 0.5), ch('rotation.z', -0.4, 0.3)], {
      ease: 'easeOut',
      caption: 'Ele ergue a clava, que na Suécia é um gomo gigante de CANA, e grita: CA-NIÁ!',
    }),
    seq('clava-lean', 'clava', 5.5, 0.5, [ch('position.y', GY + 0.5, GY)], { ease: 'easeIn' }),

    seq('panela-grow', 'panela', 6.6, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'Estufa as bochechas e sopra dentro da panela vazia: FÔÔ! Nada, nem vapor.',
    }),
    seq('bochechas-puff', 'bochechas', 7.0, 0.5, grow(0.6), { ease: 'easeOut' }),

    seq('panela-squeeze', 'panela', 8.6, 0.7, [ch('scale.x', 1.3, 1), ch('scale.z', 0.9, 1)], {
      ease: 'easeIn',
      caption: 'Então ESPREMER: aperta a panela de ferro até amassar feito latinha… espre-MÊR!',
    }),
    seq(
      'almondega-cai',
      'almondega',
      9.4,
      0.8,
      [ch('position.y', BALL_FROM.y, BALL.y), ch('position.z', BALL_FROM.z, BALL.z), ...grow(0.3)],
      { ease: 'easeIn', caption: 'Lá de dentro cai UMA almôndega no prato. E ele, com olho de cachorro pidão…' },
    ),
    seq('louros-tilt', 'louros', 11.0, 0.6, [ch('rotation.z', 0.18, 0)], {
      ease: 'easeOut',
      caption: 'Kan jag få mer? — Pode me dar mais?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.25, 2.3, 4.3], target: [0.1, 1.2, 0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-fa-mer',
    contexto:
      "À mesa: na casa de alguém, quando o prato acaba e a comida está boa; no almoço do trabalho ou da escola, com a travessa no meio; no café, pedindo a segunda xícara (påtår). Também se diz 'Kan jag få lite mer?' (um pouquinho mais).",
    fraseFonte: 'Pode me dar mais?',
    fraseAlvo: 'Kan jag få mer?',
    pronuncia:
      "ka-niá fô MÊÊR? ('kan jag' = ka-niá, o G não soa; 'få' = fô, Ô FECHADO e longo de 'avô', nunca 'fó', e sem R; 'mer' com a força toda, Ê FECHADO e LONGO, e o R do fim brando, de um toque só, mas audível — é nele que a pergunta sobe)",
    ponteSonora:
      "CA-NIÁ... FÔ... (espre)MÊR? (4 sílabas: ca-niá-fô-MÊÊR; a força vai TODA pro MÊR, onde a pergunta sobe; CA-NIÁ é a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag få menyn?' e 'Kan jag få lite vatten?', emendado — I de IOGA, nunca o J chiado de 'canja'; FÔ = o sopro de BOCHECHAS ESTUFADAS de 'Kan jag få menyn?' e 'Kan vi få notan, tack?': Ô FECHADO de 'avô', nunca 'fó', e sem R — com R vira 'får', e depois de 'kan jag' o verbo vem pelado; MÊR = o ESPREMER sem o 'espre': só o pedaço forte, que o português já fala certo — Ê FECHADO e com a força —, aqui ESTICADO, MÊÊR; o R do fim é justamente o que quase todo brasileiro engole ('espremê'): aqui ele FICA, BRANDO, de um toque só, do jeito que sai quando se emenda 'espremer a panela' — espreme-ra panela —, nunca o RR soprado; e não é o MÊ seco do MEDO de 'Vad jobbar du med?' e 'Jag håller med', que para no Ê sem R; nem o -mer fraquinho e sem força de 'kommer' (CÓ-mer): aqui o MÊR é a palavra inteira e leva a pancada)",
    historia:
      'Hércules acabou de devorar o jantar inteiro da sogra sueca — a panela de almôndegas, o purê, a geleia de lingon — e continua com fome de semideus. Ergue a clava, que na Suécia é um gomo gigante de CANA, e grita: IÁ! Estufa as bochechas e sopra dentro da panela vazia — FÔÔ — só pra conferir: nada, nem vapor. Então começa a ESPREMER: aperta a panela de ferro com as duas mãos até ela amassar feito latinha, e lá de dentro cai uma única almôndega. Ele empurra o prato pra sogra com olho de cachorro pidão: pode me dar mais?',
  },
  createScene,
}

export default card
