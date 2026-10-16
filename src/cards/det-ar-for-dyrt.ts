import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Det är för dyrt." — DÊ É... FÖ! DÜR(o)-T!
 *
 * Na loja de material elétrico, o eletricista vira a etiqueta da lâmpada
 * gigante: o preço dá choque (ZZZT!). Ele recolhe o dedo e sopra em bico (FÖ!),
 * mas a corrente sobe, o cabelo arrepia soltando faíscas e ele fica DURO feito
 * tábua, inclinado pra trás — e o bolso vira do avesso: DURO de vez.
 *
 * Diorama: piso de cerâmica cinza; estante de metal ao fundo com caixas de
 * lâmpadas e um braço de onde pende a lâmpada gigante; eletricista de
 * macacão azul-marinho à direita, virado para a lâmpada à esquerda.
 *
 * Paleta: cinzas frios + azul-marinho + papelão. Acento saturado RESERVADO ao
 * choque: raios e faíscas amarelo-elétrico. A etiqueta e a ponta do dedo
 * queimado dividem o mesmo vermelho (o preço que queima).
 */

const SOIL = '#4d5257'
const TILE = '#b7bcc0'
const GROUT = '#8e959b'
const METAL = '#8a929a'
const METAL_DARK = '#5d656d'
const KRAFT = '#c49a68'
const KRAFT_DARK = '#a37b4d'
const CREAM = '#ece6d6'
const BOX_BLUE = '#7d97b0'
const NAVY = '#263c66'
const NAVY_LIGHT = '#33507f'
const SKIN = '#e8c39e'
const LIPS = '#c9806c'
const HAIR = '#1e1d22'
const LEATHER = '#7a4e2c'
const LEATHER_DARK = '#5a3820'
const LINING = '#efe8d8'
const GLASS = '#f7e7a6'
const BRASS = '#c7a75a'
const RED = '#d23b2f' // etiqueta e dedo queimado
const ZAP = '#ffd21a' // acento saturado: o choque

const GY = 0.18 // topo do piso
const HOOK: [number, number, number] = [-0.82, 2.38, 0.05] // ponto de onde pende a lâmpada
const GLOBE_Y = -1.16 // centro do bulbo (local da lâmpada)
const GLOBE_R = 0.42
const TAG_POS: [number, number, number] = [0.36, -1.02, 0.4] // etiqueta (local da lâmpada)
const ELEC: [number, number, number] = [0.32, GY, 0.28]
const ELEC_YAW = -0.6 // virado para a lâmpada
const ELEC_SCALE = 1.25
const LEAN = -0.26 // inclinação pra trás, no plano da tela (pose final)
const ARM_REST = 0.1 // braços colados ao corpo

/** Ângulos (x, z) que apontam um braço com pivô no ombro na direção d (local do corpo). */
function aim(d: THREE.Vector3): [number, number] {
  const n = d.clone().normalize()
  return [Math.atan2(-n.z, -n.y), Math.asin(n.x)]
}

/** Traço de letra: caixinha de cantos arredondados no plano xy. */
function stroke(w: number, h: number, x: number, y: number, color: string, rot = 0) {
  const s = rbox(w, h, 0.025, 0.008, color, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** Cifrão de traço grosso: S de caixas + barra vertical. */
function cifrao() {
  const g = new THREE.Group()
  const t = 0.032
  const w = 0.11
  const hs = 0.075
  g.add(stroke(w, t, 0, hs, CREAM))
  g.add(stroke(w, t, 0, 0, CREAM))
  g.add(stroke(w, t, 0, -hs, CREAM))
  g.add(stroke(t, hs, -w / 2 + t / 2, hs / 2, CREAM))
  g.add(stroke(t, hs, w / 2 - t / 2, -hs / 2, CREAM))
  const bar = stroke(0.022, 0.25, 0, 0, CREAM)
  bar.position.z = 0.012
  g.add(bar)
  return g
}

/** Raio em zigue-zague no plano xy, saindo da origem no ângulo `ang`. */
function bolt(len: number, ang: number, seed: number) {
  const g = new THREE.Group()
  g.rotation.z = ang
  const rand = rng(seed)
  const m = mat(ZAP, { emissive: ZAP, emissiveIntensity: 0.9, roughness: 0.35 })
  const n = 4
  const pts: THREE.Vector2[] = [new THREE.Vector2(0, 0)]
  for (let i = 1; i <= n; i++) {
    const side = i === n ? 0 : (i % 2 ? 1 : -1) * (0.05 + rand() * 0.03)
    pts.push(new THREE.Vector2((len * i) / n, side))
  }
  for (let i = 0; i < n; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const d = b.clone().sub(a)
    const thick = 0.045 * (1 - i * 0.15)
    const seg = rbox(d.length() + thick, thick, thick, thick * 0.4, ZAP)
    seg.material = m
    seg.position.set((a.x + b.x) / 2, (a.y + b.y) / 2, 0)
    seg.rotation.z = Math.atan2(d.y, d.x)
    g.add(seg)
  }
  const tip = cone(0.035, 0.09, ZAP)
  tip.material = m
  tip.position.set(len + 0.03, 0, 0)
  tip.rotation.z = -Math.PI / 2
  g.add(tip)
  return g
}

/** Faísca: estrela de três traços cruzados. */
function spark(size: number) {
  const g = new THREE.Group()
  const m = mat(ZAP, { emissive: ZAP, emissiveIntensity: 1.1, roughness: 0.3 })
  for (let i = 0; i < 3; i++) {
    const ray = rbox(size, 0.03, 0.03, 0.012, ZAP)
    ray.material = m
    ray.rotation.z = (i * Math.PI) / 3
    g.add(ray)
  }
  const core = sphere(0.035, ZAP)
  core.material = m
  g.add(core)
  return g
}

/** Cilindro fino ligando dois pontos (fios, barbantes). */
function link(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const d = b.clone().sub(a)
  const c = cylinder(r, r, d.length(), color, { roughness: 0.8 }, 10)
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())
  return c
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- piso de cerâmica cinza --------------------------------------------
  const piso = new THREE.Group()
  const soil = cylinder(2.5, 2.6, 0.12, SOIL, { roughness: 0.9 })
  soil.position.y = 0.06
  piso.add(soil)
  const tiles = cylinder(2.44, 2.5, 0.06, TILE, { roughness: 0.4 })
  tiles.position.y = 0.15
  piso.add(tiles)
  // rejunte em grade: cordas do círculo nas duas direções
  for (let k = -4; k <= 4; k++) {
    const c = k * 0.55
    const len = 2 * Math.sqrt(Math.max(2.4 * 2.4 - c * c, 0.01))
    const lx = rbox(len, 0.012, 0.03, 0.006, GROUT, { roughness: 0.8 })
    lx.position.set(0, GY + 0.001, c)
    piso.add(lx)
    const lz = rbox(0.03, 0.012, len, 0.006, GROUT, { roughness: 0.8 })
    lz.position.set(c, GY + 0.001, 0)
    piso.add(lz)
  }
  // caixa de papelão aberta no chão e carretel de fio
  const caixaChao = new THREE.Group()
  caixaChao.position.set(-1.65, GY, 0.55)
  caixaChao.rotation.y = 0.5
  const cc = rbox(0.5, 0.34, 0.4, 0.02, KRAFT, { roughness: 0.85 })
  cc.position.y = 0.17
  caixaChao.add(cc)
  for (const s of [-1, 1]) {
    const flap = rbox(0.5, 0.02, 0.18, 0.008, KRAFT_DARK, { roughness: 0.85 })
    flap.position.set(0, 0.36, s * 0.27)
    flap.rotation.x = s * 0.7
    caixaChao.add(flap)
  }
  const tape = rbox(0.08, 0.3, 0.405, 0.005, '#d9c9a4', { roughness: 0.5 })
  tape.position.set(0.18, 0.17, 0)
  caixaChao.add(tape)
  piso.add(caixaChao)

  const carretel = new THREE.Group()
  carretel.position.set(1.45, GY, 0.6)
  carretel.rotation.set(0, -0.6, Math.PI / 2)
  for (const s of [-1, 1]) {
    const disc = cylinder(0.24, 0.24, 0.04, KRAFT_DARK, { roughness: 0.8 })
    disc.position.y = s * 0.15
    carretel.add(disc)
  }
  const coil = cylinder(0.17, 0.17, 0.26, '#2d2f34', { roughness: 0.55 })
  carretel.add(coil)
  carretel.position.x += 0.0
  carretel.position.y = GY + 0.24
  piso.add(carretel)
  root.add(piso)

  // ---- estante de metal ao fundo ----------------------------------------
  const prateleira = new THREE.Group()
  prateleira.position.set(-0.1, 0, -1.15)
  const SHW = 3.0
  const SHD = 0.5
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const up = rbox(0.07, 2.3, 0.07, 0.015, METAL_DARK, { roughness: 0.4, metalness: 0.6 })
      up.position.set(sx * (SHW / 2 - 0.04), GY + 1.15, sz * (SHD / 2 - 0.04))
      prateleira.add(up)
    }
  }
  const shelfYs = [0.42, 1.02, 1.62, 2.22]
  for (const y of shelfYs) {
    const board = rbox(SHW, 0.05, SHD, 0.015, METAL, { roughness: 0.35, metalness: 0.6 })
    board.position.set(0, GY + y, 0)
    prateleira.add(board)
    const lip = rbox(SHW, 0.08, 0.02, 0.01, METAL_DARK, { roughness: 0.4, metalness: 0.6 })
    lip.position.set(0, GY + y - 0.02, SHD / 2)
    prateleira.add(lip)
  }
  // caixas de lâmpadas: blocos com faixa de rótulo e um bulbo desenhado
  const boxColors = [KRAFT, CREAM, BOX_BLUE, KRAFT, CREAM]
  for (const [si, y] of shelfYs.slice(0, 3).entries()) {
    let x = -SHW / 2 + 0.12
    let k = si
    while (x < SHW / 2 - 0.3) {
      const w = 0.26 + rand() * 0.14
      const h = 0.28 + rand() * 0.18
      const col = boxColors[k % boxColors.length]
      const bx = rbox(w, h, 0.34, 0.015, col, { roughness: 0.8 })
      bx.position.set(x + w / 2, GY + y + 0.025 + h / 2, 0.02)
      bx.rotation.y = (rand() - 0.5) * 0.1
      prateleira.add(bx)
      const label = rbox(w * 0.7, h * 0.32, 0.01, 0.005, col === CREAM ? BOX_BLUE : CREAM, { roughness: 0.7 })
      label.position.set(0, -h * 0.1, 0.172)
      bx.add(label)
      const icon = sphere(Math.min(w, h) * 0.12, col === CREAM ? CREAM : '#f4eccd', { roughness: 0.5 })
      icon.position.set(0, -h * 0.1, 0.18)
      icon.scale.z = 0.3
      bx.add(icon)
      x += w + 0.04
      k++
    }
  }
  // braço de onde pende a lâmpada: sai do topo da estante para a frente
  const armTop = GY + 2.22 + 0.05
  const armLen = HOOK[2] - (-1.15)
  const bracket = rbox(0.07, 0.07, armLen + 0.1, 0.02, METAL_DARK, { roughness: 0.4, metalness: 0.6 })
  bracket.position.set(HOOK[0] + 0.1, armTop + 0.06, armLen / 2 - 0.05)
  prateleira.add(bracket)
  // mão-francesa: chapa triangular presa no montante
  const gusset = rbox(0.03, 0.22, 0.22, 0.01, METAL_DARK, { roughness: 0.4, metalness: 0.6 })
  gusset.position.set(HOOK[0] + 0.1, armTop - 0.06, SHD / 2 + 0.08)
  gusset.rotation.x = Math.PI / 4
  gusset.scale.set(1, 0.7, 0.7)
  prateleira.add(gusset)
  const hookRing = torus(0.04, 0.012, METAL_DARK, { roughness: 0.4, metalness: 0.6 })
  hookRing.position.set(HOOK[0] + 0.1, armTop + 0.0, armLen)
  prateleira.add(hookRing)
  root.add(prateleira)

  // ---- lâmpada gigante pendurada ------------------------------------------
  const lampada = new THREE.Group()
  lampada.position.set(...HOOK)

  const wire = cylinder(0.022, 0.022, 0.3, '#18181b', { roughness: 0.6 })
  wire.position.y = -0.15
  lampada.add(wire)
  const socket = lathe(
    [[0, -0.48], [0.13, -0.48], [0.15, -0.44], [0.15, -0.34], [0.12, -0.32], [0.06, -0.3], [0.05, -0.27], [0, -0.27]],
    '#2b2c30',
    { roughness: 0.45 },
  )
  lampada.add(socket)
  // rosca de latão
  const screw = cylinder(0.14, 0.14, 0.14, BRASS, { roughness: 0.3, metalness: 0.8 })
  screw.position.y = -0.55
  lampada.add(screw)
  for (const ry of [-0.51, -0.56, -0.61]) {
    const thread = torus(0.142, 0.014, BRASS, { roughness: 0.3, metalness: 0.8 })
    thread.rotation.x = Math.PI / 2
    thread.position.y = ry
    lampada.add(thread)
  }
  // vidro: perfil torneado do bulbo, de cabeça pra baixo
  const prof: [number, number][] = []
  const top = -0.62
  prof.push([0.14, top])
  prof.push([0.16, top - 0.08])
  prof.push([0.2, top - 0.18])
  // globo: do ombro do bulbo até o polo de baixo
  for (let i = 0; i <= 14; i++) {
    const t = Math.PI * 0.32 + (Math.PI * 0.68 * i) / 14 // de ~58° acima do equador até o polo de baixo
    const r = Math.sin(Math.PI - t) * GLOBE_R
    const y = GLOBE_Y + Math.cos(t) * GLOBE_R
    prof.push([Math.max(r, 0.001), y])
  }
  prof.reverse()
  prof[0] = [0, GLOBE_Y - GLOBE_R]
  const glassMat = mat(GLASS, { roughness: 0.08, emissive: '#ffd56a', emissiveIntensity: 0.22 })
  glassMat.transparent = true
  glassMat.opacity = 0.7
  glassMat.depthWrite = false
  const vidro = lathe(prof, GLASS)
  vidro.material = glassMat
  vidro.castShadow = false
  lampada.add(vidro)
  // filamento e hastes por dentro
  for (const s of [-1, 1]) {
    const stem = link(new THREE.Vector3(s * 0.04, -0.66, 0), new THREE.Vector3(s * 0.12, GLOBE_Y + 0.05, 0), 0.008, '#8d7f62')
    lampada.add(stem)
  }
  const fil = torus(0.12, 0.012, '#ffb347', { roughness: 0.4 })
  ;(fil.material as THREE.MeshStandardMaterial).emissive = new THREE.Color('#ff9a2a')
  ;(fil.material as THREE.MeshStandardMaterial).emissiveIntensity = 0.8
  fil.scale.y = 0.35
  fil.position.y = GLOBE_Y + 0.05
  lampada.add(fil)
  root.add(lampada)

  // ---- etiqueta de preço vermelha com cifrão (filha da lâmpada) -----------
  const etiqueta = new THREE.Group()
  etiqueta.position.set(...TAG_POS)
  etiqueta.rotation.set(0, 0.22, 0.12)
  const tagBody = rbox(0.3, 0.38, 0.03, 0.04, RED, { roughness: 0.55 })
  etiqueta.add(tagBody)
  // ponta chanfrada de etiqueta (em cima) com ilhós
  const tagTip = rbox(0.21, 0.21, 0.03, 0.03, RED, { roughness: 0.55 })
  tagTip.rotation.z = Math.PI / 4
  tagTip.position.y = 0.19
  etiqueta.add(tagTip)
  const ilhos = torus(0.028, 0.01, CREAM, { roughness: 0.4 })
  ilhos.position.set(0, 0.25, 0.017)
  etiqueta.add(ilhos)
  const sym = cifrao()
  sym.position.set(0, -0.04, 0.018)
  sym.scale.setScalar(1.15)
  etiqueta.add(sym)
  lampada.add(etiqueta)
  // barbante do ilhós até o pescoço do bulbo
  const ilhosLocal = new THREE.Vector3(0, 0.25, 0.017)
  etiqueta.updateMatrix()
  const ilhosL = ilhosLocal.clone().applyMatrix4(etiqueta.matrix)
  const barbante = link(new THREE.Vector3(0.13, -0.7, 0.12), ilhosL, 0.009, '#e9e1cf')
  etiqueta.add(barbante)
  // barbante é filho da etiqueta: converte para o local dela
  const inv = etiqueta.matrix.clone().invert()
  barbante.position.applyMatrix4(inv)
  barbante.quaternion.premultiply(new THREE.Quaternion().setFromRotationMatrix(inv))

  // ---- três raios amarelos saindo da etiqueta -----------------------------
  const raios = new THREE.Group()
  raios.position.set(TAG_POS[0], TAG_POS[1], TAG_POS[2] + 0.05)
  raios.rotation.y = 0.22
  for (const [len, ang, ox, oy] of [
    [0.46, 0.15, 0.16, 0.02],
    [0.36, 1.05, 0.1, 0.16],
    [0.38, -0.85, 0.1, -0.17],
  ] as const) {
    const b = bolt(len, ang, 7 + Math.round(len * 100))
    b.position.set(ox, oy, 0)
    raios.add(b)
  }
  lampada.add(raios)

  // ---- eletricista --------------------------------------------------------
  // contêiner com pivô nos pés: inclina no plano da tela, pra longe da lâmpada
  const eletricista = new THREE.Group()
  eletricista.position.set(...ELEC)
  root.add(eletricista)
  const corpo = person({ body: NAVY, skin: SKIN, height: 1.5, armAngle: ARM_REST })
  corpo.rotation.y = ELEC_YAW
  corpo.scale.setScalar(ELEC_SCALE)
  eletricista.add(corpo)

  // peitilho do macacão, alças e botões
  const bib = rbox(0.3, 0.24, 0.05, 0.03, NAVY_LIGHT, { roughness: 0.85 })
  bib.position.set(0, 0.56, 0.225)
  bib.rotation.x = -0.12
  corpo.add(bib)
  const bolsoPeito = rbox(0.13, 0.08, 0.02, 0.01, NAVY, { roughness: 0.85 })
  bolsoPeito.position.set(0.04, 0.58, 0.252)
  bolsoPeito.rotation.x = -0.12
  corpo.add(bolsoPeito)
  const caneta = cylinder(0.011, 0.011, 0.08, '#d8d8d8', { roughness: 0.4 })
  caneta.position.set(0.0, 0.63, 0.262)
  corpo.add(caneta)
  for (const s of [-1, 1]) {
    const strap = rbox(0.06, 0.22, 0.03, 0.01, NAVY_LIGHT, { roughness: 0.85 })
    strap.position.set(s * 0.12, 0.72, 0.17)
    strap.rotation.set(-0.55, 0, s * 0.08)
    corpo.add(strap)
    const btn = cylinder(0.022, 0.022, 0.02, '#b9bec4', { roughness: 0.3, metalness: 0.7 })
    btn.rotation.x = Math.PI / 2 - 0.12
    btn.position.set(s * 0.12, 0.66, 0.255)
    corpo.add(btn)
  }

  const head = corpo.getObjectByName('head') as THREE.Group

  // cabelo preto: calota rente (sempre lá)
  const calota = sphere(0.288, HAIR, { roughness: 0.85 })
  calota.scale.set(1.0, 0.5, 1.0)
  calota.position.set(0, 0.16, -0.04)
  calota.rotation.x = -0.3
  head.add(calota)

  // olhos arregalados: esclera maior, pupila pequena, sobrancelhas no alto
  for (const s of [-1, 1]) {
    const eye = sphere(0.074, '#ffffff', { roughness: 0.25 })
    eye.position.set(s * 0.105, 0.04, 0.236)
    eye.scale.z = 0.55
    head.add(eye)
    const pupil = sphere(0.024, '#151515', { roughness: 0.2 })
    pupil.position.set(s * 0.1, 0.04, 0.276)
    head.add(pupil)
    const brow = rbox(0.1, 0.022, 0.03, 0.01, HAIR, { roughness: 0.8 })
    brow.position.set(s * 0.11, 0.155, 0.235)
    brow.rotation.set(-0.3, 0, -s * 0.18)
    head.add(brow)
  }
  // boca em bico (FÖ!)
  const bico = torus(0.034, 0.02, LIPS, { roughness: 0.5 })
  bico.position.set(0, -0.12, 0.27)
  head.add(bico)
  const furo = sphere(0.022, '#4a1f1a', { roughness: 0.6 })
  furo.position.set(0, -0.12, 0.262)
  head.add(furo)

  // cabelo espetado (peça própria: arrepia no choque)
  const cabelo = new THREE.Group()
  const up = new THREE.Vector3(0, 1, 0)
  const dirs: THREE.Vector3[] = [new THREE.Vector3(0, 1, 0)]
  for (const [elev, n, off] of [[66, 6, 0.3], [40, 9, 0]] as const) {
    for (let i = 0; i < n; i++) {
      const az = off + (i / n) * Math.PI * 2
      const e = (elev * Math.PI) / 180
      const d = new THREE.Vector3(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e))
      // na testa, a franja espeta pra cima em vez de pra frente
      if (d.z > 0.4) d.set(d.x, d.y + 0.9, d.z * 0.6).normalize()
      dirs.push(d)
    }
  }
  // franja: espetos curtos na linha da testa, apontando pra cima
  const fringe: THREE.Vector3[] = []
  for (let i = 0; i < 5; i++) {
    const az = -0.75 + (i / 4) * 1.5
    const e = 0.42
    fringe.push(new THREE.Vector3(Math.sin(az) * Math.cos(e), Math.sin(e), Math.cos(az) * Math.cos(e)))
  }
  for (const d of fringe) {
    const spike = cone(0.045, 0.14, HAIR, { roughness: 0.85 }, 10)
    const dir = new THREE.Vector3(d.x * 0.6, 1, d.z * 0.5).normalize()
    spike.quaternion.setFromUnitVectors(up, dir)
    spike.position.copy(d).multiplyScalar(0.27).addScaledVector(dir, 0.06)
    cabelo.add(spike)
  }
  for (const [i, d] of dirs.entries()) {
    const h = 0.2 + ((i * 37) % 7) * 0.012
    const spike = cone(0.055, h, HAIR, { roughness: 0.85 }, 10)
    spike.quaternion.setFromUnitVectors(up, d)
    spike.position.copy(d).multiplyScalar(0.25 + h / 2).add(new THREE.Vector3(0, 0.06, -0.03))
    cabelo.add(spike)
  }
  head.add(cabelo)

  // duas faíscas saltando do cabelo
  const faiscas = new THREE.Group()
  const f1 = spark(0.17)
  f1.position.set(-0.3, 0.52, 0.02)
  f1.rotation.z = 0.3
  faiscas.add(f1)
  const f2 = spark(0.14)
  f2.position.set(0.33, 0.46, -0.04)
  f2.rotation.z = -0.2
  faiscas.add(f2)
  head.add(faiscas)

  // cinto de ferramentas com alicate e chave de fenda
  const cinto = new THREE.Group()
  const belt = torus(0.262, 0.036, LEATHER, { roughness: 0.75 })
  belt.rotation.x = Math.PI / 2
  belt.position.y = 0.3
  cinto.add(belt)
  const buckle = rbox(0.09, 0.08, 0.03, 0.012, '#b9bec4', { roughness: 0.3, metalness: 0.7 })
  buckle.position.set(0, 0.3, 0.27)
  cinto.add(buckle)
  const pouch = new THREE.Group()
  pouch.position.set(0.27, 0.22, -0.02)
  pouch.rotation.y = Math.PI / 2 - 0.2
  const bag = rbox(0.2, 0.2, 0.08, 0.03, LEATHER_DARK, { roughness: 0.8 })
  pouch.add(bag)
  // alicate: duas hastes abertas
  for (const s of [-1, 1]) {
    const handle = capsule(0.016, 0.16, '#8c3b32', { roughness: 0.6 })
    handle.position.set(-0.04 + s * 0.02, 0.14, 0.0)
    handle.rotation.z = s * 0.15
    pouch.add(handle)
  }
  const jaw = rbox(0.05, 0.08, 0.025, 0.01, '#9aa1a8', { roughness: 0.3, metalness: 0.7 })
  jaw.position.set(-0.04, 0.26, 0)
  pouch.add(jaw)
  // chave de fenda
  const grip = capsule(0.024, 0.08, '#4e7d4a', { roughness: 0.5 })
  grip.position.set(0.05, 0.16, 0)
  pouch.add(grip)
  const shaft = cylinder(0.008, 0.008, 0.12, '#b9bec4', { roughness: 0.3, metalness: 0.8 })
  shaft.position.set(0.05, 0.27, 0)
  pouch.add(shaft)
  cinto.add(pouch)
  corpo.add(cinto)

  // bolso do macacão virado do avesso, pendurado pra fora
  const bolso = new THREE.Group()
  // frente-direita do quadril, de cara pra câmera; pende girando no próprio plano
  bolso.position.set(0.19, 0.27, 0.18)
  bolso.rotation.set(0.18, -0.69, 0)
  // forro em saquinho: cápsula achatada, fundo arredondado e um vinco
  const forro = capsule(0.1, 0.07, LINING, { roughness: 0.92 })
  forro.position.set(0.03, -0.13, 0)
  forro.scale.set(0.26, 1, 1)
  bolso.add(forro)
  const vinco = rbox(0.01, 0.12, 0.012, 0.004, '#d6ccb4', { roughness: 0.9 })
  vinco.position.set(0.058, -0.12, 0.035)
  vinco.rotation.x = 0.25
  bolso.add(vinco)
  const boca = rbox(0.07, 0.04, 0.21, 0.015, '#d9cfb8', { roughness: 0.92 })
  boca.position.set(0.02, 0, 0)
  bolso.add(boca)
  const costura = rbox(0.012, 0.012, 0.1, 0.004, '#b3a688', { roughness: 0.9 })
  costura.position.set(0.05, -0.25, 0)
  bolso.add(costura)
  const fiapo = capsule(0.008, 0.08, '#b3a688', { roughness: 0.9 })
  fiapo.position.set(0.05, -0.3, 0.03)
  fiapo.rotation.x = 0.4
  bolso.add(fiapo)
  corpo.add(bolso)

  // braços: o direito colado ao corpo (duro); o esquerdo vai à etiqueta e volta à boca
  const armR = corpo.getObjectByName('armR') as THREE.Mesh
  armR.rotation.z = -0.06
  const braco = corpo.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(braco, 1.5)
  const shoulder = braco.position.clone()

  // pose final: mão diante da boca
  const MOUTH_HAND = new THREE.Vector3(-0.03, 0.75, 0.47)
  const [mx, mz] = aim(MOUTH_HAND.clone().sub(shoulder))
  // pose da etiqueta: aponta para a etiqueta (antes de inclinar)
  root.updateMatrixWorld(true)
  const tagWorld = new THREE.Vector3()
  etiqueta.getWorldPosition(tagWorld)
  const tagLocal = corpo.worldToLocal(tagWorld.clone())
  const [rx, rz] = aim(tagLocal.sub(shoulder))
  const REST_Z = ARM_REST

  braco.rotation.set(mx, 0, mz)
  // dedo indicador apontado pra cima com a ponta vermelha
  const handY = braco.children[0].position.y
  const qArm = new THREE.Quaternion().setFromEuler(new THREE.Euler(mx, 0, mz))
  const upArm = new THREE.Vector3(0, 1, 0).applyQuaternion(qArm.clone().invert())
  const fwdArm = new THREE.Vector3(0, 0, 1).applyQuaternion(qArm.clone().invert())
  const fingerBase = new THREE.Vector3(0, handY, 0).addScaledVector(upArm, 0.06).addScaledVector(fwdArm, 0.02)
  const finger = capsule(0.032, 0.11, SKIN, { roughness: 0.6 })
  finger.position.copy(fingerBase).addScaledVector(upArm, 0.07)
  finger.quaternion.setFromUnitVectors(up, upArm)
  braco.add(finger)
  const ponta = sphere(0.036, RED, { roughness: 0.5 })
  ponta.position.copy(fingerBase).addScaledVector(upArm, 0.15)
  braco.add(ponta)

  // nuvenzinha de sopro: da boca até a ponta do dedo
  const sopro = new THREE.Group()
  sopro.position.set(-0.01, 0.92, 0.37)
  const p1 = puff(0.052, '#f7f8f8', 5, 9, { roughness: 0.9 })
  sopro.add(p1)
  const p2 = sphere(0.026, '#f7f8f8', { roughness: 0.9 })
  p2.position.set(0.0, 0.03, 0.08)
  sopro.add(p2)
  const p3 = sphere(0.016, '#f7f8f8', { roughness: 0.9 })
  p3.position.set(0.01, 0.055, 0.13)
  sopro.add(p3)
  corpo.add(sopro)

  // pose final do corpo: duro, inclinado pra trás
  eletricista.rotation.z = LEAN

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'loja', object: piso },
    { name: 'prateleira', group: 'loja', object: prateleira },
    { name: 'eletricista', group: 'eletricista', object: eletricista },
    { name: 'cinto', group: 'eletricista', object: cinto },
    { name: 'lampada', group: 'lampada', object: lampada },
    { name: 'braco', group: 'etiqueta', object: braco },
    { name: 'etiqueta', group: 'etiqueta', object: etiqueta },
    { name: 'raios', group: 'choque', object: raios },
    { name: 'sopro', group: 'sopro', object: sopro },
    { name: 'cabelo', group: 'duro', object: cabelo },
    { name: 'faiscas', group: 'duro', object: faiscas },
    { name: 'bolso', group: 'bolso', object: bolso },
  ]

  const pop = (from = 0.01, to = 1) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('piso-sobe', 'piso', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Na loja de material elétrico, o eletricista vem comprar UMA lâmpada…',
    }),
    seq('prateleira-sobe', 'prateleira', 0.2, 0.9, [riseFrom(0, 2.6)], { ease: 'easeOut' }),
    seq('eletricista-sobe', 'eletricista', 1.0, 0.8, [riseFrom(GY, 1.9), ch('rotation.z', 0, 0)], { ease: 'easeOut' }),
    seq('braco-cai', 'braco', 1.0, 0.7, [ch('rotation.x', 0, 0), ch('rotation.z', 0.6, REST_Z)], { ease: 'easeOut' }),
    seq('cinto-aperta', 'cinto', 1.5, 0.5, pop(1.25, 1), { ease: 'easeOut' }),

    seq('lampada-desce', 'lampada', 2.2, 0.9, [ch('position.y', HOOK[1] + 2.2, HOOK[1])], {
      ease: 'easeOut',
      caption: 'Do braço da estante pende uma lâmpada GIGANTE, com uma etiqueta amarrada.',
    }),
    seq('lampada-balanca-a', 'lampada', 3.1, 0.45, [ch('rotation.z', 0, 0.08)], { ease: 'easeOut' }),
    seq('lampada-balanca-b', 'lampada', 3.55, 0.6, [ch('rotation.z', 0.08, 0)], { ease: 'easeInOut' }),

    seq('braco-estica', 'braco', 3.9, 0.6, [ch('rotation.x', 0, rx), ch('rotation.z', REST_Z, rz)], {
      ease: 'easeInOut',
      caption: 'Ele vira a etiqueta pra ver o preço…',
    }),
    seq('etiqueta-vira', 'etiqueta', 4.2, 0.6, [ch('rotation.y', 0.22 + Math.PI, 0.22), ...pop(0.6, 1)], { ease: 'easeOut' }),
    seq('raios-estalam', 'raios', 5.0, 0.35, pop(), {
      ease: 'easeOut',
      caption: '…e o preço é tão alto que dá choque — ZZZT!',
    }),

    seq('braco-recolhe', 'braco', 6.1, 0.45, [ch('rotation.x', rx, mx), ch('rotation.z', rz, mz)], {
      ease: 'easeOut',
      caption: 'Ele recolhe o dedo queimado e sopra, fazendo bico: FÖ!',
    }),
    seq('sopro-sai', 'sopro', 6.5, 0.45, pop(), { ease: 'easeOut' }),

    seq('eletricista-endurece', 'eletricista', 7.6, 0.5, [ch('rotation.z', 0, LEAN)], {
      ease: 'easeIn',
      caption: 'Tarde demais: a corrente sobe, o cabelo arrepia e ele fica DURO feito tábua!',
    }),
    seq('cabelo-arrepia', 'cabelo', 7.7, 0.4, pop(), { ease: 'easeOut' }),
    seq('faiscas-saltam', 'faiscas', 8.0, 0.35, pop(), { ease: 'easeOut' }),

    seq('bolso-vira', 'bolso', 9.3, 0.5, [...pop(), ch('rotation.x', 1.3, 0.18)], {
      ease: 'easeOut',
      caption: 'E o bolso vira do avesso, vazio: depois dessa etiqueta, ele está DURO de vez.',
    }),

    seq('raios-tremem', 'raios', 11.0, 0.4, [ch('rotation.z', 0.12, 0)], {
      ease: 'easeOut',
      caption: 'Det är för dyrt. — É caro demais.',
    }),
    seq('faiscas-piscam', 'faiscas', 11.1, 0.4, pop(1.3, 1), { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 1.85, 4.5], target: [-0.1, 1.3, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-for-dyrt',
    contexto:
      "Compras: no loppis, na feira, negociando no Blocket ou no Marketplace, ou só comentando com quem está com você na loja. Pra suavizar: 'Det är lite för dyrt för mig' (é um pouco caro demais pra mim). Do outro lado, o vendedor rebate: 'Det är ett bra pris!'.",
    fraseFonte: 'É caro demais.',
    fraseAlvo: 'Det är för dyrt.',
    pronuncia:
      "dê é fö DÜÜT ('det är' = dê é, sem T; 'för' aqui quer dizer 'demais': Ö de bico — lábios de Ô, língua de Ê —, curto, e o R não vibra: a língua dobra pra trás e derrete no D seguinte; 'dyrt' com Ü LONGO — lábios de U em bico, língua de I — e o 'rt' sueco: o R some dentro do T, dito com a ponta da língua virada pra trás; nada de 'dir-tchi'; a força cai no DÜÜ, e quando a reclamação é forte, no FÖ também)",
    ponteSonora:
      "DÊ É... FÖ! DÜR(o)-T! (4 sílabas: dê-é-fö-DÜÜT; força no DÜÜ — e, quando você reclama de verdade, no FÖ também; DÊ É = o 'det är' de sempre, de 'Det är fel pris' e 'Det är lugnt': DÊ fechado e sem T, É aberto e curto; FÖ = o sopro de BICO no dedo queimado, o MESMO FÖ de bico de 'Ett bord för två' e 'Tack för hjälpen': lábios de Ô com língua de Ê, CURTO; nunca o FÔ de bochecha estufada de 'få'; o R de 'för' não vibra: a língua dobra pra trás e derrete no D seguinte, fö-düüt; DÜR(o) = DURO — o eletricista fica DURO com o choque, e 'ficar duro' é também ficar sem um tostão —, mas com o Ü de BICO DE PATO: lábios de U, língua de I, LONGO, a vogal do BI(R)ÚTA de 'byta' e do me-NÜÜN de 'menyn'; com o U chapado de 'duro' sai outra vogal; o -o cai, e o R não vibra: a língua dobra pra trás e cai direto no T, que fecha seco — é o 'rt' sueco, como o CLÁR-T de 'Självklart!'; nada de 'DÜ-ro' nem 'DÜR-tchi')",
    historia:
      'O eletricista entra na loja de material elétrico pra comprar UMA lâmpada e vira a etiqueta pendurada nela: o preço é tão alto que dá choque — ZZZT! Ele recolhe o dedo e sopra, fazendo bico: FÖ! Tarde demais: a corrente sobe pelo braço, o cabelo fica em pé soltando faíscas e ele fica DURO feito tábua, inclinado pra trás. E o bolso do macacão vira do avesso, vazio: depois dessa etiqueta, ele está DURO de vez. DÊ É... FÖ DÜR-T! — é caro demais.',
  },
  createScene,
}

export default card
