import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Har ni något receptfritt mot det här?" — RRÁR-NI NÔ-TRE-SÉPT-FRIT, MUT DÊ RRÉR.
 *
 * Diorama: balcão-cozinha do apotek. O flamingo farmacêutico de gorro branco
 * ergue um tubo de ÁRNIca (RRÁR-NI) com a ponta da asa, joga a RECEITA na
 * frigideira do fogareiro (NÔ-TRE-SÉPT-FRIT!) e, da fritura, salta uma drágea
 * que ele encosta com a ponta do bico no nariz inchado do freguês (MUT DÊ RRÉR).
 */

const FLOOR = '#eef0ea'
const FLOOR_EDGE = '#cfd4cc'
const MINT = '#8fc9b0'
const MINT_DARK = '#5f9d86'
const WOOD = '#c39a63'
const WOOD_DARK = '#9a7442'
const CHAR = '#33373d'
const STEEL = '#4a505a'
const PINK = '#ef8fab'
const PINK_DARK = '#d4728f'
const WHITE = '#f5f2ea'
const SKIN = '#e8c39e'
const INK = '#46506b'
const ACCENT = '#d94123' // reservado: o remédio (tubo de árnica, drágea, nariz)

const GY = 0.16 // topo do piso do diorama
const CT = 1.12 // topo do balcão

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: piso de losangos verde-menta ------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.62, 2.7, 0.12, FLOOR_EDGE, { roughness: 0.9 })
  slab.position.y = 0.06
  base.add(slab)

  const floor = cylinder(2.54, 2.6, 0.05, FLOOR, { roughness: 0.35 })
  floor.position.y = 0.135
  base.add(floor)

  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = -3; iz <= 3; iz++) {
      if ((ix + iz) % 2 !== 0) continue
      const x = ix * 0.72
      const z = iz * 0.72
      if (Math.hypot(x, z) > 2.25) continue
      const tile = rbox(0.34, 0.02, 0.34, 0.01, MINT, { roughness: 0.35 })
      tile.position.set(x, GY + 0.005, z)
      tile.rotation.y = Math.PI / 4
      base.add(tile)
    }
  }

  // tapete de espera diante do balcão
  const rug = cylinder(0.58, 0.58, 0.03, MINT_DARK, { roughness: 0.92 })
  rug.position.set(1.42, GY + 0.015, 0.5)
  base.add(rug)

  // vaso com planta
  const pot = lathe(
    [[0, 0], [0.17, 0], [0.2, 0.06], [0.18, 0.26], [0.2, 0.3], [0.185, 0.31], [0.165, 0.27], [0, 0.27]],
    MINT_DARK,
    { roughness: 0.4 },
  )
  pot.position.set(-2.0, GY, 0.95)
  base.add(pot)
  const leaves = puff(0.26, '#4f8f4a', 6, 31, { roughness: 0.9 })
  leaves.position.set(-2.0, GY + 0.5, 0.95)
  leaves.rotation.y = rand() * Math.PI
  base.add(leaves)

  // pilha de caixinhas de remédio
  const boxA = rbox(0.32, 0.2, 0.24, 0.02, WHITE, { roughness: 0.5 })
  boxA.position.set(2.05, GY + 0.1, -0.55)
  boxA.rotation.y = 0.3 + rand() * 0.2
  base.add(boxA)
  const boxB = rbox(0.28, 0.16, 0.2, 0.02, MINT, { roughness: 0.5 })
  boxB.position.set(2.02, GY + 0.28, -0.5)
  boxB.rotation.y = -0.2 - rand() * 0.3
  base.add(boxB)

  root.add(base)

  // ---- balcão de madeira clara atravessando a cena -------------------------
  const balcao = new THREE.Group()
  balcao.position.set(0, GY, -0.2)

  const counterBody = rbox(3.5, 0.86, 0.66, 0.05, WOOD, { roughness: 0.7 })
  counterBody.position.y = 0.43
  balcao.add(counterBody)

  const counterTop = rbox(3.72, 0.1, 0.82, 0.035, WOOD_DARK, { roughness: 0.55 })
  counterTop.position.y = 0.91
  balcao.add(counterTop)

  // cruz de farmácia no painel da frente
  const crossV = rbox(0.11, 0.36, 0.03, 0.02, MINT, { roughness: 0.4 })
  crossV.position.set(1.05, 0.5, 0.34)
  const crossH = rbox(0.36, 0.11, 0.03, 0.02, MINT, { roughness: 0.4 })
  crossH.position.set(1.05, 0.5, 0.34)
  balcao.add(crossV, crossH)

  for (const fx of [-1.5, 1.5]) {
    const skirt = rbox(0.12, 0.8, 0.7, 0.03, WOOD_DARK, { roughness: 0.75 })
    skirt.position.set(fx, 0.4, 0)
    balcao.add(skirt)
  }
  root.add(balcao)

  // ---- o freguês de nariz inchado ------------------------------------------
  const fregues = person({ body: '#456d8c', skin: SKIN, height: 1.45, armAngle: 0.32 })
  fregues.position.set(1.45, GY, 0.45)
  fregues.rotation.y = -1.5
  const fregueshead = fregues.getObjectByName('head')!
  const nariz = sphere(0.078, ACCENT, { roughness: 0.55 })
  nariz.position.set(0, -0.01, 0.28)
  fregueshead.add(nariz)
  const cabelo = puff(0.19, '#4a3524', 5, 41, { roughness: 0.9 })
  cabelo.position.set(0, 0.16, -0.03)
  cabelo.scale.set(1, 0.6, 1)
  fregueshead.add(cabelo)
  root.add(fregues)

  // ---- flamingo farmacêutico (corpo + pernas + asas) -----------------------
  const flamingo = new THREE.Group()
  flamingo.position.set(0.1, GY, -1.25)

  for (const side of [-1, 1]) {
    const shin = capsule(0.04, 0.5, PINK_DARK, { roughness: 0.6 })
    shin.position.set(side * 0.15, 0.33, 0.02)
    flamingo.add(shin)

    const knee = sphere(0.055, PINK_DARK, { roughness: 0.6 })
    knee.position.set(side * 0.15, 0.62, 0.02)
    flamingo.add(knee)

    const thigh = capsule(0.05, 0.32, PINK, { roughness: 0.65 })
    thigh.position.set(side * 0.15, 0.85, -0.05)
    thigh.rotation.x = 0.28
    flamingo.add(thigh)

    const foot = rbox(0.17, 0.05, 0.22, 0.02, '#e0a24c', { roughness: 0.6 })
    foot.position.set(side * 0.15, 0.035, 0.07)
    flamingo.add(foot)
  }

  const corpo = capsule(0.34, 0.4, PINK, { roughness: 0.65 })
  corpo.position.set(0, 1.26, -0.05)
  corpo.rotation.x = Math.PI / 2
  flamingo.add(corpo)

  const cauda = cone(0.19, 0.36, PINK_DARK, { roughness: 0.7 })
  cauda.position.set(0, 1.32, -0.56)
  cauda.rotation.x = -Math.PI / 2
  flamingo.add(cauda)

  // asa direita dobrada no corpo
  const asaR = capsule(0.15, 0.34, PINK_DARK, { roughness: 0.7 })
  asaR.position.set(0.3, 1.3, -0.04)
  asaR.rotation.z = -0.22
  asaR.scale.z = 0.62
  flamingo.add(asaR)

  // asa esquerda erguida — segura o tubo de árnica na ponta
  const asaL = capsule(0.15, 0.42, PINK_DARK, { roughness: 0.7 })
  asaL.position.set(-0.24, 1.48, 0.05)
  asaL.rotation.z = 0.92
  asaL.scale.z = 0.6
  flamingo.add(asaL)

  const pontaAsa = sphere(0.09, PINK, { roughness: 0.65 })
  pontaAsa.position.set(-0.5, 1.7, 0.05)
  flamingo.add(pontaAsa)

  root.add(flamingo)

  // ---- pescoço em S por cima do balcão, com cabeça na ponta ----------------
  const pescoco = new THREE.Group()
  pescoco.position.set(0.1, 1.66, -1.05)
  pescoco.rotation.x = 0.35 // pose final: mergulhado, bico junto ao nariz
  root.add(pescoco)

  const neckCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.02, 0.42, 0.1),
    new THREE.Vector3(0.22, 0.6, 0.48),
    new THREE.Vector3(0.55, 0.42, 0.9),
    new THREE.Vector3(0.8, 0.1, 1.22),
    new THREE.Vector3(0.9, -0.086, 1.34),
  ])
  const neck = new THREE.Mesh(
    new THREE.TubeGeometry(neckCurve, 48, 0.082, 14, false),
    mat(PINK, { roughness: 0.65, size: 1.8 }),
  )
  neck.castShadow = true
  neck.receiveShadow = true
  pescoco.add(neck)

  const cabeca = new THREE.Group()
  cabeca.position.set(0.9, -0.086, 1.34)
  cabeca.rotation.set(-0.15, 0.6, 0)
  pescoco.add(cabeca)

  const cranio = sphere(0.17, PINK, { roughness: 0.65 })
  cranio.scale.set(0.95, 1, 1.05)
  cabeca.add(cranio)

  for (const side of [-1, 1]) {
    const eye = sphere(0.05, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.095, 0.05, 0.135)
    eye.scale.z = 0.6
    const pupil = sphere(0.024, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.095, 0.05, 0.162)
    cabeca.add(eye, pupil)
  }

  const bicoBase = cone(0.078, 0.24, PINK_DARK, { roughness: 0.5 })
  bicoBase.position.set(0, -0.03, 0.2)
  bicoBase.rotation.x = Math.PI / 2
  cabeca.add(bicoBase)

  const bicoPonta = cone(0.052, 0.16, '#2b2b30', { roughness: 0.45 })
  bicoPonta.position.set(0, -0.048, 0.36)
  bicoPonta.rotation.x = Math.PI / 2
  cabeca.add(bicoPonta)

  // gorro branco de farmacêutico, com cruzinha menta
  const gorro = lathe(
    [[0.175, 0], [0.18, 0.03], [0.165, 0.075], [0.125, 0.12], [0.065, 0.15], [0, 0.16]],
    WHITE,
    { roughness: 0.85 },
  )
  gorro.position.set(0, 0.1, -0.02)
  cabeca.add(gorro)

  const gorroCruzV = rbox(0.026, 0.075, 0.02, 0.008, MINT_DARK, { roughness: 0.6 })
  gorroCruzV.position.set(0, 0.16, 0.13)
  const gorroCruzH = rbox(0.075, 0.026, 0.02, 0.008, MINT_DARK, { roughness: 0.6 })
  gorroCruzH.position.set(0, 0.16, 0.13)
  cabeca.add(gorroCruzV, gorroCruzH)

  // ---- tubo de ÁRNIca (acento) ---------------------------------------------
  const arnica = new THREE.Group()
  arnica.position.set(-0.4, 2.1, -1.15)
  arnica.rotation.z = 0.16

  const tubo = lathe(
    [[0, -0.22], [0.08, -0.205], [0.086, 0.06], [0.05, 0.15], [0.048, 0.19]],
    ACCENT,
    { roughness: 0.35 },
  )
  arnica.add(tubo)

  const tampa = cylinder(0.05, 0.052, 0.09, WHITE, { roughness: 0.3 })
  tampa.position.y = 0.235
  arnica.add(tampa)

  const rotulo = cylinder(0.089, 0.089, 0.11, WHITE, { roughness: 0.5 })
  rotulo.position.y = -0.06
  arnica.add(rotulo)

  const rotuloCruzV = rbox(0.022, 0.062, 0.02, 0.007, ACCENT, { roughness: 0.4 })
  rotuloCruzV.position.set(0, -0.06, 0.088)
  const rotuloCruzH = rbox(0.062, 0.022, 0.02, 0.007, ACCENT, { roughness: 0.4 })
  rotuloCruzH.position.set(0, -0.06, 0.088)
  arnica.add(rotuloCruzV, rotuloCruzH)

  root.add(arnica)

  // ---- fogareiro + frigideira sobre o balcão -------------------------------
  const fogao = new THREE.Group()
  fogao.position.set(-0.95, CT, -0.12)

  const fogareiro = cylinder(0.3, 0.34, 0.15, STEEL, { roughness: 0.35, metalness: 0.55 })
  fogareiro.position.y = 0.075
  fogao.add(fogareiro)

  const aro = torus(0.21, 0.03, CHAR, { roughness: 0.4, metalness: 0.5 })
  aro.position.y = 0.16
  aro.rotation.x = Math.PI / 2
  fogao.add(aro)

  const botao = cylinder(0.045, 0.05, 0.06, CHAR, { roughness: 0.4 })
  botao.position.set(0.34, 0.06, 0.14)
  botao.rotation.z = Math.PI / 2
  fogao.add(botao)

  const chama = cone(0.14, 0.24, '#4fa9ff', { emissive: '#3f8ee0', emissiveIntensity: 1.2, roughness: 0.3 })
  chama.position.y = 0.28
  fogao.add(chama)

  const chamaCore = cone(0.07, 0.14, '#bfe2ff', { emissive: '#9ed3ff', emissiveIntensity: 1.4, roughness: 0.3 })
  chamaCore.position.y = 0.26
  fogao.add(chamaCore)

  const frigideira = lathe(
    [
      [0, 0], [0.26, 0], [0.33, 0.05], [0.36, 0.16],
      [0.335, 0.16], [0.305, 0.05], [0.24, 0.03], [0, 0.03],
    ],
    CHAR,
    { roughness: 0.4, metalness: 0.35 },
  )
  frigideira.position.y = 0.4
  fogao.add(frigideira)

  const cabo = cylinder(0.035, 0.03, 0.44, '#4a4038', { roughness: 0.75 })
  cabo.position.set(-0.57, 0.51, 0)
  cabo.rotation.z = Math.PI / 2 - 0.22
  fogao.add(cabo)

  const caboPonta = sphere(0.045, '#4a4038', { roughness: 0.75 })
  caboPonta.position.set(-0.79, 0.56, 0)
  fogao.add(caboPonta)

  root.add(fogao)

  // ---- a receita enrolando na frigideira -----------------------------------
  const receita = new THREE.Group()
  receita.position.set(-0.93, 1.6, -0.1)
  receita.rotation.z = 0.35
  receita.rotation.y = 0.42

  const folha = rbox(0.3, 0.014, 0.24, 0.006, WHITE, { roughness: 0.9 })
  receita.add(folha)

  for (const side of [-1, 1]) {
    const curl = rbox(0.09, 0.014, 0.24, 0.006, WHITE, { roughness: 0.9 })
    curl.position.set(side * 0.18, 0.035, 0)
    curl.rotation.z = side * 0.75
    receita.add(curl)
  }

  for (let i = 0; i < 3; i++) {
    const linha = rbox(0.18, 0.006, 0.016, 0.003, INK, { roughness: 0.6 })
    linha.position.set(-0.02, 0.012, -0.06 + i * 0.06)
    receita.add(linha)
  }

  const carimbo = cylinder(0.045, 0.045, 0.008, MINT_DARK, { roughness: 0.6 })
  carimbo.position.set(0.09, 0.012, 0.075)
  receita.add(carimbo)

  root.add(receita)

  // ---- chiado da fritura ----------------------------------------------------
  const chiado = new THREE.Group()
  chiado.position.set(-0.93, 2.02, -0.1)

  const bolhas: [number, number, number, number][] = [
    [-0.15, -0.13, 0.07, 0.075],
    [0.06, 0.05, -0.09, 0.058],
    [0.17, -0.06, 0.1, 0.048],
    [-0.02, 0.2, -0.02, 0.066],
  ]
  for (const [bx, by, bz, br] of bolhas) {
    const bolha = sphere(br, WHITE, { roughness: 0.9 })
    bolha.position.set(bx, by, bz)
    chiado.add(bolha)
  }
  root.add(chiado)

  // ---- a drágea que salta da fritura ---------------------------------------
  const dragea = new THREE.Group()
  dragea.position.set(1.207, 1.094, 0.499)
  dragea.rotation.set(0.3, 0, 0.6)

  const drageaBody = capsule(0.055, 0.09, WHITE, { roughness: 0.3 })
  dragea.add(drageaBody)

  const drageaTampa = capsule(0.057, 0.02, ACCENT, { roughness: 0.3 })
  drageaTampa.position.y = -0.048
  dragea.add(drageaTampa)

  root.add(dragea)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'fregues', group: 'cliente', object: fregues },
    { name: 'flamingo', group: 'flamingo', object: flamingo },
    { name: 'pescoco', group: 'flamingo', object: pescoco },
    { name: 'arnica', group: 'arnica', object: arnica },
    { name: 'fogao', group: 'fritura', object: fogao },
    { name: 'receita', group: 'fritura', object: receita },
    { name: 'chiado', group: 'fritura', object: chiado },
    { name: 'dragea', group: 'dragea', object: dragea },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.75)], {
      ease: 'easeOut',
      caption: 'No APOTEK, o piso de losangos verde-menta brota do chão…',
    }),
    seq('balcao-rise', 'balcao', 0.9, 0.8, [riseFrom(GY, 1.4)], { ease: 'easeOut' }),

    seq('fregues-rise', 'fregues', 2.1, 0.8, [riseFrom(GY, 1.75)], {
      ease: 'easeOut',
      caption: '…e o freguês encosta no balcão com o nariz inchado, sem saber o que tomar.',
    }),

    seq('flamingo-rise', 'flamingo', 3.9, 0.9, [riseFrom(GY, 2.3)], {
      ease: 'easeOut',
      caption: 'Sobe o FLAMINGO farmacêutico, de gorro branco, atrás do balcão…',
    }),
    seq(
      'pescoco-grow',
      'pescoco',
      4.6,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('arnica-rise', 'arnica', 5.7, 0.8, [riseFrom(2.1, 2.7)], {
      ease: 'easeOut',
      caption: 'Ele enfia o pescoço por cima do balcão, ergue o tubo de ÁRNIca — RRÁR-NI, com o h soprado — e pergunta: NÔT?',
    }),

    seq('fogao-rise', 'fogao', 7.1, 0.8, [riseFrom(CT, 2.0)], {
      ease: 'easeOut',
      caption: 'Sem esperar resposta, acende o fogareiro e joga a sua RECEITA na frigideira: NÔ-TRE-SÉPT-FRIT!',
    }),
    seq(
      'receita-rise',
      'receita',
      7.9,
      0.6,
      [ch('position.y', -0.8, 1.98), ch('position.x', -0.3, -0.45)],
      { ease: 'easeOut' },
    ),
    seq(
      'receita-flip',
      'receita',
      8.5,
      0.5,
      [ch('position.y', 1.98, 1.6), ch('position.x', -0.45, -0.93), ch('rotation.z', 0, 0.35)],
      { ease: 'easeIn' },
    ),
    seq(
      'chiado-pop',
      'chiado',
      9.0,
      0.7,
      [
        ch('position.y', 1.62, 2.02),
        ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ],
      { ease: 'easeOut' },
    ),

    seq(
      'dragea-form',
      'dragea',
      10.4,
      0.4,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'dragea-jump',
      'dragea',
      10.8,
      0.5,
      [
        ch('position.x', -0.93, 0.25),
        ch('position.y', 1.62, 2.35),
        ch('position.z', -0.1, 0.22),
        ch('rotation.z', 0, 0.6),
      ],
      { ease: 'easeOut' },
    ),
    seq(
      'dragea-land',
      'dragea',
      11.3,
      0.5,
      [
        ch('position.x', 0.25, 1.14),
        ch('position.y', 2.35, 1.094),
        ch('position.z', 0.22, 0.499),
        ch('rotation.x', 0, 0.3),
      ],
      {
        ease: 'easeIn',
        caption: 'Da fritura salta a drágea, e o bico a encosta no seu nariz: MUT DÊ RRÉR.',
      },
    ),
    seq('pescoco-dip', 'pescoco', 11.4, 0.7, [ch('rotation.x', 0, 0.35)]),

    seq('dragea-press', 'dragea', 12.0, 0.6, [ch('position.x', 1.14, 1.207)], {
      caption: 'Har ni något receptfritt mot det här? — "Vocês têm algo sem receita para isso?"',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.6, 3.0, 6.0], target: [0.15, 1.05, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'nagot-receptfritt',
    contexto: 'No balcão do apotek, mostrando onde dói ou descrevendo o sintoma.',
    fraseFonte: 'Vocês têm algo sem receita para isso?',
    fraseAlvo: 'Har ni något receptfritt mot det här?',
    pronuncia:
      "har ni NÔT re-SEPT-frit mut de HÉR ('något' na fala vira 'nåt' = NÔT; o 'c' de receptfritt = S)",
    ponteSonora:
      "RRÁR-NI NÔ-TRE-SÉPT-FRIT, MUT DÊ RRÉR? (9 sílabas, tônicas em NÔT, SÉPT e RRÉR; RRÁR-NI = a ÁRNIca sem o -ca, com h SOPRADO na frente e R brando; NÔT com Ô BEM FECHADO — se arredondar em ö vira 'nöt', que é NOZ; emende NÔT + RE num fôlego, 'NÔ-TRE', pro r de 'recept' sair BRANDO e não estourar em RR carioca; FRIT = FRITA sem o -a; MUT com O soando U; RRÉR = 'här' com o h soprado)",
    historia:
      'No apotek, o flamingo farmacêutico enfia o pescoço rosa por cima do balcão inteiro, ergue um tubo de ÁRNIca — RRÁR-NI, com o h soprado na frente — e pergunta NÔT?. Sem esperar resposta, ele joga a sua RECEITA na frigideira do fogareiro — NÔ-TRE-SÉPT-FRIT!, chiando e enrolando — porque para isso aqui não precisa de receita nenhuma. Da fritura salta uma drágea gorducha, que ele encosta com a ponta do bico no seu nariz inchado: MUT DÊ RRÉR.',
  },
  createScene,
}

export default card
