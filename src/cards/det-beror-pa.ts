import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus,
} from '../rig/helpers'

/**
 * "Det beror på." — DÊ... BARÚR... PÔ!
 *
 * Festa de fim de ano da firma: quem leva a viagem pra Kiruna, vendas ou
 * financeiro? A ÁGUIA apresentadora, de gravata-borboleta dourada, aponta o
 * BARULHÔMETRO gigante com uma asa, põe a outra em concha atrás da cabeça e
 * berra pro salão: DÊ... BARÚR... PÔ! — façam barulho, pô! Os dois lados
 * gritam igualzinho (ondas azuis de um lado, laranja do outro), a agulha
 * treme pra cá e pra lá e trava bem no meio. Quem ganha? Depende.
 *
 * Diorama: tablado de palco de madeira clara com saia de veludo, varal de
 * bandeirinhas no fundo, confete no chão. Acento saturado RESERVADO: o
 * mostrador do barulhômetro (verde | vermelho) e a plaquinha BARÚR.
 */

const TABLADO = '#dcb985'
const TABLADO_LINHA = '#b48c5a'
const SAIA = '#3b3150'
const FRISO = '#b8975a'
const POSTE = '#3a3f47'
const FIO = '#efe6d2'
const BANDEIRAS = ['#e6b54a', '#4f9fa3', '#d9785f', '#f1ebdd', '#8f7fc2']

const AGUIA = '#5b3b26'
const AGUIA_ESC = '#432a1b'
const PENA = '#33221a'
const BRANCO = '#f3f0e8'
const BICO = '#eaa936'
const BICO_ESC = '#c98a22'
const GARRA = '#e2a53c'
const UNHA = '#221c19'
const OURO = '#d8a63a'
const OURO_ESC = '#a87b22'
const GOELA = '#5a1f24'
const LINGUA = '#d97582'

const FACE = '#f6f3ec'
const MOLDURA = '#2d3138'
const CINZA = '#878d95'
const VERDE = '#35b25a' // acento: o mostrador
const VERMELHO = '#e4423a'
const AGULHA = '#16161a'
const LETRA = '#f6f0e2'
const AZUL = '#3f8fe8'
const LARANJA = '#f28a2c'

const GY = 0.28 // topo do tablado

// águia: espaço local com +z = frente
const EAGLE: [number, number, number] = [-0.78, GY, 0.22]
const EAGLE_YAW = 0.24
const HEAD: [number, number, number] = [0, 1.5, 0.06]
const HEAD_YAW = 0.55
const HEAD_PITCH = -0.26 // queixo erguido: berrando pro salão
const HEAD_TILT = 0.12 // a inclinação do "depende…"
const SHOULDER_L: [number, number, number] = [0.3, 1.16, -0.02] // asa que aponta (+x)
const SHOULDER_R: [number, number, number] = [-0.3, 1.16, -0.02] // asa em concha
const SPREAD_E = 0.6 // asas abertas pra cima no pouso
const SPREAD_D = -0.3
const REST_E = -1.31 // asas caídas ao lado do corpo, sem entrar nele
const REST_D = 1.35
const JAW_OPEN = 0.68

// barulhômetro
const METER: [number, number, number] = [1.12, GY, -0.42]
const METER_YAW = -0.18
const PED_H = 0.6
const R = 0.84
const NEEDLE_REST = 1.42 // em repouso: deitada à esquerda (silêncio)

// ondas sonoras: chegam dos dois lados do palco
const WAVE_L: [number, number, number] = [-2.06, 1.34, 0.3]
const WAVE_R: [number, number, number] = [2.3, 1.56, 0.05]

// bandeirinhas
const POLE_X = 2.2
const POLE_Z = -1.5
const POLE_H = 2.45

type V3 = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula ligando dois pontos — ossos de asa, dedos, penas. */
function limb(a: V3, b: V3, r: number, color: string, opts = {}) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const len = Math.max(dir.length(), 0.001)
  const m = capsule(r, len, color, { roughness: 0.85, ...opts })
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/** Pena: cápsula achatada (espessura no z local). */
function feather(a: V3, b: V3, r: number, color: string, flat = 0.32) {
  const m = limb(a, b, r, color, { roughness: 0.8 })
  m.scale.set(1.25, 1, flat)
  return m
}

/**
 * Tubo afunilado ao longo de uma curva (raio interpolado em `radii`). Fica
 * aberto nas pontas: o refino trata malha aberta como detalhe nítido, então o
 * bico não derrete na pele fundida da cabeça.
 */
function taperedTube(points: V3[], radii: number[], color: string, opts = {}) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const TS = 40
  const RS = 20
  const geo = new THREE.TubeGeometry(curve, TS, 1, RS, false)
  const pos = geo.attributes.position
  const nor = geo.attributes.normal
  const n = radii.length - 1
  for (let i = 0; i <= TS; i++) {
    const t = i / TS
    const k = Math.min(Math.floor(t * n), n - 1)
    const r = radii[k] + (radii[k + 1] - radii[k]) * (t * n - k)
    const c = curve.getPointAt(t)
    for (let j = 0; j <= RS; j++) {
      const idx = i * (RS + 1) + j
      pos.setXYZ(idx, c.x + nor.getX(idx) * r, c.y + nor.getY(idx) * r, c.z + nor.getZ(idx) * r)
    }
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(color, { size: 0.3, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Meio-disco extrudado (base reta em y=0, face para +z). */
function halfDisc(r: number, depth: number, color: string, opts = {}) {
  const s = new THREE.Shape()
  s.moveTo(r, 0)
  s.absarc(0, 0, r, 0, Math.PI, false)
  s.lineTo(r, 0)
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.02,
    bevelSize: 0.02,
    bevelSegments: 3,
    curveSegments: 48,
  })
  const m = new THREE.Mesh(geo, mat(color, { size: r * 2, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Faixa em arco do mostrador, de a0 a a1 (rad), entre os raios r0 e r1. */
function band(r0: number, r1: number, a0: number, a1: number, color: string) {
  const s = new THREE.Shape()
  s.moveTo(Math.cos(a0) * r1, Math.sin(a0) * r1)
  s.absarc(0, 0, r1, a0, a1, false)
  s.lineTo(Math.cos(a1) * r0, Math.sin(a1) * r0)
  s.absarc(0, 0, r0, a1, a0, true)
  s.closePath()
  const geo = new THREE.ExtrudeGeometry(s, {
    depth: 0.02,
    bevelEnabled: true,
    bevelThickness: 0.008,
    bevelSize: 0.008,
    bevelSegments: 2,
    curveSegments: 40,
  })
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.4, size: r1 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Arco fino de onda sonora, centrado na direção +x. */
function waveArc(r: number, color: string) {
  const span = 1.7
  const geo = new THREE.TorusGeometry(r, 0.032, 10, 40, span)
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.35, emissive: color, emissiveIntensity: 0.35 }))
  m.rotation.z = -span / 2
  m.castShadow = true
  return m
}

/** Traço de letra da plaquinha: caixinha em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, LETRA, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Meio anel de traço de letra (curva do U). */
function arc(r: number, x: number, y: number, rot: number) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, 0.014, 10, 24, Math.PI), mat(LETRA, { roughness: 0.5 }))
  m.castShadow = true
  m.position.set(x, y, 0)
  m.rotation.z = rot
  m.scale.set(1, 1, 1.15)
  return m
}

type Glyph = 'B' | 'A' | 'R' | 'U'

/** B A R Ú R — letras de traço grosso (altura 0.16 antes da escala). */
function letter(which: Glyph) {
  const g = new THREE.Group()
  const t = 0.026
  if (which === 'B') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.072, t, -0.008, 0.067))
    g.add(stroke(0.072, t, -0.008, 0))
    g.add(stroke(0.072, t, -0.008, -0.067))
    g.add(stroke(t, 0.06, 0.03, 0.036))
    g.add(stroke(t, 0.06, 0.03, -0.036))
  } else if (which === 'A') {
    g.add(stroke(t, 0.17, -0.026, 0, -0.3))
    g.add(stroke(t, 0.17, 0.026, 0, 0.3))
    g.add(stroke(0.06, 0.022, 0, -0.024))
  } else if (which === 'R') {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.07, t, -0.008, 0.067))
    g.add(stroke(0.07, t, -0.008, 0.006))
    g.add(stroke(t, 0.058, 0.03, 0.036))
    g.add(stroke(t, 0.09, 0.026, -0.045, 0.5))
  } else {
    g.add(stroke(t, 0.115, -0.04, 0.0225))
    g.add(stroke(t, 0.115, 0.04, 0.0225))
    g.add(arc(0.04, 0, -0.035, Math.PI))
    // acento agudo: o RÚ forte
    g.add(stroke(0.024, 0.065, 0.012, 0.13, -0.75))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- palco: tablado de madeira clara, saia de veludo, friso de latão -----
  const palco = new THREE.Group()

  const saia = cylinder(2.62, 2.66, GY - 0.05, SAIA, { roughness: 0.92 })
  saia.position.y = (GY - 0.05) / 2
  palco.add(saia)
  // pregas da saia: gomos verticais em volta
  for (let k = 0; k < 36; k++) {
    const a = (k / 36) * Math.PI * 2
    const prega = capsule(0.045, GY - 0.16, SAIA, { roughness: 0.92 })
    prega.position.set(Math.cos(a) * 2.645, (GY - 0.05) / 2, Math.sin(a) * 2.645)
    palco.add(prega)
  }
  const tampo = cylinder(2.6, 2.6, 0.07, TABLADO, { roughness: 0.6 })
  tampo.position.y = GY - 0.035
  palco.add(tampo)
  const friso = torus(2.6, 0.03, FRISO, { roughness: 0.35, metalness: 0.6 })
  friso.rotation.x = Math.PI / 2
  friso.position.y = GY - 0.07
  palco.add(friso)

  // tábuas do tablado correndo de lado a lado (eixo x)
  for (let i = -7; i <= 7; i++) {
    const z = i * 0.34 + 0.05
    const meia = Math.sqrt(Math.max(0, 2.55 * 2.55 - z * z))
    if (meia < 0.2) continue
    const fresta = rbox(meia * 2, 0.008, 0.018, 0.004, TABLADO_LINHA, { roughness: 0.75 })
    fresta.position.set(0, GY + 0.001, z)
    palco.add(fresta)
  }
  for (let i = 0; i < 14; i++) {
    const z = (Math.floor(rand() * 15) - 7) * 0.34 + 0.05 + 0.17
    const x = (rand() - 0.5) * 4.2
    if (Math.hypot(x, z) > 2.35) continue
    const emenda = rbox(0.018, 0.008, 0.32, 0.004, TABLADO_LINHA, { roughness: 0.75 })
    emenda.position.set(x, GY + 0.001, z)
    palco.add(emenda)
  }

  // confete espalhado pelo tablado (longe da águia e do medidor)
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2
    const d = 0.4 + Math.sqrt(rand()) * 1.95
    const x = Math.cos(a) * d
    const z = Math.sin(a) * d
    if (Math.hypot(x - EAGLE[0], z - EAGLE[2]) < 0.55) continue
    if (Math.abs(x - METER[0]) < 0.6 && Math.abs(z - METER[2]) < 0.4) continue
    const cor = BANDEIRAS[Math.floor(rand() * BANDEIRAS.length)]
    const confete = rbox(0.075, 0.008, 0.045, 0.004, cor, { roughness: 0.6 })
    confete.position.set(x, GY + 0.005, z)
    confete.rotation.y = rand() * Math.PI
    palco.add(confete)
  }

  root.add(palco)

  // ---- varal de bandeirinhas no fundo, entre dois postes -------------------
  const bandeirinhas = new THREE.Group()
  root.add(bandeirinhas)

  for (const side of [-1, 1]) {
    const poste = cylinder(0.035, 0.04, POLE_H, POSTE, { roughness: 0.4, metalness: 0.6 })
    poste.position.set(side * POLE_X, GY + POLE_H / 2, POLE_Z)
    bandeirinhas.add(poste)
    const pe = cylinder(0.14, 0.17, 0.05, POSTE, { roughness: 0.4, metalness: 0.6 })
    pe.position.set(side * POLE_X, GY + 0.025, POLE_Z)
    bandeirinhas.add(pe)
    const ponta = sphere(0.06, FRISO, { roughness: 0.3, metalness: 0.6 })
    ponta.position.set(side * POLE_X, GY + POLE_H + 0.04, POLE_Z)
    bandeirinhas.add(ponta)
  }

  const A = new THREE.Vector3(-POLE_X, GY + POLE_H - 0.08, POLE_Z)
  const B = new THREE.Vector3(POLE_X, GY + POLE_H - 0.08, POLE_Z)
  const SAG = 0.5
  const fioAt = (t: number) => {
    const p = A.clone().lerp(B, t)
    p.y -= SAG * 4 * t * (1 - t)
    p.z += 0.25 * 4 * t * (1 - t) // barriga do varal vem um pouco pra frente
    return p
  }
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= 32; i++) pts.push(fioAt(i / 32))
  const fio = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 64, 0.012, 6, false),
    mat(FIO, { roughness: 0.8 }),
  )
  fio.castShadow = true
  bandeirinhas.add(fio)

  const tri = new THREE.Shape()
  tri.moveTo(-0.12, 0)
  tri.lineTo(0.12, 0)
  tri.lineTo(0, -0.26)
  tri.closePath()
  const triGeo = new THREE.ExtrudeGeometry(tri, {
    depth: 0.012, bevelEnabled: true, bevelThickness: 0.006, bevelSize: 0.008, bevelSegments: 2,
  })
  const N_FLAGS = 13
  for (let i = 0; i < N_FLAGS; i++) {
    const t = (i + 0.75) / (N_FLAGS + 0.5)
    const p = fioAt(t)
    const q = fioAt(t + 0.01)
    const bandeira = new THREE.Mesh(triGeo, mat(BANDEIRAS[i % BANDEIRAS.length], { roughness: 0.75, size: 0.26 }))
    bandeira.castShadow = true
    bandeira.position.set(p.x, p.y - 0.01, p.z)
    bandeira.rotation.z = Math.atan2(q.y - p.y, q.x - p.x)
    bandeira.rotation.x = (rand() - 0.5) * 0.25
    bandeirinhas.add(bandeira)
  }

  // ---- BARULHÔMETRO gigante ------------------------------------------------
  const medidor = new THREE.Group()
  medidor.position.set(...METER)
  medidor.rotation.y = METER_YAW
  root.add(medidor)

  const sapata = rbox(0.98, 0.08, 0.6, 0.03, MOLDURA, { roughness: 0.5 })
  sapata.position.y = 0.04
  medidor.add(sapata)
  const pedestal = rbox(0.82, PED_H - 0.08, 0.46, 0.06, CINZA, { roughness: 0.4, metalness: 0.35 })
  pedestal.position.y = 0.08 + (PED_H - 0.08) / 2
  medidor.add(pedestal)
  // parafusos nos cantos do pedestal
  for (const sx of [-1, 1]) {
    for (const sy of [0.17, PED_H - 0.08]) {
      const parafuso = cylinder(0.022, 0.022, 0.02, MOLDURA, { roughness: 0.3, metalness: 0.7 })
      parafuso.rotation.x = Math.PI / 2
      parafuso.position.set(sx * 0.35, sy, 0.235)
      medidor.add(parafuso)
    }
  }

  const DIAL_Y = PED_H
  const caixa = halfDisc(R + 0.08, 0.16, MOLDURA, { roughness: 0.45 })
  caixa.position.set(0, DIAL_Y, -0.12)
  medidor.add(caixa)
  const rodape = rbox(2 * (R + 0.1), 0.1, 0.24, 0.035, MOLDURA, { roughness: 0.45 })
  rodape.position.set(0, DIAL_Y + 0.02, -0.03)
  medidor.add(rodape)
  const face = halfDisc(R, 0.02, FACE, { roughness: 0.35 })
  face.position.set(0, DIAL_Y + 0.07, 0.04)
  medidor.add(face)

  const DY = DIAL_Y + 0.07
  const verde = band(0.6 * R, 0.9 * R, Math.PI / 2 + 0.07, Math.PI - 0.1, VERDE)
  verde.position.set(0, DY, 0.075)
  medidor.add(verde)
  const vermelho = band(0.6 * R, 0.9 * R, 0.1, Math.PI / 2 - 0.07, VERMELHO)
  vermelho.position.set(0, DY, 0.075)
  medidor.add(vermelho)

  // marcas da escala; a do meio é maior (é onde a agulha trava)
  for (let k = 0; k <= 10; k++) {
    const a = 0.1 + (k / 10) * (Math.PI - 0.2)
    const mid = k === 5
    const len = mid ? 0.16 : 0.07
    const rr = 0.52 * R - (mid ? 0.03 : 0)
    const marca = rbox(mid ? 0.034 : 0.022, len, 0.02, 0.008, MOLDURA, { roughness: 0.5 })
    marca.position.set(Math.cos(a) * rr, DY + Math.sin(a) * rr, 0.08)
    marca.rotation.z = a - Math.PI / 2
    medidor.add(marca)
  }
  // a marca do meio também corta as faixas (o "empate")
  const divisa = rbox(0.022, 0.3 * R + 0.04, 0.03, 0.008, MOLDURA, { roughness: 0.5 })
  divisa.position.set(0, DY + 0.75 * R, 0.085)
  medidor.add(divisa)

  // ---- agulha preta (pivô no cubo, no pé do mostrador) ---------------------
  const agulha = new THREE.Group()
  agulha.position.set(0, DY + 0.04, 0.13)
  medidor.add(agulha)

  const NEEDLE_LEN = 0.86 * R
  const haste = cone(0.06, NEEDLE_LEN, AGULHA, { roughness: 0.35 }, 4)
  haste.scale.set(1, 1, 0.35)
  haste.rotation.y = Math.PI / 4
  haste.position.y = NEEDLE_LEN / 2
  agulha.add(haste)
  const cubo = cylinder(0.085, 0.085, 0.06, AGULHA, { roughness: 0.35 })
  cubo.rotation.x = Math.PI / 2
  agulha.add(cubo)
  const tampa = sphere(0.045, FRISO, { roughness: 0.25, metalness: 0.7 })
  tampa.scale.z = 0.6
  tampa.position.z = 0.035
  agulha.add(tampa)

  // ---- plaquinha BARÚR no pedestal -----------------------------------------
  const placa = new THREE.Group()
  placa.position.set(0, 0.08 + (PED_H - 0.08) / 2 + 0.01, 0.245)
  medidor.add(placa)
  const chapa = rbox(0.7, 0.26, 0.03, 0.035, MOLDURA, { roughness: 0.45 })
  placa.add(chapa)
  const letras = new THREE.Group()
  letras.position.set(0, -0.012, 0.022)
  letras.scale.setScalar(0.95)
  placa.add(letras)
  const glyphs: [Glyph, number][] = [['B', -0.25], ['A', -0.12], ['R', 0.0], ['U', 0.13], ['R', 0.26]]
  for (const [glyph, lx] of glyphs) {
    const l = letter(glyph)
    l.position.x = lx
    letras.add(l)
  }

  // ---- ÁGUIA apresentadora (+z local = frente) ------------------------------
  const aguia = new THREE.Group()
  aguia.position.set(...EAGLE)
  aguia.rotation.y = EAGLE_YAW
  root.add(aguia)

  const torso = sphere(0.37, AGUIA, { roughness: 0.85 })
  torso.scale.set(1, 1.3, 0.92)
  torso.position.set(0, 0.9, -0.03)
  aguia.add(torso)
  const peito = sphere(0.31, AGUIA, { roughness: 0.85 })
  peito.position.set(0, 1.0, 0.12)
  aguia.add(peito)
  const ventre = sphere(0.27, AGUIA, { roughness: 0.85 })
  ventre.scale.set(1, 0.85, 0.92)
  ventre.position.set(0, 0.62, 0.04)
  aguia.add(ventre)

  // calças de pena, tarsos e garras amarelas plantadas no tablado
  for (const side of [-1, 1]) {
    // a coxa sai de dentro da barriga: a pele fundida vira "calça" de pena
    aguia.add(limb([side * 0.12, 0.64, 0.04], [side * 0.16, 0.32, 0.08], 0.115, AGUIA_ESC, { roughness: 0.88 }))
    const barra = sphere(0.125, AGUIA_ESC, { roughness: 0.88 })
    barra.scale.set(1, 0.55, 1)
    barra.position.set(side * 0.165, 0.27, 0.085)
    aguia.add(barra)

    const fx = side * 0.17
    aguia.add(limb([fx, 0.28, 0.08], [fx, 0.08, 0.1], 0.045, GARRA, { roughness: 0.55 }))
    for (const d of [-0.5, 0, 0.5]) {
      const a = d + side * 0.12
      const tip: V3 = [fx + Math.sin(a) * 0.17, 0.034, 0.1 + Math.cos(a) * 0.17]
      aguia.add(limb([fx, 0.05, 0.1], tip, 0.034, GARRA, { roughness: 0.55 }))
      // unha preta curva: sai da ponta do dedo e crava no tablado
      const unha = cone(0.024, 0.085, UNHA, { roughness: 0.3 })
      const dir = new THREE.Vector3(Math.sin(a), -0.9, Math.cos(a)).normalize()
      unha.quaternion.setFromUnitVectors(UP, dir)
      unha.position.set(tip[0] + Math.sin(a) * 0.035, 0.03, tip[2] + Math.cos(a) * 0.035)
      aguia.add(unha)
    }
    aguia.add(limb([fx, 0.05, 0.08], [fx, 0.034, -0.07], 0.032, GARRA, { roughness: 0.55 }))
  }

  // cauda branca em leque, apoiada no tablado atrás
  for (let k = -2; k <= 2; k++) {
    aguia.add(feather([k * 0.05, 0.62, -0.28], [k * 0.09, 0.34, -0.58], 0.055, BRANCO, 0.4))
  }

  // ---- gravata-borboleta dourada --------------------------------------------
  const gravata = new THREE.Group()
  gravata.position.set(0, 1.2, 0.38)
  gravata.rotation.x = -0.25
  aguia.add(gravata)
  for (const sx of [-1, 1]) {
    const laco = cone(0.085, 0.18, OURO, { roughness: 0.3, metalness: 0.5 }, 24)
    laco.scale.set(1, 1, 0.45)
    laco.rotation.z = (sx * Math.PI) / 2
    laco.position.set(sx * 0.095, 0, 0)
    gravata.add(laco)
    const vinco = rbox(0.014, 0.11, 0.025, 0.006, OURO_ESC, { roughness: 0.35, metalness: 0.5 })
    vinco.position.set(sx * 0.15, 0, 0.03)
    gravata.add(vinco)
  }
  const no = rbox(0.065, 0.075, 0.06, 0.022, OURO, { roughness: 0.3, metalness: 0.5 })
  no.position.z = 0.015
  gravata.add(no)

  // ---- cabeça branca: bico amarelo curvo, olhar duro -----------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(...HEAD)
  cabeca.rotation.order = 'YXZ'
  cabeca.rotation.set(HEAD_PITCH, HEAD_YAW, HEAD_TILT)
  cabeca.scale.setScalar(1.12)
  aguia.add(cabeca)

  const cranio = sphere(0.25, BRANCO, { roughness: 0.8 })
  cranio.scale.set(0.95, 0.98, 1.08)
  cabeca.add(cranio)
  const nuca = sphere(0.25, BRANCO, { roughness: 0.82 })
  nuca.scale.set(1.08, 0.85, 1.0)
  nuca.position.set(0, -0.2, -0.04)
  cabeca.add(nuca)

  // bico de cima: base larga (cera) afunilando num gancho que curva pra baixo
  const bico = new THREE.Group()
  bico.position.set(0, -0.02, 0.17)
  bico.scale.set(0.88, 1.25, 1.0)
  cabeca.add(bico)
  bico.add(taperedTube(
    [[0, 0.0, -0.05], [0, 0.015, 0.06], [0, 0.005, 0.15], [0, -0.03, 0.225], [0, -0.085, 0.27], [0, -0.14, 0.275], [0, -0.185, 0.25]],
    [0.1, 0.094, 0.072, 0.052, 0.036, 0.022, 0.004],
    BICO,
    { roughness: 0.4 },
  ))
  // narinas
  for (const sx of [-1, 1]) {
    const narina = sphere(0.016, BICO_ESC, { roughness: 0.5 })
    narina.scale.set(0.6, 0.6, 1.4)
    narina.position.set(sx * 0.085, 0.035, 0.07)
    bico.add(narina)
  }

  // goela escura entre as duas metades do bico
  const goela = sphere(0.075, GOELA, { roughness: 0.6 })
  goela.scale.set(0.85, 0.75, 0.6)
  goela.position.set(0, -0.11, 0.22)
  cabeca.add(goela)

  // olhos amarelo-claros, pálpebra baixa e sobrancelha pesada (olhar duro)
  for (const sx of [-1, 1]) {
    const iris = sphere(0.058, '#f2d96a', { roughness: 0.25 })
    iris.scale.z = 0.6
    iris.position.set(sx * 0.125, 0.05, 0.205)
    cabeca.add(iris)
    const pupila = sphere(0.027, '#141414', { roughness: 0.2 })
    pupila.position.set(sx * 0.12, 0.045, 0.24)
    cabeca.add(pupila)
    const brilho = sphere(0.009, '#ffffff', { roughness: 0.1 })
    brilho.position.set(sx * 0.108, 0.062, 0.252)
    cabeca.add(brilho)
    const palpebra = sphere(0.062, BRANCO, { roughness: 0.8 })
    palpebra.scale.set(1.08, 0.55, 0.72)
    palpebra.position.set(sx * 0.125, 0.085, 0.208)
    palpebra.rotation.z = sx * 0.32
    cabeca.add(palpebra)
    // sobrancelha rente ao crânio (sem virar "orelha" de coruja na silhueta)
    const sobrancelha = capsule(0.03, 0.1, BRANCO, { roughness: 0.82 })
    sobrancelha.scale.set(1, 1, 0.5)
    sobrancelha.position.set(sx * 0.11, 0.1, 0.205)
    sobrancelha.rotation.z = Math.PI / 2 + sx * 0.3
    cabeca.add(sobrancelha)
  }

  // ---- bico de baixo (dobradiça: abre no berro) ----------------------------
  const mandibula = new THREE.Group()
  mandibula.position.set(0, -0.085, 0.19)
  mandibula.rotation.x = JAW_OPEN
  cabeca.add(mandibula)
  const jaw = new THREE.Group()
  jaw.scale.set(0.88, 1.08, 1.08)
  mandibula.add(jaw)
  jaw.add(taperedTube(
    [[0, 0.01, -0.03], [0, -0.008, 0.07], [0, -0.006, 0.15], [0, 0.008, 0.21]],
    [0.052, 0.046, 0.03, 0.006],
    BICO,
    { roughness: 0.4 },
  ))
  const lingua = sphere(0.04, LINGUA, { roughness: 0.4 })
  lingua.scale.set(0.9, 0.45, 1.5)
  lingua.position.set(0, 0.035, 0.09)
  jaw.add(lingua)

  // ---- asa esquerda: aberta, apontando o barulhômetro ----------------------
  const asaE = new THREE.Group()
  asaE.position.set(...SHOULDER_L)
  aguia.add(asaE)
  {
    // estendida quase na horizontal, mirando a ponta da agulha
    const E: V3 = [0.26, 0.04, 0.03]
    const W: V3 = [0.5, 0.09, 0.04]
    asaE.add(limb([0, 0, 0], E, 0.11, AGUIA))
    asaE.add(limb(E, W, 0.085, AGUIA))
    const coberta = sphere(0.27, AGUIA, { roughness: 0.85 })
    coberta.scale.set(1.05, 0.42, 0.22)
    coberta.position.set(0.27, -0.06, 0.02)
    coberta.rotation.z = 0.12
    asaE.add(coberta)
    // secundárias penduradas no braço
    for (let k = 0; k < 4; k++) {
      const t = 0.25 + k * 0.2
      const b: V3 = [W[0] * t, W[1] * t - 0.06, 0.0]
      asaE.add(feather(b, [b[0] + 0.1 + k * 0.03, b[1] - 0.26 + k * 0.03, -0.01], 0.05, AGUIA_ESC))
    }
    // primárias: a de cima, comprida e reta, é o "dedo" que aponta
    const prim: [number, number][] = [[0.1, 0.46], [-0.16, 0.34], [-0.42, 0.3], [-0.68, 0.26], [-0.94, 0.23]]
    for (const [a, len] of prim) {
      const tip: V3 = [W[0] + Math.cos(a) * len, W[1] + Math.sin(a) * len, W[2] - 0.02]
      asaE.add(feather(W, tip, 0.045, PENA))
    }
  }

  // ---- asa direita: dobrada em concha atrás da cabeça ("mais alto!") -------
  const asaD = new THREE.Group()
  asaD.position.set(...SHOULDER_R)
  aguia.add(asaD)
  {
    // cotovelo erguido pro lado, punho atrás da orelha
    const E: V3 = [-0.44, 0.1, -0.02]
    const W: V3 = [-0.1, 0.12, 0.0]
    asaD.add(limb([0, 0, 0], E, 0.105, AGUIA))
    asaD.add(limb(E, W, 0.085, AGUIA))
    const coberta = sphere(0.22, AGUIA, { roughness: 0.85 })
    coberta.scale.set(1.0, 0.45, 0.3)
    coberta.position.set(-0.26, 0.04, -0.04)
    coberta.rotation.z = 0.25
    asaD.add(coberta)
    // a "mão" em concha: penas JUNTAS subindo rente à orelha, pontas
    // curvadas pra frente (o gesto de "não ouvi, mais alto!")
    const tips: V3[] = [
      [-0.04, 0.5, 0.06],
      [0.0, 0.53, 0.12],
      [0.04, 0.51, 0.18],
      [0.07, 0.45, 0.24],
    ]
    for (const tip of tips) {
      const mid: V3 = [
        W[0] + (tip[0] - W[0]) * 0.55 - 0.03,
        W[1] + (tip[1] - W[1]) * 0.55,
        W[2] + (tip[2] - W[2]) * 0.55 - 0.07,
      ]
      asaD.add(feather(W, mid, 0.052, PENA, 0.42))
      asaD.add(feather(mid, tip, 0.045, PENA, 0.42))
    }
  }

  // ---- ondas sonoras: azul chega da esquerda, laranja da direita -----------
  const ondasAzul = new THREE.Group()
  ondasAzul.position.set(...WAVE_L)
  root.add(ondasAzul)
  const ondasLaranja = new THREE.Group()
  ondasLaranja.position.set(...WAVE_R)
  ondasLaranja.rotation.y = Math.PI // espelhada: abre para -x
  root.add(ondasLaranja)
  for (const r of [0.18, 0.34, 0.5]) {
    ondasAzul.add(waveArc(r, AZUL))
    ondasLaranja.add(waveArc(r, LARANJA))
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'palco', group: 'palco', object: palco },
    { name: 'bandeirinhas', group: 'palco', object: bandeirinhas },
    { name: 'aguia', group: 'aguia', object: aguia },
    { name: 'cabeca', group: 'aguia', object: cabeca },
    { name: 'gravata', group: 'aguia', object: gravata },
    { name: 'asaE', group: 'aguia', object: asaE },
    { name: 'asaD', group: 'aguia', object: asaD },
    { name: 'medidor', group: 'medidor', object: medidor },
    { name: 'agulha', group: 'medidor', object: agulha },
    { name: 'mandibula', group: 'berro', object: mandibula },
    { name: 'placa', group: 'berro', object: placa },
    { name: 'ondasAzul', group: 'barulho', object: ondasAzul },
    { name: 'ondasLaranja', group: 'barulho', object: ondasLaranja },
  ]

  const grow = () => [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)]

  // ---- montagem ------------------------------------------------------------
  const T_WAVES = 8.1
  const T_SWING = 10.3
  const build = [
    seq('palco-rise', 'palco', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Festa de fim de ano da firma: quem leva a viagem pra Kiruna — vendas ou financeiro?',
    }),
    seq('bandeirinhas-descem', 'bandeirinhas', 0.35, 0.9, [ch('position.y', 1.8, 0)], { ease: 'easeOut' }),

    // a águia pousa no palco batendo as asas
    seq('aguia-pousa', 'aguia', 1.8, 0.9, [
      ch('position.y', GY + 2.2, GY),
      ch('position.x', EAGLE[0] - 1.1, EAGLE[0]),
    ], {
      ease: 'easeOut',
      caption: 'Pousa no palco a ÁGUIA apresentadora, de gravata-borboleta dourada…',
    }),
    seq('asaE-pousa', 'asaE', 1.8, 0.9, [ch('rotation.z', SPREAD_E, REST_E)], { ease: 'easeInOut' }),
    seq('asaD-pousa', 'asaD', 1.8, 0.9, [ch('rotation.z', SPREAD_D, REST_D)], { ease: 'easeInOut' }),
    seq('cabeca-olha', 'cabeca', 1.8, 1.1, [ch('rotation.y', -0.5, HEAD_YAW)], { ease: 'easeInOut' }),
    seq('gravata-ajeita', 'gravata', 2.5, 0.5, grow(), { ease: 'easeOut' }),

    seq('medidor-rise', 'medidor', 3.6, 0.9, [riseFrom(METER[1], 2.0)], {
      ease: 'easeOut',
      caption: 'Ela diz que depende — e aponta o BARULHÔMETRO gigante.',
    }),
    seq('agulha-repouso', 'agulha', 3.6, 0.9, [ch('rotation.z', NEEDLE_REST, NEEDLE_REST)]),
    seq('asaE-aponta', 'asaE', 4.3, 0.7, [ch('rotation.z', REST_E, 0)], { ease: 'easeOut' }),

    seq('asaD-concha', 'asaD', 5.7, 0.8, [ch('rotation.z', REST_D, 0)], {
      ease: 'easeInOut',
      caption: 'Asa em concha atrás da cabeça, ela berra pro salão: DÊ… BARÚR… PÔ! — façam barulho, pô!',
    }),
    seq('cabeca-ergue', 'cabeca', 6.2, 0.5, [ch('rotation.x', 0.2, HEAD_PITCH)], { ease: 'easeOut' }),
    seq('bico-abre', 'mandibula', 6.3, 0.35, [ch('rotation.x', 0.02, JAW_OPEN)], { ease: 'easeOut' }),
    seq('placa-acende', 'placa', 6.5, 0.45, grow(), { ease: 'easeOut' }),

    seq('ondasAzul-chegam', 'ondasAzul', T_WAVES, 0.7, [...grow(), ch('position.x', WAVE_L[0] - 0.5, WAVE_L[0])], {
      ease: 'easeOut',
      caption: 'Os dois lados gritam igualzinho, e o eco engole o -LHO: das paredes volta só ba-RÚÚR!',
    }),
    seq('ondasLaranja-chegam', 'ondasLaranja', T_WAVES + 0.15, 0.7, [...grow(), ch('position.x', WAVE_R[0] + 0.5, WAVE_R[0])], {
      ease: 'easeOut',
    }),

    seq('agulha-direita', 'agulha', T_SWING, 0.55, [ch('rotation.z', NEEDLE_REST, -0.8)], {
      ease: 'easeInOut',
      caption: 'A agulha treme, vai pra um lado, pro outro… e trava bem no meio. Quem ganha?',
    }),
    seq('ondasAzul-pulsa', 'ondasAzul', T_SWING, 0.5, [ch('scale.x', 1, 1.18), ch('scale.y', 1, 1.18)]),
    seq('agulha-esquerda', 'agulha', T_SWING + 0.55, 0.45, [ch('rotation.z', -0.8, 0.55)]),
    seq('ondasLaranja-pulsa', 'ondasLaranja', T_SWING + 0.5, 0.5, [ch('scale.x', 1, 1.18), ch('scale.y', 1, 1.18)]),
    seq('ondasAzul-volta', 'ondasAzul', T_SWING + 0.5, 0.5, [ch('scale.x', 1.18, 1), ch('scale.y', 1.18, 1)]),
    seq('agulha-direita2', 'agulha', T_SWING + 1.0, 0.38, [ch('rotation.z', 0.55, -0.3)]),
    seq('ondasLaranja-volta', 'ondasLaranja', T_SWING + 1.0, 0.5, [ch('scale.x', 1.18, 1), ch('scale.y', 1.18, 1)]),
    seq('agulha-esquerda2', 'agulha', T_SWING + 1.38, 0.32, [ch('rotation.z', -0.3, 0.12)]),
    seq('agulha-trava', 'agulha', T_SWING + 1.7, 0.35, [ch('rotation.z', 0.12, 0)], { ease: 'easeOut' }),

    seq('cabeca-depende', 'cabeca', T_SWING + 2.3, 0.5, [ch('rotation.z', 0, HEAD_TILT)], {
      ease: 'easeInOut',
      caption: 'Det beror på. — Depende.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.16, 1.98, 4.3], target: [0.16, 1.3, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-beror-pa',
    contexto:
      "Quando a resposta não é simples: no trabalho ('Hinner du till fredag?' — 'Det beror på'), sobre planos de fim de semana, sobre o tempo. Dá pra completar: 'Det beror på vädret' (depende do tempo).",
    fraseFonte: 'Depende.',
    fraseAlvo: 'Det beror på.',
    pronuncia:
      "dê be-RÚÚR PÔ ('det' = dê, sem o T; 'beror' com a força no RÚ — U FECHADO e LONGO, de 'urso' — e R de um toque só, de 'caro', nos dois lugares; sem o R final vira 'bero', o infinitivo; 'på' = PÔ fechado, e leva força porque fecha a frase)",
    ponteSonora:
      "DÊ... BARÚR... PÔ! (4 sílabas: dê-ba-RÚÚR-PÔ; força no RÚ e de novo no PÔ; DÊ = 'det', o 'dê' fechado de sempre, sem T — o mesmo DÊ de 'DÊ, PÔ!' em 'Kan du skicka det på mejl?'; BARÚR = o BARULHO que a águia pede, cortado no RU e com um R BRANDO no lugar do -LHO: ba-RÚR; o BA é fraquinho e apagado, quase um 'bê' engolido — é o 'be-' sem força de 'be-TÜ-der' ('betyder') e 'be-RRÖ-ver' ('behöver'), nunca um BÁ aberto com acento; a força cai no RÚ, U FECHADO e LONGO de 'urso', SEM o bico do Ü; os dois R são de um toque só, de 'caro' — o primeiro já vem certo no próprio baRUlho, nunca o RR de 'rua'; o R do fim é OBRIGATÓRIO: sem ele sobra 'bero', o infinitivo; PÔ = o 'pô!' do português, Ô FECHADO, o mesmo 'på' de 'GRÁTIS, PÔ!' — e aqui leva força, porque fecha a frase; ATENÇÃO ao trio DÊ...PÔ: em 'Kan du skicka det på mejl?' é DÊ, PÔ! colado e depois vem o MÊIL (a pata rica); em 'Kan vi dela på notan?' é DÊ-LA, PÔ! (a onça partindo a nota); aqui, ENTRE o DÊ e o PÔ, ruge o BARULHÔMETRO da águia — BARÚR é o miolo da frase: sem ele sobra só 'det på', e a resposta 'depende' some)",
    historia:
      "Festa de fim de ano da firma, e a dúvida é quem ganha a viagem pra Kiruna: vendas ou financeiro? A ÁGUIA apresentadora diz que depende: aponta o BARULHÔMETRO gigante no palco, põe a asa em concha atrás da cabeça e berra pro salão: 'DÊ... BARÚR... PÔ!' — façam barulho, pô! Os dois lados gritam exatamente igual, e no eco do salão o -LHO se perde: das paredes volta só 'ba-RÚÚR'. A agulha treme, vai pra um lado, pro outro, e trava bem no meio: quem ganha? Depende.",
  },
  createScene,
  refine: { organic: ['aguia', 'cabeca'] },
}

export default card
