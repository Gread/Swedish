import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock,
} from '../rig/helpers'

/**
 * "Mötet är inställt." — METE(oro)-T… É… ÍNS-TELT!
 *
 * A sala da mesa em T (a do touro de 'Kan vi ta det på mötet?') ficou no
 * escuro. Na cabeceira, o METEORO de sempre já chegou pra reunião — mas o
 * besouro-hércules da agenda viu o e-mail, solta um É… de desânimo, prende o
 * nó vermelho da alavanca do disjuntor (a mesma da lhama do trem cancelado)
 * na pinça dos chifres e desce com tudo: ÍÍÍNS… TELT! A lâmpada apaga, o fogo
 * do meteoro morre e ele vira pedra cinza e fria, soltando fumacinha.
 *
 * Diorama: carpete cinza-azulado, parede escura ao fundo, mesa branca em T à
 * esquerda com o meteoro na cabeceira, disjuntor na parede à direita com o
 * besouro pendurado pelo chifre na alavanca puxada até embaixo.
 */

const SOLO = '#2b3036'
const CARPETE = '#5b6876'
const CARPETE_ESC = '#525e6b'
const PAREDE = '#3a4049'
const RODAPE = '#2a2f36'
const MESA = '#e8e6e1'
const MESA_BORDA = '#c9c7c2'
const GRAFITE = '#3d4248'
const CADEIRA = '#8e959d'
const CADEIRA_ESC = '#6d747c'
const ACO = '#a9b0b8'
const PEDRA = '#5c5a58' // meteoro apagado: cinza-chumbo
const PEDRA_ESC = '#403e3c'
const BRASA = '#e0581c'
const FOGO = '#ff6a12'
const FOGO_CLARO = '#ffb431'
const FUMACA = '#aeb3b9'
const CAIXA = '#79828b'
const VERMELHO = '#d42b2b' // acento saturado, RESERVADO à alavanca do disjuntor
const OLIVA = '#7f8d33'
const OLIVA_ESC = '#55601f'
const PRETO = '#1b1a18'
const ASA = '#e2d6b3'

const GY = 0.14 // topo do carpete
const WALL_Z = -1.55 // centro da parede
const WALL_FRONT = WALL_Z + 0.07
const TOPY = GY + 0.66 // tampo da mesa (baixa: o meteoro aparece por cima)
const TABLE_X = -0.62
const MET: [number, number, number] = [TABLE_X, GY + 0.42 + 0.43, -1.16]
const MET_R = 0.45

// disjuntor e alavanca (gira em x: 0.35 = armada pra cima; 2.79 = puxada)
const BOX: [number, number, number] = [1.12, 2.12, WALL_FRONT + 0.07]
const PIVO: [number, number, number] = [BOX[0], BOX[1], WALL_FRONT + 0.16]
const LEVER_L = 0.5
const LEVER_UP = 0.35
const LEVER_DOWN = Math.PI - 0.35
const knobAt = (th: number): [number, number, number] => [
  PIVO[0],
  PIVO[1] + Math.cos(th) * LEVER_L,
  PIVO[2] + Math.sin(th) * LEVER_L,
]
const KNOB_DOWN = knobAt(LEVER_DOWN)
const KNOB_UP = knobAt(LEVER_UP)

function aim(o: THREE.Object3D, dir: THREE.Vector3, axis = new THREE.Vector3(0, 1, 0)) {
  o.quaternion.setFromUnitVectors(axis, dir.clone().normalize())
}

/** Segmento de capsula ligando dois pontos (pernas, chifres, nervuras). */
function bone(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const len = a.distanceTo(b)
  const c = capsule(r, Math.max(0.001, len), color, opts)
  c.position.copy(a).add(b).multiplyScalar(0.5)
  aim(c, b.clone().sub(a))
  return c
}

/** Cadeira cinza de reunião; o assento olha para +z local. */
function makeChair() {
  const g = new THREE.Group()
  const seat = rbox(0.5, 0.07, 0.46, 0.03, CADEIRA, { roughness: 0.6 })
  seat.position.y = 0.42 - 0.035
  g.add(seat)
  const back = rbox(0.5, 0.46, 0.06, 0.03, CADEIRA, { roughness: 0.6 })
  back.position.set(0, 0.71, -0.22)
  back.rotation.x = -0.1
  g.add(back)
  const rail = rbox(0.42, 0.06, 0.07, 0.025, CADEIRA_ESC, { roughness: 0.5 })
  rail.position.set(0, 0.86, -0.235)
  rail.rotation.x = -0.1
  g.add(rail)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = cylinder(0.022, 0.018, 0.4, ACO, { roughness: 0.3, metalness: 0.75 })
      leg.position.set(sx * 0.21, 0.2, sz * 0.19)
      g.add(leg)
    }
    const post = cylinder(0.02, 0.02, 0.34, ACO, { roughness: 0.3, metalness: 0.75 })
    post.position.set(sx * 0.19, 0.57, -0.21)
    g.add(post)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: carpete de placas cinza-azuladas -------------------------------
  const base = new THREE.Group()
  const solo = cylinder(2.62, 2.7, 0.1, SOLO, { roughness: 0.8 })
  solo.position.y = 0.05
  base.add(solo)
  const carpete = cylinder(2.56, 2.58, 0.04, CARPETE, { roughness: 0.95 })
  carpete.position.y = GY - 0.02
  base.add(carpete)
  // placas de carpete (alternando o sentido da trama = tom levemente diferente)
  const T = 0.6
  for (let i = -4; i <= 4; i++) {
    for (let j = -4; j <= 4; j++) {
      const x = i * T
      const z = j * T
      const far = Math.max(
        Math.hypot(x + T / 2, z + T / 2), Math.hypot(x - T / 2, z + T / 2),
        Math.hypot(x + T / 2, z - T / 2), Math.hypot(x - T / 2, z - T / 2),
      )
      if (far > 2.5 || z < WALL_Z) continue
      if ((i + j) % 2 === 0) continue
      const placa = rbox(T - 0.02, 0.008, T - 0.02, 0.003, CARPETE_ESC, { roughness: 0.95 })
      placa.position.set(x, GY + 0.002, z)
      base.add(placa)
    }
  }
  root.add(base)

  // ---- parede ao fundo, cinza-escura de sala apagada -------------------------
  const parede = new THREE.Group()
  const halfW = Math.sqrt(2.6 * 2.6 - WALL_Z * WALL_Z) - 0.02
  const muro = rbox(halfW * 2, 2.62, 0.14, 0.03, PAREDE, { roughness: 0.85 })
  muro.position.set(0, GY + 1.31, WALL_Z)
  parede.add(muro)
  const rodape = rbox(halfW * 2 - 0.04, 0.1, 0.03, 0.01, RODAPE, { roughness: 0.6 })
  rodape.position.set(0, GY + 0.05, WALL_FRONT + 0.015)
  parede.add(rodape)
  // tela de apresentação desligada atrás da cabeceira
  const tela = rbox(1.2, 0.68, 0.05, 0.02, '#202429', { roughness: 0.3 })
  tela.position.set(TABLE_X, 1.95, WALL_FRONT + 0.025)
  parede.add(tela)
  const vidro = rbox(1.1, 0.58, 0.01, 0.005, '#14171b', { roughness: 0.12 })
  vidro.position.set(TABLE_X, 1.95, WALL_FRONT + 0.055)
  parede.add(vidro)
  // conduíte saindo do disjuntor para o teto
  const conduite = cylinder(0.03, 0.03, 0.4, '#5d656d', { roughness: 0.4, metalness: 0.5 })
  conduite.position.set(BOX[0], BOX[1] + 0.33 + 0.2, WALL_FRONT + 0.05)
  parede.add(conduite)
  root.add(parede)

  // ---- mesa branca em T -----------------------------------------------------
  const mesa = new THREE.Group()
  mesa.position.set(TABLE_X, 0, 0)
  root.add(mesa)
  const cadeiras = new THREE.Group() // filhas da mesa: sobem junto
  cadeiras.position.set(-TABLE_X, 0, 0)
  mesa.add(cadeiras)
  const travessa = rbox(1.9, 0.06, 0.5, 0.025, MESA, { roughness: 0.35 })
  travessa.position.set(0, TOPY, -0.5)
  mesa.add(travessa)
  const perna = rbox(0.62, 0.06, 1.3, 0.025, MESA, { roughness: 0.35 })
  perna.position.set(0, TOPY - 0.001, 0.38)
  mesa.add(perna)
  const saia1 = rbox(1.82, 0.08, 0.42, 0.02, MESA_BORDA, { roughness: 0.5 })
  saia1.position.set(0, TOPY - 0.06, -0.5)
  mesa.add(saia1)
  const saia2 = rbox(0.54, 0.08, 1.24, 0.02, MESA_BORDA, { roughness: 0.5 })
  saia2.position.set(0, TOPY - 0.06, 0.38)
  mesa.add(saia2)
  for (const sx of [-1, 1]) {
    const painel = rbox(0.06, TOPY - GY - 0.03, 0.4, 0.02, GRAFITE, { roughness: 0.45 })
    painel.position.set(sx * 0.86, GY + (TOPY - GY) / 2, -0.5)
    mesa.add(painel)
  }
  const painelF = rbox(0.5, TOPY - GY - 0.03, 0.06, 0.02, GRAFITE, { roughness: 0.45 })
  painelF.position.set(0, GY + (TOPY - GY) / 2, 0.96)
  mesa.add(painelF)
  // material de reunião esquecido: bloco, caneta, copos
  const bloco = rbox(0.2, 0.012, 0.26, 0.004, '#f6f1dc', { roughness: 0.8 })
  bloco.position.set(-0.04, TOPY + 0.036, 0.3)
  bloco.rotation.y = 0.2
  mesa.add(bloco)
  const caneta = cylinder(0.008, 0.008, 0.16, '#2d4f8a', { roughness: 0.4 })
  caneta.rotation.set(Math.PI / 2, 0, -0.5)
  caneta.position.set(0.1, TOPY + 0.04, 0.33)
  mesa.add(caneta)
  for (const [cx, cz] of [[-0.55, -0.42], [0.18, 0.72]] as const) {
    const copo = lathe([[0, 0], [0.04, 0], [0.05, 0.11], [0.044, 0.11], [0.035, 0.008], [0, 0.008]], '#d5e2ea', { roughness: 0.15 })
    copo.position.set(cx, TOPY + 0.03, cz)
    mesa.add(copo)
  }

  // ---- três cadeiras: cabeceira + duas ao longo da perna do T ----------------
  const cab = makeChair()
  cab.position.set(TABLE_X, GY, MET[2])
  cadeiras.add(cab)
  const c1 = makeChair()
  c1.position.set(TABLE_X - 0.62, GY, 0.42)
  c1.rotation.y = Math.PI / 2 - 0.12
  cadeiras.add(c1)
  const c2 = makeChair()
  c2.position.set(TABLE_X + 0.62, GY, 0.12)
  c2.rotation.y = -Math.PI / 2 + 0.15
  cadeiras.add(c2)

  // ---- METEORO apagado na cabeceira ------------------------------------------
  const meteoro = new THREE.Group()
  meteoro.position.set(...MET)
  meteoro.rotation.y = 0.15

  const stoneGeo = new THREE.IcosahedronGeometry(MET_R, 2)
  {
    const pos = stoneGeo.attributes.position
    const v = new THREE.Vector3()
    const offsets = new Map<string, number>()
    const r = rng(9)
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i)
      const key = `${v.x.toFixed(4)},${v.y.toFixed(4)},${v.z.toFixed(4)}`
      let k = offsets.get(key)
      if (k === undefined) offsets.set(key, (k = 1 + (r() - 0.5) * 0.14))
      v.multiplyScalar(k)
      pos.setXYZ(i, v.x, v.y, v.z)
    }
    stoneGeo.computeVertexNormals()
  }
  const stone = rock(MET_R, PEDRA, 9, { roughness: 0.92 })
  stone.geometry.dispose()
  stone.geometry = stoneGeo
  stone.scale.set(1.06, 0.94, 1)
  meteoro.add(stone)
  stone.updateMatrixWorld(true)

  const ray = new THREE.Raycaster()
  const surface = (dir: THREE.Vector3) => {
    const d = dir.clone().normalize()
    ray.set(d.clone().multiplyScalar(2), d.clone().negate())
    const hit = ray.intersectObject(stone, false)[0]
    return { p: hit ? hit.point : d.clone().multiplyScalar(MET_R), n: d }
  }

  // crateras
  const craters: [number, number, number, number][] = [
    [0.75, 0.45, 0.2, 0.09], [-0.2, 0.75, -0.5, 0.11], [0.55, -0.2, -0.75, 0.1],
    [-0.8, 0.25, 0.1, 0.08], [0.62, -0.05, 0.6, 0.06], [-0.55, 0.62, 0.4, 0.07],
    [0.3, 0.8, 0.35, 0.06],
  ]
  for (const [x, y, z, r] of craters) {
    const { p, n } = surface(new THREE.Vector3(x, y, z))
    const ring = torus(r, r * 0.3, '#4a4744', { roughness: 0.95, flat: true })
    aim(ring, n, new THREE.Vector3(0, 0, 1))
    ring.scale.z = 0.45
    ring.position.copy(p).addScaledVector(n, -0.012)
    meteoro.add(ring)
    const pit = sphere(r * 0.95, PEDRA_ESC, { roughness: 0.95 })
    pit.scale.set(1, 1, 0.35)
    aim(pit, n, new THREE.Vector3(0, 0, 1))
    pit.position.copy(p).addScaledVector(n, -0.01)
    meteoro.add(pit)
  }

  // três brasinhas quase apagadas nas rachaduras (laranja fraco)
  const crackRand = rng(29)
  const brasas: [number, number, number][] = [[-0.62, -0.25, 0.75], [0.6, 0.35, 0.72], [0.15, -0.6, 0.8]]
  for (const start of brasas) {
    const d = new THREE.Vector3(...start).normalize()
    const tangent = new THREE.Vector3(crackRand() - 0.5, crackRand() - 0.5, crackRand() - 0.5).cross(d).normalize()
    for (let s = 0; s < 3; s++) {
      const { p, n } = surface(d)
      const seg = capsule(0.014, 0.08, BRASA, { emissive: BRASA, emissiveIntensity: 0.9 })
      seg.position.copy(p).addScaledVector(n, 0.002)
      seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tangent)
      meteoro.add(seg)
      d.addScaledVector(tangent, 0.18).normalize()
      tangent.applyAxisAngle(d, (crackRand() - 0.5) * 1.8).projectOnPlane(d).normalize()
    }
    const { p, n } = surface(new THREE.Vector3(...start))
    const brilho = sphere(0.03, FOGO_CLARO, { emissive: FOGO, emissiveIntensity: 1.1 })
    brilho.position.copy(p).addScaledVector(n, 0.01)
    meteoro.add(brilho)
  }

  // carinha desanimada: olhos semicerrados e boca em arco pra baixo
  for (const s of [-1, 1]) {
    const { p, n } = surface(new THREE.Vector3(s * 0.32, 0.24, 0.92))
    const eye = sphere(0.078, '#ffffff', { roughness: 0.25 })
    eye.scale.z = 0.55
    aim(eye, n, new THREE.Vector3(0, 0, 1))
    eye.position.copy(p).addScaledVector(n, 0.01)
    meteoro.add(eye)
    const pupil = sphere(0.036, '#141414', { roughness: 0.2 })
    pupil.position.copy(p).addScaledVector(n, 0.046)
    pupil.position.y -= 0.022
    meteoro.add(pupil)
    // pálpebra pesada (metade de cima do olho coberta de pedra)
    const lid = sphere(0.084, PEDRA, { roughness: 0.9 })
    lid.scale.set(1.05, 0.6, 0.62)
    lid.position.copy(p).addScaledVector(n, 0.016)
    lid.position.y += 0.04
    lid.rotation.z = -s * 0.35 // canto de dentro erguido: tristeza, não raiva
    meteoro.add(lid)
  }
  {
    const { p, n } = surface(new THREE.Vector3(0, -0.14, 1))
    const boca = torus(0.07, 0.015, '#1c1a19', { roughness: 0.6 })
    ;(boca.geometry as THREE.TorusGeometry).dispose()
    boca.geometry = new THREE.TorusGeometry(0.07, 0.015, 12, 24, Math.PI)
    aim(boca, n, new THREE.Vector3(0, 0, 1))
    boca.position.copy(p).addScaledVector(n, 0.012)
    boca.position.y -= 0.03
    meteoro.add(boca)
  }
  root.add(meteoro)

  // ---- fogo do meteoro (sub-peça): arde na chegada, morre no ÍNS-TELT --------
  const fogo = new THREE.Group()
  meteoro.add(fogo)
  fogo.scale.setScalar(0.02) // pose final: apagado, recolhido dentro da pedra
  const flames: [number, number, number, number, number][] = [
    // ângulo, inclinação, raio, altura, cor (0 = laranja, 1 = amarelo)
    [0, 0.0, 0.2, 0.75, 0], [1.3, 0.45, 0.16, 0.55, 0], [2.6, 0.5, 0.15, 0.5, 0],
    [3.9, 0.45, 0.16, 0.55, 0], [5.2, 0.5, 0.15, 0.5, 0], [0.6, 0.2, 0.12, 0.5, 1],
    [3.2, 0.25, 0.12, 0.45, 1],
  ]
  for (const [a, tilt, r, h, c] of flames) {
    const f = cone(r, h, c ? FOGO_CLARO : FOGO, { emissive: c ? FOGO_CLARO : FOGO, emissiveIntensity: 1.2 })
    const dir = new THREE.Vector3(Math.sin(tilt) * Math.cos(a), Math.cos(tilt), Math.sin(tilt) * Math.sin(a))
    aim(f, dir)
    f.position.copy(dir).multiplyScalar(MET_R * 0.8 + h / 2)
    fogo.add(f)
  }

  // ---- fumacinha: três fiapos de esferas subindo da pedra ----------------------
  const fumaca = new THREE.Group()
  fumaca.position.set(MET[0], MET[1] + MET_R * 0.85, MET[2])
  root.add(fumaca)
  for (const [fx, fz, seed] of [[-0.2, 0.08, 1], [0.02, -0.04, 2], [0.22, 0.1, 3]] as const) {
    const r = rng(seed + 40)
    for (let k = 0; k < 7; k++) {
      const s = sphere(0.072 - k * 0.0075, FUMACA, { roughness: 0.95 })
      s.position.set(fx + Math.sin(k * 0.9 + seed * 2) * 0.05, 0.02 + k * 0.068, fz + (r() - 0.5) * 0.03)
      fumaca.add(s)
    }
  }

  // ---- lâmpada pendurada apagada (pivô no teto: balança) ------------------------
  const lampada = new THREE.Group()
  const TETO = 3.35
  lampada.position.set(TABLE_X, TETO, -0.48)
  root.add(lampada)
  const fio = cylinder(0.012, 0.012, 0.9, '#1e2125', { roughness: 0.5 })
  fio.position.y = -0.45
  lampada.add(fio)
  const canopla = cylinder(0.035, 0.05, 0.08, '#55595f', { roughness: 0.4, metalness: 0.5 })
  canopla.position.y = -0.92
  lampada.add(canopla)
  const cupula = lathe(
    [[0.27, 0], [0.26, 0.03], [0.2, 0.12], [0.09, 0.2], [0.05, 0.22], [0, 0.225],
      [0, 0.2], [0.04, 0.195], [0.08, 0.18], [0.18, 0.1], [0.245, 0.02], [0.255, 0]],
    '#6c7178',
    { roughness: 0.75, metalness: 0.2 },
  )
  cupula.position.y = -1.18
  lampada.add(cupula)
  const bulbo = sphere(0.075, '#74777b', { roughness: 0.45 })
  bulbo.position.y = -1.19
  lampada.add(bulbo)

  // brilho da lâmpada acesa (sub-peça): some no TELT
  const luz = new THREE.Group()
  luz.position.y = -1.19
  luz.scale.setScalar(0.01)
  lampada.add(luz)
  const halo = sphere(0.11, '#fff2b8', { emissive: '#ffe58a', emissiveIntensity: 1.6 })
  luz.add(halo)

  // ---- notebook no chão com o e-mail do cancelamento ---------------------------
  const notebook = new THREE.Group()
  notebook.position.set(1.0, GY, -0.42)
  notebook.rotation.y = -0.3
  root.add(notebook)
  const teclado = rbox(0.52, 0.03, 0.36, 0.012, '#2f343a', { roughness: 0.4, metalness: 0.4 })
  teclado.position.y = 0.015
  notebook.add(teclado)
  const teclas = rbox(0.44, 0.006, 0.18, 0.003, '#1d2024', { roughness: 0.6 })
  teclas.position.set(0, 0.032, -0.04)
  notebook.add(teclas)
  const dobra = new THREE.Group()
  dobra.position.set(0, 0.03, -0.17)
  dobra.rotation.x = -0.22
  notebook.add(dobra)
  const tampaNb = rbox(0.52, 0.34, 0.02, 0.012, '#2f343a', { roughness: 0.4, metalness: 0.4 })
  tampaNb.position.y = 0.17
  dobra.add(tampaNb)
  const display = rbox(0.47, 0.29, 0.006, 0.004, '#cfe0f2', { emissive: '#9fc3ea', emissiveIntensity: 0.55 })
  display.position.set(0, 0.17, 0.011)
  dobra.add(display)
  // envelope do e-mail na tela
  const env = rbox(0.2, 0.13, 0.006, 0.006, '#ffffff', { roughness: 0.5 })
  env.position.set(0, 0.17, 0.016)
  dobra.add(env)
  for (const sx of [-1, 1]) {
    const aba = rbox(0.115, 0.014, 0.004, 0.003, '#5b6f86', { roughness: 0.5 })
    aba.position.set(sx * 0.05, 0.2, 0.02)
    aba.rotation.z = sx * 0.55
    dobra.add(aba)
  }

  // ---- caixa do disjuntor na parede ------------------------------------------
  const disjuntor = new THREE.Group()
  disjuntor.position.set(...BOX)
  root.add(disjuntor)
  const caixa = rbox(0.5, 0.66, 0.14, 0.04, CAIXA, { roughness: 0.45, metalness: 0.5 })
  disjuntor.add(caixa)
  const tampa = rbox(0.42, 0.58, 0.02, 0.02, '#8a939c', { roughness: 0.4, metalness: 0.5 })
  tampa.position.z = 0.075
  disjuntor.add(tampa)
  const rasgo = rbox(0.09, 0.5, 0.02, 0.02, '#23272c', { roughness: 0.6 })
  rasgo.position.z = 0.088
  disjuntor.add(rasgo)
  for (const sx of [-1, 1]) {
    for (const sy of [-1, 1]) {
      const parafuso = sphere(0.018, '#c4cad0', { roughness: 0.3, metalness: 0.8 })
      parafuso.scale.z = 0.5
      parafuso.position.set(sx * 0.18, sy * 0.26, 0.088)
      disjuntor.add(parafuso)
    }
  }
  // marcas de LIGA (em cima, verde) e DESLIGA (embaixo, cinza)
  const ligado = rbox(0.07, 0.035, 0.012, 0.008, '#6fae6a', { roughness: 0.5 })
  ligado.position.set(-0.13, 0.2, 0.09)
  disjuntor.add(ligado)
  const desligado = rbox(0.07, 0.035, 0.012, 0.008, '#2a2e33', { roughness: 0.5 })
  desligado.position.set(-0.13, -0.2, 0.09)
  disjuntor.add(desligado)

  // ---- alavanca vermelha (gira no eixo x a partir do pivô) ---------------------
  const alavanca = new THREE.Group()
  alavanca.position.set(...PIVO)
  alavanca.rotation.x = LEVER_DOWN // pose final: puxada até embaixo
  root.add(alavanca)
  const eixo = cylinder(0.05, 0.05, 0.16, '#3a3f45', { roughness: 0.35, metalness: 0.7 })
  eixo.rotation.z = Math.PI / 2
  alavanca.add(eixo)
  const haste = capsule(0.035, LEVER_L - 0.08, VERMELHO, { roughness: 0.3 })
  haste.position.y = LEVER_L / 2
  alavanca.add(haste)
  const pomo = sphere(0.08, VERMELHO, { roughness: 0.25 })
  pomo.position.y = LEVER_L
  alavanca.add(pomo)

  // ---- BESOURO-HÉRCULES pendurado pela pinça dos chifres -----------------------
  // origem = nó da alavanca; corpo pendurado de cabeça pra cima, dorso (+z)
  // virado para a câmera, barriga encostada na parede.
  const besouro = new THREE.Group()
  besouro.position.set(...KNOB_DOWN)
  root.add(besouro)
  const Z0 = -0.16 // plano do corpo (a parede fica em z local ≈ −0.33)

  const cabeca = sphere(0.1, PRETO, { roughness: 0.25 })
  cabeca.scale.set(1.1, 0.95, 0.9)
  cabeca.position.set(0, -0.36, Z0 + 0.05)
  besouro.add(cabeca)
  const pronoto = sphere(0.2, PRETO, { roughness: 0.22 })
  pronoto.scale.set(1.18, 0.82, 0.78)
  pronoto.position.set(0, -0.56, Z0 + 0.02)
  besouro.add(pronoto)
  const ventre = sphere(0.24, '#3a3020', { roughness: 0.6 })
  ventre.scale.set(1.0, 1.75, 0.55)
  ventre.position.set(0, -0.98, Z0 - 0.06)
  besouro.add(ventre)
  // élitros verde-oliva entreabertos, com pintas escuras
  for (const s of [-1, 1]) {
    const elitro = new THREE.Group()
    elitro.position.set(s * 0.02, -0.66, Z0 + 0.02)
    elitro.rotation.z = s * 0.12
    const casca = sphere(1, OLIVA, { roughness: 0.22 })
    casca.scale.set(0.155, 0.42, 0.15)
    casca.position.set(s * 0.13, -0.36, 0)
    elitro.add(casca)
    const rand2 = rng(s > 0 ? 5 : 6)
    for (let k = 0; k < 4; k++) {
      const yy = -0.15 - k * 0.13 - rand2() * 0.04
      const t = (yy + 0.36) / 0.42
      const zz = 0.15 * Math.sqrt(Math.max(0, 1 - t * t - 0.12))
      const pinta = sphere(0.022 + rand2() * 0.012, OLIVA_ESC, { roughness: 0.3 })
      pinta.scale.z = 0.4
      pinta.position.set(s * (0.1 + rand2() * 0.07), yy, zz - 0.004)
      elitro.add(pinta)
    }
    besouro.add(elitro)
  }

  // ---- asas translúcidas abertas (sub-peça) ----
  const asas = new THREE.Group()
  besouro.add(asas)
  for (const s of [-1, 1]) {
    const asa = new THREE.Group()
    asa.position.set(s * 0.14, -0.66, Z0 - 0.03)
    asa.rotation.z = s * 0.95
    const membrana = sphere(1, ASA, { roughness: 0.2, detail: 0 })
    membrana.scale.set(0.17, 0.48, 0.012)
    membrana.position.y = -0.44
    const mm = membrana.material as THREE.MeshStandardMaterial
    mm.transparent = true
    mm.opacity = 0.5
    mm.depthWrite = false
    membrana.castShadow = false
    asa.add(membrana)
    for (const [ax, bx, by] of [[0, 0.06, -0.85], [0.02, -0.08, -0.7], [0, 0.11, -0.55]] as const) {
      const v = bone(new THREE.Vector3(ax, -0.04, 0), new THREE.Vector3(bx, by, 0.006), 0.006, '#6b5a3a', { roughness: 0.5 })
      asa.add(v)
    }
    asas.add(asa)
  }

  // ---- chifres, olhos e seis patas (sub-peça, rígida) ----
  const chifre = new THREE.Group()
  besouro.add(chifre)
  const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)
  const chain = (pts: THREE.Vector3[], r0: number, r1: number, color = PRETO) => {
    for (let i = 0; i < pts.length - 1; i++) {
      const t = i / Math.max(1, pts.length - 2)
      chifre.add(bone(pts[i], pts[i + 1], r0 + (r1 - r0) * t, color, { roughness: 0.2 }))
    }
  }
  // chifre torácico: sai do pronoto, sobe pela frente do nó e curva por cima
  chain([V(0, -0.5, Z0 + 0.14), V(0, -0.3, 0.1), V(0, -0.12, 0.125), V(0, 0.02, 0.115), V(0, 0.1, 0.05), V(0, 0.11, -0.02)], 0.045, 0.022)
  // dentinhos do chifre
  for (const [ty, tz] of [[-0.22, 0.135], [-0.06, 0.138]] as const) {
    const dente = cone(0.018, 0.05, PRETO, { roughness: 0.25 })
    dente.position.set(0, ty, tz)
    dente.rotation.x = Math.PI / 2
    chifre.add(dente)
  }
  // chifre da cabeça: menor, por baixo do nó (fecha a pinça)
  chain([V(0, -0.3, Z0 + 0.08), V(0, -0.18, -0.02), V(0, -0.1, -0.06), V(0, -0.07, -0.02)], 0.032, 0.018)

  // olhos: arregalados de desânimo, pálpebra caída
  for (const s of [-1, 1]) {
    const olho = sphere(0.05, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.7
    olho.position.set(s * 0.085, -0.36, Z0 + 0.12)
    chifre.add(olho)
    const pupila = sphere(0.024, '#111111', { roughness: 0.2 })
    pupila.position.set(s * 0.08, -0.375, Z0 + 0.155)
    chifre.add(pupila)
    const palpebra = sphere(0.054, OLIVA_ESC, { roughness: 0.4 })
    palpebra.scale.set(1.05, 0.55, 0.75)
    palpebra.position.set(s * 0.085, -0.33, Z0 + 0.12)
    palpebra.rotation.z = -s * 0.35
    chifre.add(palpebra)
  }

  // patas: [ombro, joelho, pé] — dianteiras agarram a borda da caixa
  const legs: [THREE.Vector3, THREE.Vector3, THREE.Vector3][] = []
  for (const s of [-1, 1]) {
    legs.push([V(s * 0.18, -0.52, Z0 - 0.04), V(s * 0.36, -0.3, -0.2), V(s * 0.24, 0.1, -0.24)])
    legs.push([V(s * 0.17, -0.78, Z0 - 0.08), V(s * 0.46, -0.68, -0.26), V(s * 0.6, -0.92, -0.3)])
    legs.push([V(s * 0.14, -1.08, Z0 - 0.08), V(s * 0.38, -1.18, -0.26), V(s * 0.44, -1.48, -0.3)])
  }
  for (const [a, b, c] of legs) {
    chifre.add(bone(a, b, 0.026, PRETO, { roughness: 0.3 }))
    chifre.add(bone(b, c, 0.02, PRETO, { roughness: 0.3 }))
    const garra = sphere(0.028, PRETO, { roughness: 0.3 })
    garra.position.copy(c)
    chifre.add(garra)
  }

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'parede', group: 'sala', object: parede },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'lampada', group: 'mesa', object: lampada },
    { name: 'luz', group: 'mesa', object: luz },
    { name: 'meteoro', group: 'meteoro', object: meteoro },
    { name: 'fogo', group: 'meteoro', object: fogo },
    { name: 'disjuntor', group: 'disjuntor', object: disjuntor },
    { name: 'alavanca', group: 'disjuntor', object: alavanca },
    { name: 'notebook', group: 'besouro', object: notebook },
    { name: 'besouro', group: 'besouro', object: besouro },
    { name: 'asas', group: 'besouro', object: asas },
    { name: 'chifre', group: 'besouro', object: chifre },
    { name: 'fumaca', group: 'apaga', object: fumaca },
  ]

  // ---- montagem --------------------------------------------------------------
  const scale = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const PULL = 8.2
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma sala de reunião sobe do chão: carpete cinza e a parede ao fundo.',
    }),
    seq('parede-rise', 'parede', 0.3, 0.8, [riseFrom(0, 2.8)], { ease: 'easeOut' }),

    seq('mesa-rise', 'mesa', 1.4, 0.7, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'No meio, a mesa em T de sempre — a da reunião —, com as cadeiras em volta.',
    }),
    seq('lampada-desce', 'lampada', 2.0, 0.7, [ch('position.y', TETO + 1.5, TETO)], { ease: 'easeOut' }),
    seq('luz-acende', 'luz', 2.5, 0.3, scale(0.01, 1), { ease: 'easeOut' }),

    seq('meteoro-cai', 'meteoro', 3.2, 0.7, [
      ch('position.y', MET[1] + 2.6, MET[1]),
      ch('position.x', MET[0] + 0.8, MET[0]),
    ], {
      ease: 'easeIn',
      caption: 'Na cabeceira já chegou o METEORO de sempre: MÖÖ-TE-T — e o T seco no fim é o "A" da reunião.',
    }),
    seq('fogo-arde', 'fogo', 3.2, 0.4, scale(0.3, 1), { ease: 'easeOut' }),

    seq('disjuntor-surge', 'disjuntor', 5.0, 0.5, scale(0.01, 1), {
      ease: 'easeOut',
      caption: 'Na parede, o disjuntor com a alavanca VERMELHA — a mesma da lhama do trem cancelado.',
    }),
    seq('alavanca-arma', 'alavanca', 5.3, 0.5, [...scale(0.01, 1), ch('rotation.x', LEVER_UP, LEVER_UP)], { ease: 'easeOut' }),

    seq('notebook-rise', 'notebook', 6.0, 0.5, [riseFrom(GY, 0.6)], { ease: 'easeOut' }),
    seq('besouro-voa', 'besouro', 6.4, 0.9, [
      ch('position.x', KNOB_UP[0] + 1.4, KNOB_UP[0]),
      ch('position.y', KNOB_UP[1] + 0.5, KNOB_UP[1]),
      ch('position.z', KNOB_UP[2] + 0.6, KNOB_UP[2]),
    ], {
      ease: 'easeOut',
      caption: 'Mas o BESOURO-hércules da agenda viu o e-mail… e solta um É… de desânimo.',
    }),
    seq('asas-batem', 'asas', 6.4, 0.9, [ch('scale.x', 0.4, 1)], { ease: 'easeInOut' }),
    seq('chifre-vem', 'chifre', 6.4, 0.3, scale(0.8, 1), { ease: 'easeOut' }),

    seq('alavanca-puxa', 'alavanca', PULL, 0.45, [ch('rotation.x', LEVER_UP, LEVER_DOWN)], {
      ease: 'easeIn',
      caption: 'Ele prende o nó vermelho na pinça dos chifres e desce com tudo: ÍÍÍNS… TELT!',
    }),
    seq('besouro-desce', 'besouro', PULL, 0.45, [
      ch('position.y', KNOB_UP[1], KNOB_DOWN[1]),
      ch('position.z', KNOB_UP[2], KNOB_DOWN[2]),
    ], { ease: 'easeIn' }),

    seq('luz-apaga', 'luz', PULL + 0.45, 0.15, scale(1, 0.01), {
      caption: 'A lâmpada apaga e o fogo do meteoro morre num chiado: virou pedra cinza e fria.',
    }),
    seq('lampada-balanca', 'lampada', PULL + 0.45, 0.3, [ch('rotation.z', 0, 0.12)], { ease: 'easeOut' }),
    seq('lampada-volta', 'lampada', PULL + 0.75, 0.7, [ch('rotation.z', 0.12, 0)], { ease: 'easeInOut' }),
    seq('fogo-morre', 'fogo', PULL + 0.55, 0.9, scale(1, 0.02), { ease: 'easeIn' }),

    seq('fumaca-sobe', 'fumaca', PULL + 1.7, 1.0, [
      ch('scale.y', 0.05, 1),
      ch('position.y', MET[1] + MET_R * 0.6, MET[1] + MET_R * 0.85),
    ], {
      ease: 'easeOut',
      caption: 'Mötet är inställt. — A reunião foi cancelada.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.35, 2.6, 4.25], target: [0.25, 1.22, -0.48] },
  }
}

export const card: Card = {
  meta: {
    id: 'motet-ar-installt',
    contexto:
      "Trabalho: o aviso no Teams/Outlook, o colega na porta da sala vazia, o chefe no corredor. Serve pra qualquer coisa marcada: 'Konserten är inställd', 'Lektionen är inställd', 'Tåget är inställt'.",
    fraseFonte: 'A reunião foi cancelada.',
    fraseAlvo: 'Mötet är inställt.',
    pronuncia:
      "MÖÖ-tet é ÍN-stelt ('mötet' com a força no MÖ — Ö LONGO, lábios de Ô e língua de Ê —, o -te fraquinho de T duro, nunca 'tchi', e um T seco no fim, que é o artigo: 'A reunião'; 'är' = É aberto e curto, que na fala quase some; 'inställt' com a força no ÍN — I curto e N de língua, sem nasalar —, e o -stelt fraco, mas com É ABERTO, L de verdade (nunca 'téu') e T seco: ÍN-stelt, nunca 'ins-TÉLT')",
    ponteSonora:
      "METE(oro)-T... É... ÍNS-TELT! (5 sílabas: MÖÖ-tet-é-ÍN-stelt; força no MÖÖ e, igual de forte, no ÍN; MÖÖ-TE-T = o METE(oro) de sempre — a reunião da cientista maluca de 'Jag har ett möte' e do touro de 'Kan vi ta det på mötet?' —, com a força no MÊ dito de BICO: língua de Ê, lábios de Ô, LONGO — nunca o MÉT aberto e curto da META do galo de 'Jag är mätt'; o -TE fraquinho, de T duro, nunca 'tchi'; e um T SECO no fim, que é o artigo colado: möte = UMA reunião, mötet = A reunião — a pista é a mesma mesa em T do touro; É = o 'är' de sempre, aberto e curto, que na fala quase some; ÍNS-TELT = o MESMO 'inställt' da lhama de 'Är tåget försenat eller inställt?': a alavanca vermelha do disjuntor puxada até o fim — ÍN é o zumbido da luz morrendo, com a FORÇA, I curto e N de ponta de língua, sem nasalar; S-TELT é o estalo da alavanca batendo embaixo: o S colado no T, É ABERTO mas fraco, L de verdade (nunca 'téu') e T seco; ÍN-stelt, jamais 'ins-TÉLT')",
    historia:
      'Na sala da mesa em T, o METEORO de sempre já chegou pra reunião e está na cabeceira, rachado de fogo. Mas o besouro-hércules que cuida da agenda acabou de ver o e-mail. Ele solta um É... de desânimo, voa até a parede, engancha o chifrão na alavanca vermelha do disjuntor — a mesma que a lhama puxou no trem cancelado — e desce com tudo: ÍÍÍNS... TELT! A lâmpada apaga, o fogo do meteoro morre num chiado e ele vira uma pedra cinza e fria, soltando fumacinha. A reunião foi cancelada.',
  },
  createScene,
  refine: { organic: ['besouro'] },
}

export default card
