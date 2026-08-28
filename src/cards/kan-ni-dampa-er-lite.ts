import * as THREE from 'three'
import type { Card, CardScene, PartDef } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kan ni dämpa er lite?" — o POLVO baterista (CAN-NI) solta DÉM-PÁ, DÉM-PÁ no
 * bumbo até as três da manhã, até um TRAVESSEIRO ser enfiado na boca do bumbo
 * e o medidor de volume despencar até o tracinho verde: ÊR-LÍTE.
 *
 * Diorama: sala do vizinho de cima — laje de tacos de madeira mel, tapete
 * azul-petróleo, bumbo creme deitado com aros cromados, caixa no tripé, polvo
 * roxo de oito tentáculos no banquinho com oito baquetas congeladas no ar,
 * travesseiro coral (o acento) e o medidor de volume em cubinhos.
 */

const WOOD = '#b8813f'
const WOOD_DARK = '#8f6230'
const TEAL = '#1f5d68'
const TEAL_DARK = '#174852'
const PURPLE = '#7b4bb0'
const PURPLE_DARK = '#5a3489'
const SUCKER = '#e7b7cf'
const CREAM = '#efe3cd'
const CREAM_LIGHT = '#f6efe2'
const CHROME = '#c9ced6'
const BRICK = '#8f4a3c'
const ACCENT = '#e2513c' // reservado ao TRAVESSEIRO (o abafador do DÉM-PA)
const GY = 0.18 // topo da laje do diorama

/** Aponta um mesh de eixo +Y do ponto a até o ponto b. */
function strut(obj: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  obj.position.copy(a).add(b).multiplyScalar(0.5)
  obj.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    b.clone().sub(a).normalize(),
  )
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(31)

  // ---- base do diorama: laje de tacos + tapete --------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.62, 2.7, 0.12, WOOD_DARK, { roughness: 0.8 })
  slab.position.y = 0.06
  base.add(slab)

  const floor = cylinder(2.56, 2.62, 0.07, WOOD, { roughness: 0.72 })
  floor.position.y = 0.145
  base.add(floor)

  // tacos: lâminas finas em espinha, só sugeridas
  for (let i = 0; i < 10; i++) {
    const plank = rbox(0.9 + rand() * 0.5, 0.012, 0.2, 0.005, i % 2 ? '#a9742f' : '#c48f4b', {
      roughness: 0.7,
    })
    const a = rand() * Math.PI * 2
    const r = 0.9 + rand() * 1.4
    plank.position.set(Math.cos(a) * r, GY + 0.006, Math.sin(a) * r)
    plank.rotation.y = a + (rand() - 0.5) * 0.4
    base.add(plank)
  }

  const rug = cylinder(1.66, 1.7, 0.035, TEAL, { roughness: 0.92 })
  rug.position.set(0.35, GY + 0.018, -0.2)
  base.add(rug)

  const rugRing = torus(1.5, 0.028, TEAL_DARK, { roughness: 0.92 })
  rugRing.rotation.x = Math.PI / 2
  rugRing.position.set(0.35, GY + 0.04, -0.2)
  base.add(rugRing)

  // adereços de ambientação
  const vinis = new THREE.Group()
  vinis.position.set(-2.0, GY, 0.95)
  for (let i = 0; i < 4; i++) {
    const disc = cylinder(0.3, 0.3, 0.035, i % 2 ? '#2b2531' : '#3a3040', { roughness: 0.55 })
    disc.position.set((rand() - 0.5) * 0.06, 0.02 + i * 0.038, (rand() - 0.5) * 0.06)
    disc.rotation.y = rand() * Math.PI
    vinis.add(disc)
  }
  base.add(vinis)

  const vaso = lathe(
    [[0, 0], [0.16, 0.01], [0.19, 0.1], [0.15, 0.3], [0.17, 0.36], [0.15, 0.37]],
    '#8a6f5a',
    { roughness: 0.75 },
  )
  vaso.position.set(1.9, GY, -1.45)
  base.add(vaso)
  const folhagem = puff(0.26, '#3f7d4a', 6, 5, { roughness: 0.9 })
  folhagem.position.set(1.9, GY + 0.55, -1.45)
  base.add(folhagem)

  const abajur = new THREE.Group()
  abajur.position.set(-1.95, GY, -1.25)
  const haste = cylinder(0.035, 0.05, 1.1, '#5c4a3a', { roughness: 0.7 })
  haste.position.y = 0.55
  const pe = cylinder(0.22, 0.26, 0.05, '#5c4a3a', { roughness: 0.75 })
  pe.position.y = 0.025
  const cupula = lathe(
    [[0.1, 0], [0.3, -0.34], [0.31, -0.35], [0.11, -0.01]],
    '#e6d3a8',
    { roughness: 0.85 },
  )
  cupula.position.y = 1.42
  abajur.add(haste, pe, cupula)
  base.add(abajur)

  const caixaPapelao = rbox(0.4, 0.3, 0.34, 0.03, '#a8845c', { roughness: 0.9 })
  caixaPapelao.position.set(-1.15, GY + 0.15, 1.55)
  caixaPapelao.rotation.y = 0.4
  base.add(caixaPapelao)

  root.add(base)

  // ---- bumbo deitado com aros cromados ----------------------------------------
  const bumbo = new THREE.Group()
  bumbo.position.set(0.95, GY, 0.2)
  bumbo.rotation.y = -0.18
  const DRUM_Y = 0.74

  // casco: sólido de revolução aberto nas duas pontas, deitado no eixo z
  const casco = lathe(
    [[0.7, -0.29], [0.725, -0.2], [0.73, 0], [0.725, 0.2], [0.7, 0.29]],
    CREAM,
    { roughness: 0.35 },
  )
  casco.rotation.x = Math.PI / 2
  casco.position.y = DRUM_Y
  bumbo.add(casco)

  const tampoTras = cylinder(0.7, 0.7, 0.02, CREAM_LIGHT, { roughness: 0.5 })
  tampoTras.rotation.x = Math.PI / 2
  tampoTras.position.set(0, DRUM_Y, -0.28)
  bumbo.add(tampoTras)

  // boca escura: o vão que vai engolir o travesseiro
  const boca = cylinder(0.66, 0.66, 0.02, '#241d28', { roughness: 0.85 })
  boca.rotation.x = Math.PI / 2
  boca.position.set(0, DRUM_Y, -0.12)
  bumbo.add(boca)

  for (const z of [-0.29, 0.29]) {
    const aro = torus(0.735, 0.05, CHROME, { roughness: 0.2, metalness: 0.9 })
    aro.position.set(0, DRUM_Y, z)
    bumbo.add(aro)
  }

  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + 0.2
    const tarraxa = rbox(0.07, 0.17, 0.07, 0.02, CHROME, { roughness: 0.22, metalness: 0.85 })
    tarraxa.position.set(Math.cos(a) * 0.755, DRUM_Y + Math.sin(a) * 0.755, 0)
    tarraxa.rotation.z = a - Math.PI / 2
    bumbo.add(tarraxa)
  }

  for (const side of [-1, 1]) {
    const pata = rbox(0.16, 0.06, 0.44, 0.025, WOOD_DARK, { roughness: 0.8 })
    pata.position.set(side * 0.5, 0.03, 0.02)
    bumbo.add(pata)
  }
  root.add(bumbo)

  // ---- caixa no tripé ----------------------------------------------------------
  const caixa = new THREE.Group()
  caixa.position.set(-0.1, GY, 0.85)
  caixa.rotation.z = 0.13

  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5
    const perna = cylinder(0.018, 0.026, 0.78, CHROME, { roughness: 0.2, metalness: 0.9 })
    strut(
      perna,
      new THREE.Vector3(Math.sin(a) * 0.34, 0.01, Math.cos(a) * 0.34),
      new THREE.Vector3(0, 0.72, 0),
    )
    caixa.add(perna)
  }
  const coluna = cylinder(0.035, 0.04, 0.24, CHROME, { roughness: 0.2, metalness: 0.9 })
  coluna.position.y = 0.72
  caixa.add(coluna)

  const casco2 = cylinder(0.3, 0.3, 0.15, CREAM, { roughness: 0.35 })
  casco2.position.y = 0.86
  caixa.add(casco2)
  const pele = cylinder(0.3, 0.3, 0.012, CREAM_LIGHT, { roughness: 0.5 })
  pele.position.y = 0.94
  caixa.add(pele)
  for (const y of [0.79, 0.935]) {
    const aro = torus(0.305, 0.024, CHROME, { roughness: 0.2, metalness: 0.9 })
    aro.rotation.x = Math.PI / 2
    aro.position.y = y
    caixa.add(aro)
  }
  root.add(caixa)

  // ---- banquinho ---------------------------------------------------------------
  const banquinho = new THREE.Group()
  banquinho.position.set(-1.15, GY, -0.6)

  const assento = lathe(
    [[0, 0], [0.3, 0.005], [0.33, 0.05], [0.31, 0.1], [0, 0.1]],
    BRICK,
    { roughness: 0.9 },
  )
  assento.position.y = 0.52
  banquinho.add(assento)

  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + 0.4
    const perna = cylinder(0.02, 0.028, 0.56, CHROME, { roughness: 0.2, metalness: 0.9 })
    strut(
      perna,
      new THREE.Vector3(Math.sin(a) * 0.28, 0.01, Math.cos(a) * 0.28),
      new THREE.Vector3(Math.sin(a) * 0.09, 0.52, Math.cos(a) * 0.09),
    )
    banquinho.add(perna)
  }
  const travessa = torus(0.2, 0.016, CHROME, { roughness: 0.2, metalness: 0.9 })
  travessa.rotation.x = Math.PI / 2
  travessa.position.y = 0.2
  banquinho.add(travessa)
  root.add(banquinho)

  // ---- polvo baterista ---------------------------------------------------------
  const POLVO_POS = new THREE.Vector3(-1.15, GY + 0.62, -0.6)
  const POLVO_ROT = 0.72

  const polvo = new THREE.Group()
  polvo.position.copy(POLVO_POS)
  polvo.rotation.y = POLVO_ROT

  const manto = lathe(
    [
      [0.02, 0], [0.3, 0.05], [0.4, 0.2], [0.43, 0.4],
      [0.38, 0.6], [0.26, 0.75], [0.12, 0.83], [0, 0.85],
    ],
    PURPLE,
    { roughness: 0.62 },
  )
  polvo.add(manto)

  // manchas do manto
  for (let i = 0; i < 5; i++) {
    const a = (rand() - 0.5) * 3.2
    const h = 0.28 + rand() * 0.38
    const mancha = sphere(0.05 + rand() * 0.035, PURPLE_DARK, { roughness: 0.7 })
    mancha.position.set(Math.sin(a) * 0.4, h, Math.cos(a) * 0.4)
    mancha.scale.set(1, 0.5, 1)
    polvo.add(mancha)
  }

  // olhos grandes (esclera achatada + pupila + brilho)
  for (const side of [-1, 1]) {
    const globo = sphere(0.17, PURPLE, { roughness: 0.62 })
    globo.position.set(side * 0.2, 0.55, 0.24)
    polvo.add(globo)

    const esclera = sphere(0.14, '#ffffff', { roughness: 0.2 })
    esclera.position.set(side * 0.2, 0.56, 0.34)
    esclera.scale.z = 0.55
    const pupila = sphere(0.068, '#161018', { roughness: 0.2 })
    pupila.position.set(side * 0.2, 0.55, 0.42)
    const brilho = sphere(0.024, '#ffffff', { roughness: 0.15 })
    brilho.position.set(side * 0.2 + 0.03, 0.6, 0.45)
    polvo.add(esclera, pupila, brilho)
  }

  const bico = cone(0.07, 0.1, '#3a2a3a', { roughness: 0.5 })
  bico.rotation.x = Math.PI / 2
  bico.position.set(0, 0.32, 0.36)
  polvo.add(bico)
  root.add(polvo)

  // ---- oito tentáculos em leque, com ventosas ----------------------------------
  const tentaculos = new THREE.Group()
  tentaculos.position.copy(POLVO_POS)
  tentaculos.rotation.y = POLVO_ROT

  const pontas: THREE.Vector3[] = []
  const dirs: THREE.Vector3[] = []

  for (let i = 0; i < 8; i++) {
    const a = -1.95 + (i * 3.9) / 7
    const lift = (rand() - 0.5) * 0.22
    const reach = 0.94 + rand() * 0.14
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(Math.sin(a) * 0.24, 0.14, Math.cos(a) * 0.24),
      new THREE.Vector3(Math.sin(a) * 0.48, -0.2 + lift * 0.4, Math.cos(a) * 0.48),
      new THREE.Vector3(Math.sin(a) * 0.8, -0.14 + lift * 0.5, Math.cos(a) * 0.8),
      new THREE.Vector3(Math.sin(a) * reach, 0.3 + lift, Math.cos(a) * reach),
    ])

    const segs = 7
    for (let s = 0; s < segs; s++) {
      const p0 = curve.getPoint(s / segs)
      const p1 = curve.getPoint((s + 1) / segs)
      const t = s / segs
      const r = 0.085 * (1 - t) + 0.028 * t
      const link = capsule(r, Math.max(p0.distanceTo(p1) - r, 0.02), PURPLE, { roughness: 0.62 })
      strut(link, p0, p1)
      tentaculos.add(link)

      if (s < 5) {
        for (const k of [0.3, 0.72]) {
          const p = curve.getPoint((s + k) / segs)
          const ventosa = sphere(r * 0.42, SUCKER, { roughness: 0.55 })
          ventosa.position.set(p.x - Math.sin(a) * r * 0.55, p.y - r * 0.6, p.z - Math.cos(a) * r * 0.55)
          ventosa.scale.y = 0.45
          tentaculos.add(ventosa)
        }
      }
    }

    const ponta = curve.getPoint(1)
    pontas.push(ponta)
    dirs.push(curve.getPoint(1).sub(curve.getPoint(0.86)).normalize())
  }
  root.add(tentaculos)

  // ---- oito baquetas congeladas no ar ------------------------------------------
  const baquetas = new THREE.Group()
  baquetas.position.copy(POLVO_POS)
  baquetas.rotation.y = POLVO_ROT

  for (let i = 0; i < 8; i++) {
    const ponta = pontas[i]
    const dir = dirs[i].clone().add(new THREE.Vector3(0, 1.5, 0)).normalize()
    const a0 = ponta.clone().add(dir.clone().multiplyScalar(-0.08))
    const a1 = ponta.clone().add(dir.clone().multiplyScalar(0.46))

    const haste2 = cylinder(0.022, 0.028, a0.distanceTo(a1), '#dcc59c', { roughness: 0.55 })
    strut(haste2, a0, a1)
    baquetas.add(haste2)

    const cabeca = sphere(0.045, '#c9ae83', { roughness: 0.55 })
    cabeca.position.copy(a1)
    baquetas.add(cabeca)
  }
  root.add(baquetas)

  // ---- travesseiro (acento coral) ----------------------------------------------
  const travesseiro = new THREE.Group()
  travesseiro.position.set(0.9, 0.88, 0.56)
  travesseiro.rotation.set(-0.12, -0.18, 0.08)

  const fronha = rbox(0.62, 0.21, 0.44, 0.1, CREAM_LIGHT, { roughness: 0.95 })
  travesseiro.add(fronha)
  for (const x of [-0.14, 0.14]) {
    const listra = rbox(0.05, 0.215, 0.445, 0.022, ACCENT, { roughness: 0.95 })
    listra.position.x = x
    travesseiro.add(listra)
  }
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const canto = sphere(0.05, CREAM_LIGHT, { roughness: 0.95 })
      canto.position.set(sx * 0.29, 0, sz * 0.2)
      canto.scale.set(0.8, 0.55, 0.8)
      travesseiro.add(canto)
    }
  }
  root.add(travesseiro)

  // ---- medidor de volume em cubinhos -------------------------------------------
  const medidor = new THREE.Group()
  medidor.position.set(2.0, GY, 0.7)
  medidor.rotation.y = -0.42

  const peMedidor = cylinder(0.3, 0.34, 0.06, '#3a3340', { roughness: 0.45 })
  peMedidor.position.y = 0.03
  medidor.add(peMedidor)
  const mastro = cylinder(0.05, 0.06, 0.85, CHROME, { roughness: 0.2, metalness: 0.9 })
  mastro.position.y = 0.45
  medidor.add(mastro)
  const painel = rbox(0.5, 1.15, 0.12, 0.05, '#2a2430', { roughness: 0.4 })
  painel.position.y = 1.35
  medidor.add(painel)

  const escala = ['#3faa55', '#4fae4a', '#8fb03c', '#c9a832', '#d99a2c', '#d4762c', '#cd4e33', '#c93a2e']
  for (let i = 0; i < 8; i++) {
    const cubo = rbox(0.3, 0.09, 0.07, 0.02, escala[i], { roughness: 0.4 })
    cubo.position.set(0, 0.92 + i * 0.125, 0.075)
    medidor.add(cubo)
  }
  root.add(medidor)

  // ponteiro: desce do vermelho até o tracinho verde (ÊR-LÍTE)
  const ponteiro = new THREE.Group()
  ponteiro.position.set(0, 0.92, 0.13)
  const tracinho = rbox(0.44, 0.05, 0.05, 0.02, '#8ff0a8', {
    roughness: 0.3,
    emissive: '#4ade80',
    emissiveIntensity: 1.2,
  })
  ponteiro.add(tracinho)
  for (const side of [-1, 1]) {
    const seta = cone(0.05, 0.09, '#e8e4da', { roughness: 0.4 })
    seta.rotation.z = -side * (Math.PI / 2)
    seta.position.set(side * 0.26, 0, 0)
    ponteiro.add(seta)
  }
  medidor.add(ponteiro)

  // ---- peças -------------------------------------------------------------------
  const parts: PartDef[] = [
    { name: 'base', group: 'sala', object: base },
    { name: 'bumbo', group: 'bateria', object: bumbo },
    { name: 'caixa', group: 'bateria', object: caixa },
    { name: 'banquinho', group: 'bateria', object: banquinho },
    { name: 'polvo', group: 'polvo', object: polvo },
    { name: 'tentaculos', group: 'polvo', object: tentaculos },
    { name: 'baquetas', group: 'polvo', object: baquetas },
    { name: 'travesseiro', group: 'travesseiro', object: travesseiro },
    { name: 'medidor', group: 'medidor', object: medidor },
    { name: 'ponteiro', group: 'medidor', object: ponteiro },
  ]

  const grow = (from = 0.01) => [
    ch('scale.x', from, 1),
    ch('scale.y', from, 1),
    ch('scale.z', from, 1),
  ]

  // ---- montagem ----------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.75)], {
      ease: 'easeOut',
      caption: 'Brota a sala do vizinho DE CIMA: tacos de madeira e tapete azul-petróleo…',
    }),

    seq('bumbo-rise', 'bumbo', 1.8, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: '…e sobe uma bateria gigante — o bumbo creme deitado, boca virada pra você.',
    }),
    seq('caixa-rise', 'caixa', 1.95, 0.75, [riseFrom(GY, 1.4)], { ease: 'easeOut' }),
    seq('banquinho-rise', 'banquinho', 2.1, 0.7, [riseFrom(GY, 1.1)], { ease: 'easeOut' }),

    seq('polvo-grow', 'polvo', 3.8, 0.8, grow(), {
      ease: 'easeOut',
      caption: 'No banquinho incha o POLVO baterista de oito braços — CAN-NI, vocês aí!',
    }),
    seq('tentaculos-grow', 'tentaculos', 3.95, 0.8, grow(), { ease: 'easeOut' }),
    seq('baquetas-rise', 'baquetas', 4.15, 0.8, [riseFrom(GY + 0.62, 2.0)], { ease: 'easeOut' }),

    seq('baquetas-bate-1', 'baquetas', 5.5, 0.35, [ch('rotation.z', 0, 0.16)], {
      caption: 'Ele solta DÉM-PÁ, DÉM-PÁ no bumbo até as três da manhã…',
    }),
    seq('polvo-bob-up', 'polvo', 5.55, 0.35, [ch('position.y', GY + 0.62, GY + 0.7)]),
    seq('bumbo-shake-1', 'bumbo', 5.7, 0.3, [ch('rotation.z', 0, 0.045)]),
    seq('baquetas-bate-2', 'baquetas', 5.85, 0.3, [ch('rotation.z', 0.16, -0.11)]),
    seq('polvo-bob-down', 'polvo', 5.9, 0.35, [ch('position.y', GY + 0.7, GY + 0.62)]),
    seq('bumbo-shake-2', 'bumbo', 6.0, 0.3, [ch('rotation.z', 0.045, -0.03)]),
    seq('baquetas-bate-3', 'baquetas', 6.15, 0.3, [ch('rotation.z', -0.11, 0.12)]),
    seq('bumbo-shake-3', 'bumbo', 6.3, 0.35, [ch('rotation.z', -0.03, 0)]),
    seq('baquetas-bate-4', 'baquetas', 6.45, 0.4, [ch('rotation.z', 0.12, 0)]),

    seq('travesseiro-rise', 'travesseiro', 7.3, 0.8, [
      ch('position.z', 1.62, 1.62),
      riseFrom(0.3, 0.75),
    ], {
      ease: 'easeOut',
      caption: 'Você sobe de pijama com um TRAVESSEIRO debaixo do braço…',
    }),

    seq('travesseiro-enfia', 'travesseiro', 8.6, 0.7, [
      ch('position.z', 1.62, 0.56),
      ch('position.y', 0.3, 0.88),
      ch('rotation.x', 0, -0.12),
      ch('rotation.y', 0, -0.18),
    ], {
      ease: 'easeIn',
      caption: '…CAN-NI… DÉM-PA! — e enfia o travesseiro na boca do bumbo: puf, abafou.',
    }),
    seq('bumbo-abafa', 'bumbo', 9.25, 0.25, [ch('scale.y', 1, 0.93), ch('scale.x', 1, 1.05)], {
      ease: 'easeOut',
    }),
    seq('bumbo-volta', 'bumbo', 9.5, 0.45, [ch('scale.y', 0.93, 1), ch('scale.x', 1.05, 1)]),

    seq('medidor-rise', 'medidor', 9.6, 0.8, [riseFrom(GY, 2.4)], {
      ease: 'easeOut',
      caption: 'O medidor de volume acende no vermelho…',
    }),
    seq('ponteiro-pop', 'ponteiro', 9.9, 0.5, grow(), { ease: 'easeOut' }),

    seq('ponteiro-despenca', 'ponteiro', 10.7, 0.8, [ch('position.y', 1.79, 0.92)], {
      ease: 'easeIn',
      caption: '…e despenca até o tracinho verde: ÊR-LÍTE. — Kan ni dämpa er lite?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 3.15, 6.4], target: [0.15, 1.05, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-ni-dampa-er-lite',
    contexto: 'Batendo na porta do vizinho tarde da noite, ou numa festa barulhenta no prédio.',
    fraseFonte: 'Vocês podem baixar um pouco?',
    fraseAlvo: 'Kan ni dämpa er lite?',
    pronuncia: "kan ni DÉM-pa er LÍ-te ('ä' = É aberto)",
    ponteSonora:
      "CAN-NI: DÉM-PA... ÊR-LÍTE! (7 sílabas, tônicas em DÉM e LÍ; 'kan' é C+A+N como em 'cana', jamais o glide de 'quando'; DÉM-PA é o batidão do bumbo sendo abafado, com É ABERTO e começando em D — nunca 'TAM-pa'; 'er lite' cola num sopro, R brando derretendo no L; 'lite' se lê LÍ-te, nunca 'láite')",
    historia:
      'O vizinho de cima é um polvo baterista de oito braços que solta DÉM-PÁ, DÉM-PÁ até as três da manhã. Você sobe de pijama com um travesseiro debaixo do braço e pede: CAN-NI... DÉM-PA! — e enfia o travesseiro dentro do bumbo, que engole o DÉM-PÁ num puf abafado. O medidor de volume despenca até o tracinho verde: ÊR-LÍTE, o som na versão light.',
  },
  createScene,
}

export default card
