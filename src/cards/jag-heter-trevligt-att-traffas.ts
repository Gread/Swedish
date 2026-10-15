import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, puff, person,
} from '../rig/helpers'

/**
 * "Jag heter ... Trevligt att träffas!" — tapete vermelho de estreia.
 * O APRESENTADOR de terno dourado agarra a sua mão, raspa a garganta
 * ("IÁ! RRÊ-ter…") e anuncia seu nome sob o letreiro de neon TRÊV·LIT,
 * enquanto TRÊS FÃS miúdos (TRÉ-fas ~ träffas) batem palmas com caderninhos.
 *
 * Diorama: palco escuro polido, tapete vermelho correndo até a câmera,
 * cordão de veludo à esquerda com os três fãs atrás, letreiro de neon
 * ao fundo. Acento saturado RESERVADO ao neon magenta do letreiro.
 */

const STAGE = '#2f3846'
const STAGE_TOP = '#39435a'
const DARK = '#232a36'
const CARPET = '#9e2f34'
const VELVET = '#7d2233'
const BRASS = '#c8922e'
const BRASS_DARK = '#8f6a22'
const SUIT = '#d8a33a'
const SKIN = '#e8c39e'
const NEON = '#ff3f8f' // acento reservado: o letreiro TRÊV·LIT
const BULB = '#ffd489'
const FAN_A = '#3f4c63'
const FAN_B = '#4a5570'
const FAN_C = '#37455c'
const GUEST = '#3c6662' // você, o convidado
const GY = 0.18 // topo da base do diorama

// ---- alfabeto de neon: segmentos numa célula 0..1 x 0..1 ---------------------
type Seg = [number, number, number, number]

const GLYPHS: Record<string, { segs: Seg[]; adv: number }> = {
  T: { segs: [[0, 1, 0.9, 1], [0.45, 1, 0.45, 0]], adv: 0.9 },
  R: {
    segs: [[0, 0, 0, 1], [0, 1, 0.7, 1], [0.7, 1, 0.7, 0.56], [0, 0.56, 0.7, 0.56], [0.28, 0.56, 0.8, 0]],
    adv: 0.8,
  },
  E: { segs: [[0, 0, 0, 1], [0, 1, 0.72, 1], [0, 0.54, 0.58, 0.54], [0, 0, 0.72, 0]], adv: 0.72 },
  V: { segs: [[0, 1, 0.4, 0], [0.4, 0, 0.8, 1]], adv: 0.8 },
  L: { segs: [[0, 1, 0, 0], [0, 0, 0.7, 0]], adv: 0.7 },
  I: { segs: [[0.18, 1, 0.18, 0]], adv: 0.36 },
}

/** Acento circunflexo do Ê, acima da célula. */
const HAT: Seg[] = [[0.1, 1.2, 0.36, 1.5], [0.36, 1.5, 0.62, 1.2]]

/** Um tubo de neon reto entre dois pontos da célula. */
function neonBar([x1, y1, x2, y2]: Seg, h: number) {
  const dx = (x2 - x1) * h
  const dy = (y2 - y1) * h
  const len = Math.hypot(dx, dy)
  const r = 0.019
  const tube = capsule(r, Math.max(len - r * 2, 0.005), NEON, {
    roughness: 0.3,
    emissive: NEON,
    emissiveIntensity: 1.3,
  })
  tube.position.set(((x1 + x2) / 2) * h, ((y1 + y2) / 2) * h, 0)
  tube.rotation.z = Math.atan2(dy, dx) - Math.PI / 2
  return tube
}

/** Palavra em tubo de neon, centrada na origem do Group. */
function neonWord(chars: string[], h: number, gap: number) {
  const width = (c: string) => (c === '·' ? 0.3 : (GLYPHS[c === 'Ê' ? 'E' : c]?.adv ?? 0.6))
  const total = chars.reduce((w, c) => w + width(c) * h + gap, 0) - gap

  const g = new THREE.Group()
  let cursor = -total / 2
  for (const c of chars) {
    const cell = new THREE.Group()
    cell.position.x = cursor
    if (c === '·') {
      const dot = sphere(0.035, NEON, { roughness: 0.3, emissive: NEON, emissiveIntensity: 1.3 })
      dot.position.set(0.15 * h, 0.42 * h, 0)
      cell.add(dot)
    } else {
      const glyph = GLYPHS[c === 'Ê' ? 'E' : c]
      for (const s of glyph.segs) cell.add(neonBar(s, h))
      if (c === 'Ê') for (const s of HAT) cell.add(neonBar(s, h))
    }
    g.add(cell)
    cursor += width(c) * h + gap
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: palco polido + tapete vermelho ----------------------
  const base = new THREE.Group()

  const slab = cylinder(2.5, 2.58, 0.12, STAGE, { roughness: 0.5 })
  slab.position.y = 0.06
  base.add(slab)

  const deck = cylinder(2.44, 2.5, 0.07, STAGE_TOP, { roughness: 0.35 })
  deck.position.y = 0.145
  base.add(deck)

  // tapete vermelho correndo do letreiro até a câmera
  const carpet = rbox(1.4, 0.05, 3.5, 0.02, CARPET, { roughness: 0.92 })
  carpet.position.set(0.35, GY + 0.025, 0.4)
  base.add(carpet)

  for (const side of [-1, 1]) {
    const trim = rbox(0.09, 0.055, 3.5, 0.02, VELVET, { roughness: 0.92 })
    trim.position.set(0.35 + side * 0.72, GY + 0.028, 0.4)
    base.add(trim)
  }

  // adereço 1: refletor de chão apontado para o tapete
  const spot = new THREE.Group()
  spot.position.set(-1.1, GY, 1.55)
  spot.rotation.y = -0.9
  const spotFoot = cylinder(0.17, 0.2, 0.06, DARK, { roughness: 0.5 })
  spotFoot.position.y = 0.03
  const spotCan = cylinder(0.11, 0.13, 0.3, DARK, { roughness: 0.45 })
  spotCan.position.set(0, 0.19, 0.02)
  spotCan.rotation.x = 0.75
  const lens = cylinder(0.1, 0.1, 0.02, BULB, { emissive: BULB, emissiveIntensity: 1.1 })
  lens.position.set(0, 0.15, 0)
  spotCan.add(lens)
  spot.add(spotFoot, spotCan)
  base.add(spot)

  // adereço 2: vaso de recepção
  const planter = new THREE.Group()
  planter.position.set(1.72, GY, -0.85)
  const pot = cylinder(0.2, 0.24, 0.3, BRASS_DARK, { roughness: 0.3, metalness: 0.7 })
  pot.position.y = 0.15
  const foliage = puff(0.24, '#3d6b45', 6, 5, { roughness: 0.9 })
  foliage.position.y = 0.46
  planter.add(pot, foliage)
  base.add(planter)

  // adereço 3: confete dourado espalhado no palco
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const d = 1.1 + rand() * 1.2
    const chip = cylinder(0.045, 0.045, 0.008, BRASS, { roughness: 0.3, metalness: 0.75 }, 6)
    chip.position.set(Math.cos(a) * d, GY + 0.006, Math.sin(a) * d)
    chip.rotation.y = rand() * Math.PI
    base.add(chip)
  }
  root.add(base)

  // ---- postes com cordão de veludo -----------------------------------------
  const postes = new THREE.Group()
  const ropeZ = [-0.3, 1.4]
  for (const z of ropeZ) {
    const foot = cylinder(0.15, 0.18, 0.05, BRASS_DARK, { roughness: 0.3, metalness: 0.7 })
    foot.position.set(-0.6, GY + 0.025, z)
    const column = cylinder(0.045, 0.055, 0.9, BRASS, { roughness: 0.25, metalness: 0.85 })
    column.position.set(-0.6, GY + 0.5, z)
    const knob = sphere(0.075, BRASS, { roughness: 0.25, metalness: 0.85 })
    knob.position.set(-0.6, GY + 0.99, z)
    postes.add(foot, column, knob)
  }

  const ropeCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.6, GY + 0.96, ropeZ[0]),
    new THREE.Vector3(-0.63, GY + 0.78, ropeZ[0] + 0.45),
    new THREE.Vector3(-0.64, GY + 0.7, (ropeZ[0] + ropeZ[1]) / 2),
    new THREE.Vector3(-0.63, GY + 0.78, ropeZ[1] - 0.45),
    new THREE.Vector3(-0.6, GY + 0.96, ropeZ[1]),
  ])
  const rope = new THREE.Mesh(
    new THREE.TubeGeometry(ropeCurve, 40, 0.035, 10, false),
    mat(VELVET, { roughness: 0.92, size: 1.7 }),
  )
  rope.castShadow = true
  rope.receiveShadow = true
  postes.add(rope)
  root.add(postes)

  // ---- letreiro de neon TRÊV·LIT -------------------------------------------
  const painel = new THREE.Group()
  painel.position.set(0.35, 0, -1.75)
  painel.rotation.y = 0.07

  for (const side of [-1, 1]) {
    const mast = cylinder(0.055, 0.075, 1.6, BRASS_DARK, { roughness: 0.3, metalness: 0.7 })
    mast.position.set(side * 0.95, GY + 0.8, 0)
    painel.add(mast)
  }

  const frame = rbox(2.5, 0.87, 0.1, 0.05, BRASS, { roughness: 0.28, metalness: 0.85 })
  frame.position.set(0, 2.05, -0.05)
  painel.add(frame)

  const board = rbox(2.35, 0.72, 0.14, 0.04, DARK, { roughness: 0.35 })
  board.position.set(0, 2.05, 0)
  painel.add(board)

  // lâmpadas de marquise contornando a moldura
  for (let i = 0; i < 8; i++) {
    const t = i / 7
    for (const sy of [-1, 1]) {
      const bulb = sphere(0.038, BULB, { emissive: BULB, emissiveIntensity: 1.0 })
      bulb.position.set(-1.15 + t * 2.3, 2.05 + sy * 0.395, 0.03)
      painel.add(bulb)
    }
  }
  root.add(painel)

  const neon = neonWord(['T', 'R', 'Ê', 'V', '·', 'L', 'I', 'T'], 0.3, 0.05)
  neon.position.set(0, 2.05 - 0.225, 0.1)
  painel.add(neon)

  // ---- apresentador de terno dourado ---------------------------------------
  const apresentador = person({ body: SUIT, skin: SKIN, height: 1.55, armAngle: 0.35 })
  apresentador.position.set(0.35, GY, -0.1)
  apresentador.rotation.y = 0.25

  const head = apresentador.getObjectByName('head')!
  const hair = puff(0.26, '#241f28', 5, 3, { roughness: 0.65 })
  // cabelo no alto da cabeça e para trás: não tapa os olhos
  hair.position.set(0, 0.2, -0.05)
  hair.scale.set(1.0, 0.5, 0.98)
  head.add(hair)

  // gravata-borboleta e lapelas escuras: o terno lê como smoking de palco
  const bow = new THREE.Group()
  bow.position.set(0, 0.79, 0.245)
  const knot = rbox(0.05, 0.06, 0.05, 0.02, DARK, { roughness: 0.4 })
  bow.add(knot)
  for (const side of [-1, 1]) {
    const wing = rbox(0.11, 0.1, 0.04, 0.03, DARK, { roughness: 0.4 })
    wing.position.x = side * 0.08
    wing.rotation.z = side * 0.25
    bow.add(wing)
  }
  apresentador.add(bow)

  for (const side of [-1, 1]) {
    const lapel = rbox(0.09, 0.3, 0.05, 0.02, DARK, { roughness: 0.4 })
    lapel.position.set(side * 0.11, 0.6, 0.22)
    lapel.rotation.z = side * 0.22
    apresentador.add(lapel)
  }

  // braço direito estendido no aperto de mão (peça animável própria)
  const bracoAperto = apresentador.getObjectByName('armR')!
  bracoAperto.rotation.set(-1.35, 0, -0.3)
  root.add(apresentador)

  // ---- você: o convidado, de 3/4, apertando a mão do apresentador -----------
  const MAO: [number, number, number] = [0.68, 0.62, 0.11]
  const convidado = person({ body: GUEST, skin: SKIN, height: 1.5, armAngle: 0.3 })
  convidado.position.set(1.08, GY, -0.05)
  convidado.rotation.y = -1.19 // de frente para o apresentador, meio virado à câmera
  // o braço do lado da câmera é a peça maoConvidado (sacode no aperto)
  const bracoFora = convidado.getObjectByName('armR')
  if (bracoFora) convidado.remove(bracoFora)
  const cabecaConv = convidado.getObjectByName('head')!
  const cabelo = puff(0.24, '#5a3a24', 5, 9, { roughness: 0.8 })
  cabelo.position.set(0, 0.17, -0.05)
  cabelo.scale.set(1.05, 0.55, 1.05)
  cabecaConv.add(cabelo)
  // crachá de convidado no peito
  const cracha = rbox(0.11, 0.08, 0.015, 0.01, '#efe9dc', { roughness: 0.7 })
  cracha.position.set(-0.09, 0.55, 0.245)
  cracha.rotation.y = -0.2
  convidado.add(cracha)
  root.add(convidado)

  // ombro do convidado (lado +x local, girado com o corpo) relativo à mão
  const ombro = new THREE.Vector3(1.5 * 0.17 * 1.15, 1.5 * 0.52 * 0.62, 0)
    .applyAxisAngle(new THREE.Vector3(0, 1, 0), convidado.rotation.y)
    .add(convidado.position)
    .sub(new THREE.Vector3(...MAO))
  const dirBraco = ombro.clone().normalize()
  const lenBraco = ombro.length()

  const maoConvidado = new THREE.Group()
  maoConvidado.position.set(...MAO)

  const palm = sphere(0.1, SKIN, { roughness: 0.6 })
  palm.scale.set(1, 0.85, 1.05)
  maoConvidado.add(palm)
  // dedos fechando por cima da mão do apresentador
  for (let i = 0; i < 4; i++) {
    const finger = capsule(0.024, 0.075, SKIN, { roughness: 0.6 })
    finger.position.set(-0.07, 0.04 - i * 0.04, 0.03)
    finger.rotation.set(0.2, 0, 1.2)
    maoConvidado.add(finger)
  }
  const thumb = capsule(0.026, 0.06, SKIN, { roughness: 0.6 })
  thumb.position.set(-0.04, 0.09, -0.03)
  thumb.rotation.z = 0.9
  maoConvidado.add(thumb)

  const yAxis = new THREE.Vector3(0, 1, 0)
  const alongArm = (t: number, obj: THREE.Object3D) => {
    obj.position.copy(dirBraco).multiplyScalar(t)
    obj.quaternion.setFromUnitVectors(yAxis, dirBraco)
    maoConvidado.add(obj)
  }
  alongArm(0.13, cylinder(0.088, 0.094, 0.08, '#efe9dc', { roughness: 0.85 })) // punho da camisa
  const mangaLen = lenBraco - 0.17
  alongArm(0.17 + mangaLen / 2, capsule(0.09, Math.max(mangaLen - 0.12, 0.05), GUEST, { roughness: 0.9 }))
  root.add(maoConvidado)

  // ---- três fãs miúdos com caderninhos --------------------------------------
  const fanSpec: [string, number, number, number][] = [
    [FAN_A, -1.5, 0.4, 1.45],
    [FAN_B, -1.42, -0.4, 1.2],
    [FAN_C, -1.72, 1.2, 1.7],
  ]
  const fas = fanSpec.map(([color, x, z, ry]) => {
    const f = person({ body: color, skin: SKIN, height: 0.72, armAngle: 0.18 })
    f.position.set(x, GY, z)
    f.rotation.y = ry

    const pad = rbox(0.13, 0.16, 0.02, 0.01, '#efe9dc', { roughness: 0.8 })
    pad.position.set(0.02, 0.4, 0.2)
    pad.rotation.set(-0.35, 0, 0.15)
    const pen = capsule(0.012, 0.08, BRASS, { roughness: 0.3, metalness: 0.7 })
    pen.position.set(-0.09, 0.42, 0.19)
    pen.rotation.set(0, 0, 0.6)
    f.add(pad, pen)
    return f
  })
  for (const f of fas) root.add(f)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'postes', group: 'cenario', object: postes },
    { name: 'apresentador', group: 'apresentador', object: apresentador },
    { name: 'bracoAperto', group: 'apresentador', object: bracoAperto },
    { name: 'convidado', group: 'apresentador', object: convidado },
    { name: 'maoConvidado', group: 'apresentador', object: maoConvidado },
    { name: 'painel', group: 'letreiro', object: painel },
    { name: 'neon', group: 'letreiro', object: neon },
    { name: 'fa1', group: 'fas', object: fas[0] },
    { name: 'fa2', group: 'fas', object: fas[1] },
    { name: 'fa3', group: 'fas', object: fas[2] },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'Sobe o palco e o tapete vermelho da estreia…',
    }),
    seq('postes-rise', 'postes', 0.25, 0.8, [riseFrom(0, 1.5)], { ease: 'easeOut' }),

    seq('apresentador-rise', 'apresentador', 2.0, 0.8, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: '…e brota o APRESENTADOR de terno dourado, que agarra a sua mão.',
    }),
    seq('braco-estende', 'bracoAperto', 2.0, 0.9, [ch('rotation.x', -0.15, -1.35)], {
      ease: 'easeOut',
    }),
    seq('convidado-rise', 'convidado', 2.4, 0.7, [riseFrom(GY, 1.9)], { ease: 'easeOut' }),
    seq('mao-rise', 'maoConvidado', 2.6, 0.7, [riseFrom(0.62, 1.0)], { ease: 'easeOut' }),

    seq('garganta-raspa', 'apresentador', 3.5, 0.55, [ch('rotation.x', 0, -0.16)], {
      caption: 'Ele raspa a garganta — "IÁ! RRÊ-ter…" — e anuncia o seu nome ao mundo.',
    }),
    seq('garganta-volta', 'apresentador', 4.05, 0.55, [ch('rotation.x', -0.16, 0)]),

    seq('aperto-a', 'bracoAperto', 4.7, 0.3, [ch('rotation.x', -1.35, -1.18)]),
    seq('mao-a', 'maoConvidado', 4.7, 0.3, [ch('position.y', 0.62, 0.7)]),
    seq('aperto-b', 'bracoAperto', 5.0, 0.3, [ch('rotation.x', -1.18, -1.48)]),
    seq('mao-b', 'maoConvidado', 5.0, 0.3, [ch('position.y', 0.7, 0.55)]),
    seq('aperto-c', 'bracoAperto', 5.3, 0.3, [ch('rotation.x', -1.48, -1.35)]),
    seq('mao-c', 'maoConvidado', 5.3, 0.3, [ch('position.y', 0.55, 0.62)]),

    seq('painel-rise', 'painel', 6.2, 0.8, [riseFrom(0, 2.7)], {
      ease: 'easeOut',
      caption: 'Atrás dele ergue-se o letreiro do evento…',
    }),
    seq(
      'neon-acende',
      'neon',
      6.6,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '…e acende em neon: TRÊV·LIT! (trevligt, com o "g" mudo)' },
    ),
    seq('neon-pisca-a', 'neon', 7.4, 0.3, [ch('scale.x', 1, 1.06), ch('scale.y', 1, 1.06)]),
    seq('neon-pisca-b', 'neon', 7.7, 0.3, [ch('scale.x', 1.06, 1), ch('scale.y', 1.06, 1)]),

    seq('fa1-rise', 'fa1', 8.6, 0.7, [riseFrom(GY, 1.1)], {
      ease: 'easeOut',
      caption: 'Atrás do cordão, TRÊS FÃS miúdos batem palmas com caderninhos: TRÉ-fas!',
    }),
    seq('fa2-rise', 'fa2', 8.8, 0.7, [riseFrom(GY, 1.1)], { ease: 'easeOut' }),
    seq('fa3-rise', 'fa3', 9.0, 0.7, [riseFrom(GY, 1.1)], { ease: 'easeOut' }),

    seq('fa1-pula', 'fa1', 9.9, 0.3, [ch('position.y', GY, GY + 0.16)], { ease: 'easeOut' }),
    seq('fa1-cai', 'fa1', 10.2, 0.35, [ch('position.y', GY + 0.16, GY)], { ease: 'easeIn' }),
    seq('fa2-pula', 'fa2', 10.05, 0.3, [ch('position.y', GY, GY + 0.14)], { ease: 'easeOut' }),
    seq('fa2-cai', 'fa2', 10.35, 0.35, [ch('position.y', GY + 0.14, GY)], { ease: 'easeIn' }),
    seq('fa3-pula', 'fa3', 10.2, 0.3, [ch('position.y', GY, GY + 0.18)], { ease: 'easeOut' }),
    seq('fa3-cai', 'fa3', 10.5, 0.35, [ch('position.y', GY + 0.18, GY)], { ease: 'easeIn' }),

    seq('reverencia', 'apresentador', 11.1, 0.6, [ch('rotation.x', 0, 0.14)], {
      caption: 'Jag heter ... Trevligt att träffas! — "Meu nome é ... Prazer em te conhecer!"',
    }),
    seq('reverencia-volta', 'apresentador', 11.7, 0.6, [ch('rotation.x', 0.14, 0)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.75, 2.55, 5.0], target: [0.1, 1.15, -0.35] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-heter-trevligt-att-traffas',
    contexto:
      'Primeiro contato: vizinho novo, colega apresentado no trabalho, festa de aniversário de criança.',
    fraseFonte: 'Meu nome é ... Prazer em te conhecer!',
    fraseAlvo: 'Jag heter ... Trevligt att träffas!',
    pronuncia:
      "iá RRÊ-ter ... TRÊV-lit at TRÉ-fass (o 'h' de heter é aspirado tipo 'rr' carioca; o 'g' de trevligt é mudo)",
    ponteSonora:
      "IÁ! RRÊ-ter... TRÊV-LIT' A TRÉ-fas! (TRÊV colado como o final de KIEV, sem vogal depois do V; TRÉ-fas com final ORAL, sem nasal)",
    historia:
      'Tapete vermelho e cordão de veludo. Um apresentador de neon agarra sua mão, raspa a garganta ("RRÊÊ") e anuncia seu nome ao mundo. Atrás dele pisca um letreiro aceso escrito TRÊV·LIT, e TRÊS FÃS miúdos batem palmas com caderninhos de autógrafo na mão.',
  },
  createScene,
}

export default card
