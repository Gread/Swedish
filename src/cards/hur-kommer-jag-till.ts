import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, person,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Hur kommer jag till Storgatan?" — o quarteirão ronrona RÜÜR e a rua É uma
 * GATA laranja gigante deitada: a STÚR GATA. Você ergue a latinha, chama pra
 * CÓ-MER, ela responde IÁ! e levanta o rabo enrolado num TIL dourado.
 *
 * Diorama: quarteirão de paralelepípedo cinza-azulado com meio-fio bege, duas
 * fachadas suecas ao fundo (ocre e vermelho-falun), a gata-rua atravessando a
 * cena da esquerda para a direita, ondas de ronronar no peito, e você na
 * calçada à direita com mochila, papelzinho e a latinha erguida.
 */

const PEDRA = '#6d7b88'      // paralelepípedo cinza-azulado
const PEDRA_ESC = '#5b6874'
const MEIO_FIO = '#cbb894'   // bege
const OCRE = '#b98a4a'
const FALUN = '#8c3b30'
const TELHA = '#4e5560'
const GATA = '#e8722c'       // ACENTO reservado: a STÚR GATA (a rua-gata)
const GATA_ESC = '#c1541f'
const GATA_CLARA = '#f2a86a'
const ALMOFADA = '#d98a86'
const OURO = '#f0b429'       // só o glifo do TIL, no alto do rabo
const PELE = '#e8c39e'
const ROUPA = '#3b5a78'
const PRATA = '#c9ccd1'
const GY = 0.16              // topo da base do diorama
const CORPO_Y = 0.66         // eixo do corpo da gata

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: quarteirão de paralelepípedo -----------------------
  const base = new THREE.Group()

  const terra = cylinder(2.68, 2.76, 0.1, '#4a4238', { roughness: 0.95 })
  terra.position.y = 0.05
  base.add(terra)

  const calcada = cylinder(2.6, 2.68, 0.07, PEDRA, { roughness: 0.9 })
  calcada.position.y = 0.125
  base.add(calcada)

  // meio-fio bege: aro em volta do quarteirão
  const meioFio = torus(2.44, 0.075, MEIO_FIO, { roughness: 0.85 })
  meioFio.rotation.x = Math.PI / 2
  meioFio.position.y = GY - 0.01
  base.add(meioFio)

  // paralelepípedos soltos, espalhados com rng fixo
  for (let i = 0; i < 7; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.9 + rand() * 1.35
    const p = rbox(0.3, 0.06, 0.24, 0.03, rand() > 0.5 ? PEDRA_ESC : PEDRA, { roughness: 0.9 })
    p.position.set(Math.cos(a) * d, GY + 0.02, Math.sin(a) * d + 1.0)
    p.rotation.y = rand() * Math.PI
    base.add(p)
  }

  // adereços de ambientação
  const arbusto = puff(0.22, '#3f6b3a', 6, 31, { roughness: 0.9 })
  arbusto.position.set(-2.1, GY + 0.14, -0.95)
  base.add(arbusto)

  const pedrinha = rock(0.13, '#7e8489', 32, { roughness: 0.9 })
  pedrinha.position.set(2.15, GY + 0.05, 0.6)
  pedrinha.rotation.y = rand() * Math.PI
  base.add(pedrinha)

  // poste de rua baixo, canto de trás
  const poste = new THREE.Group()
  poste.position.set(2.15, GY, -1.2)
  const mastro = cylinder(0.045, 0.06, 0.86, '#3a3f47', { roughness: 0.5 })
  mastro.position.y = 0.43
  const luminaria = lathe(
    [[0, 0], [0.16, 0.02], [0.15, 0.12], [0.08, 0.2], [0.05, 0.26], [0, 0.27]],
    '#3a3f47',
    { roughness: 0.5 },
  )
  luminaria.position.y = 0.84
  const lampada = sphere(0.09, '#ffe6a8', { emissive: '#ffcf6b', emissiveIntensity: 1.1 })
  lampada.position.y = 0.83
  poste.add(mastro, luminaria, lampada)
  base.add(poste)
  root.add(base)

  // ---- fachadas ao fundo ---------------------------------------------------
  const fachadas = new THREE.Group()

  function casa(
    x: number, z: number, w: number, h: number, d: number,
    cor: string, ry: number, seed: number,
  ) {
    const g = new THREE.Group()
    g.position.set(x, GY, z)
    g.rotation.y = ry

    const corpo = rbox(w, h, d, 0.05, cor, { roughness: 0.8 })
    corpo.position.y = h / 2
    g.add(corpo)

    // telhado de duas águas: duas lâminas inclinadas
    for (const side of [-1, 1]) {
      const agua = rbox(w * 0.58, 0.07, d + 0.14, 0.02, TELHA, { roughness: 0.7 })
      agua.position.set(side * w * 0.26, h + 0.2, 0)
      agua.rotation.z = -side * 0.72
      g.add(agua)
    }
    const cumeeira = rbox(0.1, 0.08, d + 0.16, 0.03, TELHA, { roughness: 0.7 })
    cumeeira.position.y = h + 0.42
    g.add(cumeeira)

    // janelas com caixilho claro
    const r2 = rng(seed)
    const cols = 2
    const rows = h > 1.7 ? 3 : 2
    for (let c = 0; c < cols; c++) {
      for (let f = 0; f < rows; f++) {
        const jx = (c - (cols - 1) / 2) * w * 0.42
        const jy = 0.42 + f * (h - 0.7) / Math.max(rows - 1, 1)
        const caixilho = rbox(0.26, 0.34, 0.05, 0.02, '#efe9dc', { roughness: 0.6 })
        caixilho.position.set(jx, jy, d / 2 + 0.01)
        const vidro = rbox(0.19, 0.27, 0.03, 0.015, r2() > 0.55 ? '#ffdc9c' : '#39506b', {
          roughness: 0.15,
        })
        vidro.position.z = 0.03
        caixilho.add(vidro)
        g.add(caixilho)
      }
    }

    // porta
    const porta = rbox(0.3, 0.56, 0.06, 0.03, '#5b4128', { roughness: 0.75 })
    porta.position.set(w * 0.28, 0.28, d / 2 + 0.01)
    g.add(porta)
    return g
  }

  fachadas.add(casa(-1.45, -1.9, 1.5, 1.55, 0.75, OCRE, 0.12, 41))
  fachadas.add(casa(0.95, -2.05, 1.7, 1.9, 0.8, FALUN, -0.14, 42))
  root.add(fachadas)

  // ---- a gata-rua: corpo laranja gigante deitado ---------------------------
  const corpo = new THREE.Group()

  const tronco = capsule(0.5, 2.2, GATA, { roughness: 0.85 })
  tronco.rotation.z = Math.PI / 2
  tronco.position.set(-0.1, CORPO_Y, 0.15)
  corpo.add(tronco)

  // barriga clara na frente
  const barriga = capsule(0.36, 1.7, GATA_CLARA, { roughness: 0.88 })
  barriga.rotation.z = Math.PI / 2
  barriga.position.set(-0.1, 0.5, 0.32)
  barriga.scale.z = 0.55
  corpo.add(barriga)

  // listras: aros em volta do tronco
  for (const sx of [-0.85, -0.35, 0.2, 0.72]) {
    const listra = torus(0.503, 0.055, GATA_ESC, { roughness: 0.85 })
    listra.rotation.y = Math.PI / 2
    listra.position.set(sx, CORPO_Y, 0.15)
    corpo.add(listra)
  }

  // quatro patas dobradas, com almofadinhas
  for (const [px, pz] of [[-1.28, 0.6], [-0.72, 0.62], [0.62, 0.56], [1.12, 0.54]] as const) {
    const pata = capsule(0.155, 0.32, GATA_CLARA, { roughness: 0.85 })
    pata.rotation.z = Math.PI / 2
    pata.position.set(px, GY + 0.16, pz)
    corpo.add(pata)

    const almofada = sphere(0.075, ALMOFADA, { roughness: 0.7 })
    almofada.position.set(px - 0.29, GY + 0.14, pz)
    almofada.scale.set(0.7, 0.75, 1)
    corpo.add(almofada)
    for (const side of [-1, 1]) {
      const dedo = sphere(0.045, ALMOFADA, { roughness: 0.7 })
      dedo.position.set(px - 0.27, GY + 0.11, pz + side * 0.085)
      corpo.add(dedo)
    }
  }

  // ---- cabeça (telescopa de dentro do corpo) -------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(-1.95, CORPO_Y + 0.02, 0.38)
  cabeca.rotation.y = 0.12

  const cranio = sphere(0.45, GATA, { roughness: 0.85 })
  cranio.scale.set(1, 0.94, 0.96)
  cabeca.add(cranio)

  const focinho = sphere(0.24, GATA_CLARA, { roughness: 0.85 })
  focinho.position.set(0, -0.12, 0.33)
  focinho.scale.set(1.15, 0.78, 0.9)
  cabeca.add(focinho)

  const nariz = cone(0.06, 0.08, ALMOFADA, { roughness: 0.5 })
  nariz.rotation.x = Math.PI / 2
  nariz.position.set(0, -0.05, 0.5)
  cabeca.add(nariz)

  // olhos verdes: esclera branca achatada + íris verde + pupila preta
  for (const side of [-1, 1]) {
    const esclera = sphere(0.115, '#ffffff', { roughness: 0.2 })
    esclera.position.set(side * 0.19, 0.07, 0.38)
    esclera.scale.z = 0.55
    const iris = sphere(0.078, '#4f9e5a', { roughness: 0.2 })
    iris.position.set(side * 0.19, 0.07, 0.45)
    iris.scale.z = 0.5
    const pupila = sphere(0.032, '#161616', { roughness: 0.2 })
    pupila.position.set(side * 0.19, 0.07, 0.485)
    pupila.scale.set(0.55, 1.5, 0.5)
    cabeca.add(esclera, iris, pupila)

    // orelhas
    const orelha = cone(0.16, 0.3, GATA, { roughness: 0.85 })
    orelha.position.set(side * 0.25, 0.42, -0.02)
    orelha.rotation.set(-0.12, 0, -side * 0.22)
    const dentro = cone(0.09, 0.18, ALMOFADA, { roughness: 0.8 })
    dentro.position.set(0, -0.02, 0.05)
    orelha.add(dentro)
    cabeca.add(orelha)

    // bigodes
    for (const dy of [-0.02, 0.05]) {
      const bigode = cylinder(0.007, 0.007, 0.44, '#f4ece0', { roughness: 0.5 })
      bigode.rotation.z = Math.PI / 2
      bigode.rotation.y = -side * 0.35
      bigode.position.set(side * 0.36, -0.09 + dy, 0.36)
      cabeca.add(bigode)
    }
  }
  corpo.add(cabeca)
  root.add(corpo)

  // ---- ondas de ronronar: RÜÜR ---------------------------------------------
  // arcos de vibração "((( )))" subindo do dorso, de ponta a ponta da gata
  const ronrom = new THREE.Group()
  ronrom.position.set(-0.1, CORPO_Y + 0.42, 0.15)
  const ondaMat = mat('#dcebff', { roughness: 0.3, emissive: '#9fc3ff', emissiveIntensity: 0.35 })
  for (const cx of [-0.95, 0.15, 1.1]) {
    for (let i = 0; i < 3; i++) {
      const arco = 1.5 - i * 0.12
      const onda = new THREE.Mesh(
        new THREE.TorusGeometry(0.2 + i * 0.16, 0.034 - i * 0.006, 10, 40, arco),
        ondaMat,
      )
      onda.rotation.z = Math.PI / 2 - arco / 2
      onda.position.set(cx, -0.06, 0)
      onda.castShadow = true
      ronrom.add(onda)
    }
  }
  root.add(ronrom)

  // ---- você, na calçada, com mochila e o papelzinho ------------------------
  const voce = person({ body: ROUPA, skin: PELE, height: 1.45, armAngle: 0.35 })
  voce.position.set(1.75, GY, 1.25)
  voce.rotation.y = -1.95 // olha para a gata-rua

  const mochila = rbox(0.36, 0.44, 0.22, 0.07, '#4a5a3e', { roughness: 0.9 })
  mochila.position.set(0, 0.5, -0.26)
  voce.add(mochila)
  for (const side of [-1, 1]) {
    const alca = capsule(0.026, 0.3, '#39472f', { roughness: 0.9 })
    alca.position.set(side * 0.1, 0.6, -0.13)
    alca.rotation.x = 0.18
    voce.add(alca)
  }

  const gorro = lathe(
    [[0, 0], [0.29, 0.01], [0.28, 0.12], [0.2, 0.24], [0.09, 0.3], [0, 0.31]],
    '#8c3b30',
    { roughness: 0.9 },
  )
  gorro.position.y = 0.07
  voce.getObjectByName('head')!.add(gorro)

  // papelzinho com o endereço, na mão esquerda
  const bracoEsq = voce.getObjectByName('armL')!
  const papel = rbox(0.17, 0.21, 0.015, 0.008, '#efe9dc', { roughness: 0.7 })
  papel.position.set(0, -0.32, 0.07)
  papel.rotation.set(0.5, 0, -0.2)
  const risco = rbox(0.11, 0.014, 0.008, 0.004, '#5b6874', { roughness: 0.6 })
  risco.position.set(0, 0.04, 0.012)
  papel.add(risco)
  bracoEsq.add(papel)

  // braço direito: peça própria, é ele que ERGUE a latinha
  const bracoDir = voce.getObjectByName('armR')!
  bracoDir.rotation.z = -0.35
  root.add(voce)

  // ---- latinha prateada ----------------------------------------------------
  const latinha = new THREE.Group()
  latinha.position.set(1.68, 0.36, 1.44)

  const lata = lathe(
    [[0, 0], [0.07, 0.008], [0.083, 0.028], [0.083, 0.18], [0.068, 0.215], [0.045, 0.222], [0, 0.224]],
    PRATA,
    { roughness: 0.2, metalness: 0.9 },
  )
  lata.position.y = -0.112
  latinha.add(lata)

  const faixa = torus(0.085, 0.016, '#c94f3d', { roughness: 0.35 })
  faixa.rotation.x = Math.PI / 2
  faixa.position.y = -0.005
  latinha.add(faixa)

  const anel = torus(0.028, 0.008, PRATA, { roughness: 0.2, metalness: 0.9 })
  anel.position.set(0.03, 0.115, 0)
  anel.rotation.x = 0.5
  latinha.add(anel)
  root.add(latinha)

  // ---- o rabo que vira TIL dourado ----------------------------------------
  // sai do alto da garupa (traseira da gata) e sobe livre, sem nada na frente
  const rabo = new THREE.Group()
  rabo.position.set(1.22, 0, 0.0)

  const haste = capsule(0.11, 1.0, GATA, { roughness: 0.85 })
  haste.position.y = GY + 0.98
  rabo.add(haste)
  for (let i = 0; i < 3; i++) {
    const anelRabo = torus(0.113, 0.045, GATA_ESC, { roughness: 0.85 })
    anelRabo.rotation.x = Math.PI / 2
    anelRabo.position.y = GY + 0.98 + i * 0.24
    rabo.add(anelRabo)
  }
  const ponteira = sphere(0.125, GATA_ESC, { roughness: 0.85 })
  ponteira.position.y = GY + 1.6
  rabo.add(ponteira)

  // o glifo do TIL (~), desenhado no alto do rabo
  const til = new THREE.Group()
  til.position.y = GY + 1.86
  til.scale.setScalar(1.25)
  const curva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.34, -0.08, 0),
    new THREE.Vector3(-0.17, 0.13, 0),
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.17, -0.13, 0),
    new THREE.Vector3(0.34, 0.08, 0),
  ])
  const tilde = new THREE.Mesh(
    new THREE.TubeGeometry(curva, 40, 0.062, 12, false),
    mat(OURO, { roughness: 0.3, metalness: 0.65 }),
  )
  tilde.castShadow = true
  tilde.receiveShadow = true
  til.add(tilde)
  for (const end of [-1, 1]) {
    const ponta = sphere(0.062, OURO, { roughness: 0.3, metalness: 0.65 })
    ponta.position.set(end * 0.34, end * 0.08, 0)
    til.add(ponta)
  }
  til.rotation.z = -0.12
  rabo.add(til)
  root.add(rabo)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'fachadas', group: 'cenario', object: fachadas },
    { name: 'corpo', group: 'gata', object: corpo },
    { name: 'cabeca', group: 'gata', object: cabeca },
    { name: 'ronrom', group: 'ronrom', object: ronrom },
    { name: 'voce', group: 'voce', object: voce },
    { name: 'braco', group: 'voce', object: bracoDir },
    { name: 'latinha', group: 'voce', object: latinha },
    { name: 'rabo', group: 'til', object: rabo },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.4)], {
      ease: 'easeOut',
      caption: 'Você para na calçada de paralelepípedo com o endereço na mão…',
    }),
    seq('fachadas-rise', 'fachadas', 1.0, 0.8, [riseFrom(0, 3.0)], { ease: 'easeOut' }),

    seq('corpo-rise', 'corpo', 2.4, 0.9, [riseFrom(0, 1.6)], {
      ease: 'easeOut',
      caption: '…e o quarteirão inteiro é uma gata laranja gigante deitada: a STÚR GATA (gata = RUA).',
    }),
    seq('cabeca-out', 'cabeca', 2.6, 0.8, [ch('position.x', -0.3, -1.95)], { ease: 'easeOut' }),

    seq(
      'ronrom-grow',
      'ronrom',
      4.4,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      {
        ease: 'easeOut',
        caption: 'Ela ronrona de ponta a ponta: RÜÜR… — o H soprado de "hur", U de bico de pato.',
      },
    ),

    seq('voce-rise', 'voce', 6.0, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: 'Você chega com a mochila e o papelzinho, e pega a latinha do chão…',
    }),
    seq('braco-settle', 'braco', 6.0, 0.6, [ch('rotation.z', -0.12, -0.35)], { ease: 'easeOut' }),
    seq('latinha-rise', 'latinha', 6.3, 0.8, [riseFrom(0.36, 1.0)], { ease: 'easeOut' }),

    seq('braco-raise', 'braco', 7.8, 0.7, [ch('rotation.z', -0.35, -2.9)]),
    seq('latinha-raise', 'latinha', 7.85, 0.7, [
      ch('position.y', 0.36, 0.9),
      ch('position.x', 1.68, 1.63),
      ch('position.z', 1.44, 1.47),
    ]),

    seq('rabo-rise', 'rabo', 9.4, 0.8, [riseFrom(0, 2.1)], {
      ease: 'easeOut',
      caption: 'Você chama pra CÓ-MER (tônica no CÓ, bem aberto) — e ela responde IÁ!',
    }),
    seq('cabeca-nod', 'cabeca', 9.6, 0.5, [ch('rotation.z', 0, 0.2)], { ease: 'easeOut' }),
    seq('cabeca-back', 'cabeca', 10.1, 0.5, [ch('rotation.z', 0.2, 0.05)]),

    seq('rabo-wag', 'rabo', 10.3, 0.6, [ch('rotation.z', 0, 0.24)]),
    seq('rabo-settle', 'rabo', 10.9, 0.7, [ch('rotation.z', 0.24, 0.06)], {
      ease: 'easeOut',
      caption: 'O rabo sobe enrolado num TIL dourado, apontando o caminho: Hur kommer jag till Storgatan?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.5, 2.55, 5.55], target: [0.0, 1.05, 0.1] },
  }
}

export const card: Card = {
  refine: { organic: ['corpo', 'cabeca'] },
  meta: {
    id: 'hur-kommer-jag-till',
    contexto: 'Parando alguém na rua com o endereço na mão. Troque pelo nome da rua ou do lugar.',
    fraseFonte: 'Como eu chego na rua Storgatan?',
    fraseAlvo: 'Hur kommer jag till Storgatan?',
    pronuncia: "RRUR KÔ-mer iá til STÚR-ga-tan? ('hur' com H soprado e u arredondado)",
    ponteSonora:
      "RÜR CÓ-MER IÁ TIL STÚR-GA-TAN (8 sílabas; RÜR = 'rural' com bico de pato e R soprado — esse sopro é o h de 'hur'; 'kommer' tem O ABERTO, tônica no CÓ e guarda o -R BRANDO: CÓ-mer, nunca 'CÔ' nem 'co-MER'; STÚR = 'tour' com S chiado, U FECHADO; em sueco 'gata' é RUA)",
    historia:
      'Você para na calçada com o endereço na mão e o quarteirão inteiro ronrona: RÜÜR... Deitada de ponta a ponta, uma gata laranja do tamanho do quarteirão é a Storgatan em pessoa: a STÚR GATA, a rua-gata gigante. Você ergue a latinha e chama pra CÓ-MER — a força cai no CÓ, bem aberto —, ela responde IÁ! e levanta o rabo, que se enrola num til dourado apontando o caminho.',
  },
  createScene,
}

export default card
