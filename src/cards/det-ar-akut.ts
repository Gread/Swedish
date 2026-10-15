import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Det är akut, jag behöver komma in idag." — a recepção da vårdcentral é um
 * TELEFONÃO vermelho do 1177 deitado no chão. Do monofone sai um JACARÉ de
 * touca de enfermeiro; ele cospe pela fenda a fita de senha (três semanas de
 * fila) e, quando você berra "DÊ É A CÜT!", as mandíbulas fecham num estalo
 * seco — CÜT! — cortando a fila no meio, sob a cruz AKUT acesa.
 */

const MINT = '#8fc9b1' // piso da recepção
const MINT_DARK = '#3f6154'
const PHONE = '#a8382e' // telefonão (vermelho quebrado, não o acento)
const PHONE_DARK = '#712219'
const CREAM = '#efe3cf' // monofone, fita de senha, touca
const OLIVE = '#5f7a3c' // jacaré
const OLIVE_DARK = '#41582a'
const BELLY = '#c3c489'
const TEETH = '#fbf7ee'
const CHROME = '#b3bbbe'
const ACCENT = '#f0452c' // reservado: boca escancarada + cruz AKUT

const GY = 0.18 // topo da base do diorama

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(29)

  // ---- base: piso verde-menta com o anel branco da fila --------------------
  const base = new THREE.Group()

  const under = cylinder(2.6, 2.7, 0.12, MINT_DARK, { roughness: 0.9 })
  under.position.y = 0.06
  base.add(under)

  const floor = cylinder(2.52, 2.6, 0.07, MINT, { roughness: 0.55 }) // 0.3 estourava num reflexo branco
  floor.position.y = 0.145
  base.add(floor)

  // o anel branco: a fila que dá a volta na recepção
  const fila = torus(1.78, 0.045, '#f4f6f2', { roughness: 0.4 })
  fila.rotation.x = Math.PI / 2
  fila.position.y = GY - 0.018
  base.add(fila)

  // vaso de espera
  const vaso = new THREE.Group()
  vaso.position.set(-1.7, GY, -0.6)
  const pote = lathe(
    [[0, 0], [0.17, 0], [0.2, 0.08], [0.17, 0.26], [0.19, 0.31], [0.15, 0.33], [0, 0.33]],
    MINT_DARK,
    { roughness: 0.5 },
  )
  vaso.add(pote)
  const tronco = cylinder(0.035, 0.045, 0.26, '#5c4a2e', { roughness: 0.8 })
  tronco.position.y = 0.44
  vaso.add(tronco)
  const copa = puff(0.26, '#3f7d4f', 6, 31, { roughness: 0.85 })
  copa.position.y = 0.74
  vaso.add(copa)
  base.add(vaso)

  // cadeira da sala de espera
  const cadeira = new THREE.Group()
  cadeira.position.set(1.55, GY, 0.85)
  cadeira.rotation.y = -0.75 + rand() * 0.1
  const assento = rbox(0.48, 0.09, 0.44, 0.04, CREAM, { roughness: 0.45 })
  assento.position.y = 0.3
  cadeira.add(assento)
  const encosto = rbox(0.48, 0.34, 0.09, 0.04, CREAM, { roughness: 0.45 })
  encosto.position.set(0, 0.5, -0.19)
  cadeira.add(encosto)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const pe = cylinder(0.022, 0.022, 0.3, CHROME, { roughness: 0.25, metalness: 0.85 })
      pe.position.set(sx * 0.19, 0.15, sz * 0.17)
      cadeira.add(pe)
    }
  }
  base.add(cadeira)

  // segunda cadeira de espera, vazia (a fila já foi embora)
  const cadeira2 = cadeira.clone()
  cadeira2.position.set(1.95, GY, 0.2)
  cadeira2.rotation.y = -1.15
  base.add(cadeira2)

  // senhas velhas largadas no chão
  for (const [sx, sz] of [[1.35, -1.6], [-1.15, -1.45]] as const) {
    const stub = rbox(0.24, 0.03, 0.16, 0.012, CREAM, { roughness: 0.7 })
    stub.position.set(sx, GY + 0.015, sz)
    stub.rotation.y = rand() * Math.PI
    base.add(stub)
  }
  root.add(base)

  // ---- telefonão do 1177 deitado no chão -----------------------------------
  const telefone = new THREE.Group()
  telefone.position.set(0.75, GY, -0.55)
  telefone.rotation.y = -0.35
  root.add(telefone)

  const corpo = rbox(2.0, 0.42, 1.3, 0.16, PHONE, { roughness: 0.35 })
  corpo.position.y = 0.21
  telefone.add(corpo)

  const rampa = rbox(1.9, 0.2, 0.44, 0.08, PHONE, { roughness: 0.35 })
  rampa.position.set(0, 0.1, 0.8)
  telefone.add(rampa)

  // a fenda por onde sai a fita de senha
  const fenda = rbox(0.66, 0.06, 0.07, 0.02, '#2a110d', { roughness: 0.6 })
  fenda.position.set(-0.25, 0.16, 0.99)
  telefone.add(fenda)

  // disco de discagem
  const disco = cylinder(0.4, 0.4, 0.06, CREAM, { roughness: 0.25 })
  disco.position.set(0.45, 0.44, 0.04)
  telefone.add(disco)
  const aro = torus(0.29, 0.035, PHONE_DARK, { roughness: 0.4 })
  aro.rotation.x = Math.PI / 2
  aro.position.set(0.45, 0.48, 0.04)
  telefone.add(aro)
  for (let i = 0; i < 9; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.35
    const furo = cylinder(0.052, 0.052, 0.05, '#33110d', { roughness: 0.6 })
    furo.position.set(0.45 + Math.cos(a) * 0.29, 0.46, 0.04 + Math.sin(a) * 0.29)
    telefone.add(furo)
  }

  // placa "1177"
  const placa = rbox(0.64, 0.05, 0.26, 0.02, CREAM, { roughness: 0.4 })
  placa.position.set(-0.52, 0.44, 0.12)
  telefone.add(placa)
  const digitos: ('1' | '7')[] = ['1', '1', '7', '7']
  digitos.forEach((d, i) => {
    const dx = -0.21 + i * 0.14
    if (d === '1') {
      const haste = rbox(0.024, 0.02, 0.13, 0.008, '#33110d', { roughness: 0.5 })
      haste.position.set(dx, 0.04, 0)
      placa.add(haste)
    } else {
      const topo = rbox(0.09, 0.02, 0.024, 0.008, '#33110d', { roughness: 0.5 })
      topo.position.set(dx, 0.04, -0.05)
      placa.add(topo)
      const perna = rbox(0.022, 0.02, 0.11, 0.008, '#33110d', { roughness: 0.5 })
      perna.position.set(dx + 0.02, 0.04, 0.02)
      perna.rotation.y = -0.22
      placa.add(perna)
    }
  })

  // berço do monofone
  for (const side of [-1, 1]) {
    const dente = rbox(0.26, 0.14, 0.32, 0.05, PHONE_DARK, { roughness: 0.4 })
    dente.position.set(side * 0.52, 0.47, -0.3)
    telefone.add(dente)
  }

  // fio espiralado saindo do corpo
  for (let i = 0; i < 5; i++) {
    const anel = torus(0.085, 0.028, '#3a1712', { roughness: 0.6 })
    anel.rotation.y = Math.PI / 2
    anel.position.set(-0.98 - i * 0.055, 0.3 + i * 0.075, -0.34 + i * 0.02)
    telefone.add(anel)
  }

  // ---- monofone creme no berço (telescopa de dentro do telefone) -----------
  const monofone = new THREE.Group()
  monofone.position.set(0, 0.62, -0.3)
  monofone.rotation.set(0, 0.1, -0.28)
  telefone.add(monofone)

  const cabo = rbox(1.08, 0.16, 0.2, 0.075, CREAM, { roughness: 0.3 })
  monofone.add(cabo)
  for (const side of [-1, 1]) {
    const copo = lathe(
      [[0, 0], [0.15, 0], [0.19, 0.09], [0.22, 0.2], [0.15, 0.23], [0.04, 0.22], [0, 0.21]],
      CREAM,
      { roughness: 0.3 },
    )
    copo.rotation.z = side < 0 ? Math.PI / 2 : -Math.PI / 2
    copo.position.set(side * 0.6, 0, 0)
    monofone.add(copo)
  }

  // ---- fita de senha: sai da fenda e serpenteia pelo chão ------------------
  const fita = new THREE.Group()
  fita.position.set(0.18, GY + 0.02, 0.28)
  fita.rotation.y = -1.08
  root.add(fita)

  function painel(x: number, z: number, ry: number, seed: number) {
    const g = new THREE.Group()
    g.position.set(x, 0, z)
    g.rotation.y = ry
    const folha = rbox(0.32, 0.035, 0.42, 0.014, CREAM, { roughness: 0.75 })
    g.add(folha)
    const marca = rbox(0.17, 0.012, 0.03, 0.005, PHONE_DARK, { roughness: 0.6 })
    marca.position.set(0, 0.024, -0.09 + (seed % 3) * 0.09)
    g.add(marca)
    const risco = rbox(0.1, 0.012, 0.02, 0.004, MINT_DARK, { roughness: 0.6 })
    risco.position.set(-0.03, 0.024, 0.13)
    g.add(risco)
    return g
  }

  // metade que fica presa ao telefone
  fita.add(painel(-0.02, 0.22, -0.18, 1))
  fita.add(painel(-0.09, 0.6, 0.22, 2))

  // metade solta: o pedaço de fila que o jacaré arranca com a mordida
  const fitaSolta = new THREE.Group()
  fitaSolta.position.set(-0.66, 0, 1.05)
  fitaSolta.rotation.y = 0.85
  fita.add(fitaSolta)
  fitaSolta.add(painel(0, 0.2, 0.24, 3))
  fitaSolta.add(painel(0.14, 0.58, 0.42, 4))
  fitaSolta.add(painel(0.34, 0.93, 0.12, 5))

  // ---- jacaré-enfermeiro: nasce no monofone, morde a fita ------------------
  const boca = fita.localToWorld(new THREE.Vector3(-0.1, 0.22, 0.8))
  const orelha = monofone.localToWorld(new THREE.Vector3(-0.84, 0, 0))

  const jacare = new THREE.Group()
  jacare.position.copy(orelha)
  root.add(jacare)
  jacare.lookAt(boca)

  const L = orelha.distanceTo(boca) // comprimento do bicho, do fone à mordida
  const frente = boca.clone().sub(orelha).normalize()

  const golaAnel = torus(0.3, 0.06, OLIVE_DARK, { roughness: 0.7 })
  golaAnel.position.z = 0.05
  jacare.add(golaAnel)

  const troncoLen = Math.max(L - 1.43, 0.25)
  const troncoZ = (L - 0.83) / 2
  const troncoJ = capsule(0.28, troncoLen, OLIVE, { roughness: 0.72 })
  troncoJ.rotation.x = Math.PI / 2
  troncoJ.position.z = troncoZ
  jacare.add(troncoJ)

  const barriga = capsule(0.21, troncoLen, BELLY, { roughness: 0.8 })
  barriga.rotation.x = Math.PI / 2
  barriga.position.set(0, -0.11, troncoZ)
  barriga.scale.z = 0.65
  jacare.add(barriga)

  for (let i = 0; i < 5; i++) {
    const escama = cone(0.075 - i * 0.006, 0.17, OLIVE_DARK, { roughness: 0.75 })
    escama.position.set(0, 0.26, 0.3 + i * 0.22)
    escama.rotation.x = -0.1
    jacare.add(escama)
  }

  for (const [pz, side] of [[0.5, -1], [0.5, 1], [1.0, -1], [1.0, 1]] as const) {
    const pata = capsule(0.07, 0.2, OLIVE, { roughness: 0.72 })
    pata.position.set(side * 0.26, -0.19, pz)
    pata.rotation.set(0.45, 0, side * 0.4)
    const pe = sphere(0.085, OLIVE_DARK, { roughness: 0.75 })
    pe.position.y = -0.16
    pata.add(pe)
    jacare.add(pata)
  }

  // crânio fixo + mandíbula inferior
  const cranio = rbox(0.37, 0.31, 0.36, 0.11, OLIVE, { roughness: 0.72 })
  cranio.position.set(0, 0.02, L - 0.78)
  jacare.add(cranio)

  const queixo = rbox(0.32, 0.1, 0.62, 0.045, OLIVE, { roughness: 0.72 })
  queixo.position.set(0, -0.09, L - 0.32)
  jacare.add(queixo)

  // interior da boca: o acento saturado da cena. Peça própria (sem animação)
  // pra ficar fora da pele refinada: o bake de AO, feito com a boca fechada,
  // o deixava preto justo quando a boca escancara
  const goela = rbox(0.26, 0.04, 0.56, 0.015, ACCENT, { roughness: 0.55 })
  goela.position.set(0, 0.005, L - 0.32) // acima da pele refinada do queixo
  jacare.add(goela)

  for (const side of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      const dente = cone(0.033, 0.11, TEETH, { roughness: 0.3 })
      dente.position.set(side * 0.13, 0.0, L - 0.55 + i * 0.16)
      jacare.add(dente)
    }
    // olhos saltados
    const bulbo = sphere(0.1, OLIVE, { roughness: 0.72 })
    bulbo.position.set(side * 0.14, 0.2, L - 0.84)
    jacare.add(bulbo)
    const esclera = sphere(0.075, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.14, 0.25, L - 0.79)
    esclera.scale.z = 0.7
    const pupila = sphere(0.034, '#141414', { roughness: 0.2 })
    pupila.position.set(side * 0.14, 0.26, L - 0.73)
    jacare.add(esclera, pupila)
  }

  // ---- touca de enfermeiro (cruz vermelha) --------------------------------
  const touca = new THREE.Group()
  touca.position.set(0, 0.31, L - 0.88)
  touca.rotation.x = -0.16
  jacare.add(touca)
  const coifa = lathe(
    [[0, 0], [0.19, 0.006], [0.2, 0.05], [0.17, 0.11], [0.09, 0.135], [0, 0.14]],
    '#fbf9f4',
    { roughness: 0.88 },
  )
  touca.add(coifa)
  const cruzH = rbox(0.15, 0.025, 0.05, 0.008, ACCENT, { roughness: 0.5 })
  cruzH.position.set(0, 0.13, 0.03)
  touca.add(cruzH)
  const cruzV = rbox(0.05, 0.025, 0.15, 0.008, ACCENT, { roughness: 0.5 })
  cruzV.position.set(0, 0.13, 0.03)
  touca.add(cruzV)

  // ---- mandíbula superior: a peça que dá o CÜT ----------------------------
  const mandibula = new THREE.Group()
  mandibula.position.set(0, 0.06, L - 0.66)
  mandibula.rotation.x = 0.12
  jacare.add(mandibula)

  const focinho = rbox(0.33, 0.13, 0.6, 0.05, OLIVE, { roughness: 0.72 })
  focinho.position.set(0, 0.03, 0.33)
  mandibula.add(focinho)
  for (const side of [-1, 1]) {
    const narina = sphere(0.036, OLIVE_DARK, { roughness: 0.6 })
    narina.position.set(side * 0.09, 0.1, 0.57)
    mandibula.add(narina)
    for (let i = 0; i < 4; i++) {
      const dente = cone(0.032, 0.11, TEETH, { roughness: 0.3 })
      dente.rotation.x = Math.PI
      dente.position.set(side * 0.13, -0.05, 0.13 + i * 0.15)
      mandibula.add(dente)
    }
  }

  // ---- cruz AKUT acesa -----------------------------------------------------
  const cruz = new THREE.Group()
  cruz.position.set(-1.0, GY, -1.45)
  cruz.rotation.y = 0.42
  root.add(cruz)

  const mastro = cylinder(0.055, 0.075, 1.72, CHROME, { roughness: 0.25, metalness: 0.85 })
  mastro.position.y = 0.86
  cruz.add(mastro)
  const bracoV = rbox(0.24, 0.74, 0.14, 0.05, ACCENT, {
    emissive: '#ff3c20',
    emissiveIntensity: 1.15,
  })
  bracoV.position.y = 2.02
  cruz.add(bracoV)
  const bracoH = rbox(0.74, 0.24, 0.14, 0.05, ACCENT, {
    emissive: '#ff3c20',
    emissiveIntensity: 1.15,
  })
  bracoH.position.y = 2.02
  cruz.add(bracoH)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'recepcao', object: base },
    { name: 'telefone', group: 'telefone', object: telefone },
    { name: 'monofone', group: 'telefone', object: monofone },
    { name: 'jacare', group: 'jacare', object: jacare },
    { name: 'touca', group: 'jacare', object: touca },
    { name: 'goela', group: 'jacare', object: goela },
    { name: 'fita', group: 'fila', object: fita },
    { name: 'fitaSolta', group: 'fila', object: fitaSolta },
    { name: 'mandibula', group: 'mordida', object: mandibula },
    { name: 'cruz', group: 'akut', object: cruz },
  ]

  // ---- montagem ------------------------------------------------------------
  const dentro = orelha.clone().addScaledVector(frente, -0.5)
  const empurra = orelha.clone().addScaledVector(frente, 0.17)

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.95)], {
      ease: 'easeOut',
      caption: 'Recepção da vårdcentral: piso verde-menta e o anel branco da FILA.',
    }),

    seq('telefone-rise', 'telefone', 1.8, 0.85, [riseFrom(GY, 1.4)], {
      ease: 'easeOut',
      caption: 'Deitado no chão, o telefonão vermelho do 1177 — DÊ É… quem atende?',
    }),
    seq('monofone-lift', 'monofone', 2.1, 0.7, [ch('position.y', 0.02, 0.62)], { ease: 'easeOut' }),

    seq(
      'jacare-emerge',
      'jacare',
      3.8,
      0.85,
      [
        ch('scale.x', 0.01, 1),
        ch('scale.y', 0.01, 1),
        ch('scale.z', 0.01, 1),
        ch('position.x', dentro.x, orelha.x),
        ch('position.y', dentro.y, orelha.y),
        ch('position.z', dentro.z, orelha.z),
      ],
      {
        ease: 'easeOut',
        caption: 'Do monofone sai um jacaré de touca de enfermeiro — ele é o 1177.',
      },
    ),
    seq('mandibula-abre', 'mandibula', 3.95, 0.6, [ch('rotation.x', 0.06, 0.62)], {
      ease: 'easeOut',
    }),
    seq(
      'touca-pop',
      'touca',
      4.1,
      0.55,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('fita-cospe', 'fita', 5.6, 0.9, [ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'Ele cospe pela fenda a fita de senha: três semanas de fila.',
    }),
    seq('fitasolta-estica', 'fitaSolta', 5.75, 0.85, [ch('position.z', 0.55, 0.8)], {
      ease: 'easeOut',
    }),

    seq('mandibula-escancara', 'mandibula', 7.4, 0.5, [ch('rotation.x', 0.62, 0.98)], {
      ease: 'easeOut',
      caption: 'Você aponta e berra DÊ É A CÜT! — e as mandíbulas fecham num estalo seco.',
    }),
    seq('jacare-arma', 'jacare', 7.5, 0.5, [ch('position.y', orelha.y, orelha.y + 0.1)], {
      ease: 'easeOut',
    }),
    seq('jacare-baixa', 'jacare', 8.15, 0.3, [ch('position.y', orelha.y + 0.1, orelha.y)], {
      ease: 'easeIn',
    }),
    seq('mandibula-estala', 'mandibula', 8.3, 0.3, [ch('rotation.x', 0.98, 0)], { ease: 'easeIn' }),
    seq(
      'fitasolta-corta',
      'fitaSolta',
      8.6,
      0.7,
      [
        ch('position.x', -0.14, -0.66),
        ch('position.z', 0.8, 1.05),
        ch('rotation.y', 0, 0.85),
      ],
      { ease: 'easeOut' },
    ),
    seq('mandibula-solta', 'mandibula', 8.95, 0.5, [ch('rotation.x', 0, 0.12)], { ease: 'easeOut' }),

    seq('cruz-rise', 'cruz', 9.9, 0.9, [riseFrom(GY, 2.85)], {
      ease: 'easeOut',
      caption:
        'Você BE-RRÖ-VER o doutor e a cruz AKUT acende: CÓ-MA IN, I-DÁG! — "Det är akut, jag behöver komma in idag."',
    }),

    seq(
      'jacare-empurra',
      'jacare',
      11.2,
      0.4,
      [
        ch('position.x', orelha.x, empurra.x),
        ch('position.y', orelha.y, empurra.y),
        ch('position.z', orelha.z, empurra.z),
      ],
      { ease: 'easeIn' },
    ),
    seq(
      'jacare-volta',
      'jacare',
      11.6,
      0.5,
      [
        ch('position.x', empurra.x, orelha.x),
        ch('position.y', empurra.y, orelha.y),
        ch('position.z', empurra.z, orelha.z),
      ],
      { ease: 'easeOut' },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 2.65, 4.9], target: [0.15, 1.0, -0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-akut',
    contexto:
      'No telefone com o 1177 ou na recepção da vårdcentral quando a fila é de semanas.',
    fraseFonte: 'É urgente, preciso ser atendido hoje.',
    fraseAlvo: 'Det är akut, jag behöver komma in idag.',
    pronuncia:
      "de é a-KÚT, iá be-HÖ-ver KÓM-ma in i-DÁG ('akut' com tônica no U)",
    ponteSonora:
      "DÊ É A CÜT! IÁ BE-RRÖ-VER, CÓ-MA IN, I-DÁG! (13 sílabas, tônicas em CÜT, RRÖ, CÓ e DÁG; 'det' = DÊ fechado e curto; 'akut' com U de BICO quase Ü e T seco no fim; 'behöver' = be-RRÖ-ver, o RR inicial é só o h soprado e o Ö é lábios de Ô com língua de Ê, nunca um Ô puro; o R de -ver é BRANDO; 'komma' com Ó ABERTO como em 'cópia')",
    historia:
      'Você liga pro 1177 e quem atende, de dentro do telefonão vermelho, é um jacaré de touca de enfermeiro. Ele cospe pela fenda uma fita de senha com três semanas de fila; você aponta e berra DÊ É A CÜT! — e as mandíbulas dele fecham num estalo seco, CÜT!, cortando a fita da fila no meio. Aí você BE-RRÖ-VER que precisa ver o doutor, e ele te empurra pra dentro: CÓ-MA IN, I-DÁG.',
  },
  createScene,
  refine: { organic: ['jacare', 'mandibula'] },
}

export default card
