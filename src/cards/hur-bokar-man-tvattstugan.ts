import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, torus, lathe, person, puff,
} from '../rig/helpers'

/**
 * "Hur bokar man tvättstugan?" — a máquina RUGE (RRÜR), o lençol-fantasma
 * salta da escotilha gritando BÚ!, você berra CARMAN! e a zeladora estala a
 * toalha (TVÉT!) apontando para o quadro de reservas.
 *
 * Diorama: stuga vermelha em miniatura com paredes em U — a parede da FRENTE
 * fica aberta para a câmera (casa de boneca) e o telhado cobre só o fundo,
 * então nada oclui o interior.
 */

const FALUN = '#9e3b2e'      // base 1: parede vermelho-falun
const FALUN_DARK = '#82301f'
const BONE = '#eae4d8'       // base 2: telhado, máquina, rodapé
const TILE = '#7d8c99'       // base 3: ladrilho cinza-azulado
const TILE_DARK = '#5b6771'
const DENIM = '#3f6f92'      // parente do ladrilho: cesto e listras da toalha
const WOOD = '#8a6a42'
const CHROME = '#c9ced3'
const SKIN = '#e8c39e'
const HAIR = '#6b4a34'
const SHEET = '#f3f0e8'
const GOLD = '#f2b12b'       // ACENTO reservado: avental da CARMAN + pino dourado

const GY = 0.16              // topo do piso do diorama
const WALL_H = 2.0
const WALL_T = 0.16
const WALL_X = 1.85          // eixo das paredes laterais
const WALL_Z = -1.85         // eixo da parede do fundo

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(19)

  // ---- base: piso de ladrilho com ralo + adereços --------------------------
  const base = new THREE.Group()

  const laje = cylinder(2.72, 2.8, 0.16, TILE_DARK, { roughness: 0.9 })
  laje.position.y = 0.08
  base.add(laje)

  const ladrilho = cylinder(2.66, 2.72, 0.06, TILE, { roughness: 0.3 })
  ladrilho.position.y = 0.155
  base.add(ladrilho)

  // ralo no meio do piso
  const ralo = cylinder(0.17, 0.17, 0.05, TILE_DARK, { roughness: 0.6 })
  ralo.position.set(-0.05, GY - 0.01, 0.85)
  base.add(ralo)
  for (let i = 0; i < 3; i++) {
    const grade = rbox(0.28, 0.02, 0.035, 0.008, CHROME, { roughness: 0.25, metalness: 0.8 })
    grade.position.set(-0.05, GY + 0.015, 0.85 + (i - 1) * 0.075)
    base.add(grade)
  }

  // poça d'água rasa em volta do ralo
  const poca = cylinder(0.44, 0.46, 0.012, '#8fa6b4', { roughness: 0.12 })
  poca.position.set(-0.02, GY + 0.004, 0.88)
  base.add(poca)

  // cesto de roupa com espuma transbordando (adereço de ambientação)
  const cesto = new THREE.Group()
  cesto.position.set(1.32, GY, 1.12)
  cesto.rotation.y = rand() * 0.6 - 0.3
  const balde = lathe(
    [[0, 0], [0.3, 0.02], [0.4, 0.44], [0.43, 0.47], [0.415, 0.44], [0.315, 0.04], [0, 0.02]],
    DENIM,
    { roughness: 0.4 },
  )
  cesto.add(balde)
  // pilha de roupa dobrada (colorida: não pode competir com o lençol branco)
  const roupas: [number, number, number, number, string][] = [
    [0.0, 0.4, 0.02, 0.1, '#7a9cc0'],
    [0.03, 0.49, -0.03, -0.15, '#c96f6f'],
    [-0.02, 0.57, 0.01, 0.25, '#9cb07a'],
  ]
  for (const [x, y, z, ry, c] of roupas) {
    const peca = rbox(0.5, 0.09, 0.4, 0.04, c, { roughness: 0.92 })
    peca.position.set(x, y, z)
    peca.rotation.y = ry
    cesto.add(peca)
  }
  const meia = capsule(0.045, 0.22, '#c96f6f', { roughness: 0.92 })
  meia.position.set(0.4, 0.38, 0.12)
  meia.rotation.z = 0.35
  cesto.add(meia)
  base.add(cesto)

  // caixa de sabão em pó encostada na parede
  const sabao = rbox(0.3, 0.4, 0.22, 0.03, '#d9e3ea', { roughness: 0.55 })
  sabao.position.set(-1.55, GY + 0.2, 0.55)
  sabao.rotation.y = 0.35 + rand() * 0.2
  const rotulo = rbox(0.2, 0.14, 0.02, 0.02, DENIM, { roughness: 0.5 })
  rotulo.position.set(0, 0.05, 0.115)
  sabao.add(rotulo)
  base.add(sabao)

  // tapete de borracha na entrada
  const tapete = new THREE.Group()
  const borda = rbox(0.9, 0.035, 0.5, 0.02, '#6b4f2e', { roughness: 0.95 })
  borda.position.y = 0.018
  const fibra = rbox(0.78, 0.02, 0.38, 0.01, '#b08a55', { roughness: 0.98 })
  fibra.position.y = 0.04
  tapete.add(borda, fibra)
  tapete.position.set(0.25, GY, 1.62)
  tapete.rotation.y = -0.12
  base.add(tapete)

  root.add(base)

  // ---- paredes em U (FRENTE ABERTA para a câmera, em +z) -------------------
  const paredes = new THREE.Group()

  const fundo = rbox(WALL_X * 2 + WALL_T, WALL_H, WALL_T, 0.03, FALUN, { roughness: 0.8 })
  fundo.position.set(0, GY + WALL_H / 2, WALL_Z)
  paredes.add(fundo)

  for (const side of [-1, 1]) {
    const lateral = rbox(WALL_T, WALL_H, WALL_X * 2, 0.03, side < 0 ? FALUN : FALUN_DARK, {
      roughness: 0.8,
    })
    lateral.position.set(side * WALL_X, GY + WALL_H / 2, 0)
    paredes.add(lateral)

    // rodapé branco por dentro
    const rodape = rbox(0.05, 0.14, WALL_X * 2 - 0.1, 0.02, BONE, { roughness: 0.5 })
    rodape.position.set(side * (WALL_X - WALL_T / 2 - 0.02), GY + 0.07, 0)
    paredes.add(rodape)
  }
  const rodapeFundo = rbox(WALL_X * 2 - 0.1, 0.14, 0.05, 0.02, BONE, { roughness: 0.5 })
  rodapeFundo.position.set(0, GY + 0.07, WALL_Z + WALL_T / 2 + 0.02)
  paredes.add(rodapeFundo)

  // frontão triangular do fundo, fechando a empena sob o telhado
  const empenaShape = new THREE.Shape()
  empenaShape.moveTo(-(WALL_X + WALL_T / 2), 0)
  empenaShape.lineTo(WALL_X + WALL_T / 2, 0)
  empenaShape.lineTo(0, 0.74)
  empenaShape.closePath()
  const empena = new THREE.Mesh(
    new THREE.ExtrudeGeometry(empenaShape, { depth: WALL_T, bevelEnabled: false }),
    mat(FALUN, { roughness: 0.8, size: 2 }),
  )
  empena.castShadow = true
  empena.receiveShadow = true
  empena.position.set(0, GY + WALL_H, WALL_Z - WALL_T / 2)
  paredes.add(empena)

  // janelinha alta na parede do fundo, para a luz entrar
  const janela = rbox(0.62, 0.34, 0.06, 0.02, '#cfe0ea', { roughness: 0.12 })
  janela.position.set(-1.05, GY + 1.55, WALL_Z + WALL_T / 2)
  paredes.add(janela)
  const caixilho = rbox(0.72, 0.44, 0.05, 0.02, BONE, { roughness: 0.55 })
  caixilho.position.set(-1.05, GY + 1.55, WALL_Z + WALL_T / 2 - 0.015)
  paredes.add(caixilho)

  root.add(paredes)

  // ---- telhado branco em duas águas + chaminé ------------------------------
  const telhado = new THREE.Group()

  const RIDGE = GY + WALL_H + 0.72
  const ROOF_Z = -0.6      // cobre z de -2.12 a 0.92: a boca da casa fica aberta
  for (const side of [-1, 1]) {
    const agua = rbox(2.22, 0.09, 3.05, 0.03, BONE, { roughness: 0.6 })
    agua.position.set(side * 1.03, GY + WALL_H + 0.37, ROOF_Z)
    agua.rotation.z = -side * 0.336
    telhado.add(agua)

    // beiral levemente destacado
    const beiral = rbox(0.14, 0.07, 3.15, 0.02, '#dcd4c6', { roughness: 0.65 })
    beiral.position.set(side * 2.06, GY + WALL_H - 0.02, ROOF_Z)
    telhado.add(beiral)
  }
  const cumeeira = rbox(0.2, 0.11, 3.12, 0.04, '#dcd4c6', { roughness: 0.6 })
  cumeeira.position.set(0, RIDGE - 0.02, ROOF_Z)
  telhado.add(cumeeira)

  const chamine = rbox(0.34, 0.82, 0.34, 0.05, FALUN_DARK, { roughness: 0.85 })
  chamine.position.set(0.95, GY + WALL_H + 0.62, -1.42)
  telhado.add(chamine)
  const capaChamine = rbox(0.44, 0.1, 0.44, 0.03, BONE, { roughness: 0.6 })
  capaChamine.position.set(0.95, GY + WALL_H + 1.06, -1.42)
  telhado.add(capaChamine)
  const fumaca = puff(0.16, '#e6e6e6', 5, 41, { roughness: 0.95 })
  fumaca.position.set(1.02, GY + WALL_H + 1.32, -1.42)
  fumaca.scale.set(1, 0.8, 1)
  telhado.add(fumaca)

  root.add(telhado)

  // ---- máquina de lavar branca com escotilha cromada -----------------------
  const maquina = new THREE.Group()
  maquina.position.set(-0.95, GY, -1.05)
  maquina.rotation.y = 0.18

  const corpo = rbox(1.06, 1.1, 0.96, 0.07, BONE, { roughness: 0.32 })
  corpo.position.y = 0.57
  maquina.add(corpo)

  const tampo = rbox(1.1, 0.06, 1.0, 0.02, '#d8d2c6', { roughness: 0.4 })
  tampo.position.y = 1.14
  maquina.add(tampo)

  const painel = rbox(0.92, 0.2, 0.06, 0.03, '#b9bec4', { roughness: 0.4 })
  painel.position.set(0, 0.94, 0.48)
  maquina.add(painel)

  const seletor = cylinder(0.09, 0.09, 0.06, CHROME, { roughness: 0.2, metalness: 0.85 })
  seletor.rotation.x = Math.PI / 2
  seletor.position.set(-0.32, 0.94, 0.53)
  maquina.add(seletor)
  for (let i = 0; i < 2; i++) {
    const luz = sphere(0.035, i === 0 ? '#8ce07a' : '#e07a6a', {
      emissive: i === 0 ? '#8ce07a' : '#e07a6a',
      emissiveIntensity: 1.1,
    })
    luz.position.set(0.12 + i * 0.16, 0.94, 0.52)
    maquina.add(luz)
  }

  // escotilha: aro cromado + túnel escuro por onde o lençol salta
  const aro = torus(0.31, 0.055, CHROME, { roughness: 0.2, metalness: 0.9 })
  aro.position.set(0, 0.5, 0.48)
  maquina.add(aro)
  const tunel = cylinder(0.29, 0.29, 0.34, '#20272d', { roughness: 0.7 })
  tunel.rotation.x = Math.PI / 2
  tunel.position.set(0, 0.5, 0.33)
  maquina.add(tunel)

  for (const [px, pz] of [[-0.42, 0.38], [0.42, 0.38], [-0.42, -0.38], [0.42, -0.38]] as const) {
    const pe = cylinder(0.07, 0.08, 0.06, '#3d4349', { roughness: 0.75 })
    pe.position.set(px, 0.03, pz)
    maquina.add(pe)
  }
  root.add(maquina)

  // tambor girando, emissivo, no fundo da escotilha (peça filha da máquina)
  const tambor = new THREE.Group()
  tambor.position.set(0, 0.5, 0.3)
  const fundoTambor = cylinder(0.24, 0.24, 0.02, '#ffcf7a', {
    emissive: '#ffb347',
    emissiveIntensity: 1.2,
  })
  fundoTambor.rotation.x = Math.PI / 2
  tambor.add(fundoTambor)
  const aroTambor = torus(0.2, 0.03, CHROME, { roughness: 0.2, metalness: 0.9 })
  tambor.add(aroTambor)
  for (let i = 0; i < 4; i++) {
    const pa = rbox(0.36, 0.05, 0.05, 0.02, CHROME, { roughness: 0.25, metalness: 0.8 })
    pa.rotation.z = (i * Math.PI) / 4
    pa.position.z = 0.02
    tambor.add(pa)
  }
  const trapo = rbox(0.2, 0.12, 0.03, 0.02, DENIM, { roughness: 0.9 })
  trapo.position.set(0.06, -0.08, 0.05)
  trapo.rotation.z = 0.5
  tambor.add(trapo)
  maquina.add(tambor)

  // ---- lençol-fantasma saltando da escotilha -------------------------------
  // posição de origem: a boca da escotilha, em coordenadas de mundo
  const HATCH = new THREE.Vector3(-0.86, GY + 0.5, -0.58)
  const LENCOL_Y = 1.42 // altura ao fim do salto (depois flutua até LENCOL_Y + 0.08)
  const lencol = new THREE.Group()
  lencol.position.set(-0.12, LENCOL_Y + 0.08, -0.3)
  lencol.rotation.z = -0.12
  const PANO = { roughness: 0.62, detail: 0.35 }

  // corpo em gota: cabeça redonda afinando numa cauda de pano
  const pano = lathe(
    [
      [0.001, -0.44], [0.09, -0.42], [0.17, -0.34], [0.28, -0.22], [0.36, -0.05],
      [0.39, 0.12], [0.36, 0.3], [0.27, 0.43], [0.14, 0.5], [0.001, 0.52],
    ],
    SHEET,
    PANO,
  )
  lencol.add(pano)

  // olhos e boca pretos, ovais: rosto clássico de fantasma ("BÚ!")
  for (const side of [-1, 1]) {
    const olho = sphere(0.06, '#16161c', { roughness: 0.3 })
    olho.position.set(side * 0.12, 0.2, 0.33)
    olho.scale.set(0.8, 1.3, 0.45)
    olho.rotation.y = side * 0.35
    lencol.add(olho)

    // braços de pano abertos para os lados, pontas para cima: "BÚ!"
    const braco = capsule(0.075, 0.26, SHEET, PANO)
    braco.position.set(side * 0.46, 0.08, 0.04)
    braco.rotation.z = -side * 0.85
    lencol.add(braco)
  }
  const boca = sphere(0.085, '#16161c', { roughness: 0.4 })
  boca.position.set(0, -0.04, 0.35)
  boca.scale.set(0.85, 1.25, 0.45)
  lencol.add(boca)

  // cauda de pano que ainda sai da escotilha (calculada na pose final)
  lencol.updateMatrixWorld(true)
  const dentroTunel = lencol.worldToLocal(HATCH.clone().add(new THREE.Vector3(0.01, 0, -0.12)))
  const caudaCurva = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, -0.36, 0),
    new THREE.Vector3(-0.08, -0.62, 0.06),
    new THREE.Vector3(dentroTunel.x * 0.6, dentroTunel.y * 0.85, dentroTunel.z * 0.3 + 0.05),
    new THREE.Vector3(dentroTunel.x * 0.92, dentroTunel.y, dentroTunel.z * 0.75),
    dentroTunel,
  ])
  const cauda = new THREE.Mesh(
    new THREE.TubeGeometry(caudaCurva, 40, 0.1, 16, false),
    mat(SHEET, { ...PANO, size: 0.8 }),
  )
  cauda.castShadow = true
  cauda.receiveShadow = true
  lencol.add(cauda)
  root.add(lencol)

  // ---- dona Carman: avental amarelo e coque --------------------------------
  const carman = person({ body: GOLD, skin: SKIN, height: 1.45, armAngle: 0.35 })
  carman.position.set(0.55, GY, 0.7)
  carman.rotation.y = 0.85 // pose final: já virada para o quadro

  const cabeca = carman.getObjectByName('head')!
  const cabelo = sphere(0.29, HAIR, { roughness: 0.85 })
  cabelo.scale.set(1, 0.82, 1)
  cabelo.position.set(0, 0.04, -0.14)
  cabeca.add(cabelo)
  const coque = sphere(0.125, HAIR, { roughness: 0.85 })
  coque.position.set(0, 0.17, -0.31)
  cabeca.add(coque)

  const bib = rbox(0.28, 0.3, 0.05, 0.02, '#f6f2e6', { roughness: 0.9 })
  bib.position.set(0, 0.45, 0.235)
  carman.add(bib)
  const bolso = rbox(0.16, 0.1, 0.03, 0.015, GOLD, { roughness: 0.9 })
  bolso.position.set(0, 0.38, 0.27)
  carman.add(bolso)

  for (const side of [-1, 1]) {
    const perna = capsule(0.075, 0.16, '#4a5560', { roughness: 0.9 })
    perna.position.set(side * 0.11, 0.13, 0)
    carman.add(perna)
    const tamanco = rbox(0.16, 0.08, 0.26, 0.03, FALUN_DARK, { roughness: 0.7 })
    tamanco.position.set(side * 0.11, 0.04, 0.05)
    carman.add(tamanco)
  }
  root.add(carman)

  // ---- toalha azul-listrada estalando em diagonal --------------------------
  // cresce da mão dela: pivô exatamente no punho esquerdo
  const toalha = new THREE.Group()
  carman.updateMatrixWorld(true)
  const mao = carman.getObjectByName('armR')!.children[0].getWorldPosition(new THREE.Vector3())
  const ALVO_QUADRO = new THREE.Vector3(1.55, GY + 1.2, -0.15) // = quadro.position
  toalha.position.copy(mao)
  // Euler XYZ com rotation.z = 0.55 (pose final da animação): +x local aponta
  // para (cos z·cos y, sen z, −cos z·sen y) — basta escolher y
  toalha.rotation.set(0, Math.atan2(-(ALVO_QUADRO.z - mao.z), ALVO_QUADRO.x - mao.x), 0.55)
  // toalha contínua (base clara + listras azuis), com franja na ponta
  const TOALHA_L = 1.25
  const tecido = rbox(TOALHA_L, 0.035, 0.36, 0.015, BONE, { roughness: 0.95 })
  tecido.position.x = 0.12 + TOALHA_L / 2
  toalha.add(tecido)
  for (const fx of [0.3, 0.62, 0.94, 1.22]) {
    const listra = rbox(0.12, 0.045, 0.365, 0.015, DENIM, { roughness: 0.95 })
    listra.position.x = fx
    toalha.add(listra)
  }
  for (let i = 0; i < 6; i++) {
    const fio = capsule(0.012, 0.07, BONE, { roughness: 0.95 })
    fio.rotation.z = Math.PI / 2
    fio.position.set(0.12 + TOALHA_L + 0.05, 0, -0.15 + i * 0.06)
    toalha.add(fio)
  }
  // ponta dobrada pelo estalo: o TVÉT!
  const dobra = rbox(0.18, 0.035, 0.36, 0.015, BONE, { roughness: 0.95 })
  dobra.position.set(0.12 + TOALHA_L - 0.02, 0.05, 0)
  dobra.rotation.z = 0.5
  toalha.add(dobra)
  root.add(toalha)

  // ---- quadro de reservas com pinos ----------------------------------------
  // na parede da direita, girado meia-volta para a câmera conseguir ler
  const quadro = new THREE.Group()
  quadro.position.copy(ALVO_QUADRO)
  quadro.rotation.y = -Math.PI / 2 + 0.5

  const placa = rbox(0.92, 0.68, 0.05, 0.02, WOOD, { roughness: 0.75 })
  quadro.add(placa)
  const cortica = rbox(0.82, 0.58, 0.03, 0.015, '#c9a877', { roughness: 0.85 })
  cortica.position.z = 0.025
  quadro.add(cortica)

  const cabecalho = rbox(0.82, 0.1, 0.02, 0.01, BONE, { roughness: 0.5 })
  cabecalho.position.set(0, 0.23, 0.045)
  quadro.add(cabecalho)

  for (let i = 0; i < 4; i++) {
    const coluna = rbox(0.02, 0.44, 0.012, 0.005, '#8a7350', { roughness: 0.7 })
    coluna.position.set(-0.3 + i * 0.2, -0.06, 0.045)
    quadro.add(coluna)
  }
  for (let i = 0; i < 3; i++) {
    const linha = rbox(0.78, 0.02, 0.012, 0.005, '#8a7350', { roughness: 0.7 })
    linha.position.set(0, -0.24 + i * 0.16, 0.045)
    quadro.add(linha)
  }

  for (const [px, py] of [[-0.3, 0.06], [-0.1, -0.1], [0.1, 0.06], [0.3, -0.26]] as const) {
    const pino = cylinder(0.022, 0.022, 0.06, CHROME, { roughness: 0.25, metalness: 0.8 })
    pino.rotation.x = Math.PI / 2
    pino.position.set(px, py, 0.075)
    const cabecaPino = sphere(0.035, i2color(px), { roughness: 0.4 })
    cabecaPino.position.set(px, py, 0.11)
    quadro.add(pino, cabecaPino)
  }
  root.add(quadro)

  // o pino DOURADO: o horário que é seu (peça filha do quadro)
  const pinoDourado = new THREE.Group()
  pinoDourado.position.set(0.1, -0.26, 0.055)
  const haste = cylinder(0.028, 0.028, 0.07, CHROME, { roughness: 0.2, metalness: 0.9 })
  haste.rotation.x = Math.PI / 2
  pinoDourado.add(haste)
  const cabecaDourada = sphere(0.055, GOLD, { roughness: 0.25, metalness: 0.7 })
  cabecaDourada.position.z = 0.05
  pinoDourado.add(cabecaDourada)
  const brilho = sphere(0.028, '#ffe9a8', { emissive: '#ffd766', emissiveIntensity: 1.2 })
  brilho.position.set(0.02, 0.02, 0.09)
  pinoDourado.add(brilho)
  quadro.add(pinoDourado)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'paredes', group: 'cenario', object: paredes },
    { name: 'telhado', group: 'cenario', object: telhado },
    { name: 'maquina', group: 'maquina', object: maquina },
    { name: 'tambor', group: 'maquina', object: tambor },
    { name: 'lencol', group: 'lencol', object: lencol },
    { name: 'carman', group: 'carman', object: carman },
    { name: 'toalha', group: 'carman', object: toalha },
    { name: 'quadro', group: 'quadro', object: quadro },
    { name: 'pino', group: 'quadro', object: pinoDourado },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 1.05)], {
      ease: 'easeOut',
      caption: 'Primeira semana no prédio: brota do chão a lavanderia comum, ladrilho e ralo.',
    }),
    seq('paredes-rise', 'paredes', 0.95, 0.85, [riseFrom(0, 3.05)], { ease: 'easeOut' }),
    seq('telhado-rise', 'telhado', 1.2, 0.9, [riseFrom(0, 3.45)], { ease: 'easeOut' }),

    seq('maquina-rise', 'maquina', 3.0, 0.8, [riseFrom(GY, 1.55)], {
      ease: 'easeOut',
      caption: 'Você abre a porta e a máquina de lavar RUGE: RRÜR! — feito bicho preso lá dentro.',
    }),
    seq(
      'tambor-grow',
      'tambor',
      3.25,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    // giro do tambor: -4π volta ao mesmo ângulo da pose final (rotation.z = 0)
    seq('tambor-spin', 'tambor', 3.9, 1.7, [ch('rotation.z', 0, -Math.PI * 4)]),

    seq(
      'lencol-salta',
      'lencol',
      5.5,
      0.7,
      [
        ch('position.x', HATCH.x, -0.12),
        ch('position.y', HATCH.y, LENCOL_Y),
        ch('position.z', HATCH.z, -0.3),
        ch('scale.x', 0.3, 1),
        ch('scale.y', 0.3, 1),
        ch('scale.z', 0.3, 1),
      ],
      {
        ease: 'easeOut',
        caption: 'Um lençol ainda quente salta da escotilha gritando BÚ! (bokar = BÚ-kar).',
      },
    ),
    seq('lencol-balanca', 'lencol', 6.25, 0.6, [ch('rotation.z', -0.42, -0.12)]),

    seq('carman-rise', 'carman', 7.3, 0.8, [riseFrom(GY, 1.85)], {
      ease: 'easeOut',
      caption: 'Você berra por socorro: CARMAN! — a zeladora de avental amarelo surge na porta.',
    }),
    seq(
      'toalha-desdobra',
      'toalha',
      7.55,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('toalha-arma', 'toalha', 8.8, 0.5, [ch('rotation.z', 0.55, -0.5)], {
      caption: 'Ela estala a toalha molhada no ar — TVÉT! — e aponta com ela para o quadro.',
    }),
    seq('toalha-estala', 'toalha', 9.35, 0.45, [ch('rotation.z', -0.5, 0.55)], { ease: 'easeIn' }),
    seq('carman-vira', 'carman', 9.4, 0.5, [ch('rotation.y', 1.15, 0.85)]),
    seq(
      'quadro-abre',
      'quadro',
      9.5,
      0.7,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('pino-crava', 'pino', 10.6, 0.6, [ch('position.z', -0.02, 0.055)], {
      ease: 'easeOut',
      caption: 'Hur bokar man tvättstugan? — "Como se reserva a lavanderia?" (TVÉT-STÜ-GAN)',
    }),
    seq('lencol-flutua', 'lencol', 10.7, 0.7, [ch('position.y', LENCOL_Y, LENCOL_Y + 0.08)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.8, 5.8], target: [0.05, 1.15, -0.35] },
  }
}

/** Cor das cabeças dos pinos comuns, variando com a coluna do quadro. */
function i2color(x: number): string {
  return x < -0.2 ? '#b0454a' : x < 0 ? '#4a7f5e' : '#4a5560'
}

export const card: Card = {
  meta: {
    id: 'hur-bokar-man-tvattstugan',
    contexto:
      'Primeira semana no prédio, perguntando ao vizinho ou ao hyresvärd como funciona o quadro ou o app.',
    fraseFonte: 'Como se reserva a lavanderia?',
    fraseAlvo: 'Hur bokar man tvättstugan?',
    pronuncia:
      "RRUR BÚ-kar man TVÉT-stü-gan? ('hur' com H soprado; 'o' de bokar = ú fechado)",
    ponteSonora:
      "RRÜR! BÚ, CARMAN! TVÉT-STÜ-GAN? (7 sílabas, tônicas em BÚ e TVÉT; 'hur' = RRÜR: o RR inicial é só o h soprado, a vogal é Ü DE BICO (jamais o U chapado de 'urso') e o R final é BRANDO; 'bokar' = BÚ com U bem fechado e longo, o 'car' fraquinho com R BRANDO; 'man' seco e não-nasal; 'tvätt' é um golpe só, T e V colados, É ABERTO; STÜ com bico)",
    historia:
      'Primeira semana no prédio: você abre a porta da lavanderia e a máquina ruge RRÜR feito bicho preso. Um lençol ainda quente salta da escotilha gritando BÚ! e você berra por socorro: CARMAN! — a zeladora surge, estala a toalha molhada no ar, TVÉT!, e aponta com ela para o quadro de reservas.',
  },
  createScene,
}

export default card
