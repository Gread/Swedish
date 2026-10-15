import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag tar en kaffe, tack." — IÁ! TÁ, REN — CÁ-FE, TAC!
 *
 * Diorama: balcão de cafeteria. A bandeja de metal sobre o tampo vira uma
 * ARENA romana em miniatura (areia ocre + muro bege). Você (à esquerda) grita
 * "IÁ!" e joga a moeda — "TÁ, REN!" — para a xícara-gladiadora REN, que crava
 * a colher-tridente no bule adversário; o CÁ-FE jorra na areia e o martelinho
 * do juiz sela a vitória: TAC!
 */

// --- paleta: madeira/ocre, creme/porcelana, prata/azul-cinza + acento RUBRO --
const PISO = '#ded3bf'
const PISO_LUZ = '#ece2d0'
const MEL = '#a9743f'
const MEL_ESC = '#7a4f28'
const PRATA = '#b9c2c9'
const AREIA = '#c9a869'
const AREIA_ESC = '#a8874c'
const MURO = '#d9cba6'
const PORCELANA = '#f2ece0'
const CAFE = '#452718'
const OURO = '#dda12c'
const RUBRO = '#c94f3d' // acento saturado: RESERVADO à gladiadora REN
const TECIDO = '#54646e'
const GORRO = '#6f8189'
const PELE = '#e8c39e'
const SALVIA = '#7d8c66'

const GY = 0.18 // topo do piso do diorama
const TOP = 1.06 // topo do tampo do balcão
const SAND = 0.11 // topo da areia, local à bandeja

// materiais por intenção física
const M_METAL = { roughness: 0.2, metalness: 0.9 }
const M_PRATA_CLARA = { roughness: 0.3, metalness: 0.55 } // lê como prata, não como buraco escuro
const M_OURO = { roughness: 0.25, metalness: 0.85 }
const M_LOUCA = { roughness: 0.15 }
const M_MADEIRA = { roughness: 0.7 }
const M_TERRA = { roughness: 0.95 }
const M_TECIDO = { roughness: 0.9 }

/** Letra desenhada com barrinhas creme, para o escudo da gladiadora. */
function letra(qual: 'R' | 'E' | 'N') {
  const g = new THREE.Group()
  const bar = (w: number, h: number, x: number, y: number, rz = 0) => {
    const b = rbox(w, h, 0.014, 0.005, PORCELANA, M_LOUCA)
    b.position.set(x, y, 0)
    b.rotation.z = rz
    g.add(b)
  }
  if (qual === 'R') {
    bar(0.015, 0.09, -0.021, 0)
    bar(0.038, 0.014, 0.002, 0.038)
    bar(0.038, 0.014, 0.002, 0.004)
    bar(0.015, 0.038, 0.021, 0.021)
    bar(0.014, 0.046, 0.019, -0.024, -0.42)
  } else if (qual === 'E') {
    bar(0.015, 0.09, -0.021, 0)
    bar(0.042, 0.014, 0.003, 0.038)
    bar(0.034, 0.014, -0.001, 0.001)
    bar(0.042, 0.014, 0.003, -0.038)
  } else {
    bar(0.015, 0.09, -0.023, 0)
    bar(0.015, 0.09, 0.023, 0)
    bar(0.013, 0.104, 0, 0, 0.44)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: piso da cafeteria + balcão + adereços -------------------------
  const base = new THREE.Group()

  const piso = cylinder(2.55, 2.65, 0.12, PISO, M_TERRA)
  piso.position.y = 0.06
  base.add(piso)

  const ladrilho = cylinder(2.48, 2.55, 0.07, PISO_LUZ, { roughness: 0.5 })
  ladrilho.position.y = 0.145
  base.add(ladrilho)

  const corpoBalcao = rbox(2.5, 0.82, 1.25, 0.05, MEL, M_MADEIRA)
  corpoBalcao.position.set(0.45, GY + 0.41, -0.05)
  base.add(corpoBalcao)

  const tampo = rbox(2.62, 0.09, 1.36, 0.03, MEL_ESC, M_MADEIRA)
  tampo.position.set(0.45, GY + 0.835, -0.05)
  base.add(tampo)

  const friso = rbox(2.34, 0.07, 0.03, 0.015, MEL_ESC, M_MADEIRA)
  friso.position.set(0.45, GY + 0.5, 0.565)
  base.add(friso)

  // pilha de pires à esquerda do tampo
  for (let i = 0; i < 4; i++) {
    const pires = cylinder(0.17, 0.155, 0.035, PORCELANA, M_LOUCA)
    pires.position.set(-0.6 + (rand() - 0.5) * 0.02, TOP + 0.02 + i * 0.037, 0.02)
    base.add(pires)
  }

  // porta-guardanapos à direita do tampo
  const porta = rbox(0.17, 0.19, 0.2, 0.03, PRATA, M_METAL)
  porta.position.set(1.5, TOP + 0.095, -0.3)
  base.add(porta)
  const guardanapo = rbox(0.03, 0.16, 0.16, 0.01, PORCELANA, { roughness: 0.8 })
  guardanapo.position.set(1.5, TOP + 0.14, -0.3)
  base.add(guardanapo)

  // saco de grãos no chão, à esquerda
  const saco = rbox(0.46, 0.56, 0.36, 0.11, '#c2b190', M_TECIDO)
  saco.position.set(-1.95, GY + 0.28, 1.0)
  saco.rotation.y = (rand() - 0.5) * 0.7
  base.add(saco)
  for (let i = 0; i < 4; i++) {
    const grao = capsule(0.028, 0.03, CAFE, { roughness: 0.45 })
    grao.position.set(-1.7 + rand() * 0.45, GY + 0.03, 1.25 + rand() * 0.3)
    grao.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
    base.add(grao)
  }

  // vaso com planta no chão, à direita
  const vaso = lathe(
    [[0, 0], [0.2, 0], [0.22, 0.05], [0.2, 0.26], [0.23, 0.3], [0.205, 0.31], [0.18, 0.28], [0, 0.27]],
    '#b06a45',
    { roughness: 0.6 },
  )
  vaso.position.set(1.95, GY, 0.85)
  base.add(vaso)
  const folhagem = puff(0.3, SALVIA, 6, 31, M_TECIDO)
  folhagem.position.set(1.95, GY + 0.56, 0.85)
  base.add(folhagem)

  root.add(base)

  // ---- você, no balcão (olha para a arena: olhos em +z local) --------------
  const voce = person({ body: TECIDO, skin: PELE, height: 1.55, armAngle: 0.55 })
  voce.position.set(-1.25, GY, -0.1)
  voce.rotation.y = 0.95

  const cabeca = voce.getObjectByName('head') as THREE.Object3D
  const cupula = lathe(
    [[0, 0], [0.3, 0], [0.3, 0.06], [0.27, 0.16], [0.18, 0.25], [0, 0.28]],
    GORRO,
    M_TECIDO,
  )
  cupula.position.y = 0.06
  cabeca.add(cupula)
  const aba = torus(0.29, 0.05, GORRO, M_TECIDO)
  aba.rotation.x = Math.PI / 2
  aba.position.y = 0.07
  cabeca.add(aba)
  const pompom = sphere(0.075, PORCELANA, M_TECIDO)
  pompom.position.y = 0.36
  cabeca.add(pompom)

  // braço direito erguido: é dele que a moeda sai
  const bracoDir = voce.getObjectByName('armR') as THREE.Object3D
  bracoDir.rotation.z = 2.6
  root.add(voce)

  // posição real da mão, para a moeda partir exatamente dali
  root.updateMatrixWorld(true)
  const mao = new THREE.Vector3()
  bracoDir.children[0].getWorldPosition(mao)

  // ---- a moeda (viaja da mão até a areia) ----------------------------------
  const moeda = new THREE.Group()
  const disco = cylinder(0.105, 0.105, 0.024, OURO, M_OURO)
  moeda.add(disco)
  const cunho = cylinder(0.055, 0.055, 0.032, '#b8811f', M_OURO)
  moeda.add(cunho)
  const MOEDA_FIM: [number, number, number] = [-0.02, 1.26, 0.42]
  moeda.position.set(...MOEDA_FIM)
  moeda.rotation.set(1.25, 6.6, 0.2)
  root.add(moeda)

  // ---- a bandeja-arena sobre o tampo ---------------------------------------
  const bandeja = new THREE.Group()
  bandeja.position.set(0.55, TOP, 0.05)
  root.add(bandeja)

  const prato = cylinder(0.95, 0.9, 0.055, PRATA, M_METAL)
  prato.position.y = 0.0275
  bandeja.add(prato)

  const aro = torus(0.93, 0.035, PRATA, M_METAL)
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.055
  bandeja.add(aro)

  const areia = cylinder(0.8, 0.8, 0.055, AREIA, M_TERRA)
  areia.position.y = 0.0825
  bandeja.add(areia)

  const muro = torus(0.86, 0.07, MURO, { roughness: 0.8 })
  muro.rotation.x = Math.PI / 2
  muro.position.y = 0.13
  bandeja.add(muro)

  // sulcos de areia pisada
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const r = 0.2 + rand() * 0.52
    const marca = sphere(0.05 + rand() * 0.05, AREIA_ESC, M_TERRA)
    marca.scale.set(1, 0.12, 0.75)
    marca.position.set(Math.cos(a) * r, SAND - 0.005, Math.sin(a) * r)
    marca.rotation.y = rand() * Math.PI
    bandeja.add(marca)
  }

  // ---- xícara-gladiadora REN ------------------------------------------------
  const xicara = new THREE.Group()
  xicara.position.set(-0.34, SAND, 0.1)
  xicara.rotation.y = 0.85 // encara o bule, mas mostra a cara pra câmera
  bandeja.add(xicara)

  const corpoXic = lathe(
    [
      [0, 0], [0.2, 0], [0.215, 0.025], [0.19, 0.05], [0.235, 0.16],
      [0.285, 0.355], [0.29, 0.375], [0.262, 0.375], [0.255, 0.34],
      [0.205, 0.16], [0.165, 0.055], [0, 0.05],
    ],
    PORCELANA,
    M_LOUCA,
  )
  xicara.add(corpoXic)

  const cafeDentro = cylinder(0.245, 0.2, 0.02, CAFE, { roughness: 0.25 })
  cafeDentro.position.y = 0.3
  xicara.add(cafeDentro)

  const asa = torus(0.085, 0.026, PORCELANA, M_LOUCA)
  asa.rotation.y = Math.PI / 2
  asa.position.set(0, 0.22, -0.28)
  xicara.add(asa)

  for (const lado of [-1, 1]) {
    const esclera = sphere(0.048, '#ffffff', { roughness: 0.25 })
    esclera.position.set(lado * 0.085, 0.245, 0.24)
    esclera.scale.z = 0.6
    const pupila = sphere(0.022, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(lado * 0.085, 0.248, 0.272)
    xicara.add(esclera, pupila)
  }

  // escudo com o nome REN, virado para a câmera
  const escudo = new THREE.Group()
  escudo.position.set(-0.26, 0.22, 0.26)
  escudo.rotation.y = -0.55
  xicara.add(escudo)

  const tabua = rbox(0.3, 0.34, 0.04, 0.06, RUBRO, { roughness: 0.45 })
  escudo.add(tabua)
  for (const [i, qual] of (['R', 'E', 'N'] as const).entries()) {
    const l = letra(qual)
    l.position.set(-0.085 + i * 0.085, 0.0, 0.027)
    escudo.add(l)
  }
  for (const [sx, sy] of [[-1, 1], [1, 1], [-1, -1], [1, -1]] as const) {
    const tacha = sphere(0.019, OURO, M_OURO)
    tacha.position.set(sx * 0.12, sy * 0.145, 0.024)
    escudo.add(tacha)
  }

  // ---- elmo dourado com crista rubra (nasce na cabeça da xícara) ------------
  const elmo = new THREE.Group()
  elmo.position.set(0, 0.4, 0)
  xicara.add(elmo)

  const calota = lathe(
    [[0, 0], [0.28, 0], [0.285, 0.04], [0.27, 0.12], [0.22, 0.22], [0.13, 0.28], [0, 0.29]],
    OURO,
    M_OURO,
  )
  elmo.add(calota)
  const borda = torus(0.28, 0.028, OURO, M_OURO)
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.015
  elmo.add(borda)
  const nasal = rbox(0.05, 0.15, 0.035, 0.012, OURO, M_OURO)
  nasal.position.set(0, -0.05, 0.245)
  elmo.add(nasal)
  for (let i = 0; i < 7; i++) {
    const h = 0.1 + 0.13 * Math.sin((i / 6) * Math.PI)
    const lamina = capsule(0.026, h, RUBRO, M_TECIDO)
    lamina.position.set(0, 0.29 + h / 2, -0.21 + i * 0.07)
    elmo.add(lamina)
  }

  // ---- bule adversário (pose final: tombado para trás, ferido pelo tridente) --
  // Modelado com o bico em +z local e o pivô na aresta traseira da base (z=0);
  // o giro em y põe o bico virado para REN (-x) e o perfil para a câmera.
  const bule = new THREE.Group()
  bule.position.set(0.45, SAND, -0.05)
  bule.rotation.order = 'YXZ' // rotation.x = tombar para trás, já no eixo do bule
  bule.rotation.y = -Math.PI / 2
  bule.rotation.x = -0.6 // pivô na aresta da base: ele TOMBA, não flutua
  bandeja.add(bule)

  const corpoBule = lathe(
    [
      [0, 0], [0.16, 0], [0.19, 0.03], [0.235, 0.14], [0.24, 0.3],
      [0.215, 0.44], [0.2, 0.5], [0.205, 0.53], [0.17, 0.55], [0, 0.55],
    ],
    PRATA,
    M_PRATA_CLARA,
  )
  corpoBule.position.z = 0.24
  bule.add(corpoBule)

  const cinta = torus(0.237, 0.022, OURO, M_OURO)
  cinta.rotation.x = Math.PI / 2
  cinta.position.set(0, 0.3, 0.24)
  bule.add(cinta)

  const tampaBule = cylinder(0.15, 0.17, 0.03, '#9aa4ac', M_PRATA_CLARA)
  tampaBule.position.set(0, 0.555, 0.24)
  bule.add(tampaBule)
  const puxador = sphere(0.055, MEL_ESC, M_MADEIRA)
  puxador.position.set(0, 0.59, 0.24)
  bule.add(puxador)

  const bico = new THREE.Group()
  bico.position.set(0, 0.2, 0.43)
  bico.rotation.x = 0.7
  const canoBico = cylinder(0.045, 0.078, 0.3, PRATA, M_PRATA_CLARA)
  canoBico.position.y = 0.15
  bico.add(canoBico)
  bule.add(bico)

  const alcaBule = torus(0.13, 0.03, PRATA, M_PRATA_CLARA)
  alcaBule.rotation.y = Math.PI / 2
  alcaBule.position.set(0, 0.32, 0.01)
  bule.add(alcaBule)

  // ---- colher-tridente (pose final: cravada no bule) ------------------------
  const tridente = new THREE.Group()
  tridente.position.set(0.08, 0.56, 0.12) // à frente do elmo: o golpe fica à vista
  tridente.rotation.z = 0.8
  bandeja.add(tridente)

  const cabo = cylinder(0.034, 0.038, 0.6, PRATA, M_PRATA_CLARA)
  cabo.position.y = 0.3
  tridente.add(cabo)

  const concha = sphere(0.105, PRATA, M_PRATA_CLARA)
  concha.scale.set(1, 0.34, 0.72)
  concha.position.y = 0.63
  tridente.add(concha)

  const colar = torus(0.04, 0.016, OURO, M_OURO)
  colar.rotation.x = Math.PI / 2
  colar.position.y = 0.045
  tridente.add(colar)

  for (const desvio of [-1, 0, 1]) {
    const ponta = new THREE.Group()
    ponta.position.set(desvio * 0.05, 0, 0)
    ponta.rotation.z = -desvio * 0.22
    const haste = capsule(0.02, 0.11, PRATA, M_PRATA_CLARA)
    haste.position.y = -0.075
    ponta.add(haste)
    const bicoPonta = cone(0.028, 0.07, PRATA, M_PRATA_CLARA)
    bicoPonta.rotation.z = Math.PI
    bicoPonta.position.y = -0.165
    ponta.add(bicoPonta)
    tridente.add(ponta)
  }

  // ---- o jorro de CÁ-FE (nasce no bico e desce até a areia) -----------------
  const jorro = new THREE.Group()
  jorro.position.set(0.24, 0.42, 0.06) // nasce no furo do tridente
  bandeja.add(jorro)

  const veia = cylinder(0.045, 0.08, 0.32, CAFE, { roughness: 0.2 })
  veia.rotation.z = -0.3
  veia.position.set(-0.047, -0.153, 0)
  jorro.add(veia)

  const poca = lathe(
    [[0, 0], [0.19, 0.004], [0.215, 0.018], [0.185, 0.03], [0, 0.028]],
    CAFE,
    { roughness: 0.2 },
  )
  poca.position.set(-0.1, -0.307, 0.03)
  jorro.add(poca)

  for (let i = 0; i < 4; i++) {
    const gota = sphere(0.026 + rand() * 0.016, CAFE, { roughness: 0.2 })
    const a = rand() * Math.PI * 2
    gota.position.set(-0.1 + Math.cos(a) * 0.24, -0.29 + rand() * 0.04, 0.03 + Math.sin(a) * 0.2)
    jorro.add(gota)
  }

  // ---- martelinho do juiz (bate na borda da arena) --------------------------
  const martelinho = new THREE.Group()
  martelinho.position.set(0.855, 0.62, 0.43)
  martelinho.rotation.z = -0.28
  bandeja.add(martelinho)

  const caboMart = cylinder(0.03, 0.034, 0.34, MEL, M_MADEIRA)
  caboMart.position.y = -0.17
  martelinho.add(caboMart)
  const pomo = sphere(0.045, MEL_ESC, M_MADEIRA)
  pomo.position.y = 0.02
  martelinho.add(pomo)
  const cabecaMart = cylinder(0.07, 0.07, 0.26, MEL_ESC, M_MADEIRA)
  cabecaMart.position.y = -0.4
  cabecaMart.rotation.z = Math.PI / 2 // cabeça atravessada no cabo: lê como martelo
  martelinho.add(cabecaMart)
  for (const lado of [-1, 1]) {
    const anel = torus(0.071, 0.014, OURO, M_OURO)
    anel.rotation.y = Math.PI / 2
    anel.position.set(lado * 0.085, -0.4, 0)
    martelinho.add(anel)
    const face = cylinder(0.078, 0.078, 0.03, MEL, M_MADEIRA)
    face.rotation.z = Math.PI / 2
    face.position.set(lado * 0.13, -0.4, 0)
    martelinho.add(face)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cafeteria', object: base },
    { name: 'bandeja', group: 'arena', object: bandeja },
    { name: 'voce', group: 'voce', object: voce },
    { name: 'moeda', group: 'voce', object: moeda },
    { name: 'xicara', group: 'gladiador', object: xicara },
    { name: 'elmo', group: 'gladiador', object: elmo },
    { name: 'bule', group: 'duelo', object: bule },
    { name: 'tridente', group: 'duelo', object: tridente },
    { name: 'jorro', group: 'cafe', object: jorro },
    { name: 'martelinho', group: 'veredito', object: martelinho },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 1.3)], {
      ease: 'easeOut',
      caption: 'No café, o piso e o balcão de madeira brotam do chão…',
    }),

    seq(
      'bandeja-abre',
      'bandeja',
      1.9,
      0.8,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: '…e a bandeja de metal se abre virando uma ARENA romana em miniatura.',
      },
    ),

    seq('voce-rise', 'voce', 3.5, 0.8, [riseFrom(GY, 1.95)], {
      ease: 'easeOut',
      caption: 'Você ergue a mão e grita "IÁ!" (jag) — e joga a moeda: "TÁ, REN!"',
    }),
    seq(
      'moeda-pop',
      'moeda',
      3.9,
      0.4,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('voce-impulso', 'voce', 4.3, 0.3, [ch('position.y', GY, GY + 0.16)], { ease: 'easeOut' }),
    seq(
      'moeda-arco',
      'moeda',
      4.4,
      0.45,
      [
        ch('position.x', mao.x, -0.78),
        ch('position.y', mao.y, 1.88),
        ch('position.z', mao.z, 0.06),
        ch('rotation.y', 0, 3.4),
      ],
      { ease: 'easeOut' },
    ),
    seq('voce-pousa', 'voce', 4.6, 0.3, [ch('position.y', GY + 0.16, GY)], { ease: 'easeIn' }),
    seq(
      'moeda-cai',
      'moeda',
      4.85,
      0.45,
      [
        ch('position.x', -0.78, MOEDA_FIM[0]),
        ch('position.y', 1.88, MOEDA_FIM[1]),
        ch('position.z', 0.06, MOEDA_FIM[2]),
        ch('rotation.y', 3.4, 6.6),
        ch('rotation.x', 0, 1.25),
      ],
      { ease: 'easeIn' },
    ),

    seq('xicara-rise', 'xicara', 5.4, 0.8, [ch('position.y', -0.55, SAND)], {
      ease: 'easeOut',
      caption: 'Da areia sobe a xícara-gladiadora: o nome dela está no escudo — REN.',
    }),
    seq(
      'elmo-cresce',
      'elmo',
      5.9,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('bule-rise', 'bule', 7.2, 0.8, [ch('position.y', -0.7, SAND)], { ease: 'easeOut' }),
    seq('tridente-rise', 'tridente', 7.4, 0.8, [ch('position.y', -0.8, 0.86)], { ease: 'easeOut' }),

    seq('xicara-avanca', 'xicara', 8.9, 0.35, [ch('position.x', -0.34, -0.22)], { ease: 'easeOut' }),
    seq(
      'tridente-crava',
      'tridente',
      9.0,
      0.45,
      [ch('position.x', -0.06, 0.08), ch('position.y', 0.86, 0.56), ch('rotation.z', 0.45, 0.8)],
      {
        ease: 'easeIn',
        caption: 'REN crava a colher-tridente no bule — e o CÁ-FE jorra na areia!',
      },
    ),
    seq('bule-tomba', 'bule', 9.4, 0.6, [ch('rotation.x', 0, -0.6)], { ease: 'easeOut' }),
    seq('xicara-recua', 'xicara', 9.45, 0.5, [ch('position.x', -0.22, -0.34)]),

    seq(
      'jorro-cai',
      'jorro',
      10.0,
      0.75,
      [ch('scale.y', 0.02, 1), ch('scale.x', 0.4, 1), ch('scale.z', 0.4, 1)],
      { ease: 'easeOut' },
    ),

    seq('martelinho-rise', 'martelinho', 11.5, 0.7, [ch('position.y', -0.2, 0.62)], {
      ease: 'easeOut',
    }),
    seq('tac-1', 'martelinho', 12.3, 0.3, [ch('rotation.z', -0.62, -0.28)], {
      ease: 'easeIn',
      caption: 'O martelinho do juiz sela a vitória: TAC! — "Jag tar en kaffe, tack."',
    }),
    seq('tac-sobe', 'martelinho', 12.6, 0.28, [ch('rotation.z', -0.28, -0.55)], { ease: 'easeOut' }),
    seq('tac-2', 'martelinho', 12.88, 0.28, [ch('rotation.z', -0.55, -0.28)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.05, 3.5, 4.0], target: [0.05, 1.2, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-tar-en-kaffe-tack',
    contexto:
      "Balcão de café, padaria, foodtruck, bar. Também serve apontando para algo na loja: 'Jag tar den här'.",
    fraseFonte: 'Vou querer um café, por favor.',
    fraseAlvo: 'Jag tar en kaffe, tack.',
    pronuncia:
      "iá tar en KÁ-fe, tak (o 'g' de 'jag' some na fala normal; 'a' de 'tar' é longo e escuro, quase 'tór')",
    ponteSonora: "IÁ! TÁ, REN — CÁ-FE, TAC! (CÁ-FE com força na 1ª sílaba, nunca 'café' oxítono)",
    historia:
      'Na areia da bandeja-arena, a xícara-gladiadora se chama REN. Você grita "IÁ!" e joga a moeda pra ela — "TÁ, REN!". Ela crava o tridente no bule adversário, o CÁ-FE jorra na areia, e o martelinho do juiz sela a vitória: TAC!',
  },
  createScene,
}

export default card
