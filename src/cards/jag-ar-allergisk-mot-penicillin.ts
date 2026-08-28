import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Jag är allergisk mot penicillin." — sala de curativos.
 *
 * O rapaz ergue o braço e mal começa o A-LÉR… quando a seringa gigante já
 * esguicha na cara: GUISK! A vaca-enfermeira baixa os chifres e mete uma
 * cabeçada MUT, contra!, no vidro âmbar de PENICILÍN, que estoura numa nuvem
 * de bolhas rosa. Uma pulseira vermelha de alerta trava no pulso erguido.
 *
 * Cor: 3 matizes de base (branco-gelo da clínica, azul clínico, verde-água do
 * rapaz) + acento saturado ÂMBAR reservado ao vidro de PENICILÍN — o objeto da
 * ponte sonora. A pulseira fecha no vermelho de alerta, na mesma família quente.
 */

const ICE = '#e9edf0' // branco-gelo: piso, carrinho, vaca
const ICE_WARM = '#f4f7f9'
const CLINIC_BLUE = '#3f7fbf' // azul clínico: faixa do piso, jato, marcas
const TEAL = '#55a39c' // verde-água: tronco do rapaz
const SKIN = '#e8c39e'
const STEEL = '#9aa4ad'
const AMBER = '#e08a1e' // ACENTO: o vidro de PENICILÍN
const PINK = '#e0729a'
const ALERT = '#c94f3d'
const GY = 0.14 // topo da base do diorama

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base: sala de curativos --------------------------------------------
  const base = new THREE.Group()

  const piso = cylinder(2.6, 2.68, 0.14, ICE, { roughness: 0.22 })
  piso.position.y = 0.07
  base.add(piso)

  // faixa azul em arco, embutida no piso (anel fino + miolo do próprio piso)
  const faixaAnel = cylinder(1.92, 1.92, 0.02, CLINIC_BLUE, { roughness: 0.3 })
  faixaAnel.position.y = 0.145
  base.add(faixaAnel)
  const faixaMiolo = cylinder(1.78, 1.78, 0.03, ICE, { roughness: 0.22 })
  faixaMiolo.position.y = 0.147
  base.add(faixaMiolo)

  // carrinho de enfermagem com rodízios
  const carrinho = new THREE.Group()
  carrinho.position.set(1.5, GY, -0.35)
  carrinho.rotation.y = -0.35

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const roda = sphere(0.055, '#33383f', { roughness: 0.35, metalness: 0.6 })
      roda.position.set(sx * 0.34, 0.055, sz * 0.22)
      const haste = cylinder(0.028, 0.028, 0.07, STEEL, { roughness: 0.3, metalness: 0.7 })
      haste.position.set(sx * 0.34, 0.115, sz * 0.22)
      carrinho.add(roda, haste)
    }
  }

  const corpoCarrinho = rbox(0.86, 0.6, 0.58, 0.06, ICE_WARM, { roughness: 0.3 })
  corpoCarrinho.position.y = 0.44
  carrinho.add(corpoCarrinho)

  for (const gy of [0.3, 0.56]) {
    const puxador = rbox(0.42, 0.035, 0.03, 0.014, STEEL, { roughness: 0.3, metalness: 0.7 })
    puxador.position.set(0, gy, 0.3)
    carrinho.add(puxador)
    const risco = rbox(0.72, 0.008, 0.006, 0.003, '#c8d1d8', { roughness: 0.4 })
    risco.position.set(0, gy + 0.11, 0.292)
    carrinho.add(risco)
  }

  const tampo = rbox(0.96, 0.06, 0.66, 0.02, '#dfe6ea', { roughness: 0.25 })
  tampo.name = 'tampo'
  tampo.position.y = 0.77
  carrinho.add(tampo)

  const bandeja = rbox(0.3, 0.03, 0.22, 0.012, CLINIC_BLUE, { roughness: 0.35 })
  bandeja.position.set(-0.26, 0.815, 0.12)
  carrinho.add(bandeja)
  base.add(carrinho)

  // adereços de ambientação
  const lixeira = new THREE.Group()
  lixeira.position.set(-2.02, GY, -0.9)
  lixeira.rotation.y = rand() * Math.PI
  const cesto = lathe(
    [[0, 0], [0.17, 0], [0.185, 0.05], [0.2, 0.34], [0.21, 0.38]],
    '#cfd6db',
    { roughness: 0.35 },
  )
  const tampaLixo = cylinder(0.215, 0.205, 0.05, CLINIC_BLUE, { roughness: 0.35 })
  tampaLixo.position.y = 0.4
  lixeira.add(cesto, tampaLixo)
  base.add(lixeira)

  const banquinho = new THREE.Group()
  banquinho.position.set(-1.72, GY, 1.12)
  banquinho.rotation.y = rand() * Math.PI
  const assento = cylinder(0.23, 0.21, 0.07, TEAL, { roughness: 0.5 })
  assento.position.y = 0.44
  banquinho.add(assento)
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2
    const perna = cylinder(0.024, 0.03, 0.44, STEEL, { roughness: 0.3, metalness: 0.7 })
    perna.position.set(Math.cos(a) * 0.14, 0.22, Math.sin(a) * 0.14)
    perna.rotation.set(-Math.sin(a) * 0.12, 0, Math.cos(a) * 0.12)
    banquinho.add(perna)
  }
  base.add(banquinho)

  for (const [rx, rz] of [[0.35, 1.62], [-0.55, -1.78]] as const) {
    const gaze = cylinder(0.09, 0.09, 0.15, '#f2ede2', { roughness: 0.9 })
    gaze.position.set(rx, GY + 0.09, rz)
    gaze.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
    const miolo = cylinder(0.03, 0.03, 0.16, '#d9d2c2', { roughness: 0.9 })
    gaze.add(miolo)
    base.add(gaze)
  }
  root.add(base)

  // ---- rapaz de braço erguido ---------------------------------------------
  const rapaz = person({ body: TEAL, skin: SKIN, height: 1.5, armAngle: 0.35 })
  rapaz.position.set(-0.95, GY, 0.15)
  rapaz.rotation.y = 1.0 // olha para a seringa (olhos em +z local)

  // colarinho de camisola de exame
  const colarinho = cylinder(0.2, 0.22, 0.07, '#cfe3e0', { roughness: 0.9 })
  colarinho.position.y = 0.75
  rapaz.add(colarinho)

  // braço direito repivotado no OMBRO, para erguer de verdade
  const armR = rapaz.getObjectByName('armR') as THREE.Object3D
  const braco = new THREE.Group()
  braco.position.set(armR.position.x, armR.position.y + 0.195, armR.position.z)
  rapaz.remove(armR)
  armR.position.set(0, -0.195, 0)
  armR.rotation.set(0, 0, 0)
  braco.add(armR)
  braco.rotation.z = 2.75 // pose final: braço no alto
  rapaz.add(braco)
  root.add(rapaz)

  // ---- seringa gigante na diagonal ----------------------------------------
  // eixo local +y = do êmbolo para a agulha; a rotação aponta a agulha na cara
  const seringa = new THREE.Group()
  seringa.position.set(1.363, 1.6681, 0.7738) // pose final (já desferida)
  seringa.rotation.set(0, -0.2631, 1.7795)

  const emboloPad = cylinder(0.155, 0.155, 0.05, ICE_WARM, { roughness: 0.35 })
  emboloPad.position.y = -0.3
  const haste = cylinder(0.033, 0.033, 0.36, ICE_WARM, { roughness: 0.35 })
  haste.position.y = -0.11
  const flange = cylinder(0.25, 0.25, 0.05, ICE_WARM, { roughness: 0.35 })
  flange.position.y = 0.06
  seringa.add(emboloPad, haste, flange)

  const cilindro = cylinder(0.17, 0.17, 0.89, '#eef4f8', { roughness: 0.12 })
  cilindro.position.y = 0.505
  seringa.add(cilindro)
  for (const gy of [0.28, 0.46, 0.64, 0.82]) {
    const marca = cylinder(0.174, 0.174, 0.012, CLINIC_BLUE, { roughness: 0.3 })
    marca.position.y = gy
    seringa.add(marca)
  }

  const bico = lathe(
    [[0.17, 0], [0.17, 0.03], [0.07, 0.15], [0.06, 0.21]],
    STEEL,
    { roughness: 0.25, metalness: 0.8 },
  )
  bico.position.y = 0.95
  seringa.add(bico)

  const agulha = cylinder(0.016, 0.026, 0.38, '#c6ccd2', { roughness: 0.2, metalness: 0.9 })
  agulha.position.y = 1.33
  const ponta = cone(0.016, 0.06, '#c6ccd2', { roughness: 0.2, metalness: 0.9 })
  ponta.position.y = 1.55
  seringa.add(agulha, ponta)
  root.add(seringa)

  // ---- jato GUISK: 5 esferas azuis em arco --------------------------------
  const jato = new THREE.Group()
  jato.position.set(-0.1011, 1.3468, 0.3793) // ponta da agulha, pós-golpe
  const dir = new THREE.Vector3(-0.9446, -0.2073, -0.2545)
  const lado = new THREE.Vector3(0, 1, 0).cross(dir).normalize()
  const gotas: [number, number][] = [
    [0.13, 0.075], [0.24, 0.068], [0.35, 0.062], [0.46, 0.054], [0.55, 0.095],
  ]
  for (const [t, r] of gotas) {
    const gota = sphere(r, CLINIC_BLUE, { roughness: 0.12 })
    gota.position
      .copy(dir).multiplyScalar(t)
      .addScaledVector(lado, Math.sin(t * 5.2) * 0.055)
      .add(new THREE.Vector3(0, Math.sin(t * 3.4) * 0.05, 0))
    gota.scale.set(1, 0.9, 1)
    jato.add(gota)
  }
  root.add(jato)

  // ---- vidro âmbar de penicilina (ACENTO) ---------------------------------
  const vidro = new THREE.Group()
  vidro.position.set(1.426, 1.02, -0.363) // pose final: já tombado pela cabeçada
  vidro.rotation.y = -0.4914 // o tombo cai na direção do empurrão da vaca
  vidro.rotation.z = -0.55

  const frasco = lathe(
    [
      [0, 0], [0.115, 0], [0.125, 0.05], [0.125, 0.28],
      [0.1, 0.33], [0.072, 0.36], [0.072, 0.42], [0, 0.42],
    ],
    AMBER,
    { roughness: 0.15 },
  )
  const rotulo = cylinder(0.128, 0.128, 0.13, '#f6efdf', { roughness: 0.8 })
  rotulo.position.y = 0.16
  const rotuloRisco = cylinder(0.129, 0.129, 0.02, ALERT, { roughness: 0.7 })
  rotuloRisco.position.y = 0.2
  const tampaMetal = cylinder(0.085, 0.085, 0.07, '#c9ced4', { roughness: 0.2, metalness: 0.9 })
  tampaMetal.position.y = 0.45
  const lacre = cylinder(0.076, 0.076, 0.03, '#adb4bb', { roughness: 0.25, metalness: 0.8 })
  lacre.position.y = 0.4
  vidro.add(frasco, rotulo, rotuloRisco, lacre, tampaMetal)
  root.add(vidro)

  // ---- vaca-enfermeira -----------------------------------------------------
  const vaca = new THREE.Group()
  vaca.position.set(0.05, GY, -1.1)
  vaca.rotation.y = 1.0793 // encara o vidro no carrinho

  const tronco = capsule(0.31, 0.5, ICE, { roughness: 0.85 })
  tronco.rotation.x = Math.PI / 2
  tronco.position.y = 0.75
  vaca.add(tronco)

  // manchas: esferas achatadas coladas na superfície do tronco
  const manchas: [number, number, number][] = [
    [0.62, 0.16, 0.14], [-1.15, -0.2, 0.11], [0.35, 0.36, 0.09], [-0.55, -0.42, 0.1],
  ]
  for (const [ang, mz, mr] of manchas) {
    const mancha = sphere(mr, '#2f2b28', { roughness: 0.85 })
    mancha.position.set(Math.sin(ang) * 0.29, 0.75 + Math.cos(ang) * 0.29, mz)
    mancha.lookAt(0, 0.75, mz)
    mancha.scale.set(1, 0.85, 0.45)
    vaca.add(mancha)
  }

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const perna = capsule(0.075, 0.36, ICE, { roughness: 0.85 })
      perna.position.set(sx * 0.19, 0.3, sz * 0.32)
      const casco = cylinder(0.082, 0.075, 0.08, '#3a332e', { roughness: 0.6 })
      casco.position.y = -0.22
      perna.add(casco)
      vaca.add(perna)
    }
  }

  const rabo = capsule(0.032, 0.32, ICE, { roughness: 0.85 })
  rabo.position.set(0, 0.66, -0.6)
  rabo.rotation.x = 0.35
  const tufo = sphere(0.065, '#2f2b28', { roughness: 0.9 })
  tufo.position.y = -0.2
  rabo.add(tufo)
  vaca.add(rabo)

  // cabeça: telescopa do tronco e depois baixa os chifres (MUT!)
  // pescoço: liga o tronco à cabeça erguida sobre o carrinho
  const pescoco = capsule(0.15, 0.12, ICE, { roughness: 0.85 })
  pescoco.position.set(0, 0.98, 0.42)
  pescoco.rotation.x = 0.79
  vaca.add(pescoco)

  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.14, 0.62) // alta o bastante para passar sobre o tampo

  const cranio = sphere(0.2, ICE, { roughness: 0.85 })
  cranio.scale.set(1, 0.95, 1.15)
  cabeca.add(cranio)

  const focinho = rbox(0.25, 0.18, 0.2, 0.08, '#efb6bd', { roughness: 0.7 })
  focinho.name = 'focinho'
  focinho.position.set(0, -0.07, 0.22)
  cabeca.add(focinho)
  for (const sx of [-1, 1]) {
    const narina = sphere(0.026, '#7d4a52', { roughness: 0.6 })
    narina.position.set(sx * 0.06, -0.05, 0.31)
    cabeca.add(narina)

    const olho = sphere(0.05, '#ffffff', { roughness: 0.25 })
    olho.position.set(sx * 0.105, 0.07, 0.16)
    olho.scale.z = 0.6
    const pupila = sphere(0.025, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(sx * 0.108, 0.07, 0.2)
    cabeca.add(olho, pupila)

    const orelha = capsule(0.05, 0.1, ICE, { roughness: 0.85 })
    orelha.position.set(sx * 0.23, 0.08, -0.02)
    orelha.rotation.z = -sx * 0.95
    orelha.scale.z = 0.6
    cabeca.add(orelha)

    const chifre = cone(0.048, 0.24, '#e8dcc0', { roughness: 0.45 })
    chifre.name = 'chifre'
    chifre.position.set(sx * 0.15, 0.2, 0.02)
    chifre.rotation.set(-0.2, 0, -sx * 0.6)
    cabeca.add(chifre)
  }

  const touca = lathe(
    [[0, 0], [0.13, 0], [0.15, 0.04], [0.13, 0.1], [0.06, 0.135], [0, 0.14]],
    '#ffffff',
    { roughness: 0.85 },
  )
  touca.position.set(0, 0.16, 0.02)
  touca.rotation.x = -0.15
  cabeca.add(touca)
  for (const [cw, cd] of [[0.09, 0.028], [0.028, 0.09]] as const) {
    const cruz = rbox(cw, 0.014, cd, 0.005, ALERT, { roughness: 0.6 })
    cruz.position.set(0, 0.3, 0.09)
    cruz.rotation.x = -0.15
    cabeca.add(cruz)
  }
  vaca.add(cabeca)
  root.add(vaca)

  // ---- seis bolhas rosa ----------------------------------------------------
  const bolhas = new THREE.Group()
  bolhas.position.set(1.65, 1.434, -0.243) // boca do frasco já tombado
  for (let i = 0; i < 6; i++) {
    const r = 0.075 + rand() * 0.075
    const bolha = sphere(r, PINK, { roughness: 0.1 })
    const a = rand() * Math.PI * 2
    const b = (rand() - 0.5) * 1.4
    const d = 0.1 + rand() * 0.26
    bolha.position.set(
      Math.cos(a) * Math.cos(b) * d,
      Math.sin(b) * d * 0.9 + 0.08,
      Math.sin(a) * Math.cos(b) * d,
    )
    const brilho = sphere(r * 0.28, '#ffe2ee', { roughness: 0.05 })
    brilho.position.set(r * 0.45, r * 0.5, r * 0.5)
    bolha.add(brilho)
    bolhas.add(bolha)
  }
  root.add(bolhas)

  // ---- pulseira de alerta no pulso erguido --------------------------------
  const pulseira = new THREE.Group()
  pulseira.position.set(-0.717, 1.151, -0.212)
  pulseira.rotation.y = 1.0
  const inclina = new THREE.Group()
  inclina.rotation.z = -0.3916 // eixo do anel alinhado com o braço erguido
  const anel = torus(0.135, 0.035, ALERT, { roughness: 0.45 })
  anel.rotation.x = Math.PI / 2 // eixo do anel sobe em +y local
  inclina.add(anel)
  const placa = rbox(0.13, 0.07, 0.03, 0.012, '#f3ece0', { roughness: 0.6 })
  placa.position.set(0, 0, 0.14)
  const linha = rbox(0.08, 0.014, 0.012, 0.005, ALERT, { roughness: 0.6 })
  linha.position.z = 0.018
  placa.add(linha)
  inclina.add(placa)
  pulseira.add(inclina)
  root.add(pulseira)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'clinica', object: base },
    { name: 'rapaz', group: 'rapaz', object: rapaz },
    { name: 'braco', group: 'rapaz', object: braco },
    { name: 'seringa', group: 'seringa', object: seringa },
    { name: 'jato', group: 'seringa', object: jato },
    { name: 'vidro', group: 'vaca', object: vidro },
    { name: 'vaca', group: 'vaca', object: vaca },
    { name: 'cabeca', group: 'vaca', object: cabeca },
    { name: 'bolhas', group: 'vaca', object: bolhas },
    { name: 'pulseira', group: 'alerta', object: pulseira },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.9, [riseFrom(0, 1.15)], {
      ease: 'easeOut',
      caption: 'Sala de curativos: piso branco-gelo, faixa azul, carrinho de enfermagem.',
    }),

    seq('rapaz-rise', 'rapaz', 2.0, 0.9, [riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: 'Você levanta o braço e mal começa o A-LÉR… — a força cai bem no LÉR.',
    }),
    seq('braco-up', 'braco', 2.2, 0.8, [ch('rotation.z', 0.35, 2.75)], { ease: 'easeOut' }),

    seq('seringa-rise', 'seringa', 4.0, 0.85, [riseFrom(1.7013, 2.2)], {
      ease: 'easeOut',
      caption: '…quando a seringa gigante já te esguicha na cara: GUISK! (G duro, uma sílaba só)',
    }),
    seq(
      'seringa-golpe',
      'seringa',
      5.1,
      0.45,
      [
        ch('position.x', 1.5141, 1.363),
        ch('position.y', 1.7013, 1.6681),
        ch('position.z', 0.8145, 0.7738),
      ],
      { ease: 'easeIn' },
    ),
    seq(
      'jato-guisk',
      'jato',
      5.45,
      0.5,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('vidro-rise', 'vidro', 6.7, 0.7, [ch('position.y', 0.32, 0.94)], { ease: 'easeOut' }),
    seq('vaca-rise', 'vaca', 6.85, 0.9, [riseFrom(GY, 1.75)], {
      ease: 'easeOut',
      caption:
        'A vaca-enfermeira baixa os chifres e mete uma cabeçada MUT, contra!, no vidro de PENICILÍN…',
    }),
    seq('cabeca-out', 'cabeca', 7.0, 0.7, [ch('position.z', 0.25, 0.62)], { ease: 'easeOut' }),

    seq(
      'vaca-cabecada',
      'vaca',
      8.6,
      0.4,
      [ch('position.x', 0.05, 0.4909), ch('position.z', -1.1, -0.8641)],
      { ease: 'easeIn' },
    ),
    seq('cabeca-baixa', 'cabeca', 8.6, 0.4, [ch('rotation.x', 0, 0.6)], { ease: 'easeIn' }),
    seq(
      'vidro-tomba',
      'vidro',
      8.95,
      0.45,
      [
        ch('position.x', 1.32, 1.426),
        ch('position.y', 0.94, 1.02),
        ch('position.z', -0.42, -0.363),
        ch('rotation.z', 0, -0.55),
      ],
      { ease: 'easeOut' },
    ),
    seq(
      'bolhas-estouram',
      'bolhas',
      9.1,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut', caption: '…que estoura numa nuvem de bolhas rosa.' },
    ),
    seq(
      'vaca-recua',
      'vaca',
      9.4,
      0.6,
      [ch('position.x', 0.4909, 0.05), ch('position.z', -0.8641, -1.1)],
      { ease: 'easeOut' },
    ),
    seq('cabeca-ergue', 'cabeca', 9.4, 0.6, [ch('rotation.x', 0.6, 0)], { ease: 'easeOut' }),

    seq(
      'pulseira-desce',
      'pulseira',
      10.3,
      0.7,
      [
        ch('position.y', 1.43, 1.19),
        ch('scale.x', 0.01, 1.25),
        ch('scale.y', 0.01, 1.25),
        ch('scale.z', 0.01, 1.25),
      ],
      {
        ease: 'easeOut',
        caption:
          'Uma pulseira vermelha de alerta trava no seu pulso erguido: Jag är allergisk mot penicillin.',
      },
    ),
    seq(
      'pulseira-trava',
      'pulseira',
      11.0,
      0.4,
      [
        ch('position.y', 1.19, 1.151),
        ch('scale.x', 1.25, 1),
        ch('scale.y', 1.25, 1),
        ch('scale.z', 1.25, 1),
      ],
      { ease: 'easeIn' },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.9, 3.0, 6.4], target: [0.05, 1.05, -0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-allergisk-mot-penicillin',
    contexto:
      'Perguntam isso em toda consulta e no balcão do apotek antes de entregar remédio.',
    fraseFonte: 'Sou alérgico a penicilina.',
    fraseAlvo: 'Jag är allergisk mot penicillin.',
    pronuncia:
      "iá é a-ler-GUÍSK mut pe-ni-si-LÍN ('g' duro em 'allergisk'; 'mot' com o = u; tônica no fim de 'penicillin')",
    ponteSonora:
      "IÁ É A-LÉR-GUISK, MUT PENICILÍN! (10 sílabas; a tônica de 'allergisk' cai no LÉR, como em 'energisk' — nunca 'aler-GUÍSK'; GUISK com G DURO de 'guitarra', jamais 'jisk', tudo numa sílaba só — é o esguicho da seringa; MUT = 'mot' com O soando U FECHADO e T seco; PENICILÍN com tônica no FIM, sem o -a)",
    historia:
      'Você levanta o braço e mal começa o A-LÉR… — a força cai bem no LÉR — quando a seringa gigante já te esguicha na cara: GUISK! Aí a vaca-enfermeira baixa os chifres e mete uma cabeçada MUT, contra!, no vidro de PENICILÍN, que estoura numa nuvem de bolhas rosa. Uma pulseira vermelha de alerta desce do teto e trava sozinha no seu pulso erguido.',
  },
  createScene,
}

export default card
