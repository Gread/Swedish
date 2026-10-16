import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat, shoulderPivot,
  rbox, cylinder, sphere, capsule, torus, lathe, person,
} from '../rig/helpers'

/**
 * "Jag är ledig imorgon." — no corredor do avião, a comissária ouve o pedido
 * do comandante (IÁ! É…?), LÊ a escala bem devagar (LÊÊ… DI(a)…), acha o
 * quadradinho de amanhã VAZIO, baixa a máscara de dormir em pé e solta
 * I MÓ RON(co)! — tão alto que as máscaras de oxigênio despencam do teto.
 *
 * Diorama: fatia de cabine em corte (casco creme em arco aberto para a
 * câmera), cortina azul da copa ao fundo, poltronas azuis dos dois lados;
 * a comissária no centro do corredor segura a prancheta virada para a câmera.
 * O verde saturado é RESERVADO ao quadradinho vazio da escala.
 */

const BASE = '#2c3448'
const CARPET = '#26335c'
const CABIN = '#efe7d8'
const CABIN_DARK = '#ddd3c1'
const TRIM = '#c9ccd2'
const SEAT = '#6f9fd4'
const SEAT_DARK = '#4f7cb1'
const NAVY = '#22305a'
const CURTAIN = '#33467a'
const METAL = '#a9b0b8'
const DARK = '#3a3f48'
const RED = '#b8263b'
const RED_DARK = '#8f1c2e'
const WHITE = '#f7f4ee'
const SKIN = '#e8c39e'
const HAIR = '#6b4329'
const GOLD = '#d9a93a'
const SLEEP = '#bfe0f6'
const SLEEP_DARK = '#5b7fa8'
const GRID = '#3f6fb5'
const YELLOW = '#ffd21f'
const GREEN = '#1fcf5c' // acento saturado RESERVADO: o quadradinho vazio

const FY = 0.22 // topo do carpete
const YC = 0.9 // eixo do casco
const R = 1.9 // raio do casco
const Z_BACK = -1.15
const Z_FRONT = 0.95
const CAB_L = Z_FRONT - Z_BACK
const CAB_Z = (Z_FRONT + Z_BACK) / 2
const H = 1.5 // altura-parâmetro de person()
const SCALE = 1.3
const P_POS: [number, number, number] = [0, FY, 0.32]

/** Traço de letra: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.025, 0.006, WHITE, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** D I A — traço grosso, legível do ângulo da câmera. */
function letter(which: 'D' | 'I' | 'A') {
  const g = new THREE.Group()
  const t = 0.028
  if (which === 'D') {
    g.add(stroke(t, 0.14, -0.04, 0))
    g.add(stroke(0.058, t, -0.012, 0.056))
    g.add(stroke(0.058, t, -0.012, -0.056))
    g.add(stroke(t, 0.07, 0.042, 0))
    g.add(stroke(t, 0.046, 0.028, 0.04, 0.785))
    g.add(stroke(t, 0.046, 0.028, -0.04, -0.785))
  } else if (which === 'I') {
    g.add(stroke(t, 0.14, 0, 0))
    g.add(stroke(0.07, t, 0, 0.056))
    g.add(stroke(0.07, t, 0, -0.056))
  } else {
    g.add(stroke(t, 0.15, -0.024, 0, -0.3))
    g.add(stroke(t, 0.15, 0.024, 0, 0.3))
    g.add(stroke(0.052, 0.022, 0, -0.022))
  }
  return g
}

/** Superfície do casco/arco sem sombra projetada (senão apaga a cabine). */
function noShadow(o: THREE.Object3D) {
  o.traverse((c) => {
    c.castShadow = false
  })
  return o
}

/** Máscara de oxigênio: tubinho transparente do teto + copo amarelo + elástico. */
function makeOxygen(len: number) {
  const g = new THREE.Group()

  const tubo = cylinder(0.014, 0.014, len, '#e6f2ff', { roughness: 0.1 }, 10)
  const tm = tubo.material as THREE.MeshStandardMaterial
  tm.transparent = true
  tm.opacity = 0.55
  tubo.castShadow = false
  tubo.position.y = -len / 2
  g.add(tubo)

  const bocal = cylinder(0.024, 0.02, 0.05, '#e6f2ff', { roughness: 0.2 })
  bocal.position.y = -len + 0.01
  g.add(bocal)

  const copo = new THREE.Group()
  copo.position.set(0, -len - 0.06, 0.01)
  copo.rotation.set(Math.PI / 2 - 0.65, 0.45, 0)
  copo.scale.setScalar(1.45)
  const cup = lathe(
    [[0, 0], [0.05, 0.004], [0.078, 0.03], [0.09, 0.075], [0.084, 0.082], [0.07, 0.04], [0.045, 0.016], [0, 0.014]],
    YELLOW,
    { roughness: 0.7 },
  )
  copo.add(cup)
  const aro = torus(0.088, 0.009, '#f0b81a', { roughness: 0.7 })
  aro.rotation.x = Math.PI / 2
  aro.position.y = 0.078
  copo.add(aro)
  g.add(copo)

  // bolsinha transparente do oxigênio, logo abaixo do copo
  const bolsa = capsule(0.055, 0.09, '#eef6ff', { roughness: 0.15 })
  const bm = bolsa.material as THREE.MeshStandardMaterial
  bm.transparent = true
  bm.opacity = 0.5
  bolsa.castShadow = false
  bolsa.position.set(0.02, -len - 0.24, -0.02)
  g.add(bolsa)

  // elástico pendurado em laço
  const elastico = torus(0.1, 0.006, '#d18f1a', { roughness: 0.6 })
  elastico.position.set(0, -len - 0.17, -0.04)
  elastico.scale.setScalar(1.3)
  elastico.rotation.y = 0.3
  g.add(elastico)

  // compartimento aberto no teto, de onde a máscara caiu
  const nicho = rbox(0.24, 0.02, 0.2, 0.006, DARK, { roughness: 0.6 })
  nicho.position.y = 0.005
  g.add(nicho)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: plataforma + carpete azul-marinho com trilha de luzinhas -------
  const base = new THREE.Group()
  const plinth = rbox(3.95, 0.16, 2.45, 0.05, BASE, { roughness: 0.7 })
  plinth.position.set(0, 0.08, CAB_Z)
  base.add(plinth)
  const sill = rbox(3.75, 0.05, 2.25, 0.02, TRIM, { roughness: 0.4, metalness: 0.5 })
  sill.position.set(0, 0.175, CAB_Z)
  base.add(sill)
  const carpet = rbox(3.52, 0.04, CAB_L, 0.015, CARPET, { roughness: 0.95 })
  carpet.position.set(0, FY - 0.02, CAB_Z)
  base.add(carpet)
  // trilha de luz no meio do corredor
  const trilha = rbox(0.1, 0.012, CAB_L - 0.1, 0.005, DARK, { roughness: 0.5 })
  trilha.position.set(0, FY + 0.004, CAB_Z)
  base.add(trilha)
  for (let z = Z_BACK + 0.12; z < Z_FRONT - 0.05; z += 0.17) {
    const led = sphere(0.022, '#ffffff', { emissive: '#fff6dc', emissiveIntensity: 1.4 }, 12)
    led.scale.y = 0.5
    led.position.set(0, FY + 0.012, z)
    led.castShadow = false
    base.add(led)
  }
  // faixas do carpete (desenho de tapete de avião)
  for (const sx of [-1, 1]) {
    const faixa = rbox(0.04, 0.008, CAB_L - 0.05, 0.004, '#3a4d82', { roughness: 0.95 })
    faixa.position.set(sx * 0.6, FY + 0.002, CAB_Z)
    base.add(faixa)
  }
  root.add(base)

  // ---- poltronas: uma dupla de cada lado -----------------------------------
  const poltronas = new THREE.Group()
  for (const side of [-1, 1]) {
    const unit = new THREE.Group()
    unit.position.set(side * 1.16, FY, -0.48)
    for (const k of [-1, 1]) {
      const sx = k * 0.27
      const cushion = rbox(0.5, 0.14, 0.5, 0.06, SEAT, { roughness: 0.85 })
      cushion.position.set(sx, 0.45, 0.04)
      unit.add(cushion)
      const back = rbox(0.5, 0.88, 0.16, 0.07, SEAT, { roughness: 0.85 })
      back.position.set(sx, 0.92, -0.22)
      back.rotation.x = -0.1
      unit.add(back)
      // capinha branca do encosto
      const capa = rbox(0.36, 0.2, 0.03, 0.02, WHITE, { roughness: 0.8 })
      capa.position.set(sx, 1.2, -0.115)
      capa.rotation.x = -0.1
      unit.add(capa)
      // costura do assento
      const costura = rbox(0.44, 0.012, 0.012, 0.004, SEAT_DARK, { roughness: 0.8 })
      costura.position.set(sx, 0.52, 0.29)
      unit.add(costura)
      // pé da poltrona
      const pe = rbox(0.06, 0.36, 0.06, 0.02, METAL, { roughness: 0.3, metalness: 0.7 })
      pe.position.set(sx, 0.2, 0.02)
      unit.add(pe)
    }
    for (const ax of [-0.55, 0, 0.55]) {
      const braco = rbox(0.07, 0.07, 0.46, 0.03, DARK, { roughness: 0.5 })
      braco.position.set(ax, 0.64, 0.02)
      unit.add(braco)
      const apoio = rbox(0.05, 0.14, 0.05, 0.02, DARK, { roughness: 0.5 })
      apoio.position.set(ax, 0.55, -0.12)
      unit.add(apoio)
    }
    const trilhoP = rbox(1.0, 0.06, 0.08, 0.02, METAL, { roughness: 0.3, metalness: 0.7 })
    trilhoP.position.set(0, 0.04, 0.02)
    unit.add(trilhoP)
    poltronas.add(unit)
  }
  root.add(poltronas)

  // ---- teto: casco creme em arco, bagageiros, cortina da copa --------------
  const teto = new THREE.Group()
  const a0 = Math.asin((FY - YC) / R) // ângulo (a partir de +x) onde o casco toca o piso
  const shellGeo = new THREE.CylinderGeometry(R, R, CAB_L, 72, 1, true, Math.PI / 2 - a0, Math.PI + 2 * a0)
  shellGeo.rotateX(Math.PI / 2)
  const shellMat = mat(CABIN, { roughness: 0.6, size: 3 })
  shellMat.side = THREE.DoubleSide
  // luz de cabine: o casco não recebe a key por dentro, então brilha um pouco
  shellMat.emissive.set(CABIN)
  shellMat.emissiveIntensity = 0.18
  const shell = new THREE.Mesh(shellGeo, shellMat)
  shell.receiveShadow = true
  shell.position.set(0, YC, CAB_Z)
  teto.add(shell)

  // aro de acabamento na boca do corte
  const rimGeo = new THREE.TorusGeometry(R, 0.045, 12, 96, Math.PI - 2 * a0)
  const rim = new THREE.Mesh(rimGeo, mat(TRIM, { roughness: 0.35, metalness: 0.4 }))
  rim.rotation.z = a0
  rim.position.set(0, YC, Z_FRONT)
  teto.add(rim)

  // parede do fundo com a cortina azul da copa
  const shape = new THREE.Shape()
  shape.moveTo(R * Math.cos(a0), R * Math.sin(a0))
  shape.absarc(0, 0, R, a0, Math.PI - a0, false)
  shape.closePath()
  const wallGeo = new THREE.ExtrudeGeometry(shape, { depth: 0.06, bevelEnabled: false, curveSegments: 48 })
  const wall = new THREE.Mesh(wallGeo, mat(CABIN_DARK, { roughness: 0.7, size: 3 }))
  wall.position.set(0, YC, Z_BACK - 0.06)
  wall.receiveShadow = true
  teto.add(wall)

  const cortina = new THREE.Group()
  cortina.position.set(0, FY, Z_BACK + 0.05)
  const pano = rbox(1.1, 1.85, 0.05, 0.02, CURTAIN, { roughness: 0.95 })
  pano.position.y = 0.95
  cortina.add(pano)
  for (let i = -4; i <= 4; i++) {
    const dobra = rbox(0.05, 1.8, 0.03, 0.02, '#3d5390', { roughness: 0.95 })
    dobra.position.set(i * 0.12, 0.93, 0.03)
    cortina.add(dobra)
  }
  const varao = cylinder(0.02, 0.02, 1.25, METAL, { roughness: 0.3, metalness: 0.7 })
  varao.rotation.z = Math.PI / 2
  varao.position.set(0, 1.9, 0.04)
  cortina.add(varao)
  teto.add(cortina)

  // bagageiros fechados acompanhando a curva do casco
  for (const side of [-1, 1]) {
    const phi = 0.92
    const rc = R - 0.2
    const bin = new THREE.Group()
    bin.position.set(side * rc * Math.sin(phi), YC + rc * Math.cos(phi), CAB_Z + 0.02)
    bin.rotation.z = -side * phi
    const caixa = rbox(0.56, 0.38, CAB_L - 0.12, 0.06, CABIN, { roughness: 0.55 })
    bin.add(caixa)
    // tampa frontal mais escura: lê como móvel embutido, não caixa solta
    const tampaFrente = rbox(0.5, 0.32, 0.02, 0.04, CABIN_DARK, { roughness: 0.6 })
    tampaFrente.position.z = (CAB_L - 0.12) / 2 + 0.005
    bin.add(tampaFrente)
    // faixa de luz de cabine na borda de baixo do bagageiro
    const luz = rbox(0.04, 0.025, CAB_L - 0.2, 0.01, '#fff3d6', { emissive: '#ffe9b8', emissiveIntensity: 1.2 })
    luz.position.set(-side * 0.27, -0.19, 0)
    bin.add(luz)
    // portas: frisos e puxadores na face voltada para o corredor
    for (const dz of [-0.55, 0.15, 0.85]) {
      if (dz > CAB_L / 2) continue
      const friso = rbox(0.54, 0.012, 0.012, 0.004, CABIN_DARK, { roughness: 0.6 })
      friso.position.set(0, -0.192, dz - 0.35)
      bin.add(friso)
      const puxador = rbox(0.16, 0.025, 0.06, 0.012, DARK, { roughness: 0.4 })
      puxador.position.set(side * 0.12, -0.195, dz)
      bin.add(puxador)
    }
    teto.add(bin)

    // janelinhas nas paredes
    for (const wz of [-0.7, 0.35]) {
      const wy = 1.5
      const wx = Math.sqrt(R * R - (wy - YC) ** 2) - 0.015
      const jan = new THREE.Group()
      jan.position.set(side * wx, wy, wz)
      jan.rotation.set(0, -side * Math.PI / 2, 0)
      const moldura = rbox(0.26, 0.34, 0.03, 0.1, TRIM, { roughness: 0.4 })
      jan.add(moldura)
      const vidro = rbox(0.19, 0.26, 0.02, 0.08, '#9fd0f2', { roughness: 0.1, emissive: '#8cc4ee', emissiveIntensity: 0.35 })
      vidro.position.z = 0.012
      jan.add(vidro)
      teto.add(jan)
    }
  }
  // painel central do teto
  const painel = rbox(0.9, 0.03, CAB_L - 0.1, 0.012, CABIN_DARK, { roughness: 0.5, emissive: CABIN_DARK, emissiveIntensity: 0.2 })
  painel.position.set(0, YC + R - 0.03, CAB_Z)
  teto.add(painel)
  noShadow(teto)
  root.add(teto)

  // ---- comissária ----------------------------------------------------------
  const comissaria = person({ body: RED, skin: SKIN, height: H, armAngle: 0.18 })
  comissaria.position.set(...P_POS)
  comissaria.scale.setScalar(SCALE)

  // saia lápis um tom mais escuro
  const saia = lathe(
    [[0.0, 0.17], [0.262, 0.17], [0.268, 0.24], [0.262, 0.36], [0.258, 0.37], [0, 0.37]],
    RED_DARK,
    { roughness: 0.75 },
  )
  comissaria.add(saia)
  // scarpins azul-marinho por cima dos pés
  for (const sx of [-1, 1]) {
    const sapato = rbox(0.17, 0.1, 0.27, 0.045, NAVY, { roughness: 0.35 })
    sapato.position.set(sx * 0.105, 0.045, 0.12)
    comissaria.add(sapato)
  }
  // botões dourados e brevê no peito
  for (const by of [0.44, 0.53]) {
    const botao = sphere(0.022, GOLD, { roughness: 0.3, metalness: 0.8 }, 14)
    botao.position.set(0.045, by, 0.25)
    comissaria.add(botao)
  }
  const breve = rbox(0.11, 0.028, 0.02, 0.01, GOLD, { roughness: 0.3, metalness: 0.8 })
  breve.position.set(-0.11, 0.6, 0.225)
  breve.rotation.y = -0.35
  comissaria.add(breve)

  // lenço branco amarrado no pescoço
  const golaLenco = torus(0.15, 0.045, WHITE, { roughness: 0.85 })
  golaLenco.rotation.x = Math.PI / 2
  golaLenco.position.y = 0.76
  comissaria.add(golaLenco)
  const no = sphere(0.055, WHITE, { roughness: 0.85 })
  no.position.set(0.05, 0.735, 0.17)
  comissaria.add(no)
  for (const k of [-1, 1]) {
    const ponta = rbox(0.06, 0.16, 0.025, 0.012, WHITE, { roughness: 0.85 })
    ponta.position.set(0.05 + k * 0.035, 0.66, 0.205)
    ponta.rotation.set(-0.25, 0, k * 0.35)
    comissaria.add(ponta)
  }

  const head = comissaria.getObjectByName('head') as THREE.Group
  const headR = 0.205 * H // raio real da cabeça esculpida (bases.glb)

  // cabelo castanho: calota no alto e nuca, coque atrás
  const calota = new THREE.Mesh(
    new THREE.SphereGeometry(headR * 1.05, 32, 16, 0, Math.PI * 2, 0, 0.95),
    mat(HAIR, { roughness: 0.7 }),
  )
  calota.position.set(0, 0.015, -0.01)
  head.add(calota)
  const nuca = new THREE.Mesh(
    new THREE.SphereGeometry(headR * 1.04, 32, 16, Math.PI, Math.PI, 0, Math.PI * 0.68),
    mat(HAIR, { roughness: 0.7 }),
  )
  nuca.position.set(0, 0.01, -0.01)
  head.add(nuca)
  const coque = sphere(0.12, HAIR, { roughness: 0.7 })
  coque.position.set(0, 0.17, -0.27)
  head.add(coque)
  const coqueAro = torus(0.07, 0.022, RED, { roughness: 0.6 })
  coqueAro.position.set(0, 0.15, -0.22)
  coqueAro.rotation.x = 0.9
  head.add(coqueAro)

  // chapeuzinho redondo vermelho (pillbox), de lado
  const chapeu = new THREE.Group()
  chapeu.position.set(0.06, 0.27, 0.02)
  chapeu.rotation.set(0.12, 0, -0.22)
  const copa = cylinder(0.17, 0.175, 0.12, RED, { roughness: 0.6 })
  copa.position.y = 0.06
  chapeu.add(copa)
  const tampo = cylinder(0.165, 0.17, 0.02, RED_DARK, { roughness: 0.6 })
  tampo.position.y = 0.125
  chapeu.add(tampo)
  const fita = torus(0.174, 0.016, GOLD, { roughness: 0.3, metalness: 0.8 })
  fita.rotation.x = Math.PI / 2
  fita.position.y = 0.025
  chapeu.add(fita)
  const emblema = rbox(0.07, 0.035, 0.02, 0.01, GOLD, { roughness: 0.3, metalness: 0.8 })
  emblema.position.set(0, 0.07, 0.172)
  chapeu.add(emblema)
  head.add(chapeu)

  // máscara de dormir azul-clara sobre os olhos, com olhinhos fechados
  const mascara = new THREE.Group()
  mascara.position.set(0, 0.035, 0)
  const almofada = sphere(0.21, SLEEP, { roughness: 0.8 })
  almofada.scale.set(1.08, 0.36, 0.58)
  almofada.position.set(0, 0, 0.255)
  mascara.add(almofada)
  const tira = torus(headR * 1.0, 0.014, SLEEP_DARK, { roughness: 0.7 })
  tira.rotation.x = Math.PI / 2
  mascara.add(tira)
  for (const sx of [-1, 1]) {
    const olho = new THREE.Mesh(
      new THREE.TorusGeometry(0.045, 0.009, 8, 24, Math.PI),
      mat(SLEEP_DARK, { roughness: 0.6 }),
    )
    olho.rotation.z = Math.PI
    olho.position.set(sx * 0.1, 0.012, 0.37)
    olho.castShadow = true
    mascara.add(olho)
  }
  head.add(mascara)

  // boca aberta num O de ronco
  const boca = new THREE.Group()
  boca.position.set(0, -0.15, 0.245)
  const buraco = sphere(0.055, '#4a1620', { roughness: 0.5 })
  buraco.scale.set(0.85, 1.05, 0.45)
  boca.add(buraco)
  const labio = torus(0.05, 0.014, '#c9605e', { roughness: 0.5 })
  labio.scale.set(0.9, 1.1, 1)
  labio.position.z = 0.012
  boca.add(labio)
  head.add(boca)

  // braço esquerdo (lado esquerdo da tela) segura a prancheta, meio largado
  const bracoL = comissaria.getObjectByName('armL')!
  shoulderPivot(bracoL, H)
  bracoL.rotation.set(-0.95, 0, 0.32)
  const bracoR = comissaria.getObjectByName('armR')!
  bracoR.rotation.z = -0.16

  root.add(comissaria)
  root.updateMatrixWorld(true)

  // ---- prancheta prateada com a escala ------------------------------------
  const mao = new THREE.Vector3()
  bracoL.children[0].getWorldPosition(mao)

  const prancheta = new THREE.Group()
  prancheta.position.set(mao.x - 0.16, mao.y + 0.12, mao.z + 0.08)
  prancheta.rotation.set(-0.18, 0.28, 0.06)
  const PW = 0.56
  const PH = 0.74
  const placa = rbox(PW, PH, 0.03, 0.04, METAL, { roughness: 0.3, metalness: 0.75 })
  prancheta.add(placa)
  const papel = rbox(PW - 0.08, PH - 0.12, 0.012, 0.01, WHITE, { roughness: 0.8 })
  papel.position.set(0, -0.03, 0.02)
  prancheta.add(papel)
  const clipe = rbox(0.22, 0.07, 0.05, 0.02, DARK, { roughness: 0.35, metalness: 0.6 })
  clipe.position.set(0, PH / 2 - 0.04, 0.03)
  prancheta.add(clipe)
  // grade 3×4 de quadradinhos azuis com voo; um verde VAZIO (amanhã)
  const CELL = 0.105
  const GAP = 0.03
  const VAZIO = { col: 1, row: 2 }
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 3; col++) {
      if (row === VAZIO.row && col === VAZIO.col) continue
      const cx = (col - 1) * (CELL + GAP)
      const cy = 0.17 - row * (CELL + GAP) - 0.03
      const cel = rbox(CELL, CELL, 0.012, 0.015, GRID, { roughness: 0.6 })
      cel.position.set(cx, cy, 0.03)
      prancheta.add(cel)
      const voo = rbox(0.06, 0.018, 0.008, 0.006, WHITE, { roughness: 0.6 })
      voo.position.set(cx, cy, 0.038)
      prancheta.add(voo)
    }
  }
  // posição do quadradinho vazio (o verde entra depois, como peça própria)
  const vazioX = (VAZIO.col - 1) * (CELL + GAP)
  const vazioY = 0.17 - VAZIO.row * (CELL + GAP) - 0.03
  root.add(prancheta)

  const quadrado = new THREE.Group()
  quadrado.position.set(vazioX, vazioY, 0.034)
  const verde = rbox(CELL + 0.02, CELL + 0.02, 0.022, 0.018, GREEN, { roughness: 0.4 })
  quadrado.add(verde)
  const miolo = rbox(CELL - 0.035, CELL - 0.035, 0.01, 0.01, '#e9fff0', { roughness: 0.5 })
  miolo.position.z = 0.012
  quadrado.add(miolo)
  prancheta.add(quadrado)

  // placa curta DIA no topo da prancheta
  const placaDia = new THREE.Group()
  placaDia.position.set(0, PH / 2 + 0.09, 0.02)
  const tabua = rbox(0.4, 0.2, 0.035, 0.03, NAVY, { roughness: 0.6 })
  placaDia.add(tabua)
  for (const [glyph, lx] of [['D', -0.115], ['I', 0], ['A', 0.115]] as const) {
    const l = letter(glyph)
    l.position.set(lx, 0, 0.022)
    placaDia.add(l)
  }
  prancheta.add(placaDia)

  // ---- anéis de ronco saindo da boca ---------------------------------------
  const bocaW = new THREE.Vector3()
  boca.getWorldPosition(bocaW)
  const roncos = new THREE.Group()
  roncos.position.copy(bocaW)
  for (const [i, [rx, ry, rr]] of ([[0.5, 0.0, 0.075], [0.62, 0.27, 0.105], [0.68, 0.58, 0.14]] as const).entries()) {
    const anel = torus(rr, 0.02 + i * 0.005, '#ffffff', { roughness: 0.4 })
    anel.position.set(rx, ry, 0.14)
    anel.rotation.y = -0.2
    roncos.add(anel)
  }
  root.add(roncos)

  // ---- máscaras de oxigênio -------------------------------------------------
  const ceilY = (x: number) => YC + Math.sqrt(R * R - x * x) - 0.03
  const oxiDefs: [string, number, number, number][] = [
    ['oxi1', -0.8, 0.3, 0.68],
    ['oxi2', -0.25, -0.75, 0.42],
    ['oxi3', 0.98, 0.25, 1.0],
  ]
  const oxis = oxiDefs.map(([name, x, z, len]) => {
    const o = makeOxygen(len)
    o.position.set(x, ceilY(x), z)
    return { name, object: o }
  })
  for (const o of oxis) root.add(o.object)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'poltronas', group: 'cenario', object: poltronas },
    { name: 'teto', group: 'cenario', object: teto },
    { name: 'comissaria', group: 'comissaria', object: comissaria },
    { name: 'chapeu', group: 'comissaria', object: chapeu },
    { name: 'prancheta', group: 'escala', object: prancheta },
    { name: 'placa', group: 'escala', object: placaDia },
    { name: 'quadrado', group: 'vazio', object: quadrado },
    { name: 'mascara', group: 'mascara', object: mascara },
    { name: 'boca', group: 'ronco', object: boca },
    { name: 'roncos', group: 'ronco', object: roncos },
    { name: 'oxi1', group: 'oxigenio', object: oxis[0].object },
    { name: 'oxi2', group: 'oxigenio', object: oxis[1].object },
    { name: 'oxi3', group: 'oxigenio', object: oxis[2].object },
  ]

  const grow = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const rz = roncos.position

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'No corredor de um avião, brota o carpete azul-marinho com a trilha de luzinhas…',
    }),
    seq('poltronas-rise', 'poltronas', 0.35, 0.8, [riseFrom(0, 1.4)], { ease: 'easeOut' }),
    seq('teto-desce', 'teto', 0.7, 1.0, [ch('position.y', 3.2, 0)], { ease: 'easeOut' }),

    seq('comissaria-rise', 'comissaria', 2.0, 0.85, [riseFrom(FY, 2.2)], {
      ease: 'easeOut',
      caption: 'O comandante pede que a comissária pegue o voo de amanhã. Ela solta um IÁ! É…? desconfiado.',
    }),
    seq('chapeu-poe', 'chapeu', 2.6, 0.6, [...grow(), ch('position.y', 0.55, 0.27)], { ease: 'easeOut' }),

    seq('prancheta-surge', 'prancheta', 3.8, 0.7, [...grow(), ch('rotation.z', -0.9, 0.06)], {
      ease: 'easeOut',
      caption: 'Arranca a escala da prancheta e LÊ, de boquinha fechada e bem devagar: LÊÊ… DI(a)…',
    }),
    seq('placa-sobe', 'placa', 4.3, 0.6, [...grow(), ch('position.y', PH / 2 - 0.1, PH / 2 + 0.09)], {
      ease: 'easeOut',
    }),

    seq('quadrado-pisca', 'quadrado', 5.5, 0.45, [ch('scale.x', 0.01, 1.6), ch('scale.y', 0.01, 1.6), ch('scale.z', 0.01, 1.6)], {
      ease: 'easeOut',
      caption: '…até o dedo parar no quadradinho de amanhã: VAZIO, sem voo nenhum!',
    }),
    seq('quadrado-assenta', 'quadrado', 5.95, 0.4, [ch('scale.x', 1.6, 1), ch('scale.y', 1.6, 1), ch('scale.z', 1.6, 1)], {
      ease: 'easeInOut',
    }),

    seq('mascara-surge', 'mascara', 7.0, 0.35, grow(), {
      ease: 'easeOut',
      caption: 'Pronto: ela baixa a máscara de dormir ali mesmo, em pé no corredor…',
    }),
    seq('mascara-baixa', 'mascara', 7.4, 0.6, [ch('position.y', 0.2, 0.035)], { ease: 'easeInOut' }),

    seq('boca-abre', 'boca', 8.3, 0.4, grow(), {
      ease: 'easeOut',
      caption: '…e solta um I MÓ RON(co)! — um baita ronco, de chacoalhar o avião.',
    }),
    seq('roncos-saem', 'roncos', 8.45, 0.8, [
      ...grow(), ch('position.x', rz.x - 0.25, rz.x), ch('position.y', rz.y - 0.2, rz.y),
    ], { ease: 'easeOut' }),

    seq('oxi1-cai', 'oxi1', 9.4, 0.45, [...grow(), ch('rotation.z', 0, 0.4)], {
      ease: 'easeIn',
      caption: 'O ronco é tão grande que as máscaras de oxigênio despencam do teto!',
    }),
    seq('oxi2-cai', 'oxi2', 9.55, 0.45, [...grow(), ch('rotation.z', 0, -0.35)], { ease: 'easeIn' }),
    seq('oxi3-cai', 'oxi3', 9.7, 0.45, [...grow(), ch('rotation.z', 0, -0.4)], { ease: 'easeIn' }),
    seq('oxi1-balanca', 'oxi1', 9.85, 0.6, [ch('rotation.z', 0.4, -0.18)], { ease: 'easeInOut' }),
    seq('oxi2-balanca', 'oxi2', 10.0, 0.6, [ch('rotation.z', -0.35, 0.15)], { ease: 'easeInOut' }),
    seq('oxi3-balanca', 'oxi3', 10.15, 0.6, [ch('rotation.z', -0.4, 0.18)], { ease: 'easeInOut' }),
    seq('oxi1-assenta', 'oxi1', 10.45, 0.7, [ch('rotation.z', -0.18, 0)], { ease: 'easeOut' }),
    seq('oxi2-assenta', 'oxi2', 10.6, 0.7, [ch('rotation.z', 0.15, 0)], { ease: 'easeOut' }),
    seq('oxi3-assenta', 'oxi3', 10.75, 0.7, [ch('rotation.z', 0.18, 0)], { ease: 'easeOut' }),

    seq('roncos-pulsa', 'roncos', 10.3, 0.4, [ch('scale.x', 1, 1.15), ch('scale.y', 1, 1.15)], { ease: 'easeOut' }),
    seq('roncos-volta', 'roncos', 11.1, 0.5, [ch('scale.x', 1.15, 1), ch('scale.y', 1.15, 1)], {
      ease: 'easeInOut',
      caption: 'Jag är ledig imorgon. — Estou de folga amanhã.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.05, 4.75], target: [0, 1.38, -0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-ledig-imorgon',
    contexto:
      "Trabalho: quando o chefe pergunta se você pode cobrir um turno ou ir numa reunião amanhã; e com amigos, pra marcar um fika ou uma ida ao lago ('Jag är ledig imorgon, ska vi ses?'). 'Ledig' é o 'de folga/livre' de escala e de calendário: 'ledig dag', 'föräldraledig' (licença-parental) — e o molde serve pra qualquer dia: 'Jag är ledig på fredag'.",
    fraseFonte: 'Estou de folga amanhã.',
    fraseAlvo: 'Jag är ledig imorgon.',
    pronuncia:
      "iá é LÊÊ-di i-MÓR-ron ('jag' = iá, o G não soa; 'är' = É aberto e curto; 'ledig' com a força no LÊ — Ê FECHADO de 'você', LONGO — e o g do fim mudo na fala: sobra LÊÊ-di, com D de 'dado', nunca 'dji'; esse -di já gruda no i- de 'imorgon': lêê-di-i-MÓ-ron; 'imorgon' com a força no MÓ, Ó ABERTO de 'pó', R de um toque só, o g mudo e o -ron também de Ó aberto, com N de língua, sem nasalar)",
    ponteSonora:
      "IÁ! É... LÊÊ: DI(a)... I MÓ RON(co)! (7 sílabas: iá-é-LÊÊ-di-i-MÓR-ron; força no LÊÊ e, maior, no MÓ; IÁ É = o 'jag är' de sempre — o MESMO de 'Jag är trött', 'Jag är mätt' e 'Jag är på semester': IÁ com I de IOGA, nunca o J chiado de 'já', e É aberto e curto; LÊÊ = o verbo LER, 'ela LÊ', exatamente como o português já diz — o MESMO LÊÊ da fada de 'Är det ledigt här?', que lê de BOQUINHA FECHADA: Ê FECHADO de 'você' e LONGO, é nele que cai a força; nunca o LÉÉR escancarado do palhaço de 'Jag lär mig svenska', nem o LÉ aberto e curto do picolé da bibliotecária de 'Jag är ledsen' (aquele é picoLÉ SEM, triste; este é LÊÊ-DI, o dia que se lê, de folga), nem o LÖÖ de bico do pombo de 'lösenordet'; DI(a) = o DIA que ela lê na escala, cortado no I: D de 'dado', NUNCA o 'dji' carioca/paulista — é o mesmo D duro do DIT' da fada — e sem força; o g de 'ledig' não soa, então LÊÊ-DI já é a palavra inteira (com o T da fada, 'ledigt', é outra forma); I = o 'e' brasileiro, que já sai I, colado no DI: lêê-di-i...; MÓ = o 'mó' da gíria, 'MÓ ronco' = um baita ronco: Ó ABERTO de 'pó' — o MESMO MÓ da pedra do moinho do camelo de 'God morgon!' e do ouriço IMÓRON de 'Ska vi säga imorgon klockan tre?' —, é a força principal; RON(co) = só o começo do RONCO, com R de UM toque só (de 'caro', jamais o RR de 'rua') e, aqui vai a única correção, Ó ABERTO de novo e N de ponta de língua, sem o 'rõ' nasal de 'ronco': MÓ-RON, as duas vogais iguais; I MÓ RON = 'imorgon', amanhã, com o g mudo)",
    historia:
      'No corredor do avião, o comandante pergunta se a comissária de bordo pode pegar o voo de amanhã. Ela solta um IÁ! É...? desconfiado, arranca a escala da prancheta e LÊ, de boquinha fechada e bem devagar — LÊÊ... DI(a)... — até o dedo parar no quadradinho de amanhã: VAZIO, sem voo nenhum. Pronto: ela baixa a máscara de dormir ali mesmo, em pé no corredor, e solta — I MÓ RONCO! — um ronco tão grande que as máscaras de oxigênio despencam do teto. Amanhã, nem pensar: ela está de folga.',
  },
  createScene,
}

export default card
