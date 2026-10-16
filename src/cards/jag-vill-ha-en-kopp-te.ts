import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, torus, lathe,
} from '../rig/helpers'

/**
 * "Jag vill ha en kopp te." — a pulga VILÃ de cartola e capa, fugida do circo,
 * sobe no balcão do café da estação: IÁ! VIL! RRÁ! — ergue UMA patinha (EN) e
 * aponta o CÓP(o) de vidro fumegante com a etiqueta amarela TÊ.
 */

const WOOD = '#d8ae78'
const WOOD_LINE = '#b98d58'
const WOOD_DARK = '#7a5636'
const TILE = '#f2f0ea'
const GROUT = '#c8c2b5'
const FLEA = '#8c3a20'
const FLEA_LIGHT = '#b05a32'
const FLEA_DARK = '#5e2414'
const CAPE = '#1f1c24'
const LINING = '#8a1f2c'
const TEA = '#a9541a'
const TEA_TOP = '#c06a26'
const BAG = '#dcc8a0'
const PORCELAIN = '#f6f4ef'
const INK = '#1d1b22'
const ACCENT = '#ffcc14' // acento RESERVADO: a etiqueta TÊ

const CY = 0.25 // tampo do balcão
const FX = -0.62
const FZ = 0.05
const GX = 0.78
const GZ = 0.12
const PATA_FINAL = -0.25

/** Cápsula entre dois pontos. */
function link(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(d.length(), 0.001), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return m
}

const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.02, 0.006, INK, { roughness: 0.6 })
  s.position.set(x, y, 0.02)
  s.rotation.z = rot
  return s
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- balcão de madeira clara ---------------------------------------------
  const base = new THREE.Group()
  const plinth = rbox(5.4, 0.12, 2.9, 0.04, WOOD_DARK, { roughness: 0.8 })
  plinth.position.y = 0.06
  base.add(plinth)
  const top = rbox(5.2, 0.14, 2.7, 0.05, WOOD, { roughness: 0.6 })
  top.position.y = 0.18
  base.add(top)
  for (const z of [-0.9, -0.45, 0, 0.45, 0.9]) {
    const seam = rbox(5.1, 0.006, 0.02, 0.003, WOOD_LINE, { roughness: 0.7 })
    seam.position.set(0, CY + 0.002, z)
    base.add(seam)
  }
  // caixinha de madeira de saquinhos ao fundo
  const caixa = rbox(0.7, 0.22, 0.42, 0.03, WOOD_DARK, { roughness: 0.7 })
  caixa.position.set(1.85, CY + 0.11, -0.75)
  caixa.rotation.y = -0.3
  base.add(caixa)
  root.add(base)

  // ---- parede de azulejos brancos ------------------------------------------
  const parede = new THREE.Group()
  const wall = rbox(5.2, 2.8, 0.14, 0.04, GROUT, { roughness: 0.8 })
  wall.position.set(0, CY + 1.4, -1.3)
  parede.add(wall)
  const tileProto = rbox(0.38, 0.18, 0.04, 0.02, TILE, { roughness: 0.25 })
  for (let row = 0; row < 14; row++) {
    const off = row % 2 === 0 ? 0 : 0.2
    for (let col = -7; col <= 6; col++) {
      const x = col * 0.4 + off
      if (Math.abs(x) > 2.4) continue
      const t = tileProto.clone()
      t.position.set(x, CY + 0.1 + row * 0.2, -1.21)
      parede.add(t)
    }
  }
  root.add(parede)

  // ---- pulga vilã -----------------------------------------------------------
  const pulga = new THREE.Group()
  pulga.position.set(FX, CY, FZ)
  pulga.rotation.y = 0.28
  const gloss = { roughness: 0.32 }

  const abdomen = sphere(0.4, FLEA, gloss)
  abdomen.scale.set(0.88, 1.18, 0.95)
  abdomen.position.set(0, 0.78, -0.02)
  pulga.add(abdomen)
  const belly = sphere(0.33, FLEA_LIGHT, gloss)
  belly.scale.set(0.8, 1.05, 0.45)
  belly.position.set(0, 0.8, 0.2)
  pulga.add(belly)
  const thorax = sphere(0.27, FLEA, gloss)
  thorax.scale.set(1, 0.9, 0.95)
  thorax.position.set(0, 1.24, 0.03)
  pulga.add(thorax)

  for (const s of [-1, 1]) {
    // pernas traseiras compridas e dobradas
    const hip = v(s * 0.22, 0.5, 0.02)
    const knee = v(s * 0.52, 0.64, 0.12)
    const ankle = v(s * 0.45, 0.08, 0.16)
    const toe = v(s * 0.48, 0.05, 0.38)
    pulga.add(link(hip, knee, 0.1, FLEA, gloss))
    pulga.add(link(knee, ankle, 0.06, FLEA_DARK, gloss))
    pulga.add(link(ankle, toe, 0.05, FLEA_DARK, gloss))
    // patas do meio na cintura
    const sh = v(s * 0.3, 0.98, 0.06)
    const el = v(s * 0.52, 0.82, 0.14)
    const hd = v(s * 0.36, 0.64, 0.26)
    pulga.add(link(sh, el, 0.05, FLEA_DARK, gloss))
    pulga.add(link(el, hd, 0.045, FLEA_DARK, gloss))
  }
  // pata esquerda no peito (IÁ!)
  const shL = v(-0.27, 1.22, 0.05)
  const elL = v(-0.42, 1.0, 0.2)
  const pwL = v(-0.12, 1.12, 0.3)
  pulga.add(link(shL, elL, 0.055, FLEA_DARK, gloss))
  pulga.add(link(elL, pwL, 0.05, FLEA_DARK, gloss))
  const pawL = sphere(0.065, FLEA_DARK, gloss)
  pawL.position.copy(pwL)
  pulga.add(pawL)
  root.add(pulga)

  // ---- capa preta de forro vermelho (filha da pulga) -----------------------
  const capa = new THREE.Group()
  capa.position.set(0, 1.36, -0.02)
  const capeGeo = new THREE.CylinderGeometry(0.27, 0.62, 1.3, 40, 1, true, Math.PI - 1.75, 3.5)
  capeGeo.translate(0, -0.65, 0)
  const outer = new THREE.Mesh(capeGeo, mat(CAPE, { roughness: 0.6 }))
  outer.castShadow = true
  capa.add(outer)
  const innerMat = mat(LINING, { roughness: 0.5 })
  innerMat.side = THREE.BackSide
  const inner = new THREE.Mesh(capeGeo.clone().scale(0.97, 1, 0.97), innerMat)
  capa.add(inner)
  const collarGeo = new THREE.CylinderGeometry(0.38, 0.26, 0.3, 32, 1, true, Math.PI - 1.5, 3.0)
  collarGeo.translate(0, 0.14, 0)
  const collar = new THREE.Mesh(collarGeo, mat(CAPE, { roughness: 0.6 }))
  capa.add(collar)
  const collarIn = mat(LINING, { roughness: 0.5 })
  collarIn.side = THREE.BackSide
  capa.add(new THREE.Mesh(collarGeo.clone().scale(0.96, 1, 0.96), collarIn))
  pulga.add(capa)

  // ---- cabeça ---------------------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.55, 0.06)
  const skull = sphere(0.25, FLEA, gloss)
  skull.scale.set(1, 0.95, 1)
  cabeca.add(skull)
  const muzzle = sphere(0.15, FLEA_LIGHT, gloss)
  muzzle.scale.set(1.1, 0.8, 1)
  muzzle.position.set(0, -0.07, 0.17)
  cabeca.add(muzzle)
  for (const s of [-1, 1]) {
    const eye = sphere(0.085, '#ffffff', { roughness: 0.25 })
    eye.position.set(s * 0.1, 0.06, 0.2)
    eye.scale.z = 0.6
    const pupil = sphere(0.04, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(s * 0.1 + 0.02, 0.04, 0.245)
    const lid = sphere(0.088, FLEA_DARK, gloss)
    lid.scale.set(1, 0.5, 0.62)
    lid.position.set(s * 0.1, 0.1, 0.202)
    cabeca.add(eye, pupil, lid)
  }
  pulga.add(cabeca)

  // boca escancarada (filha da cabeça)
  const boca = new THREE.Group()
  boca.position.set(0, -0.13, 0.28)
  const cav = sphere(0.1, '#3b1418', { roughness: 0.6 })
  cav.scale.set(1.25, 0.8, 0.55)
  boca.add(cav)
  const tongue = sphere(0.055, '#d9707c', { roughness: 0.4 })
  tongue.scale.set(1.3, 0.5, 0.8)
  tongue.position.set(0, -0.04, 0.03)
  boca.add(tongue)
  const teeth = rbox(0.14, 0.035, 0.03, 0.01, '#f7f3ea', { roughness: 0.3 })
  teeth.position.set(0, 0.05, 0.04)
  boca.add(teeth)
  cabeca.add(boca)

  // bigodinho enrolado + sobrancelhas de vilã
  const bigode = new THREE.Group()
  bigode.position.set(0, -0.085, 0.3)
  for (const s of [-1, 1]) {
    const half = capsule(0.022, 0.1, INK, { roughness: 0.5 })
    half.rotation.z = Math.PI / 2 + s * 0.35
    half.position.set(s * 0.065, 0.01, 0)
    bigode.add(half)
    const curl = torus(0.028, 0.012, INK, { roughness: 0.5 })
    curl.position.set(s * 0.13, 0.03, -0.01)
    bigode.add(curl)
    const brow = capsule(0.018, 0.09, INK, { roughness: 0.5 })
    brow.rotation.z = Math.PI / 2 - s * 0.45
    brow.position.set(s * 0.1, 0.245, -0.09)
    bigode.add(brow)
  }
  cabeca.add(bigode)

  // cartola preta pequena
  const cartola = new THREE.Group()
  cartola.position.set(0, 0.22, -0.01)
  cartola.rotation.z = 0.15
  const brim = cylinder(0.21, 0.21, 0.025, INK, { roughness: 0.5 })
  cartola.add(brim)
  const crown = lathe([[0, 0], [0.13, 0], [0.145, 0.3], [0, 0.3]], INK, { roughness: 0.5 })
  cartola.add(crown)
  const band = cylinder(0.136, 0.134, 0.05, LINING, { roughness: 0.5 })
  band.position.y = 0.05
  cartola.add(band)
  cabeca.add(cartola)

  // pata erguida (EN) — gira pelo ombro
  const pata = new THREE.Group()
  pata.position.set(0.27, 1.22, 0.05)
  pata.rotation.z = PATA_FINAL
  pata.add(link(v(0, 0, 0), v(0.05, 0.35, 0.02), 0.055, FLEA_DARK, gloss))
  pata.add(link(v(0.05, 0.35, 0.02), v(0.02, 0.66, 0.04), 0.05, FLEA_DARK, gloss))
  const paw = sphere(0.07, FLEA_DARK, gloss)
  paw.position.set(0.02, 0.7, 0.04)
  pata.add(paw)
  const finger = capsule(0.028, 0.12, FLEA_DARK, gloss)
  finger.position.set(0.02, 0.82, 0.05)
  pata.add(finger)
  pulga.add(pata)

  // ---- pires ----------------------------------------------------------------
  const pires = lathe(
    [[0, 0], [0.4, 0], [0.46, 0.02], [0.62, 0.07], [0.64, 0.085], [0.6, 0.085], [0.44, 0.04], [0, 0.04]],
    PORCELAIN,
    { roughness: 0.3 },
  )
  pires.position.set(GX, CY, GZ)
  root.add(pires)

  // ---- copo de vidro com chá -----------------------------------------------
  const copo = new THREE.Group()
  copo.position.set(GX, CY + 0.04, GZ)
  const glassMat = mat('#e4f1f2', { roughness: 0.05, detail: 0 })
  glassMat.transparent = true
  glassMat.opacity = 0.3
  glassMat.depthWrite = false
  const glass = lathe([[0, 0], [0.36, 0], [0.37, 0.02], [0.44, 1.45], [0.42, 1.45], [0.35, 0.12], [0, 0.12]], '#e4f1f2')
  glass.material = glassMat
  glass.castShadow = false
  copo.add(glass)
  const rim = torus(0.43, 0.012, '#ffffff', { roughness: 0.1 })
  rim.rotation.x = Math.PI / 2
  rim.position.y = 1.45
  copo.add(rim)
  const tea = cylinder(0.4, 0.345, 1.08, TEA, { roughness: 0.15 })
  tea.position.y = 0.66
  copo.add(tea)
  const teaTop = cylinder(0.4, 0.4, 0.01, TEA_TOP, { roughness: 0.1 })
  teaTop.position.y = 1.205
  copo.add(teaTop)
  root.add(copo)

  // ---- vapor ---------------------------------------------------------------
  const vapor = new THREE.Group()
  vapor.position.set(GX, CY + 1.3, GZ)
  for (const [x0, ph] of [[-0.15, 0], [0.02, 1.4], [0.18, 2.6]] as const) {
    let prev = v(x0, 0, 0)
    for (let i = 1; i <= 7; i++) {
      const p = v(x0 + Math.sin(i * 0.9 + ph) * 0.07, i * 0.13, Math.cos(i * 0.7 + ph) * 0.03)
      const m = link(prev, p, 0.045 - i * 0.004, '#ffffff', { roughness: 0.9, detail: 0 })
      m.castShadow = false
      vapor.add(m)
      prev = p
    }
  }
  root.add(vapor)

  // ---- saquinho + barbante -------------------------------------------------
  const saquinho = new THREE.Group()
  const bag = rbox(0.22, 0.28, 0.06, 0.03, BAG, { roughness: 0.9 })
  bag.position.set(GX + 0.1, CY + 1.5, GZ - 0.05)
  bag.rotation.z = 0.2
  saquinho.add(bag)
  const bagTop = v(GX + 0.08, CY + 1.64, GZ - 0.02)
  const rimPt = v(GX - 0.05, CY + 1.5, GZ + 0.44)
  const tagTop = v(GX - 0.05, 1.14, GZ + 0.48)
  saquinho.add(link(bagTop, rimPt, 0.008, '#eae0c8'))
  saquinho.add(link(rimPt, tagTop, 0.008, '#eae0c8'))
  root.add(saquinho)

  // ---- etiqueta amarela TÊ -------------------------------------------------
  const etiqueta = new THREE.Group()
  etiqueta.position.set(GX - 0.05, 0.86, GZ + 0.49)
  etiqueta.rotation.set(-0.08, -0.12, 0)
  etiqueta.add(rbox(0.5, 0.54, 0.025, 0.04, ACCENT, { roughness: 0.45 }))
  const grommet = torus(0.025, 0.008, '#9a9a9a', { roughness: 0.3, metalness: 0.7 })
  grommet.position.set(0, 0.22, 0.015)
  etiqueta.add(grommet)
  const t = 0.045
  const y0 = -0.06
  // T
  etiqueta.add(stroke(0.17, t, -0.11, y0 + 0.0875))
  etiqueta.add(stroke(t, 0.22, -0.11, y0))
  // Ê
  const ex = 0.05
  etiqueta.add(stroke(t, 0.22, ex, y0))
  etiqueta.add(stroke(0.14, t, ex - t / 2 + 0.07, y0 + 0.0875))
  etiqueta.add(stroke(0.11, t, ex - t / 2 + 0.055, y0))
  etiqueta.add(stroke(0.14, t, ex - t / 2 + 0.07, y0 - 0.0875))
  // chapeuzinho bem grande
  const cx = ex + 0.045
  etiqueta.add(stroke(0.11, 0.035, cx - 0.04, y0 + 0.165, 0.65))
  etiqueta.add(stroke(0.11, 0.035, cx + 0.04, y0 + 0.165, -0.65))
  root.add(etiqueta)

  const parts = [
    { name: 'base', group: 'cafe', object: base },
    { name: 'parede', group: 'cafe', object: parede },
    { name: 'pulga', group: 'pulga', object: pulga },
    { name: 'capa', group: 'vil', object: capa },
    { name: 'cartola', group: 'vil', object: cartola },
    { name: 'cabeca', group: 'pulga', object: cabeca },
    { name: 'boca', group: 'rra', object: boca },
    { name: 'bigode', group: 'rra', object: bigode },
    { name: 'pata', group: 'en', object: pata },
    { name: 'pires', group: 'kopp', object: pires },
    { name: 'copo', group: 'kopp', object: copo },
    { name: 'vapor', group: 'kopp', object: vapor },
    { name: 'saquinho', group: 'te', object: saquinho },
    { name: 'etiqueta', group: 'te', object: etiqueta },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Um café de estação: balcão de madeira clara e azulejos brancos…',
    }),
    seq('parede-rise', 'parede', 0.2, 0.9, [riseFrom(0, 3.2)], { ease: 'easeOut' }),

    seq('pulga-salto-a', 'pulga', 1.5, 0.35, [ch('position.x', -2.8, -1.7), ch('position.y', CY + 0.3, CY + 1.0)], {
      ease: 'easeOut',
      caption: '…e uma PULGA VILÃ, fugida do circo de pulgas, pula no balcão!',
    }),
    seq('pulga-salto-b', 'pulga', 1.85, 0.4, [ch('position.x', -1.7, FX), ch('position.y', CY + 1.0, CY)], { ease: 'easeIn' }),
    seq('cabeca-surge', 'cabeca', 1.5, 0.3, [ch('rotation.x', 0.2, 0)]),
    seq('pata-surge', 'pata', 1.5, 0.3, [ch('rotation.z', -2.6, -2.75)]),

    seq('capa-abre', 'capa', 3.0, 0.7, [ch('scale.y', 0.05, 1), ch('scale.x', 0.6, 1)], {
      ease: 'easeOut',
      caption: 'De capa e cartola, bate no peito — IÁ! — e se anuncia: VIL!',
    }),
    seq('cartola-cai', 'cartola', 3.3, 0.6, [ch('position.y', 0.9, 0.22), ch('rotation.z', -0.6, 0.15)], { ease: 'easeIn' }),

    seq('boca-abre', 'boca', 4.8, 0.4, s3(0.15, 1), {
      ease: 'easeOut',
      caption: 'Torce o bigodinho e solta a gargalhada de vilã: RRÁ!',
    }),
    seq('bigode-surge', 'bigode', 4.8, 0.4, s3(0.01, 1), { ease: 'easeOut' }),
    seq('cabeca-ri', 'cabeca', 5.0, 0.3, [ch('rotation.x', 0, -0.2)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 5.4, 0.4, [ch('rotation.x', -0.2, 0)]),

    seq('pata-ergue', 'pata', 6.3, 0.7, [ch('rotation.z', -2.75, PATA_FINAL)], {
      ease: 'easeOut',
      caption: 'Ergue UMA patinha só — EN…',
    }),

    seq('pires-rise', 'pires', 7.4, 0.6, [riseFrom(CY, 0.6)], {
      ease: 'easeOut',
      caption: '…e aponta o COPO sem o -O, de vidro fumegante, gigante pra ela: CÓP!',
    }),
    seq('copo-rise', 'copo', 7.55, 0.8, [riseFrom(CY + 0.04, 1.8)], { ease: 'easeOut' }),
    seq('vapor-sobe', 'vapor', 8.3, 0.8, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),

    seq('saquinho-cai', 'saquinho', 9.3, 0.5, [ch('position.y', 0.8, 0)], {
      ease: 'easeIn',
      caption: 'Na borda, o saquinho de chá com a etiqueta amarela: TÊ!',
    }),
    seq('etiqueta-cai', 'etiqueta', 9.3, 0.5, [ch('position.y', 1.66, 0.86)], { ease: 'easeIn' }),
    seq('etiqueta-balanca', 'etiqueta', 9.8, 0.4, [ch('rotation.z', 0.15, 0)]),

    seq('pulga-pula', 'pulga', 11.0, 0.3, [ch('position.y', CY, CY)], {
      caption: 'Jag vill ha en kopp te. — Eu quero uma xícara de chá.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 2.2, 4.6], target: [0.08, 1.15, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-vill-ha-en-kopp-te',
    contexto:
      "Café: no balcão, na cafeteria do trabalho, no vagão-bistrô do trem ou na casa de alguém, quando perguntam 'Kaffe eller te?'. No balcão costuma vir a pergunta do sabor — 'Vilket te?' — ou te entregam a caneca com água quente pra você escolher o saquinho numa caixinha de madeira.",
    fraseFonte: 'Eu quero uma xícara de chá.',
    fraseAlvo: 'Jag vill ha en kopp te.',
    pronuncia:
      "iá vil rrá en KÓP TÊÊ ('jag' = iá, o G não soa; 'vill' com I curto e L de verdade — língua no céu da boca, nunca 'viu' —, emendado no 'ha'; 'ha' com h soprado e A longo, mas sem pancada e sem R no fim; 'en' curtinho, N de língua, sem o 'ẽ' nasal; 'kopp' com Ó ABERTO e CURTO de 'só' e o P segurado um instante (é dobrado), seco, sem 'pi' no fim; 'te' = TÊÊ, Ê FECHADO e LONGO, T seco de 'tatu' — nunca 'tchê'; a força cai no KÓP e, maior, no TÊ)",
    ponteSonora:
      "IÁ, VIL! RRÁ! EN... CÓP(o)... TÊ! (6 sílabas: iá-vil-rrá-en-KÓP-TÊÊ; força no CÓP e, maior, no TÊ; IÁ é o 'jag' de sempre, I de IOGA, nunca o J chiado de 'já'; VIL = o 'vill' da bruxa vil e da avestruz vilã ('Vill du ha något att dricka?', 'Vill du ha kvittot?', 'Jag vill lämna tillbaka den här'): I curto e L DE VERDADE, língua no céu da boca — nunca 'viu' —, e nunca VÍLIA, que é 'vilja'; RRÁ = a gargalhada de vilã, UMA só, o MESMO RRÁ soprado de 'Ha det bra' e 'Vill du ha...?': h como RR carioca leve, A longo e SEM R no fim — com R vira 'har' (tenho); EN = o 'en' (um) de sempre, a patinha erguida — o MESMO dedo erguido de 'Har du tid en stund?' e 'Får jag fråga en sak?': E curto, N de língua, sem o 'ẽ' nasal; CÓP(o) = o COPO sem o -O, que o português já fala com Ó ABERTO de 'só' e a força no lugar certo: é só NÃO dizer o -O — os lábios fecham no P e param, segurando um instante (é o 'pp' dobrado), nunca 'CÓ-pi'; TÊ = o nome da letra T, do jeito que o alfabeto português diz — e é assim, escrito TÊ, de chapeuzinho, que vem na etiqueta: não é o T mudo e seco da trilha em T de 'Hur långt är det?' nem da mesa em T de 'mötet', que é só consoante; aqui é a sílaba inteira, Ê FECHADO e LONGO, TÊÊ, com T seco de 'tatu' — nunca 'tchê'; de quebra, em inglês 'tea' soa igual à letra T)",
    historia:
      'A pulga vilã, de cartola e capa preta, fugiu do circo de pulgas e invadiu o café da estação. Sobe no balcão, bate no peito — IÁ! —, se anuncia VIL e solta a gargalhada de vilã: RRÁ! Depois ergue UMA patinha só, EN, e aponta o COPO de vidro fumegante — gigante pra ela — com um saquinho pendurado na borda e a etiqueta marcada TÊ. E mergulha de capa e tudo: até o vilão, no frio sueco, só quer uma xícara de chá.',
  },
  createScene,
}

export default card
