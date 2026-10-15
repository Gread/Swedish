import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Vänta lite!" — VÉNTA! LÍTE!
 *
 * O porco guloso de babador gruda a VENTA (o focinho, acento rosa-choque) no
 * vidro do forno onde assa o bolo LITE da dieta dele. Bufa tanto que embaça a
 * porta, o garfo treme na pata... mas ele vira a ampulheta: VÉNTA, LÍTE!
 *
 * Composição: forno à esquerda com a porta virada para a frente-direita (o
 * vidro aparece em 3/4 e deixa ver o bolo); porco sentado à direita, corpo em
 * 3/4 para a câmera e cabeça de perfil, focinho achatado no vidro.
 */

const AZUL = '#3f6fb5'
const AZULEJO = '#f1eee6'
const BORDA = '#2e3d55'
const FORNO = '#f4f1ea'
const TRIM = '#2b2f36'
const CROMO = '#c9ced4'
const INTERIOR = '#2a211d'
const BRASA = '#ff8a3d'
const PORCO = '#f2a5b4'
const PORCO_ESC = '#d98495'
const CASCO = '#8a4a55'
const VENTA = '#ff3f7f' // acento saturado, RESERVADO à venta (o focinho)
const BABADOR = '#fbfaf6'
const BOLINHA = '#d6453d'
const BOLO = '#f2c14e'
const BOLO_TOPO = '#d99a2b'
const MADEIRA = '#a8743f'
const AREIA = '#f6b8c6'
const TINTA = '#24324f'

const FY = 0.16 // topo do piso de azulejos

// forno (espaço local: frente = +z)
const OVEN_POS = new THREE.Vector3(-0.62, FY, -0.38)
const OVEN_ROT = 0.75 // porta virada para a frente-direita
const OW = 1.3
const OD = 0.95
const CAV_Y0 = 0.46 // base da cavidade
const CAV_Y1 = 1.16 // teto da cavidade
const TOP_Y = 1.56 // tampo do forno
const DZ = OD / 2 + 0.035 // centro da porta
const WIN_Y0 = 0.55
const WIN_Y1 = 1.08
const WIN_W = 0.9
const CONTACT_X = 0.24 // onde a venta encosta no vidro (x local do forno)
const RACK_Y = 0.5

// porco
const PIG_ROT = -Math.PI / 2 + 0.6 // corpo em 3/4 para a câmera
const HEAD_ROT = -0.75 // pescoço vira a cabeça de perfil para o vidro
const HEAD_POS = new THREE.Vector3(0, 0.95, 0.58)
const HEAD_BACK_Z = 0.5 // pose antes de grudar no vidro: erguida e recuada
const HEAD_BACK_Y = 1.07
const ARM_UP = 2.5 // braço com o garfo erguido (pose final)
const ARM_DOWN = -0.45

const CAM: [number, number, number] = [0.4, 1.75, 4.1]
const CAM_TARGET: [number, number, number] = [0.1, 0.95, -0.1]

const glassify = (m: THREE.Mesh, opacity: number) => {
  const mt = m.material as THREE.MeshStandardMaterial
  mt.transparent = true
  mt.opacity = opacity
  mt.depthWrite = false
  m.castShadow = false
  return m
}

/** Traço de letra: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number) {
  const s = rbox(w, h, 0.02, 0.006, TINTA, { roughness: 0.5 })
  s.position.set(x, y, 0)
  return s
}

/** L I T E — letras de traço grosso, 0.13 de altura. */
function letter(which: 'L' | 'I' | 'T' | 'E') {
  const g = new THREE.Group()
  const t = 0.028
  const h = 0.13
  if (which === 'L') {
    g.add(stroke(t, h, -0.025, 0))
    g.add(stroke(0.075, t, 0.0, -h / 2 + t / 2))
  } else if (which === 'I') {
    g.add(stroke(t, h, 0, 0))
  } else if (which === 'T') {
    g.add(stroke(0.09, t, 0, h / 2 - t / 2))
    g.add(stroke(t, h, 0, 0))
  } else {
    g.add(stroke(t, h, -0.025, 0))
    g.add(stroke(0.075, t, 0.0, h / 2 - t / 2))
    g.add(stroke(0.06, t, -0.007, 0))
    g.add(stroke(0.075, t, 0.0, -h / 2 + t / 2))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- cozinha: piso xadrez azul e branco ---------------------------------
  const base = new THREE.Group()

  const rim = cylinder(2.55, 2.63, 0.1, BORDA, { roughness: 0.7 })
  rim.position.y = 0.05
  base.add(rim)

  const piso = cylinder(2.48, 2.5, 0.06, AZULEJO, { roughness: 0.35 })
  piso.position.y = 0.13
  base.add(piso)

  const T = 0.42
  for (let i = -6; i <= 6; i++) {
    for (let j = -6; j <= 6; j++) {
      if ((i + j) % 2 === 0) continue
      const cx = i * T
      const cz = j * T
      const far = Math.hypot(Math.abs(cx) + T / 2, Math.abs(cz) + T / 2)
      if (far > 2.42) continue
      const tile = rbox(T - 0.025, 0.014, T - 0.025, 0.006, AZUL, { roughness: 0.3 })
      tile.position.set(cx, FY + 0.003, cz)
      base.add(tile)
    }
  }

  // adereços: luva de forno e tigela com batedor
  const luva = new THREE.Group()
  luva.position.set(-0.75, FY, 1.05)
  luva.rotation.y = 0.5 + rand() * 0.3
  const palmaLuva = rbox(0.34, 0.07, 0.22, 0.035, '#c9453b', { roughness: 0.9 })
  palmaLuva.position.y = 0.035
  luva.add(palmaLuva)
  const dedao = rbox(0.13, 0.065, 0.09, 0.03, '#c9453b', { roughness: 0.9 })
  dedao.position.set(0.06, 0.033, 0.15)
  dedao.rotation.y = -0.5
  luva.add(dedao)
  const punho = rbox(0.1, 0.075, 0.24, 0.03, AZULEJO, { roughness: 0.9 })
  punho.position.set(-0.2, 0.037, 0)
  luva.add(punho)
  base.add(luva)

  const tigela = new THREE.Group()
  tigela.position.set(-1.45, FY, 0.95)
  const cuia = lathe(
    [[0, 0], [0.1, 0], [0.17, 0.05], [0.2, 0.15], [0.19, 0.155], [0.16, 0.06], [0.09, 0.02], [0, 0.02]],
    '#7fa7d9',
    { roughness: 0.3 },
  )
  tigela.add(cuia)
  const massa = cylinder(0.16, 0.12, 0.05, '#f5e3b0', { roughness: 0.8 })
  massa.position.y = 0.1
  tigela.add(massa)
  const batedor = new THREE.Group()
  batedor.position.set(0.04, 0.12, 0)
  batedor.rotation.z = -0.55
  const caboBat = cylinder(0.02, 0.02, 0.2, MADEIRA, { roughness: 0.6 })
  caboBat.position.y = 0.26
  batedor.add(caboBat)
  for (let k = 0; k < 3; k++) {
    const arame = torus(0.055, 0.007, CROMO, { roughness: 0.25, metalness: 0.8 })
    arame.scale.y = 1.8
    arame.position.y = 0.08
    arame.rotation.y = (k * Math.PI) / 3
    batedor.add(arame)
  }
  tigela.add(batedor)
  base.add(tigela)

  root.add(base)

  // ---- forno branco com porta de vidro escuro -----------------------------
  const forno = new THREE.Group()
  forno.position.copy(OVEN_POS)
  forno.rotation.y = OVEN_ROT
  root.add(forno)

  for (const fx of [-1, 1]) {
    for (const fz of [-1, 1]) {
      const pe = cylinder(0.045, 0.05, 0.08, TRIM, { roughness: 0.5 })
      pe.position.set(fx * (OW / 2 - 0.1), 0.04, fz * (OD / 2 - 0.1))
      forno.add(pe)
    }
  }

  const gaveta = rbox(OW, CAV_Y0 - 0.08, OD, 0.05, FORNO, { roughness: 0.4 })
  gaveta.position.y = 0.08 + (CAV_Y0 - 0.08) / 2
  forno.add(gaveta)
  const frenteGaveta = rbox(OW - 0.14, 0.24, 0.03, 0.02, '#e8e4da', { roughness: 0.4 })
  frenteGaveta.position.set(0, 0.27, OD / 2 + 0.01)
  forno.add(frenteGaveta)
  const puxGaveta = rbox(0.4, 0.035, 0.04, 0.015, CROMO, { roughness: 0.25, metalness: 0.8 })
  puxGaveta.position.set(0, 0.34, OD / 2 + 0.04)
  forno.add(puxGaveta)

  const CAV_H = CAV_Y1 - CAV_Y0
  for (const sx of [-1, 1]) {
    const lado = rbox(0.1, CAV_H + 0.1, OD, 0.04, FORNO, { roughness: 0.4 })
    lado.position.set(sx * (OW / 2 - 0.05), (CAV_Y0 + CAV_Y1) / 2, 0)
    forno.add(lado)
    const forro = rbox(0.01, CAV_H, OD - 0.12, 0.004, INTERIOR, { roughness: 0.6 })
    forro.position.set(sx * (OW / 2 - 0.105), (CAV_Y0 + CAV_Y1) / 2, 0.02)
    forno.add(forro)
  }
  const fundo = rbox(OW, CAV_H + 0.1, 0.1, 0.04, FORNO, { roughness: 0.4 })
  fundo.position.set(0, (CAV_Y0 + CAV_Y1) / 2, -OD / 2 + 0.05)
  forno.add(fundo)
  // o fundo brilha quente: o forno está ligado
  const brasa = rbox(OW - 0.22, CAV_H - 0.04, 0.01, 0.004, '#4a2a1c', {
    emissive: BRASA,
    emissiveIntensity: 0.55,
  })
  brasa.position.set(0, (CAV_Y0 + CAV_Y1) / 2, -OD / 2 + 0.105)
  forno.add(brasa)
  const chao = rbox(OW - 0.2, 0.01, OD - 0.12, 0.004, INTERIOR, { roughness: 0.6 })
  chao.position.set(0, CAV_Y0 + 0.005, 0.02)
  forno.add(chao)
  // resistências incandescentes sob o teto
  for (const rz of [-0.18, 0.12]) {
    const res = cylinder(0.018, 0.018, OW - 0.26, '#ffb070', { emissive: '#ff6a1f', emissiveIntensity: 1.1 })
    res.rotation.z = Math.PI / 2
    res.position.set(0, CAV_Y1 - 0.05, rz)
    forno.add(res)
  }
  // grade
  for (const gx of [-1, 1]) {
    const trilho = cylinder(0.012, 0.012, OD - 0.2, CROMO, { roughness: 0.25, metalness: 0.8 })
    trilho.rotation.x = Math.PI / 2
    trilho.position.set(gx * 0.5, RACK_Y, 0.02)
    forno.add(trilho)
  }
  for (let k = 0; k < 6; k++) {
    const barra = cylinder(0.009, 0.009, 1.0, CROMO, { roughness: 0.25, metalness: 0.8 })
    barra.rotation.z = Math.PI / 2
    barra.position.set(0, RACK_Y, -0.3 + k * 0.12)
    forno.add(barra)
  }

  const tampo = rbox(OW, TOP_Y - CAV_Y1, OD, 0.06, FORNO, { roughness: 0.4 })
  tampo.position.y = (CAV_Y1 + TOP_Y) / 2
  forno.add(tampo)
  const painel = rbox(OW - 0.14, 0.24, 0.03, 0.02, TRIM, { roughness: 0.35 })
  painel.position.set(0, (CAV_Y1 + TOP_Y) / 2 + 0.01, OD / 2 + 0.005)
  forno.add(painel)
  for (const kx of [-0.45, -0.28, 0.28, 0.45]) {
    const botao = cylinder(0.055, 0.06, 0.05, CROMO, { roughness: 0.3, metalness: 0.7 })
    botao.rotation.x = Math.PI / 2
    botao.position.set(kx, (CAV_Y1 + TOP_Y) / 2 + 0.01, OD / 2 + 0.04)
    forno.add(botao)
    const marca = rbox(0.012, 0.05, 0.01, 0.004, TRIM, { roughness: 0.4 })
    marca.position.set(kx, (CAV_Y1 + TOP_Y) / 2 + 0.03, OD / 2 + 0.068)
    forno.add(marca)
  }
  const visor = rbox(0.3, 0.1, 0.012, 0.01, '#0f1d17', { roughness: 0.3 })
  visor.position.set(0, (CAV_Y1 + TOP_Y) / 2 + 0.01, OD / 2 + 0.024)
  forno.add(visor)
  for (const dx of [-0.08, -0.03, 0.03, 0.08]) {
    const digito = rbox(0.03, 0.055, 0.006, 0.004, '#7dffb0', { emissive: '#3dff8a', emissiveIntensity: 0.9 })
    digito.position.set(dx, (CAV_Y1 + TOP_Y) / 2 + 0.01, OD / 2 + 0.032)
    forno.add(digito)
  }

  // porta: moldura branca em volta da janela + vidro escuro
  const DOOR_W = OW - 0.06
  const portaBaixo = rbox(DOOR_W, WIN_Y0 - CAV_Y0, 0.06, 0.025, FORNO, { roughness: 0.4 })
  portaBaixo.position.set(0, (CAV_Y0 + WIN_Y0) / 2, DZ)
  forno.add(portaBaixo)
  const portaCima = rbox(DOOR_W, CAV_Y1 - WIN_Y1, 0.06, 0.025, FORNO, { roughness: 0.4 })
  portaCima.position.set(0, (WIN_Y1 + CAV_Y1) / 2, DZ)
  forno.add(portaCima)
  for (const sx of [-1, 1]) {
    const montante = rbox((DOOR_W - WIN_W) / 2 + 0.02, WIN_Y1 - WIN_Y0 + 0.02, 0.06, 0.02, FORNO, { roughness: 0.4 })
    montante.position.set(sx * (WIN_W / 2 + (DOOR_W - WIN_W) / 4), (WIN_Y0 + WIN_Y1) / 2, DZ)
    forno.add(montante)
  }
  const vidro = rbox(WIN_W + 0.02, WIN_Y1 - WIN_Y0 + 0.02, 0.015, 0.006, '#1c2230', {
    roughness: 0.05,
    detail: 0,
  })
  vidro.position.set(0, (WIN_Y0 + WIN_Y1) / 2, DZ + 0.018)
  glassify(vidro, 0.28)
  forno.add(vidro)
  // puxador cromado com dois apoios
  const puxador = cylinder(0.028, 0.028, DOOR_W - 0.22, CROMO, { roughness: 0.2, metalness: 0.85 })
  puxador.rotation.z = Math.PI / 2
  puxador.position.set(0, CAV_Y1 - 0.05, DZ + 0.12)
  forno.add(puxador)
  for (const sx of [-1, 1]) {
    const apoio = cylinder(0.02, 0.02, 0.1, CROMO, { roughness: 0.2, metalness: 0.85 })
    apoio.rotation.x = Math.PI / 2
    apoio.position.set(sx * (DOOR_W / 2 - 0.15), CAV_Y1 - 0.05, DZ + 0.07)
    forno.add(apoio)
  }

  // ---- bolo amarelo na forma redonda (dentro do forno) --------------------
  const bolo = new THREE.Group()
  bolo.position.set(0.04, RACK_Y + 0.01, 0.12)
  forno.add(bolo)
  const forma = lathe(
    [[0, 0], [0.28, 0], [0.3, 0.02], [0.31, 0.13], [0.33, 0.14], [0.3, 0.14], [0.29, 0.03], [0, 0.03]],
    '#8e979f',
    { roughness: 0.3, metalness: 0.7 },
  )
  bolo.add(forma)
  const massaBolo = lathe(
    [[0, 0.03], [0.29, 0.03], [0.3, 0.15], [0.28, 0.2], [0.2, 0.25], [0.1, 0.27], [0, 0.275]],
    BOLO,
    { roughness: 0.75 },
  )
  bolo.add(massaBolo)
  const crosta = lathe(
    [[0.27, 0.205], [0.2, 0.255], [0.1, 0.277], [0, 0.282]],
    BOLO_TOPO,
    { roughness: 0.8 },
  )
  bolo.add(crosta)

  // ---- bandeirinha LITE espetada no bolo, virada para a câmera -------------
  const bandeira = new THREE.Group()
  bandeira.position.set(0.04, RACK_Y + 0.27, 0.12)
  forno.add(bandeira)
  {
    const flagWorld = new THREE.Vector3(0.04, 0, 0.12)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), OVEN_ROT)
      .add(OVEN_POS)
    const camYaw = Math.atan2(CAM[0] - flagWorld.x, CAM[2] - flagWorld.z)
    bandeira.rotation.y = camYaw - OVEN_ROT
  }
  const palito = cylinder(0.012, 0.012, 0.3, '#e9d3a6', { roughness: 0.6 })
  palito.position.set(-0.19, 0.1, 0)
  bandeira.add(palito)
  const pano = rbox(0.38, 0.19, 0.02, 0.02, '#ffffff', { roughness: 0.7 })
  pano.position.set(0.0, 0.14, 0)
  bandeira.add(pano)
  const letras: ['L' | 'I' | 'T' | 'E', number][] = [['L', -0.115], ['I', -0.04], ['T', 0.03], ['E', 0.12]]
  for (const [g, lx] of letras) {
    const l = letter(g)
    l.position.set(lx, 0.14, 0.018)
    bandeira.add(l)
  }

  // ---- ampulheta de madeira com areia rosa em cima do forno ----------------
  const ampulheta = new THREE.Group()
  ampulheta.position.set(-0.36, TOP_Y + 0.24, 0.05)
  forno.add(ampulheta)
  for (const cy of [-0.215, 0.215]) {
    const tampa = cylinder(0.15, 0.15, 0.045, MADEIRA, { roughness: 0.55 })
    tampa.position.y = cy
    ampulheta.add(tampa)
  }
  for (let k = 0; k < 3; k++) {
    const a = (k / 3) * Math.PI * 2 + 0.4
    const coluna = cylinder(0.018, 0.018, 0.4, MADEIRA, { roughness: 0.55 })
    coluna.position.set(Math.cos(a) * 0.122, 0, Math.sin(a) * 0.122)
    ampulheta.add(coluna)
  }
  const bulbo = lathe(
    [[0.02, -0.195], [0.09, -0.17], [0.105, -0.1], [0.03, -0.015], [0.02, 0], [0.03, 0.015], [0.105, 0.1], [0.09, 0.17], [0.02, 0.195]],
    '#e8f1f6',
    { roughness: 0.05, detail: 0 },
  )
  glassify(bulbo, 0.35)
  ampulheta.add(bulbo)
  // acabou de virar: areia lá em cima, um fiozinho caindo
  const areiaCima = lathe(
    [[0.0, 0.03], [0.05, 0.06], [0.088, 0.1], [0.085, 0.13], [0, 0.135]],
    AREIA,
    { roughness: 0.9 },
  )
  ampulheta.add(areiaCima)
  const fio = cylinder(0.006, 0.006, 0.17, AREIA, { roughness: 0.9 })
  fio.position.y = -0.09
  ampulheta.add(fio)
  const monte = cone(0.05, 0.03, AREIA, { roughness: 0.9 })
  monte.position.y = -0.178
  ampulheta.add(monte)

  // ---- PORCO guloso, sentado e barrigudo ----------------------------------
  const porco = new THREE.Group()
  porco.rotation.y = PIG_ROT
  root.add(porco)

  const anca = sphere(0.4, PORCO, { roughness: 0.6 })
  anca.scale.set(1.05, 0.9, 1)
  anca.position.set(0, 0.36, -0.12)
  porco.add(anca)
  const barriga = sphere(0.45, PORCO, { roughness: 0.6 })
  barriga.scale.set(1, 0.95, 1.05)
  barriga.position.set(0, 0.56, 0.12)
  porco.add(barriga)
  const peito = sphere(0.32, PORCO, { roughness: 0.6 })
  peito.position.set(0, 0.84, 0.32)
  porco.add(peito)

  // pernas traseiras dobradas para a frente
  for (const side of [-1, 1]) {
    const coxa = sphere(0.21, PORCO, { roughness: 0.6 })
    coxa.position.set(side * 0.3, 0.25, 0.2)
    porco.add(coxa)
    const canela = capsule(0.1, 0.16, PORCO, { roughness: 0.6 })
    canela.rotation.x = Math.PI / 2
    canela.position.set(side * 0.32, 0.12, 0.44)
    porco.add(canela)
    const casco = cylinder(0.1, 0.105, 0.08, CASCO, { roughness: 0.5 })
    casco.rotation.x = Math.PI / 2
    casco.position.set(side * 0.32, 0.12, 0.6)
    porco.add(casco)
  }
  // rabinho enrolado
  const rabo = torus(0.06, 0.03, PORCO_ESC, { roughness: 0.6 })
  rabo.position.set(0, 0.42, -0.54)
  porco.add(rabo)

  // braço de lá: estica para a porta (quase abre!)
  const bracoL = new THREE.Group()
  bracoL.position.set(-0.28, 0.9, 0.38)
  bracoL.rotation.set(-0.95, 0, -0.2)
  porco.add(bracoL)
  const bracoLm = capsule(0.085, 0.28, PORCO, { roughness: 0.6 })
  bracoLm.position.y = -0.2
  bracoL.add(bracoLm)
  const cascoL = cylinder(0.085, 0.09, 0.08, CASCO, { roughness: 0.5 })
  cascoL.position.y = -0.41
  bracoL.add(cascoL)

  // ---- babador branco de bolinhas -----------------------------------------
  const babador = new THREE.Group()
  babador.position.set(0, 0.7, 0.62)
  babador.rotation.x = 1.2
  porco.add(babador)
  const pano2 = cylinder(0.27, 0.27, 0.025, BABADOR, { roughness: 0.85 })
  pano2.scale.set(1, 1, 1.15)
  babador.add(pano2)
  const vies = torus(0.27, 0.015, BOLINHA, { roughness: 0.8 })
  vies.rotation.x = Math.PI / 2
  vies.scale.set(1, 1.15, 1)
  babador.add(vies)
  for (const [bx, bz] of [[0, 0], [0.14, 0.1], [-0.14, 0.1], [0.12, -0.15], [-0.12, -0.15], [0, 0.22], [0, -0.24]] as const) {
    const bola = cylinder(0.035, 0.035, 0.01, BOLINHA, { roughness: 0.8 })
    bola.position.set(bx, 0.016, bz)
    babador.add(bola)
  }

  // ---- cabeça de perfil, orelhas caídas -----------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(HEAD_POS)
  cabeca.rotation.y = HEAD_ROT
  porco.add(cabeca)
  const cranio = sphere(0.32, PORCO, { roughness: 0.6 })
  cranio.scale.set(1.05, 0.95, 1.05)
  cabeca.add(cranio)
  for (const side of [-1, 1]) {
    const orelha = sphere(0.14, PORCO_ESC, { roughness: 0.65 })
    orelha.scale.set(0.8, 0.26, 1.2)
    orelha.position.set(side * 0.2, 0.3, -0.04)
    orelha.rotation.set(0.7, 0, side * 0.55)
    cabeca.add(orelha)

    const olho = sphere(0.085, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * 0.17, 0.1, 0.24)
    olho.scale.z = 0.7
    cabeca.add(olho)
    const pupila = sphere(0.045, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.16, 0.1, 0.3)
    cabeca.add(pupila)

    const bochecha = sphere(0.1, PORCO_ESC, { roughness: 0.65 })
    bochecha.scale.set(1, 0.7, 0.6)
    bochecha.position.set(side * 0.2, -0.1, 0.18)
    cabeca.add(bochecha)
  }

  // ---- VENTA: focinho gigante achatado no vidro (acento) -------------------
  const venta = new THREE.Group()
  venta.position.set(0, -0.05, 0.27)
  cabeca.add(venta)
  const tubo = cylinder(0.15, 0.17, 0.18, VENTA, { roughness: 0.5 })
  tubo.rotation.x = Math.PI / 2
  tubo.position.z = 0.07
  venta.add(tubo)
  const disco = cylinder(0.2, 0.2, 0.07, VENTA, { roughness: 0.5 })
  disco.position.z = 0.19
  venta.add(disco)
  for (const side of [-1, 1]) {
    const narina = sphere(0.05, '#8e1f45', { roughness: 0.5 })
    narina.scale.set(0.7, 1, 0.35)
    narina.position.set(side * 0.07, 0, 0.035)
    disco.add(narina)
  }

  // garfo no braço de cá (erguido)
  const bracoR = new THREE.Group()
  bracoR.position.set(0.3, 0.92, 0.3)
  bracoR.rotation.set(ARM_UP, 0, 0.3)
  porco.add(bracoR)
  const bracoRm = capsule(0.09, 0.4, PORCO, { roughness: 0.6 })
  bracoRm.position.y = -0.26
  bracoR.add(bracoRm)
  const cascoR = cylinder(0.09, 0.095, 0.09, CASCO, { roughness: 0.5 })
  cascoR.position.y = -0.53
  bracoR.add(cascoR)

  const garfo = new THREE.Group()
  garfo.position.set(0, -0.55, 0.0)
  bracoR.add(garfo)
  const cabo = rbox(0.045, 0.34, 0.025, 0.012, '#e4e8ee', { roughness: 0.22, metalness: 0.6 })
  cabo.position.y = -0.12
  garfo.add(cabo)
  const pescoco = rbox(0.1, 0.07, 0.022, 0.01, '#e4e8ee', { roughness: 0.22, metalness: 0.6 })
  pescoco.position.y = -0.31
  garfo.add(pescoco)
  for (let k = 0; k < 4; k++) {
    const dente = rbox(0.018, 0.13, 0.018, 0.008, '#e4e8ee', { roughness: 0.22, metalness: 0.6 })
    dente.position.set(-0.039 + k * 0.026, -0.4, 0)
    garfo.add(dente)
  }

  // ---- posiciona o porco: a venta encosta no vidro --------------------------
  root.updateMatrixWorld(true)
  const nWorld = new THREE.Vector3(Math.sin(OVEN_ROT), 0, Math.cos(OVEN_ROT))
  const tip = disco.getWorldPosition(new THREE.Vector3())
  const contactLocal = new THREE.Vector3(CONTACT_X, tip.y - FY, DZ + 0.026 + 0.035)
  const contact = forno.localToWorld(contactLocal.clone())
  porco.position.x += contact.x - tip.x
  porco.position.z += contact.z - tip.z
  porco.position.y = FY
  root.updateMatrixWorld(true)
  {
    // disco paralelo ao vidro: o eixo do cilindro aponta ao longo da normal
    const want = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), nWorld)
    const parentQ = venta.getWorldQuaternion(new THREE.Quaternion())
    disco.quaternion.copy(parentQ.invert().multiply(want))
  }
  const pigY = porco.position.y

  // ---- bafo: três nuvens brancas embaçando o vidro --------------------------
  const bafo = new THREE.Group()
  bafo.position.set(CONTACT_X, contactLocal.y, DZ + 0.05)
  forno.add(bafo)
  for (const [px, py, r, s] of [
    [0.06, 0.2, 0.12, 3],
    [-0.04, -0.21, 0.11, 7],
    [-0.27, -0.16, 0.09, 11],
  ] as const) {
    const nuvem = puff(r, '#ffffff', 5, s, { roughness: 0.9 })
    nuvem.position.set(px, py, 0)
    nuvem.scale.z = 0.35
    nuvem.traverse((o) => {
      const m = o as THREE.Mesh
      if (m.isMesh) glassify(m, 0.82)
    })
    bafo.add(nuvem)
  }
  // o vidro embaçado em volta da venta
  const nevoa = cylinder(0.3, 0.3, 0.004, '#ffffff', { roughness: 0.9, detail: 0 })
  nevoa.rotation.x = Math.PI / 2
  nevoa.scale.set(1.05, 1, 0.8)
  nevoa.position.set(-0.08, -0.02, -0.024)
  glassify(nevoa, 0.38)
  bafo.add(nevoa)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cozinha', object: base },
    { name: 'forno', group: 'forno', object: forno },
    { name: 'bolo', group: 'bolo', object: bolo },
    { name: 'bandeira', group: 'bolo', object: bandeira },
    { name: 'porco', group: 'porco', object: porco },
    { name: 'babador', group: 'porco', object: babador },
    { name: 'cabeca', group: 'porco', object: cabeca },
    { name: 'venta', group: 'venta', object: venta },
    { name: 'bafo', group: 'venta', object: bafo },
    { name: 'bracoR', group: 'garfo', object: bracoR },
    { name: 'garfo', group: 'garfo', object: garfo },
    { name: 'ampulheta', group: 'ampulheta', object: ampulheta },
  ]

  const grow = (from: number, to = 1) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]
  const AY = ampulheta.position.y

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Uma cozinha de azulejos azul e branco brota do chão…',
    }),
    seq('forno-rise', 'forno', 0.9, 0.9, [riseFrom(FY, 1.8)], {
      ease: 'easeOut',
      caption: '…e um forno branco, de porta de vidro escuro, já ligado.',
    }),

    seq('bolo-cresce', 'bolo', 2.4, 0.8, [ch('scale.y', 0.05, 1), ch('scale.x', 0.6, 1), ch('scale.z', 0.6, 1)], {
      ease: 'easeOut',
      caption: 'Lá dentro assa o bolo da dieta, com a bandeirinha: LITE.',
    }),
    seq('bandeira-espeta', 'bandeira', 2.9, 0.6, [ch('position.y', RACK_Y + 0.05, RACK_Y + 0.27)], { ease: 'easeOut' }),

    seq('porco-rise', 'porco', 4.2, 0.9, [riseFrom(pigY, 1.6)], {
      ease: 'easeOut',
      caption: 'Chega o porco guloso, de babador, louco pelo bolo…',
    }),
    seq('cabeca-surge', 'cabeca', 4.2, 0.9, [ch('position.y', HEAD_BACK_Y - 0.25, HEAD_BACK_Y), ch('position.z', HEAD_BACK_Z, HEAD_BACK_Z)], {
      ease: 'easeOut',
    }),
    seq('braco-surge', 'bracoR', 4.2, 0.9, [ch('rotation.x', ARM_DOWN, ARM_DOWN)]),
    seq('babador-poe', 'babador', 4.7, 0.5, grow(0.01), { ease: 'easeOut' }),

    seq('cabeca-gruda', 'cabeca', 5.9, 0.55, [ch('position.z', HEAD_BACK_Z, HEAD_POS.z), ch('position.y', HEAD_BACK_Y, HEAD_POS.y)], {
      ease: 'easeIn',
      caption: '…e gruda a VENTA no vidro. A VENTA gigante: VÉNTA!',
    }),
    seq('venta-incha', 'venta', 5.9, 0.7, [ch('scale.x', 0.55, 1), ch('scale.y', 0.55, 1), ch('scale.z', 1.5, 1)], {
      ease: 'easeOut',
    }),

    seq('bafo-embaca', 'bafo', 7.2, 0.8, grow(0.01), {
      ease: 'easeOut',
      caption: 'Ele bufa tanto que embaça a porta toda.',
    }),

    seq('braco-ergue', 'bracoR', 8.5, 0.6, [ch('rotation.x', ARM_DOWN, ARM_UP)], {
      ease: 'easeOut',
      caption: 'O garfo treme na pata… ele quase abre a porta…',
    }),
    seq('garfo-aparece', 'garfo', 8.5, 0.4, grow(0.01), { ease: 'easeOut' }),
    seq('garfo-treme-a', 'garfo', 9.15, 0.15, [ch('rotation.z', 0, 0.22)]),
    seq('garfo-treme-b', 'garfo', 9.3, 0.15, [ch('rotation.z', 0.22, -0.18)]),
    seq('garfo-treme-c', 'garfo', 9.45, 0.15, [ch('rotation.z', -0.18, 0.12)]),
    seq('garfo-treme-d', 'garfo', 9.6, 0.15, [ch('rotation.z', 0.12, 0)]),

    seq('ampulheta-surge', 'ampulheta', 10.1, 0.45, [...grow(0.01), ch('position.y', AY + 0.3, AY)], {
      ease: 'easeOut',
      caption: '…mas vira a ampulheta e se obriga: VÉNTA, LÍTE!',
    }),
    seq('ampulheta-vira', 'ampulheta', 10.6, 0.7, [ch('rotation.z', Math.PI, 0)], { ease: 'easeInOut' }),

    seq('bafo-pulsa', 'bafo', 11.6, 0.35, grow(1, 1.15), {
      ease: 'easeOut',
      caption: 'Vänta lite! — Espera um pouco!',
    }),
    seq('bafo-assenta', 'bafo', 11.95, 0.45, grow(1.15, 1), { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: CAM_TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'vanta-lite',
    contexto:
      "Ao telefone ('vänta lite, jag ska kolla'), no balcão procurando o cartão, quando alguém fala rápido demais, ou segurando o elevador.",
    fraseFonte: 'Espera um pouco!',
    fraseAlvo: 'Vänta lite!',
    pronuncia:
      "VÉN-ta LÍ-te ('ä' = É ABERTO, como em 'pé'; o N é batido na língua, sem o 'ẽ' nasal do português; 'lite' = LÍ-te, nunca 'láite')",
    ponteSonora:
      "VÉNTA! LÍTE! (4 sílabas, força no VÉN e no LÍ; VÉNTA é a VENTA do porco — o focinho — mas com É ABERTO de 'pé' e o N batido na língua, sem o 'ẽ' nasal do português; LÍTE é o mesmo LITE de 'prata lite' e 'dämpa er lite', dito LÍ-te, nunca 'láite')",
    historia:
      'O porco de babador está colado no vidro do forno onde assa o bolo LITE da dieta dele. A VENTA gigante gruda no vidro e bufa tanto que embaça tudo — a venta VENTA! O garfo treme na pata, ele quase abre a porta... mas vira a ampulheta e se obriga: VÉNTA, LÍTE! Espera um pouco, ainda não tá pronto.',
  },
  createScene,
  refine: { organic: ['porco', 'cabeca', 'venta', 'bracoR'] },
}

export default card
