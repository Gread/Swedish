import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, rock,
} from '../rig/helpers'

/**
 * "Jag hostar mycket." — IÁ! RRÔST-AR… MÜ-QUE!
 *
 * No pico nevado dos Andes, onde o AR quase acaba, o condor não para de
 * tossir: cada tosse enche o ROSTO careca de AR (ROST-AR), que estufa
 * vermelho feito balão e escapa pelo bico numa nuvem branca. De tanto
 * sacudir a asa, a tosse virou musculação: ele ergue a asa em pose de
 * fisiculturista e mostra o MUQUE.
 *
 * Diorama: disco de rocha com neve, pico facetado cinza-escuro de topo
 * nevado no centro, três pedras com neve em volta e dois picos ao fundo.
 * Condor preto de colar branco e cachecol andino em cima do pico. O vermelho
 * do rosto estufado é o único acento saturado.
 */

const ROCHA = '#5b6069'
const ROCHA_ESC = '#3f434b'
const NEVE = '#eef3f7'
const NEVE_SOMBRA = '#d7e1ea'
const PRETO = '#2b2e35'
const PRETO_PENA = '#3a3e47'
const BRANCO = '#f3f0e8'
const ROSTO = '#e5434f' // acento reservado: o ROSTO estufado de AR
const CRISTA = '#8e2934'
const OLHO = '#2a1a1d'
const BICO = '#4b4845'
const BICO_PONTA = '#e2d6bc'
const PELE = '#c96f6c'
const MUQUE = '#d98a7c'
const MUQUE_ESC = '#bf6f64'
const PERNA = '#8d8682'
const LISTA_V = '#ad4438'
const LISTA_A = '#d9a63c'
const LISTA_G = '#4f8650'
const SUOR = '#5aaee8'
const AR = '#ffffff'

const GY = 0.21 // topo da neve do disco
const TOP = GY + 0.57 // topo nevado do pico, onde o condor pousa

// condor: posição no topo e giro de leve para a câmera
const CONDOR_POS = new THREE.Vector3(0.05, TOP, 0.05)
const CONDOR_ROT = 0.12
// cabeça (local ao condor) e giro dela para a direita da tela
const HEAD_LOCAL = new THREE.Vector3(0, 2.14, 0.06)
const HEAD_ROT = 0.55
// asa erguida: pose final é rotation = 0; dobrada = pendurada junto ao corpo,
// inclinada para trás, com o antebraço esticado na mesma linha
const ASA_DOBRADA = 1.45
const ASA_TRAS = 0.55
const ANTEBRACO_DOBRADO = 1.5

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- montanha: disco de rocha + neve + pico facetado ----------------------
  const montanha = new THREE.Group()

  const disco = cylinder(2.45, 2.6, 0.16, ROCHA_ESC, { roughness: 0.9, flat: true }, 11)
  disco.position.y = 0.08
  montanha.add(disco)

  const neveChao = cylinder(2.34, 2.42, 0.05, NEVE_SOMBRA, { roughness: 0.95, flat: true }, 11)
  neveChao.position.y = 0.185
  montanha.add(neveChao)

  // montinhos de neve espalhados no disco
  for (const [nx, nz, nr] of [[-1.7, 0.4, 0.32], [1.55, 1.15, 0.26], [0.9, -1.6, 0.3], [-0.9, 1.75, 0.22]] as const) {
    const monte = sphere(nr, NEVE, { roughness: 0.95 })
    monte.scale.set(1.3, 0.35, 1.1)
    monte.position.set(nx, GY, nz)
    montanha.add(monte)
  }

  // o pico: perfil torneado com poucos lados = rocha facetada
  const pico = lathe(
    [[0, 0], [1.4, 0], [1.3, 0.1], [1.08, 0.26], [0.86, 0.4], [0.7, 0.5], [0.6, 0.55], [0, 0.56]],
    ROCHA,
    { roughness: 0.88, flat: true },
    9,
  )
  pico.position.y = GY - 0.02
  pico.rotation.y = 0.2
  montanha.add(pico)

  // capa de neve no topo, com escorridos pela encosta
  const capa = lathe(
    [[1.05, 0.27], [0.92, 0.39], [0.76, 0.49], [0.64, 0.548], [0.3, 0.57], [0, 0.575]],
    NEVE,
    { roughness: 0.92, flat: true },
    9,
  )
  capa.position.y = GY - 0.02
  capa.rotation.y = 0.2
  montanha.add(capa)

  root.add(montanha)

  // ---- pedras com neve + picos ao fundo -------------------------------------
  const pedras = new THREE.Group()
  for (const [i, [px, pz, pr]] of ([[-1.65, 1.0, 0.3], [1.75, 0.35, 0.26], [1.2, 1.2, 0.2]] as const).entries()) {
    const pedra = rock(pr, ROCHA, 7 + i, { roughness: 0.9 })
    pedra.scale.y = 0.8
    pedra.position.set(px, GY + pr * 0.45, pz)
    pedra.rotation.y = rand() * Math.PI
    pedras.add(pedra)
    const touca = sphere(pr * 0.72, NEVE, { roughness: 0.95 })
    touca.scale.set(1.1, 0.42, 1.0)
    touca.position.set(px, GY + pr * 1.05, pz)
    pedras.add(touca)
  }
  // a cordilheira atrás: dois picos menores com ponta nevada
  for (const [px, pz, h, r] of [[-1.55, -1.45, 1.45, 0.62], [1.7, -1.2, 1.05, 0.5]] as const) {
    const serra = cone(r, h, ROCHA_ESC, { roughness: 0.9, flat: true }, 7)
    serra.position.set(px, GY + h / 2, pz)
    serra.rotation.y = rand() * Math.PI
    pedras.add(serra)
    const ponta = cone(r * 0.42, h * 0.42, NEVE, { roughness: 0.92, flat: true }, 7)
    ponta.position.set(px, GY + h - h * 0.21 + 0.015, pz)
    ponta.rotation.y = serra.rotation.y
    pedras.add(ponta)
  }
  root.add(pedras)

  // ---- CONDOR ---------------------------------------------------------------
  const condor = new THREE.Group()
  condor.position.copy(CONDOR_POS)
  condor.rotation.y = CONDOR_ROT
  root.add(condor)

  const corpo = sphere(0.55, PRETO, { roughness: 0.7 })
  corpo.scale.set(1.0, 1.3, 0.88)
  corpo.position.y = 0.95
  condor.add(corpo)

  // peito um tom acima, para o volume ler contra o preto
  const peito = sphere(0.38, PRETO_PENA, { roughness: 0.75 })
  peito.scale.set(1.0, 1.25, 0.6)
  peito.position.set(0, 1.0, 0.28)
  condor.add(peito)

  // cauda em leque, para trás e para baixo
  for (const dx of [-0.16, 0, 0.16]) {
    const pena = capsule(0.09, 0.42, PRETO, { roughness: 0.7 })
    pena.scale.set(1.5, 1, 0.45)
    pena.position.set(dx, 0.3, -0.5)
    pena.rotation.set(1.05, 0, -dx * 1.2)
    condor.add(pena)
  }

  // pernas e garras agarradas na neve
  for (const side of [-1, 1]) {
    const perna = capsule(0.075, 0.22, PERNA, { roughness: 0.7 })
    perna.position.set(side * 0.2, 0.22, 0.1)
    condor.add(perna)
    for (const a of [-0.45, 0, 0.45]) {
      const dedo = capsule(0.042, 0.13, PERNA, { roughness: 0.7 })
      dedo.rotation.set(Math.PI / 2, 0, 0)
      const dir = new THREE.Vector3(Math.sin(a), 0, Math.cos(a))
      dedo.position.set(side * 0.2 + dir.x * 0.13, 0.045, 0.12 + dir.z * 0.13)
      dedo.rotation.y = a
      dedo.rotation.order = 'YXZ'
      condor.add(dedo)
      const unha = cone(0.03, 0.08, '#2c2a28', { roughness: 0.4 })
      unha.rotation.order = 'YXZ'
      unha.rotation.set(Math.PI / 2 + 0.5, a, 0)
      unha.position.set(side * 0.2 + dir.x * 0.25, 0.03, 0.12 + dir.z * 0.25)
      condor.add(unha)
    }
  }

  // asa esquerda dobrada ao lado do corpo, com a faixa branca do condor
  const asaDobrada = capsule(0.2, 0.72, PRETO, { roughness: 0.7 })
  asaDobrada.scale.set(0.55, 1, 1.45)
  asaDobrada.position.set(0.5, 0.98, -0.06)
  asaDobrada.rotation.set(-0.22, 0, 0.14)
  condor.add(asaDobrada)
  const faixa = capsule(0.12, 0.42, BRANCO, { roughness: 0.85 })
  faixa.scale.set(0.5, 1, 1.5)
  faixa.position.set(0.58, 1.12, -0.12)
  faixa.rotation.set(-0.22, 0, 0.14)
  condor.add(faixa)
  for (const dz of [-0.12, 0.02]) {
    const ponta = capsule(0.07, 0.4, PRETO, { roughness: 0.7 })
    ponta.scale.set(0.6, 1, 1.4)
    ponta.position.set(0.44, 0.38, -0.38 + dz)
    ponta.rotation.set(-0.6, 0, 0.1)
    condor.add(ponta)
  }

  // colar de penas brancas fofas
  const colar = torus(0.3, 0.12, BRANCO, { roughness: 0.92 })
  colar.rotation.x = Math.PI / 2
  colar.position.y = 1.62
  condor.add(colar)
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2
    const tufo = sphere(0.1 + rand() * 0.03, BRANCO, { roughness: 0.92 })
    tufo.position.set(Math.cos(a) * 0.36, 1.58 + (rand() - 0.5) * 0.06, Math.sin(a) * 0.34)
    condor.add(tufo)
  }

  // pescoço careca (quase todo coberto pelo cachecol)
  const pescoco = cylinder(0.17, 0.2, 0.34, PELE, { roughness: 0.6 })
  pescoco.position.y = 1.8
  condor.add(pescoco)

  // ---- cachecol andino listrado ---------------------------------------------
  const cachecol = new THREE.Group()
  cachecol.position.set(0, 1.81, 0)
  condor.add(cachecol)
  for (const [i, cor] of [LISTA_V, LISTA_A, LISTA_G].entries()) {
    const volta = torus(0.205, 0.05, cor, { roughness: 0.92 })
    volta.rotation.x = Math.PI / 2
    volta.position.y = -0.08 + i * 0.075
    cachecol.add(volta)
  }
  // ponta pendurada sobre o colar, com franja
  const pontaCachecol = new THREE.Group()
  pontaCachecol.position.set(0.12, -0.02, 0.32)
  pontaCachecol.rotation.set(-0.5, 0.15, 0.12)
  cachecol.add(pontaCachecol)
  for (const [i, cor] of [LISTA_V, LISTA_A, LISTA_G, LISTA_V].entries()) {
    const faixaC = rbox(0.21, 0.11, 0.06, 0.025, cor, { roughness: 0.92 })
    faixaC.position.y = -0.06 - i * 0.11
    pontaCachecol.add(faixaC)
  }
  for (let i = 0; i < 4; i++) {
    const fio = capsule(0.012, 0.05, LISTA_V, { roughness: 0.92 })
    fio.position.set(-0.075 + i * 0.05, -0.5, 0)
    pontaCachecol.add(fio)
  }

  // ---- cabeça careca estufada (ROST-AR) -------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(HEAD_LOCAL)
  cabeca.rotation.y = HEAD_ROT
  condor.add(cabeca)

  const cranio = sphere(0.36, ROSTO, { roughness: 0.42 })
  cranio.scale.set(1.08, 1.0, 1.05)
  cabeca.add(cranio)

  for (const side of [-1, 1]) {
    const bochecha = sphere(0.2, ROSTO, { roughness: 0.42 })
    bochecha.position.set(side * 0.25, -0.08, 0.17)
    cabeca.add(bochecha)

    // olhos espremidos de tanto tossir: > <
    for (const up of [1, -1]) {
      const traco = capsule(0.02, 0.06, OLHO, { roughness: 0.3 })
      traco.position.set(side * 0.155, 0.09 + up * 0.022, 0.335)
      traco.rotation.z = -side * up * 1.1
      cabeca.add(traco)
    }
  }

  // carúncula: a crista escura no alto da cabeça do condor
  const crista = capsule(0.07, 0.2, CRISTA, { roughness: 0.5 })
  crista.rotation.x = Math.PI / 2
  crista.scale.set(0.6, 1, 1)
  crista.position.set(0, 0.33, 0.06)
  cabeca.add(crista)


  // ---- bico curvo aberto no meio da tosse -----------------------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.04, 0.33)
  bico.scale.setScalar(1.3)
  cabeca.add(bico)

  const superior = capsule(0.075, 0.16, BICO, { roughness: 0.35 })
  superior.rotation.x = Math.PI / 2 - 0.12
  superior.scale.set(0.85, 1, 0.9)
  superior.position.set(0, 0.03, 0.12)
  bico.add(superior)

  const curva = sphere(0.068, BICO_PONTA, { roughness: 0.3 })
  curva.scale.set(0.8, 1, 1)
  curva.position.set(0, 0.0, 0.27)
  bico.add(curva)

  const gancho = cone(0.052, 0.13, BICO_PONTA, { roughness: 0.3 })
  gancho.rotation.x = Math.PI - 0.35
  gancho.position.set(0, -0.06, 0.3)
  bico.add(gancho)

  const narina = sphere(0.018, '#1c1a19', { roughness: 0.3 })
  narina.position.set(0.04, 0.085, 0.1)
  bico.add(narina)

  const bocaAberta = sphere(0.07, '#5a2027', { roughness: 0.5 })
  bocaAberta.scale.set(0.9, 0.7, 1.3)
  bocaAberta.position.set(0, -0.06, 0.1)
  bico.add(bocaAberta)

  const inferior = new THREE.Group()
  inferior.position.set(0, -0.05, 0.0)
  inferior.rotation.x = 0.55 // aberto pra baixo
  const mandibula = capsule(0.055, 0.13, BICO, { roughness: 0.35 })
  mandibula.rotation.x = Math.PI / 2
  mandibula.scale.set(0.85, 1, 0.8)
  mandibula.position.z = 0.12
  inferior.add(mandibula)
  bico.add(inferior)

  // ---- nuvem de ar saindo do bico (raiz: não estufa junto com a cabeça) -----
  condor.updateMatrixWorld(true)
  const ponta = new THREE.Vector3(0, -0.08, 0.66)
  cabeca.localToWorld(ponta)
  const rumo = new THREE.Vector3(Math.sin(CONDOR_ROT + HEAD_ROT), 0, Math.cos(CONDOR_ROT + HEAD_ROT))
  const nuvem = new THREE.Group()
  nuvem.position.copy(ponta)
  root.add(nuvem)
  for (const [i, [d, r, up]] of ([[0.16, 0.12, 0.0], [0.45, 0.18, 0.05], [0.88, 0.26, 0.12]] as const).entries()) {
    const bola = puff(r, AR, 5, 60 + i, { roughness: 0.95 })
    bola.position.set(rumo.x * d + d * 0.25, up, rumo.z * d)
    nuvem.add(bola)
  }

  // ---- gotinhas de suor voando da cabeça ------------------------------------
  const centroCabeca = new THREE.Vector3()
  cabeca.getWorldPosition(centroCabeca)
  const suor = new THREE.Group()
  suor.position.copy(centroCabeca)
  root.add(suor)
  for (const [dx, dy, dz] of [[-0.62, 0.3, 0.12], [-0.38, 0.55, 0.18], [-0.05, 0.66, 0.1]] as const) {
    const u = new THREE.Vector3(dx, dy, dz).normalize()
    const gota = new THREE.Group()
    gota.position.set(dx, dy, dz)
    const bolinha = sphere(0.055, SUOR, { roughness: 0.15 })
    gota.add(bolinha)
    const cauda = cone(0.05, 0.11, SUOR, { roughness: 0.15 })
    cauda.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), u.clone().negate())
    cauda.position.copy(u).multiplyScalar(-0.06)
    gota.add(cauda)
    suor.add(gota)
  }

  // ---- asa direita erguida em pose de fisiculturista ------------------------
  const asa = new THREE.Group()
  asa.position.set(-0.42, 1.42, 0.06)
  condor.add(asa)

  const ombro = sphere(0.17, PRETO, { roughness: 0.7 })
  asa.add(ombro)

  const umero = capsule(0.15, 0.5, PRETO, { roughness: 0.7 })
  umero.rotation.z = Math.PI / 2
  umero.scale.set(1, 1, 1.15)
  umero.position.set(-0.34, 0, 0)
  asa.add(umero)

  // franja de penas sob o braço: é asa, não braço
  for (let i = 0; i < 4; i++) {
    const sec = capsule(0.06, 0.16, PRETO_PENA, { roughness: 0.6 })
    sec.scale.set(1.5, 1, 0.45)
    sec.position.set(-0.14 - i * 0.15, -0.19, -0.01)
    sec.rotation.z = -0.12 - i * 0.06
    asa.add(sec)
  }

  const cotovelo = sphere(0.15, PRETO, { roughness: 0.6 })
  cotovelo.position.set(-0.74, 0.02, 0)
  asa.add(cotovelo)

  // antebraço: dobra no cotovelo (dobrado = pendurado junto ao corpo)
  const antebraco = new THREE.Group()
  antebraco.position.set(-0.74, 0.02, 0)
  asa.add(antebraco)

  const ulna = capsule(0.13, 0.42, PRETO, { roughness: 0.6 })
  ulna.position.set(-0.02, 0.3, 0)
  ulna.rotation.z = -0.08
  antebraco.add(ulna)

  // faixa branca da asa do condor, contornando o antebraço
  const faixaAsa = capsule(0.07, 0.36, BRANCO, { roughness: 0.85 })
  faixaAsa.scale.set(1, 1, 0.7)
  faixaAsa.position.set(-0.13, 0.3, 0.03)
  faixaAsa.rotation.z = -0.08
  antebraco.add(faixaAsa)

  // primárias abertas no alto: os "dedos" do punho fechado
  for (let i = 0; i < 5; i++) {
    const a = -0.65 + i * 0.27
    const prim = capsule(0.045, 0.32, PRETO_PENA, { roughness: 0.6 })
    prim.scale.set(1.3, 1, 0.45)
    prim.rotation.z = a
    prim.position.set(-0.04 - Math.sin(a) * 0.22, 0.64 + Math.cos(a) * 0.2, 0)
    antebraco.add(prim)
  }
  const punho = sphere(0.14, PRETO, { roughness: 0.6 })
  punho.position.set(-0.04, 0.62, 0)
  antebraco.add(punho)

  // ---- MUQUE saltando debaixo das penas -------------------------------------
  const muque = new THREE.Group()
  muque.position.set(-0.38, 0.15, 0.02)
  asa.add(muque)

  const bola = sphere(0.24, MUQUE, { roughness: 0.4 })
  bola.scale.set(1.3, 0.95, 0.95)
  muque.add(bola)
  const pico2 = sphere(0.17, MUQUE, { roughness: 0.4 })
  pico2.position.set(-0.12, 0.09, 0.02)
  muque.add(pico2)
  const veia = capsule(0.014, 0.2, MUQUE_ESC, { roughness: 0.5 })
  veia.position.set(0.02, 0.04, 0.215)
  veia.rotation.z = 1.25
  muque.add(veia)
  // penas arrepiadas em volta da base do muque
  for (const [fx, fr] of [[-0.3, 0.6], [0.0, 0.0], [0.28, -0.6]] as const) {
    const pena = capsule(0.04, 0.12, PRETO_PENA, { roughness: 0.7 })
    pena.scale.set(1.3, 1, 0.5)
    pena.position.set(fx, -0.12, 0.17)
    pena.rotation.z = fr
    muque.add(pena)
  }

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'montanha', group: 'andes', object: montanha },
    { name: 'pedras', group: 'andes', object: pedras },
    { name: 'condor', group: 'condor', object: condor },
    { name: 'cabeca', group: 'condor', object: cabeca },
    { name: 'bico', group: 'condor', object: bico },
    { name: 'cachecol', group: 'condor', object: cachecol },
    { name: 'nuvem', group: 'rostar', object: nuvem },
    { name: 'suor', group: 'rostar', object: suor },
    { name: 'asa', group: 'muque', object: asa },
    { name: 'antebraco', group: 'muque', object: antebraco },
    { name: 'muque', group: 'muque', object: muque },
  ]

  const s3 = (_part: string, from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('montanha-sobe', 'montanha', 0, 0.85, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No pico mais alto dos Andes, onde o AR é tão fino que quase acaba…',
    }),
    seq('pedras-sobem', 'pedras', 0.35, 0.8, [riseFrom(0, 1.6)], { ease: 'easeOut' }),

    seq('condor-pousa', 'condor', 1.7, 0.9, [riseFrom(CONDOR_POS.y, 2.6)], {
      ease: 'easeOut',
      caption: '…pousa um condor preto de colar branco — e ele não para de tossir.',
    }),
    seq('cabeca-surge', 'cabeca', 1.95, 0.6, s3('cabeca', 0.01, 0.78), { ease: 'easeOut' }),
    seq('bico-surge', 'bico', 2.1, 0.5, s3('bico', 0.01, 1), { ease: 'easeOut' }),
    seq('asa-surge', 'asa', 2.0, 0.6, [
      ch('rotation.z', ASA_DOBRADA, ASA_DOBRADA),
      ch('rotation.x', ASA_TRAS, ASA_TRAS),
      ...s3('asa', 0.3, 0.82),
    ], { ease: 'easeOut' }),
    seq('antebraco-surge', 'antebraco', 2.0, 0.6, [
      ch('rotation.z', ANTEBRACO_DOBRADO, ANTEBRACO_DOBRADO),
    ], { ease: 'easeOut' }),
    seq('cachecol-enrola', 'cachecol', 2.6, 0.7, [
      ch('rotation.y', -Math.PI, 0),
      ...s3('cachecol', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('cabeca-estufa', 'cabeca', 3.9, 0.5, [
      ...s3('cabeca', 0.78, 1.22),
      ch('rotation.x', 0, -0.18),
    ], {
      ease: 'easeOut',
      caption: 'Entre uma tossida e outra ele grita IÁ! — e cada tosse enche o ROSTO careca dele de AR…',
    }),
    seq('cabeca-assenta', 'cabeca', 4.4, 0.35, [
      ...s3('cabeca', 1.22, 1),
      ch('rotation.x', -0.18, 0),
    ], { ease: 'easeInOut' }),

    seq('nuvem-sai', 'nuvem', 5.2, 0.6, s3('nuvem', 0.01, 1), {
      ease: 'easeOut',
      caption: '…que estufa vermelho feito balão e escapa pelo bico numa nuvem branca: ROST-AR! ROST-AR!',
    }),
    seq('cabeca-tosse', 'cabeca', 5.2, 0.25, [ch('rotation.x', 0, 0.22)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 5.45, 0.35, [ch('rotation.x', 0.22, 0)], { ease: 'easeInOut' }),
    seq('suor-voa', 'suor', 5.9, 0.5, s3('suor', 0.4, 1), { ease: 'easeOut' }),

    seq('antebraco-dobra', 'antebraco', 7.55, 0.75, [
      ch('rotation.z', ANTEBRACO_DOBRADO, 0),
    ], { ease: 'easeInOut' }),
    seq('asa-ergue', 'asa', 7.4, 0.8, [
      ch('rotation.z', ASA_DOBRADA, 0),
      ch('rotation.x', ASA_TRAS, 0),
      ...s3('asa', 0.82, 1),
    ], {
      ease: 'easeOut',
      caption: 'Tossiu tanto, o dia inteiro, que a tosse virou musculação: ele ergue a asa de fisiculturista…',
    }),
    seq('muque-salta', 'muque', 8.6, 0.35, s3('muque', 0.01, 1.3), {
      ease: 'easeOut',
      caption: '…e debaixo das penas salta um MUQUE enorme: IÁ! ROST-AR… MÜ-QUE!',
    }),
    seq('muque-assenta', 'muque', 8.95, 0.3, s3('muque', 1.3, 1), { ease: 'easeInOut' }),

    seq('cabeca-tosse2', 'cabeca', 10.3, 0.3, s3('cabeca', 1, 1.12), {
      ease: 'easeOut',
      caption: 'Jag hostar mycket. — Estou tossindo muito.',
    }),
    seq('cabeca-fim', 'cabeca', 10.6, 0.35, s3('cabeca', 1.12, 1), { ease: 'easeInOut' }),
    seq('nuvem-pulsa', 'nuvem', 10.35, 0.3, s3('nuvem', 1, 1.15), { ease: 'easeOut' }),
    seq('nuvem-fim', 'nuvem', 10.65, 0.35, s3('nuvem', 1.15, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 2.7, 6.7], target: [-0.05, 1.72, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-hostar-mycket',
    contexto: "Saúde: na vårdcentral ou ao telefone com o 1177 descrevendo sintomas, no trabalho avisando que vai ficar em casa, ou se desculpando no ônibus, na reunião ou no cinema depois de um acesso de tosse.",
    fraseFonte: "Estou tossindo muito.",
    fraseAlvo: "Jag hostar mycket.",
    pronuncia: "iá RRÔS-tar MÜK-ke ('jag' = iá; 'hostar' com h soprado leve e a força no HOS — O CURTO e FECHADO, puxando pra U —, S de cobra, e o -tar fraco mas com R brando no fim: sem ele vira 'hosta', o infinitivo; 'mycket' = MÜK-ke, Ü curto de bico, o K segurado um instante e o -ke fraquinho; o T não soa)",
    ponteSonora: "IÁ! RRÔST(o)-AR... MÜ-QUE! (5 sílabas: iá-RRÔS-tar-MÜK-ke; força no RRÔS e no MÜ; IÁ = o 'jag' de sempre, I de IOGA, nunca J chiado — aqui o grito entre uma tossida e outra; RRÔST(o)-AR = o ROSTO careca do condor estufado de AR, num fôlego só e sem o -O: ROST-AR; o R de começo é o soprado carioca LEVE — é o h de 'hosta' —, sem raspar a garganta; o Ô é CURTO e FECHADO, puxando pra U (é o o curto sueco), nunca o Ó aberto de 'rosa'; S de cobra, nunca o 'sh' carioca de 'rôshto'; a força fica no RRÔS e o -TAR sai fraquinho, mas com o R BRANDO no fim, AUDÍVEL: é ele que faz o presente, 'hostar' (tusso) — sem ele sobra 'hosta', o infinitivo; MÜ-QUE = o MUQUE de 'Tack så mycket' (TAC, SÔ MUQUE) e de 'Jag har mycket att göra' — aqui o muque que nasceu na asa de tanto tossir, apontado com o BICO: Ü CURTO de bico, língua de I e lábios de U, o K segurado um instante (é dobrado) e o -QUE fraquinho; o T de 'mycket' não aparece, igual na fala sueca; nunca 'MÚ-qui' de boca aberta)",
    historia: "No pico mais alto dos Andes, onde o AR é tão fino que quase acaba, o condor não para de tossir. Entre uma tossida e outra ele grita IÁ!, e cada tosse enche o ROSTO careca dele de AR, que estufa vermelho feito balão — ROST-AR! ROST-AR! — e escapa pelo bico numa nuvem branca. Tossiu tanto, o dia inteiro, que a tosse virou musculação: a asa, sacudida a cada tossida, saltou num MUQUE enorme debaixo das penas. Ele ergue a asa em pose de fisiculturista e aponta o bico pro muque: é de tanto tossir — estou tossindo muito.",
  },
  createScene,
  refine: { organic: ['condor', 'cabeca', 'asa', 'antebraco', 'muque'] },
}

export default card
