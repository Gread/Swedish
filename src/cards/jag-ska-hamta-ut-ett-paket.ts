import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  person, rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
  rng, seq, ch, riseFrom,
} from '../rig/helpers'

/**
 * jag-ska-hamta-ut-ett-paket — "Jag ska hämta ut ett paket."
 * IÁ, ESCARRA EM TATU — ETE PACOTE! O tatu atendente do postombud recebe
 * o escarro na carapaça e libera o pacote com um ET dentro.
 *
 * Paleta: creme quente (piso/tampo) · vermelho ICA temperado #c23b30 (balcão)
 * · cinza-azulado (tatu/estante). Acento saturado RESERVADO: teal #35e0b0
 * do escarro (a "senha" nojenta do balcão).
 */
function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(11)

  // ---------- BASE do diorama: piso ladrilhado do ICA + adereços ----------
  const base = new THREE.Group()
  const disco = cylinder(2.5, 2.6, 0.16, '#d6d0c0', { roughness: 0.9 })
  disco.position.y = 0.08
  base.add(disco)

  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = -3; iz <= 3; iz++) {
      const x = ix * 0.62
      const z = iz * 0.62
      if (Math.hypot(x, z) > 2.0) continue
      if (rand() < 0.08) continue
      const cor = (ix + iz) % 2 === 0 ? '#eae5d8' : '#d3cdbd'
      const tile = rbox(0.54, 0.03, 0.54, 0.012, cor, { roughness: 0.85 })
      tile.position.set(x, 0.175, z)
      base.add(tile)
    }
  }

  // adereço 1: pilha de encomendas esperando retirada
  const pilha = new THREE.Group()
  const pacoteBaixo = rbox(0.42, 0.3, 0.34, 0.03, '#a97f52', { roughness: 0.8 })
  pacoteBaixo.position.y = 0.34
  pilha.add(pacoteBaixo)
  const fitaBaixo = rbox(0.09, 0.31, 0.35, 0.01, '#e6d3a3', { roughness: 0.6 })
  fitaBaixo.position.set(0.04, 0.34, 0)
  pilha.add(fitaBaixo)
  const pacoteCima = rbox(0.32, 0.24, 0.27, 0.03, '#c19467', { roughness: 0.8 })
  pacoteCima.position.y = 0.61
  pacoteCima.rotation.y = 0.45
  pilha.add(pacoteCima)
  pilha.position.set(-1.75, 0, 0.55)
  pilha.rotation.y = -0.25
  base.add(pilha)

  // adereço 2: vaso de planta da lojinha (lathe + puff)
  const planta = new THREE.Group()
  const vaso = lathe(
    [[0, 0], [0.14, 0], [0.17, 0.05], [0.19, 0.24], [0.145, 0.26], [0, 0.26]],
    '#a5654a', { roughness: 0.85 },
  )
  vaso.position.y = 0.17
  planta.add(vaso)
  const folhagem = puff(0.24, '#4a8f3c', 6, 31, { roughness: 0.9 })
  folhagem.position.y = 0.6
  planta.add(folhagem)
  planta.position.set(1.8, 0, -1.45)
  base.add(planta)

  // adereço 3: cone de sinalização da fila
  const coneFila = new THREE.Group()
  const coneCorpo = cone(0.15, 0.34, '#d8a13f', { roughness: 0.75 })
  coneCorpo.position.y = 0.35
  coneFila.add(coneCorpo)
  const coneFaixa = torus(0.105, 0.022, '#f2efe7', { roughness: 0.6 })
  coneFaixa.rotation.x = Math.PI / 2
  coneFaixa.position.y = 0.33
  coneFila.add(coneFaixa)
  coneFila.position.set(-1.45, 0, 1.25)
  base.add(coneFila)

  // adereço 4: florzinha perdida do buquê de alguém
  const flor = new THREE.Group()
  const caule = cylinder(0.018, 0.022, 0.22, '#5f9e4a', { roughness: 0.8 })
  caule.position.y = 0.29
  flor.add(caule)
  const petala = sphere(0.055, '#c95f8a', { roughness: 0.6 })
  petala.position.y = 0.42
  flor.add(petala)
  flor.position.set(1.55, 0, 1.35)
  flor.rotation.z = 0.15
  base.add(flor)

  root.add(base)

  // ---------- BALCÃO vermelho do postombud + estante de pacotes ----------
  const balcao = new THREE.Group()
  const balcaoCorpo = rbox(2.3, 0.8, 0.8, 0.06, '#c23b30', { roughness: 0.6 })
  balcaoCorpo.position.set(0, 0.4, 0.02)
  balcao.add(balcaoCorpo)
  const friso = rbox(2.34, 0.1, 0.05, 0.015, '#f2efe7', { roughness: 0.45 })
  friso.position.set(0, 0.62, 0.42)
  balcao.add(friso)
  const tampo = rbox(2.5, 0.1, 1.0, 0.04, '#f4f0e6', { roughness: 0.35 })
  tampo.position.set(0, 0.85, 0)
  balcao.add(tampo)

  // placa redonda da loja na frente do balcão
  const placa = cylinder(0.17, 0.17, 0.035, '#f2efe7', { roughness: 0.3 })
  placa.rotation.x = Math.PI / 2
  placa.position.set(-0.72, 0.32, 0.43)
  balcao.add(placa)
  const placaFaixa = rbox(0.2, 0.07, 0.02, 0.01, '#c23b30', { roughness: 0.5 })
  placaFaixa.position.set(-0.72, 0.32, 0.45)
  balcao.add(placaFaixa)

  // leitor de QR sobre o tampo
  const leitor = new THREE.Group()
  const leitorCorpo = rbox(0.3, 0.18, 0.24, 0.03, '#3d4852', { roughness: 0.4 })
  leitorCorpo.position.y = 0.09
  leitor.add(leitorCorpo)
  const leitorTela = rbox(0.24, 0.16, 0.04, 0.012, '#ffe3ae', {
    roughness: 0.25, emissive: '#ffd9a0', emissiveIntensity: 0.9,
  })
  leitorTela.position.set(0, 0.22, 0.03)
  leitorTela.rotation.x = -0.35
  leitor.add(leitorTela)
  leitor.position.set(0.98, 0.9, 0.2) // na ponta do cliente
  leitor.rotation.y = -0.9
  balcao.add(leitor)

  // estante de encomendas atrás do balcão
  for (const lado of [-1, 1]) {
    const poste = rbox(0.08, 1.55, 0.08, 0.02, '#6f7a88', { roughness: 0.55 })
    poste.position.set(lado * 0.95, 0.775, -1.45)
    balcao.add(poste)
  }
  for (const py of [0.7, 1.25]) {
    const prateleira = rbox(2.0, 0.06, 0.5, 0.02, '#8b95a3', { roughness: 0.5 })
    prateleira.position.set(0, py, -1.45)
    balcao.add(prateleira)
    const cores = ['#b08050', '#a06f45', '#c19467', '#8f6a48']
    for (let i = 0; i < 3; i++) {
      const w = 0.24 + rand() * 0.14
      const h = 0.18 + rand() * 0.12
      const enc = rbox(w, h, 0.3, 0.025, cores[Math.floor(rand() * cores.length)], { roughness: 0.8 })
      enc.position.set(-0.6 + i * 0.6 + (rand() - 0.5) * 0.12, py + 0.03 + h / 2, -1.45)
      enc.rotation.y = (rand() - 0.5) * 0.5
      balcao.add(enc)
    }
  }

  balcao.position.set(0, 0.19, -0.55)
  root.add(balcao)

  // ---------- VOCÊ: cliente de gorro na ponta do balcão, de perfil ----------
  const cliente = person({ body: '#4a7d9e', skin: '#e8c39e', height: 1.8, armAngle: 0.4 })
  cliente.rotation.order = 'YXZ' // rotation.x = inclinar o tronco (inspira/escarra)
  const cabecaCliente = cliente.getObjectByName('head')!
  const gorro = lathe(
    [[0, 0], [0.3, 0], [0.31, 0.1], [0.25, 0.2], [0.12, 0.26], [0, 0.28]],
    '#d8a13f', { roughness: 0.85 },
  )
  gorro.scale.setScalar(1.2)
  gorro.position.y = 0.1
  cabecaCliente.add(gorro)
  const barra = torus(0.35, 0.045, '#c08a2e', { roughness: 0.9 }) // barra dobrada do gorro
  barra.rotation.x = Math.PI / 2
  barra.position.y = 0.13
  cabecaCliente.add(barra)
  const pompom = puff(0.075, '#f2efe7', 5, 7, { roughness: 0.95 })
  pompom.position.y = 0.46
  cabecaCliente.add(pompom)
  const bracoDir = cliente.getObjectByName('armR')!
  bracoDir.rotation.x = -1.45 // apontando para o tatu, indignado
  bracoDir.rotation.z = -0.15
  cliente.position.set(1.85, 0.19, -0.3)
  cliente.rotation.y = -1.9 // encarando o atendente, de perfil para a câmera
  root.add(cliente)

  // ---------- o TATU atendente: carapaça bandada de perfil, patas no tampo ----------
  // modelado com o eixo longo em z (cabeça em +z) e girado para olhar o cliente (+x)
  const pele = '#c4a596'
  const casco = '#99a1b0'
  const tatuCorpo = new THREE.Group()
  const [ax, ay, az] = [0.527, 0.558, 0.806] // semi-eixos da carapaça
  const carapaca = sphere(1, casco, { roughness: 0.6 })
  carapaca.scale.set(ax, ay, az)
  tatuCorpo.add(carapaca)
  // escudos de ombro e quadril um tom mais claro, cinturão de bandas no meio
  for (const [sz, tom] of [[0.5, '#a7aebb'], [-0.5, '#a7aebb']] as const) {
    const k = Math.sqrt(1 - (sz / az) ** 2)
    const escudo = sphere(1, tom, { roughness: 0.6 })
    escudo.scale.set(ax * k * 1.03, ay * k * 1.03, 0.3)
    escudo.position.z = sz
    tatuCorpo.add(escudo)
  }
  for (const bz of [-0.3, -0.15, 0, 0.15, 0.3]) {
    const k = Math.sqrt(1 - (bz / az) ** 2)
    const banda = torus(ay * k, 0.03, '#7d8595', { roughness: 0.65 })
    banda.scale.set(ax / ay, 1, 1)
    banda.position.z = bz
    tatuCorpo.add(banda)
  }
  const rabo = cone(0.09, 0.6, '#8e97a6', { roughness: 0.65 })
  rabo.rotation.x = -1.9
  rabo.position.set(0, -0.12, -0.98)
  tatuCorpo.add(rabo)
  // patas dianteiras apoiadas no tampo, com garras creme
  for (const [lx, lz] of [[-0.62, 0.4], [-0.58, 0.68]] as const) {
    const pata = capsule(0.065, 0.26, pele, { roughness: 0.7 })
    pata.rotation.z = Math.PI / 2
    pata.position.set(lx, -0.06, lz)
    tatuCorpo.add(pata)
    for (const dz of [-0.045, 0, 0.045]) {
      const garra = cone(0.018, 0.08, '#efe6d2', { roughness: 0.4 })
      garra.rotation.z = Math.PI / 2
      garra.position.set(lx - 0.22, -0.08, lz + dz)
      tatuCorpo.add(garra)
    }
  }
  tatuCorpo.position.set(-0.1, 1.25, -1.25) // atrás do balcão, casco bem acima do tampo
  tatuCorpo.rotation.y = Math.PI / 2
  root.add(tatuCorpo)

  // crachá preso no ombro do tatu (peça rígida, fora da pele do Blender)
  const cracha = new THREE.Group()
  const crachaPlaca = rbox(0.2, 0.25, 0.03, 0.012, '#f5f2ea', { roughness: 0.35 })
  cracha.add(crachaPlaca)
  const crachaFaixa = rbox(0.2, 0.06, 0.012, 0.006, '#4a6fa5', { roughness: 0.4 })
  crachaFaixa.position.set(0, 0.095, 0.017)
  cracha.add(crachaFaixa)
  const crachaFoto = rbox(0.07, 0.08, 0.01, 0.004, '#b8a89a', { roughness: 0.5 })
  crachaFoto.position.set(-0.05, -0.02, 0.018)
  cracha.add(crachaFoto)
  for (const ly of [0.0, -0.05]) {
    const linha = rbox(0.07, 0.014, 0.01, 0.003, '#8b95a3', { roughness: 0.5 })
    linha.position.set(0.045, ly, 0.018)
    cracha.add(linha)
  }
  cracha.rotation.order = 'YXZ'
  cracha.rotation.set(-0.48, 0.47, 0)
  cracha.position.set(0.36, 1.51, -0.86)
  root.add(cracha)

  // ---------- a cabeça do tatu: focinho longo, escudo na testa, orelhas ovais ----------
  const tatuCabeca = new THREE.Group()
  const cranioTatu = sphere(0.16, pele, { roughness: 0.7 })
  cranioTatu.scale.set(0.95, 0.9, 1.1)
  cranioTatu.position.set(0, 0.02, -0.05)
  tatuCabeca.add(cranioTatu)
  const elmo = sphere(0.15, '#8e97a6', { roughness: 0.6 }) // escudo cefálico
  elmo.scale.set(0.95, 0.45, 1.35)
  elmo.position.set(0, 0.11, 0.03)
  tatuCabeca.add(elmo)
  const focinho = cylinder(0.04, 0.085, 0.3, pele, { roughness: 0.7 })
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.03, 0.22)
  tatuCabeca.add(focinho)
  const nariz = sphere(0.045, '#6e4b45', { roughness: 0.45 })
  nariz.scale.set(1.1, 0.9, 0.6)
  nariz.position.set(0, -0.03, 0.38)
  tatuCabeca.add(nariz)
  const pescocoTatu = capsule(0.1, 0.18, pele, { roughness: 0.7 })
  pescocoTatu.rotation.x = 0.9
  pescocoTatu.position.set(0, -0.12, -0.16)
  tatuCabeca.add(pescocoTatu)
  for (const lado of [-1, 1]) {
    const olho = sphere(0.04, '#ffffff', { roughness: 0.25 })
    olho.position.set(lado * 0.11, 0.06, 0.07)
    olho.scale.z = 0.6
    const pupila = sphere(0.024, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(lado * 0.118, 0.06, 0.095)
    tatuCabeca.add(olho, pupila)
    const orelha = sphere(0.09, '#b0968a', { roughness: 0.7 })
    orelha.scale.set(0.3, 1.0, 0.65)
    orelha.position.set(lado * 0.1, 0.23, -0.14)
    orelha.rotation.z = -lado * 0.35
    tatuCabeca.add(orelha)
  }
  tatuCabeca.rotation.order = 'YXZ' // rotation.x = erguer o focinho (susto)
  tatuCabeca.rotation.y = 1.15 // focinho virado para o cliente
  tatuCabeca.position.set(0.85, 1.42, -1.0)
  root.add(tatuCabeca)

  // ---------- o ESCARRO teal — acento da cena (pose final: espatifado na carapaça) ----------
  const escarro = new THREE.Group()
  const gosma = sphere(0.16, '#35e0b0', { roughness: 0.15 })
  escarro.add(gosma)
  for (const [gx, gy, gz, gr] of [
    [0.17, 0.08, 0.08, 0.06], [-0.14, 0.13, 0.06, 0.05], [0.05, -0.17, 0.1, 0.055],
    [-0.19, -0.08, 0.05, 0.04], [0.21, -0.12, 0.04, 0.035],
  ] as const) {
    const gota = sphere(gr, '#35e0b0', { roughness: 0.15 })
    gota.position.set(gx, gy, gz)
    escarro.add(gota)
  }
  escarro.position.set(-0.1, 1.65, -0.86)
  escarro.rotation.x = -0.74 // achatado rente à superfície do casco
  escarro.scale.set(1.4, 1.4, 0.35)
  root.add(escarro)

  // ---------- o PACOTE liberado sobre o tampo ----------
  const pacote = new THREE.Group()
  const caixa = rbox(0.72, 0.55, 0.55, 0.04, '#b08050', { roughness: 0.75 })
  pacote.add(caixa)
  const fita = rbox(0.15, 0.56, 0.56, 0.012, '#e6d3a3', { roughness: 0.55 })
  fita.position.x = -0.06
  pacote.add(fita)
  const etiqueta = rbox(0.2, 0.2, 0.02, 0.008, '#f5f2ea', { roughness: 0.35 })
  etiqueta.position.set(0.17, -0.02, 0.27)
  pacote.add(etiqueta)
  const qr = rbox(0.13, 0.13, 0.014, 0.005, '#22262c', { roughness: 0.4 })
  qr.position.set(0.17, -0.02, 0.283)
  pacote.add(qr)
  for (const [qx, qy] of [[0.135, 0.015], [0.205, -0.05]] as const) {
    const pixel = rbox(0.032, 0.032, 0.016, 0.004, '#f5f2ea', { roughness: 0.35 })
    pixel.position.set(qx, qy, 0.284)
    pacote.add(pixel)
  }
  pacote.position.set(-0.8, 1.37, -0.5) // apoiado no tampo (topo do balcão y=1.09)
  root.add(pacote)

  // ---------- a TAMPA do pacote (dobradiça na aresta de trás) ----------
  const tampa = new THREE.Group()
  const tampaAba = rbox(0.74, 0.05, 0.58, 0.02, '#a97f52', { roughness: 0.75 })
  tampaAba.position.set(0, 0.025, 0.29)
  tampa.add(tampaAba)
  const tampaFita = rbox(0.15, 0.06, 0.58, 0.01, '#e6d3a3', { roughness: 0.55 })
  tampaFita.position.set(-0.06, 0.03, 0.29)
  tampa.add(tampaFita)
  tampa.position.set(-0.8, 1.645, -0.775) // pivô na aresta traseira da caixa
  tampa.rotation.x = -2.2 // pose final: escancarada para trás
  root.add(tampa)

  // ---------- a cabeça do ET espiando de dentro do pacote ----------
  const etCabeca = new THREE.Group()
  const cranioEt = sphere(0.21, '#7cc45e', { roughness: 0.55 })
  cranioEt.scale.set(1.0, 1.18, 0.95)
  etCabeca.add(cranioEt)
  const pescoco = capsule(0.055, 0.16, '#6fb050', { roughness: 0.55 })
  pescoco.position.y = -0.26
  etCabeca.add(pescoco)
  for (const lado of [-1, 1]) {
    const olho = sphere(0.062, '#ffffff', { roughness: 0.25 })
    olho.position.set(lado * 0.09, 0.05, 0.17)
    olho.scale.z = 0.5
    const pupila = sphere(0.052, '#1a1a1a', { roughness: 0.15 })
    pupila.position.set(lado * 0.09, 0.05, 0.19)
    const brilho = sphere(0.016, '#ffffff', { roughness: 0.1 })
    brilho.position.set(lado * 0.11, 0.09, 0.235)
    etCabeca.add(olho, pupila, brilho)
  }
  etCabeca.position.set(-0.8, 1.78, -0.5) // espiando por cima da borda da caixa
  etCabeca.rotation.y = 0.3
  root.add(etCabeca)

  // ---------- a mãozinha do ET acenando, dedo aceso ----------
  const etMaozinha = new THREE.Group()
  const bracoEt = capsule(0.045, 0.26, '#7cc45e', { roughness: 0.55 })
  bracoEt.position.y = 0.16
  etMaozinha.add(bracoEt)
  const maoEt = sphere(0.07, '#8fd76a', { roughness: 0.55 })
  maoEt.position.y = 0.33
  etMaozinha.add(maoEt)
  const dedo = capsule(0.022, 0.1, '#8fd76a', { roughness: 0.55 })
  dedo.position.set(0.035, 0.43, 0.02)
  dedo.rotation.z = -0.3
  etMaozinha.add(dedo)
  const pontaDedo = sphere(0.032, '#ffc37a', {
    roughness: 0.3, emissive: '#ffb26b', emissiveIntensity: 1.3,
  })
  pontaDedo.position.set(0.055, 0.49, 0.025)
  etMaozinha.add(pontaDedo)
  etMaozinha.position.set(-0.47, 1.62, -0.45) // pivô na borda direita da caixa
  etMaozinha.rotation.z = -0.3 // pose final: inclinada para fora, em pleno aceno
  root.add(etMaozinha)

  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'cliente', group: 'cenario', object: cliente },
    { name: 'tatu-corpo', group: 'tatu', object: tatuCorpo },
    { name: 'cracha', group: 'tatu', object: cracha },
    { name: 'tatu-cabeca', group: 'tatu', object: tatuCabeca },
    { name: 'escarro', group: 'escarro', object: escarro },
    { name: 'pacote', group: 'pacote', object: pacote },
    { name: 'tampa', group: 'pacote', object: tampa },
    { name: 'et-cabeca', group: 'et', object: etCabeca },
    { name: 'et-maozinha', group: 'et', object: etMaozinha },
  ]

  const build = [
    // ---- cenário: piso, balcão vermelho, você na fila ----
    seq('base-rise', 'base', 0, 0.7, [riseFrom(0, 1.2)], {
      caption: 'Você chega ao postombud do ICA: o balcão vermelho de retirar pacotes…',
    }),
    seq('balcao-rise', 'balcao', 0.2, 0.8, [riseFrom(0.19, 2.1)]),
    seq('cliente-rise', 'cliente', 0.4, 0.75, [riseFrom(0.19, 2.0)]),

    // ---- o tatu atendente ----
    seq('tatu-corpo-rise', 'tatu-corpo', 1.7, 0.8, [riseFrom(1.25, 1.5)], {
      ease: 'easeOut',
      caption: '…mas o atendente é um TATU gigante de crachá!',
    }),
    seq('cracha-rise', 'cracha', 1.7, 0.8, [riseFrom(1.51, 1.5)], { ease: 'easeOut' }),
    seq('tatu-cabeca-rise', 'tatu-cabeca', 1.9, 0.7, [riseFrom(1.42, 1.8)], { ease: 'easeOut' }),

    // ---- o escarro: sobe até a boca, voa, espatifa ----
    seq('escarro-cospe', 'escarro', 3.4, 0.55, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], {
      ease: 'easeOut',
      caption: "A senha do balcão é nojenta: você grita 'IÁ!' e ESCARRA…",
    }),
    seq('cliente-inspira', 'cliente', 3.4, 0.3, [ch('rotation.x', 0, -0.14)]),
    seq('cliente-cospe', 'cliente', 3.95, 0.25, [ch('rotation.x', -0.14, 0.16)], { ease: 'easeIn' }),
    seq('escarro-voa', 'escarro', 4.0, 0.55, [
      ch('position.x', 1.57, -0.1),
      ch('position.y', 1.36, 1.65),
      ch('position.z', -0.4, -0.86),
    ], {
      ease: 'easeIn',
      caption: '…IÁ, ESCARRA EM TATU: o escarro gruda na carapaça! (jag ska hämta ut)',
    }),
    seq('escarro-splat', 'escarro', 4.55, 0.25, [
      ch('scale.x', 1, 1.4),
      ch('scale.y', 1, 1.4),
      ch('scale.z', 1, 0.35),
    ], { ease: 'easeOut' }),
    seq('tatu-susto', 'tatu-cabeca', 4.55, 0.3, [ch('rotation.x', 0, -0.35)]),
    seq('cliente-endireita', 'cliente', 4.5, 0.4, [ch('rotation.x', 0.16, 0)]),
    seq('tatu-volta', 'tatu-cabeca', 4.85, 0.4, [ch('rotation.x', -0.35, 0)]),

    // ---- o pacote destravado sobe pelo balcão ----
    seq('pacote-rise', 'pacote', 5.4, 0.8, [riseFrom(1.37, 2.0)], {
      ease: 'easeOut',
      caption: 'O TATU confere o QR code, destrava como um cofre e solta o PACOTE…',
    }),
    seq('tampa-rise', 'tampa', 5.4, 0.8, [riseFrom(1.645, 2.0)], { ease: 'easeOut' }),
    seq('tampa-abre', 'tampa', 6.5, 0.6, [ch('rotation.x', 0, -2.2)], { ease: 'easeOut' }),

    // ---- o ET lá de dentro ----
    seq('et-espia', 'et-cabeca', 7.3, 0.7, [ch('position.y', 1.35, 1.78)], {
      ease: 'easeOut',
      caption: "…e de dentro espia um ET acenando: 'ETE PACOTE!' (ett paket)",
    }),
    seq('et-maozinha-sobe', 'et-maozinha', 7.6, 0.5, [ch('position.y', 1.12, 1.62)], { ease: 'easeOut' }),
    seq('acena-1', 'et-maozinha', 8.3, 0.35, [ch('rotation.z', 0, 0.5)]),
    seq('acena-2', 'et-maozinha', 8.65, 0.45, [ch('rotation.z', 0.5, -0.3)], {
      caption: 'IÁ, ESCARRA EM TATU — ETE PACOTE! "Jag ska hämta ut ett paket." (Vim retirar um pacote.)',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.75, 4.05], target: [0.35, 1.28, -0.6] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ska-hamta-ut-ett-paket',
    contexto:
      'Balcão de pacotes (postombud) dentro do ICA, Coop, Pressbyrån — e, trocando a palavra final, o balcão da farmácia.',
    fraseFonte: 'Vim retirar um pacote.',
    fraseAlvo: 'Jag ska hämta ut ett paket.',
    pronuncia:
      "iá ska RRÉM-ta üt et pa-KÊT ('hämta' com h aspirado tipo 'rr' carioca; 'ut' com u de bico, entre 'u' e 'i')",
    ponteSonora:
      '"IÁ, ESCARRA EM TATU — ETE PACOTE!" — fale corrido: "iá-scarrêm-tatú... ete-pakêt" e sai quase "Jag ska hämta ut ett paket" (o RR de "escaRRa" é o h aspirado de "hämta"; "tatu" cobre o "ta ut" com u de bico; "paket" já soa "pakêt").',
    historia:
      'Você chega ao balcão vermelho do ICA para retirar um pacote, mas o atendente é um TATU gigante de crachá. A senha do balcão é nojenta: você grita "IÁ!" e ESCARRA na carapaça do TATU. O tatu confere o QR code, destrava como um cofre e empurra o pacote — que se abre sozinho e revela um ET acenando lá de dentro: "ETE PACOTE!" (ett paket).',
  },
  createScene,
  refine: { organic: ['tatu-cabeca', 'et-cabeca'] },
}

export default card
