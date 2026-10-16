import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Kan jag få en servett?" — CA-NIÁ, FÔ... EN... CER(a)-VÉT(o)!
 *
 * Quiosque de café na feira. O apicultor lambuzado de mel finca a CANA no
 * chão (CA-NIÁ), solta um puf do fumigador (FÔ), ergue UM dedo (EN), tem
 * CERA grudada no peito (CER) e a luva carimbada de VETO (VÉT). O pote de
 * guardanapos fica lá na ponta do balcão. O vermelho é RESERVADO ao VETO.
 */

const GRASS = '#6f9a4a'
const GRASS_DARK = '#5a8540'
const SOIL = '#4a3a2a'
const WOOD = '#4a3020'
const WOOD_TOP = '#6a4630'
const WOOD_LINE = '#3a2418'
const STRIPE_Y = '#efc94c'
const STRIPE_W = '#f6f1e4'
const POST = '#d9d2c2'
const SUIT = '#f2f0ea'
const SUIT_SHADE = '#d8d5cc'
const SKIN = '#e8c39e'
const HAT = '#e9e1c9'
const VEIL = '#1d1d22'
const GLOVE = '#f0d560'
const HONEY = '#d98b12'
const WAX = '#e6b53c'
const WAX_CELL = '#b8861e'
const SILVER = '#c9ced4'
const NAPKIN = '#fbfaf6'
const BELLOWS = '#7a4e2c'
const SMOKE = '#a9a9ad'
const CANE = '#a3b552'
const CANE_DARK = '#8da046'
const CANE_NODE = '#5e4a2a'
const LEAF = '#5f913c'
const RED = '#d6262b' // acento RESERVADO ao VETO e ao carimbo

const GY = 0.16
const S = 1.25
const P: [number, number, number] = [-0.35, GY, 0.25]
const YAW = 0.15
const ARM_REST = -0.5
const ARM_UP = 2.3
const COUNTER_H = 0.95
const TOPY = GY + COUNTER_H
const STAMP: [number, number, number] = [1.12, TOPY, -0.32]

function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.02, 0.005, RED, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** V E T O em traço grosso vermelho, ~0.075 de largura por letra. */
function letter(which: 'V' | 'E' | 'T' | 'O') {
  const g = new THREE.Group()
  const t = 0.02
  const h = 0.1
  if (which === 'V') {
    g.add(stroke(t, h * 1.05, -0.016, 0, 0.3))
    g.add(stroke(t, h * 1.05, 0.016, 0, -0.3))
  } else if (which === 'E') {
    g.add(stroke(t, h, -0.022, 0))
    for (const y of [h / 2 - t / 2, 0, -h / 2 + t / 2]) g.add(stroke(0.05, t, 0.002, y))
  } else if (which === 'T') {
    g.add(stroke(0.06, t, 0, h / 2 - t / 2))
    g.add(stroke(t, h, 0, 0))
  } else {
    g.add(stroke(t, h, -0.022, 0))
    g.add(stroke(t, h, 0.022, 0))
    g.add(stroke(0.05, t, 0, h / 2 - t / 2))
    g.add(stroke(0.05, t, 0, -h / 2 + t / 2))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: grama ---------------------------------------------------------
  const base = new THREE.Group()
  const soil = cylinder(2.55, 2.65, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)
  const grass = cylinder(2.5, 2.55, 0.06, GRASS, { roughness: 0.92 })
  grass.position.y = 0.13
  base.add(grass)
  for (let i = 0; i < 9; i++) {
    const a = rand() * Math.PI * 2
    const r = 1.4 + rand() * 0.9
    const tufo = puff(0.09 + rand() * 0.05, GRASS_DARK, 4, 10 + i, { roughness: 0.9 })
    tufo.scale.y = 0.6
    tufo.position.set(Math.cos(a) * r, GY + 0.03, Math.sin(a) * r)
    base.add(tufo)
  }
  root.add(base)

  // ---- balcão + toldo ------------------------------------------------------
  const balcao = new THREE.Group()
  balcao.position.set(1.25, 0, -0.45)
  root.add(balcao)
  const corpo = rbox(1.8, COUNTER_H, 0.6, 0.04, WOOD, { roughness: 0.7 })
  corpo.position.y = GY + COUNTER_H / 2
  balcao.add(corpo)
  for (let k = -3; k <= 3; k++) {
    const ripa = rbox(0.02, COUNTER_H - 0.12, 0.02, 0.008, WOOD_LINE, { roughness: 0.8 })
    ripa.position.set(k * 0.24, GY + COUNTER_H / 2, 0.3)
    balcao.add(ripa)
  }
  const tampo = rbox(1.92, 0.06, 0.7, 0.025, WOOD_TOP, { roughness: 0.55 })
  tampo.position.set(0, TOPY - 0.03, 0.02)
  balcao.add(tampo)
  for (const px of [-0.85, 0.85]) {
    const poste = cylinder(0.035, 0.035, 1.45, POST, { roughness: 0.5, metalness: 0.5 })
    poste.position.set(px, TOPY + 0.72, -0.28)
    balcao.add(poste)
  }
  const toldo = new THREE.Group()
  toldo.position.set(0, TOPY + 1.38, -0.05)
  toldo.rotation.x = 0.32
  balcao.add(toldo)
  for (let k = 0; k < 10; k++) {
    const faixa = rbox(0.2, 0.04, 0.95, 0.015, k % 2 ? STRIPE_W : STRIPE_Y, { roughness: 0.8 })
    faixa.position.set(-0.9 + 0.1 + k * 0.2, 0, 0)
    toldo.add(faixa)
    const aba = cylinder(0.1, 0.1, 0.03, k % 2 ? STRIPE_W : STRIPE_Y, { roughness: 0.8 }, 20)
    aba.rotation.x = Math.PI / 2
    aba.scale.set(1, 1, 1)
    aba.position.set(-0.8 + k * 0.2, -0.08, 0.47)
    toldo.add(aba)
  }
  // copos de papel empilhados e bule
  for (let k = 0; k < 3; k++) {
    const copo = lathe([[0, 0], [0.05, 0], [0.065, 0.12], [0, 0.12]], k % 2 ? '#e9e2d2' : '#d8cdb8', { roughness: 0.7 })
    copo.position.set(0.15 + k * 0.16, TOPY, -0.02)
    balcao.add(copo)
  }
  const bule = lathe([[0, 0], [0.11, 0], [0.13, 0.12], [0.08, 0.24], [0.04, 0.27], [0, 0.28]], '#3d5a5a', { roughness: 0.35, metalness: 0.4 })
  bule.position.set(0.25, TOPY, -0.2)
  balcao.add(bule)

  // ---- pote de guardanapos na ponta mais distante --------------------------
  const pote = new THREE.Group()
  pote.position.set(2.0, TOPY, -0.38)
  root.add(pote)
  const lata = lathe([[0, 0], [0.13, 0], [0.135, 0.02], [0.12, 0.2], [0.13, 0.21], [0, 0.21]], SILVER, { roughness: 0.25, metalness: 0.8 })
  pote.add(lata)
  for (let k = 0; k < 7; k++) {
    const g = rbox(0.15, 0.2, 0.012, 0.01, NAPKIN, { roughness: 0.9 })
    const a = (k / 7) * Math.PI
    g.position.set(Math.cos(a) * 0.03, 0.24, Math.sin(a) * 0.03)
    g.rotation.set(0, a, (k - 3) * 0.12)
    pote.add(g)
  }

  // ---- apicultor -----------------------------------------------------------
  const apicultor = person({ body: SUIT, skin: SKIN, height: 1.5, armAngle: 0.5 })
  apicultor.position.set(...P)
  apicultor.rotation.y = YAW
  apicultor.scale.setScalar(S)
  root.add(apicultor)
  const ziper = rbox(0.025, 0.42, 0.02, 0.008, SUIT_SHADE, { roughness: 0.6 })
  ziper.position.set(0, 0.48, 0.255)
  apicultor.add(ziper)
  for (const side of [-1, 1]) {
    const bolso = rbox(0.1, 0.09, 0.03, 0.015, SUIT_SHADE, { roughness: 0.8 })
    bolso.position.set(side * 0.13, 0.28, 0.235)
    bolso.rotation.y = side * 0.4
    apicultor.add(bolso)
  }

  // chapéu de abas largas + véu escuro translúcido
  const chapeu = new THREE.Group()
  const head = apicultor.getObjectByName('head')!
  chapeu.position.copy(head.position)
  apicultor.add(chapeu)
  const aba = lathe([[0.46, 0.2], [0.47, 0.215], [0.3, 0.24], [0, 0.24]], HAT, { roughness: 0.8 })
  chapeu.add(aba)
  const copa = lathe([[0.27, 0.2], [0.27, 0.36], [0.22, 0.42], [0, 0.43]], HAT, { roughness: 0.8 })
  chapeu.add(copa)
  const fita = cylinder(0.275, 0.275, 0.05, '#8a7a5a', { roughness: 0.7 })
  fita.position.y = 0.25
  chapeu.add(fita)
  const veuMat = new THREE.MeshStandardMaterial({
    color: VEIL, roughness: 0.9, transparent: true, opacity: 0.38, side: THREE.DoubleSide, depthWrite: false,
  })
  const veu = new THREE.Mesh(new THREE.LatheGeometry([
    new THREE.Vector2(0.36, -0.3), new THREE.Vector2(0.4, -0.05), new THREE.Vector2(0.44, 0.2),
  ], 40), veuMat)
  chapeu.add(veu)

  // braço esquerdo com o fumigador (fixo)
  const bracoL = apicultor.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.set(-0.55, 0, 0.1)
  const maoL = bracoL.children[0] as THREE.Mesh
  ;(maoL.material as THREE.MeshStandardMaterial).color.set(GLOVE)
  const punhoL = lathe([[0.1, 0], [0.12, 0.14], [0.11, 0.16], [0, 0.16]], GLOVE, { roughness: 0.5 })
  punhoL.position.y = maoL.position.y + 0.04
  bracoL.add(punhoL)

  // braço direito ergue a luva (peça própria)
  const bracoR = apicultor.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoR, 1.5)
  bracoR.rotation.z = ARM_UP
  const maoR = bracoR.children[0] as THREE.Mesh
  bracoR.remove(maoR)
  const handY = maoR.position.y
  const punhoR = lathe([[0.1, 0], [0.13, 0.16], [0.12, 0.18], [0, 0.18]], GLOVE, { roughness: 0.5 })
  punhoR.position.y = handY + 0.04
  bracoR.add(punhoR)
  const luva = new THREE.Group()
  luva.position.set(0, handY - 0.06, 0)
  luva.rotation.z = -ARM_UP // fica em pé, de frente para a câmera
  bracoR.add(luva)
  const palma = rbox(0.3, 0.28, 0.12, 0.05, GLOVE, { roughness: 0.45 })
  luva.add(palma)
  const dedo = capsule(0.045, 0.16, GLOVE, { roughness: 0.45 })
  dedo.position.set(-0.07, 0.25, 0)
  luva.add(dedo)
  for (let k = 0; k < 3; k++) {
    const no = sphere(0.045, GLOVE, { roughness: 0.45 })
    no.position.set(0.0 + k * 0.07, 0.14, 0.03)
    luva.add(no)
  }
  const polegar = capsule(0.04, 0.09, GLOVE, { roughness: 0.45 })
  polegar.position.set(-0.17, 0.0, 0.02)
  polegar.rotation.z = 0.7
  luva.add(polegar)
  for (const [x, y, r] of [[0.1, 0.12, 0.04], [-0.12, -0.1, 0.035], [0.06, -0.13, 0.03]] as const) {
    const melado = sphere(r, HONEY, { roughness: 0.12 })
    melado.scale.set(1.3, 1, 0.5)
    melado.position.set(x, y, 0.06)
    luva.add(melado)
  }

  // VETO carimbado (peça própria, na frente da palma)
  const veto = new THREE.Group()
  veto.position.set(0, -0.02, 0.065)
  luva.add(veto)
  const moldura = [
    [0.27, 0.016, 0, 0.075], [0.27, 0.016, 0, -0.075], [0.016, 0.15, 0.135, 0], [0.016, 0.15, -0.135, 0],
  ] as const
  for (const [w, h, x, y] of moldura) veto.add(stroke(w, h, x, y))
  ;(['V', 'E', 'T', 'O'] as const).forEach((c, i) => {
    const l = letter(c)
    l.scale.setScalar(0.85)
    l.position.set(-0.093 + i * 0.062, 0, 0)
    veto.add(l)
  })

  // favos de cera no peito
  const favos = new THREE.Group()
  apicultor.add(favos)
  for (const [x, y, r, rot] of [[-0.1, 0.56, 0.085, 0.2], [0.11, 0.42, 0.07, -0.3]] as const) {
    const favo = new THREE.Group()
    favo.position.set(x, y, 0.255)
    favo.rotation.set(Math.PI / 2, rot, 0)
    const placa = cylinder(r, r, 0.04, WAX, { roughness: 0.5 }, 6)
    favo.add(placa)
    for (const [cx, cz] of [[0, 0], [r * 0.5, r * 0.3], [-r * 0.5, r * 0.3], [0, -r * 0.55]] as const) {
      const cel = cylinder(r * 0.22, r * 0.22, 0.012, WAX_CELL, { roughness: 0.4 }, 6)
      cel.position.set(cx, 0.016, cz)
      favo.add(cel)
    }
    favos.add(favo)
  }

  root.updateMatrixWorld(true)

  // ---- fumigador na mão esquerda -------------------------------------------
  const maoLW = maoL.getWorldPosition(new THREE.Vector3())
  const fumigador = new THREE.Group()
  fumigador.position.copy(maoLW)
  root.add(fumigador)
  const fole = rbox(0.07, 0.22, 0.2, 0.025, BELLOWS, { roughness: 0.8 })
  fole.position.set(0.0, -0.06, 0.0)
  fumigador.add(fole)
  const can = cylinder(0.1, 0.1, 0.28, SILVER, { roughness: 0.3, metalness: 0.8 })
  can.position.set(-0.15, -0.04, 0)
  fumigador.add(can)
  const bico = cone(0.1, 0.13, SILVER, { roughness: 0.3, metalness: 0.8 })
  bico.position.set(-0.15, 0.165, 0)
  fumigador.add(bico)
  const aro = torus(0.1, 0.012, '#8d939a', { roughness: 0.3, metalness: 0.8 })
  aro.rotation.x = Math.PI / 2
  aro.position.set(-0.15, 0.1, 0)
  fumigador.add(aro)

  const fumaca = new THREE.Group()
  fumaca.position.set(maoLW.x - 0.32, maoLW.y + 0.5, maoLW.z + 0.05)
  root.add(fumaca)
  const nuvem1 = puff(0.17, SMOKE, 6, 71, { roughness: 0.95 })
  fumaca.add(nuvem1)
  const nuvem2 = puff(0.08, SMOKE, 4, 72, { roughness: 0.95 })
  nuvem2.position.set(0.12, -0.24, 0)
  fumaca.add(nuvem2)

  // ---- cana-cajado fincada ---------------------------------------------------
  const cana = new THREE.Group()
  cana.position.set(-1.3, GY - 0.05, 0.3)
  cana.rotation.z = -0.06
  root.add(cana)
  const nodes = 8
  const segL = 2.0 / nodes
  for (let k = 0; k < nodes; k++) {
    const gomo = lathe(
      [[0.05, 0], [0.058, segL * 0.2], [0.06, segL * 0.5], [0.058, segL * 0.8], [0.05, segL]],
      k % 2 ? CANE : CANE_DARK, { roughness: 0.4 }, 20,
    )
    gomo.position.y = segL * k
    cana.add(gomo)
    const anel = torus(0.056, 0.018, CANE_NODE, { roughness: 0.5 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = segL * k
    cana.add(anel)
  }
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2
    const folha = capsule(0.022, 0.32, LEAF, { roughness: 0.7 })
    folha.scale.set(1, 1, 0.35)
    folha.position.set(Math.cos(a) * 0.07, 2.12, Math.sin(a) * 0.07)
    folha.rotation.set(Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8)
    cana.add(folha)
  }

  // ---- carimbo grande no balcão ---------------------------------------------
  const carimbo = new THREE.Group()
  carimbo.position.set(...STAMP)
  carimbo.rotation.y = -0.3
  root.add(carimbo)
  const borracha = rbox(0.26, 0.05, 0.18, 0.015, RED, { roughness: 0.6 })
  borracha.position.y = 0.025
  carimbo.add(borracha)
  const bloco = rbox(0.26, 0.08, 0.18, 0.02, WOOD_TOP, { roughness: 0.6 })
  bloco.position.y = 0.09
  carimbo.add(bloco)
  const cabo = lathe([[0.04, 0], [0.03, 0.08], [0.035, 0.14], [0.07, 0.2], [0.06, 0.26], [0, 0.27]], '#8a5a34', { roughness: 0.5 })
  cabo.position.y = 0.13
  carimbo.add(cabo)

  // ---- mel pingando da luva até o chão --------------------------------------
  const luvaW = luva.getWorldPosition(new THREE.Vector3())
  const mel = new THREE.Group()
  mel.position.set(luvaW.x + 0.05, 0, luvaW.z + 0.05)
  root.add(mel)
  for (const [y, r] of [[luvaW.y - 0.3, 0.035], [luvaW.y - 0.62, 0.03], [luvaW.y - 0.95, 0.032], [luvaW.y - 1.25, 0.028]] as const) {
    const gota = sphere(r, HONEY, { roughness: 0.12 })
    gota.scale.set(1, 1.5, 1)
    gota.position.y = y
    mel.add(gota)
    const ponta = cone(r * 0.7, r * 1.6, HONEY, { roughness: 0.12 })
    ponta.position.y = y + r * 1.6
    mel.add(ponta)
  }
  const poca = cylinder(0.14, 0.15, 0.015, HONEY, { roughness: 0.1 })
  poca.scale.z = 0.7
  poca.position.y = GY + 0.008
  mel.add(poca)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'quiosque', object: base },
    { name: 'balcao', group: 'quiosque', object: balcao },
    { name: 'pote', group: 'quiosque', object: pote },
    { name: 'apicultor', group: 'apicultor', object: apicultor },
    { name: 'chapeu', group: 'apicultor', object: chapeu },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'fumigador', group: 'fo', object: fumigador },
    { name: 'fumaca', group: 'fo', object: fumaca },
    { name: 'bracoR', group: 'en', object: bracoR },
    { name: 'mel', group: 'en', object: mel },
    { name: 'favos', group: 'cer', object: favos },
    { name: 'carimbo', group: 'vet', object: carimbo },
    { name: 'veto', group: 'vet', object: veto },
  ]

  const fp = fumaca.position.clone()
  const pop = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Na feira, um quiosque de café sobe do gramado, de toldo listrado.',
    }),
    seq('balcao-rise', 'balcao', 0.3, 0.9, [riseFrom(0, 2.6)], { ease: 'easeOut' }),
    seq('pote-pop', 'pote', 1.2, 0.5, pop(0.01, 1), {
      ease: 'easeOut',
      caption: 'Lá na ponta do balcão, o pote de guardanapos.',
    }),

    seq('apicultor-rise', 'apicultor', 2.4, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Chega um apicultor direto da colmeia, lambuzado de mel da cabeça aos pés.',
    }),
    seq('braco-brota', 'bracoR', 2.4, 0.9, [ch('scale.y', 0.3, 1), ch('rotation.z', ARM_REST, ARM_REST)], { ease: 'easeOut' }),
    seq('chapeu-cai', 'chapeu', 3.0, 0.6, [
      ch('position.y', head.position.y + 0.8, head.position.y), ch('rotation.z', 0.5, 0),
    ], { ease: 'easeOut' }),

    seq('cana-finca', 'cana', 4.3, 0.6, [ch('position.y', GY + 1.6, GY - 0.05)], {
      ease: 'easeIn',
      caption: 'Ele finca no chão a CANA que usa de cajado: CA-NIÁ!',
    }),

    seq('fumigador-pop', 'fumigador', 5.6, 0.45, pop(0.01, 1), {
      ease: 'easeOut',
      caption: 'Solta um puf do fumigador: FÔ!',
    }),
    seq('fumaca-sai', 'fumaca', 5.9, 0.7, [
      ch('position.x', fp.x + 0.3, fp.x), ch('position.y', fp.y - 0.4, fp.y), ...pop(0.1, 1),
    ], { ease: 'easeOut' }),

    seq('braco-ergue', 'bracoR', 7.0, 0.7, [ch('rotation.z', ARM_REST, ARM_UP)], {
      ease: 'easeInOut',
      caption: 'Ergue UM dedo grudento: EN…',
    }),
    seq('mel-pinga', 'mel', 7.6, 0.6, [ch('position.y', 0.25, 0), ch('scale.y', 0.6, 1)], { ease: 'easeIn' }),

    seq('favos-pop', 'favos', 8.6, 0.5, pop(0.01, 1), {
      ease: 'easeOut',
      caption: '…e implora, com CERA grudada no peito: CER…',
    }),

    seq('carimbo-bate', 'carimbo', 9.8, 0.35, [ch('position.y', STAMP[1] + 0.9, STAMP[1])], {
      ease: 'easeIn',
      caption: '…mas a dona do quiosque carimba a luva melada: VETO! — VÉT!',
    }),
    seq('veto-pop', 'veto', 10.1, 0.4, [...pop(0.01, 1), ch('rotation.z', -0.5, 0)], { ease: 'easeOut' }),

    seq('pote-pisca', 'pote', 11.4, 0.6, [ch('rotation.y', -0.6, 0)], {
      ease: 'easeInOut',
      caption: 'Kan jag få en servett? — Pode me dar um guardanapo?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.05, 5.0], target: [0.35, 1.3, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-fa-en-servett',
    contexto:
      'Café e lanchonete: no self-service, no food truck, na festa de criança — o guardanapo fica num pote no balcão e, quando acaba, você pede. E na hora do desastre: café derrubado, criança lambuzada de sorvete.',
    fraseFonte: 'Pode me dar um guardanapo?',
    fraseAlvo: 'Kan jag få en servett?',
    pronuncia:
      "ka-niá fô en ser-VÉT? ('kan jag' = ka-niá, o G mudo; 'få' = fô, Ô FECHADO e sem R; 'en' curtinho, N de língua, sem o 'ẽ' nasal; 'servett' com a força no fim, no VÉT: É ABERTO e curto e TT seco atrás dos dentes, sem 'tchi'; o 'ser' vem fraquinho, com R brando de um toque só, que emenda direto no V)",
    ponteSonora:
      "CA-NIÁ, FÔ... EN... CER(a)-VÉT(o)! (6 sílabas: ca-niá-fô-en-ser-VÉT; a força toda no VÉT; CA-NIÁ é a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag få menyn?' e 'Kan jag få mer?', emendado — I de IOGA, nunca o J chiado de 'canja'; FÔ = o MESMO sopro de bochechas estufadas de 'Kan jag få menyn?', aqui o puf do fumigador: Ô FECHADO de 'avô', nunca 'fó', e sem R; EN = o 'en' (um) de sempre, o dedo erguido de 'Har du tid en stund?' e 'Får jag fråga en sak?': E curto, N de língua, sem o 'ẽ' nasal; CER(a) = a CERA de abelha sem o -A, fraquinha e rápida, com o R de um toque só que já gruda no V: ser-VÉT, nunca 'se-ra-vé'; VÉT(o) = o carimbo VETO sem o -O: o português já diz 'VÉ-to' com É ABERTO de 'pé' e a força no lugar certo — é só NÃO dizer o -O: o T fecha seco atrás dos dentes, sem 'tchi'; e não é o VÊT fechado e longo do sorVÊTe de 'Jag vet inte' ('vet', sei): aqui o É é aberto e curto)",
    historia:
      'O apicultor saiu direto da colmeia pro quiosque de café da feira — de macacão branco, chapéu de véu e luvas — e está lambuzado da cabeça aos pés: mel escorrendo da luva, pedaços de CERA grudados no peito. Ele estica a mão pro pote de guardanapos, mas a dona do quiosque é mais rápida e bate o carimbo bem na luva melada: VETO! — lambuzado assim, não encosta em nada. Ele finca no chão a cana que usa de cajado — IÁ! —, solta um puf do fumigador — FÔ! —, ergue UM dedo grudento, EN, e implora com o resto de dignidade: CERA... VETO... só um guardanapo, por favor!',
  },
  createScene,
}

export default card
