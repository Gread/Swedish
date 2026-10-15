import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Lycka till!" — (ma)LÜ-CA, TIL!
 *
 * A Dona Caracol, a MALUCA da pista, está na linha de largada dos 100 metros
 * rasos com um foguete amarrado na concha. No lugar das barreiras, a pista tem
 * uma rampa gigante em forma de TIL (~). Quem vai encarar isso precisa de
 * muita sorte: LÜ-CA, TIL!
 *
 * Diorama: base de grama, pista vermelho-tijolo correndo da esquerda para a
 * direita, linha de largada xadrez; a caracol (de perfil, olhando para +x) à
 * esquerda; a rampa ~ turquesa — acento saturado reservado ao TIL — à direita.
 */

const SOIL = '#6b4a34'
const GRASS = '#6f9450'
const GRASS_DARK = '#557a3d'
const BRICK = '#b0573f'
const LINE = '#f3eee4'
const CHECK_DARK = '#232323'
const SNAIL = '#8f9c4c'
const SNAIL_LIGHT = '#b3bb6c'
const SNAIL_DARK = '#6c7836'
const SHELL = '#d98632'
const SHELL_CREAM = '#f2e0b8'
const HELMET = '#cf3a2c'
const VISOR = '#1d2228'
const SILVER = '#c9cfd6'
const ROPE = '#c9a46a'
const CLOVER = '#3fae46'
const TIL = '#12b8b0' // acento saturado RESERVADO: a rampa em forma de ~

const GY = 0.2 // topo da grama
const TY = 0.24 // topo da pista

// cabeça da caracol (local do grupo caracol)
const HEAD = new THREE.Vector3(-0.42, 0.78, 0)
const SHELL_C = new THREE.Vector3(-1.45, 0.8, 0)
const SHELL_R = 0.58
const SHELL_SZ = 0.72
const ROCKET_Y = 1.5 // eixo do foguete (local caracol)
const ROCKET_X0 = -2.0 // cauda do foguete

/** Rampa ~ : traço grosso de til extrudado na largura da pista. */
function tildeRamp() {
  const g = new THREE.Group()
  const X0 = 0.22
  const X1 = 2.05
  const A = 0.36
  const H = 0.12 // meia espessura do traço
  const YC = A + H + 0.03
  const T0 = -0.3 * Math.PI
  const T1 = 2.3 * Math.PI
  const k = (X1 - X0) / (T1 - T0)
  const N = 64
  const P: THREE.Vector2[] = []
  const Nn: THREE.Vector2[] = []
  for (let i = 0; i <= N; i++) {
    const t = T0 + (i / N) * (T1 - T0)
    P.push(new THREE.Vector2(X0 + (t - T0) * k, YC + A * Math.sin(t)))
    const n = new THREE.Vector2(-A * Math.cos(t), k).normalize()
    Nn.push(n)
  }
  const shape = new THREE.Shape()
  shape.moveTo(P[0].x + Nn[0].x * H, P[0].y + Nn[0].y * H)
  for (let i = 1; i <= N; i++) shape.lineTo(P[i].x + Nn[i].x * H, P[i].y + Nn[i].y * H)
  const capPts = 10
  const aEnd = Math.atan2(Nn[N].y, Nn[N].x)
  for (let s = 1; s <= capPts; s++) {
    const a = aEnd - (s / capPts) * Math.PI
    shape.lineTo(P[N].x + Math.cos(a) * H, P[N].y + Math.sin(a) * H)
  }
  for (let i = N - 1; i >= 0; i--) shape.lineTo(P[i].x - Nn[i].x * H, P[i].y - Nn[i].y * H)
  const aStart = Math.atan2(-Nn[0].y, -Nn[0].x)
  for (let s = 1; s < capPts; s++) {
    const a = aStart - (s / capPts) * Math.PI
    shape.lineTo(P[0].x + Math.cos(a) * H, P[0].y + Math.sin(a) * H)
  }
  shape.closePath()

  const DEPTH = 0.8
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: DEPTH,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.035,
    bevelSegments: 4,
    curveSegments: 12,
  })
  geo.translate(0, 0, -DEPTH / 2)
  geo.computeVertexNormals()
  const ramp = new THREE.Mesh(geo, mat(TIL, { roughness: 0.3, size: 2 }))
  ramp.castShadow = true
  ramp.receiveShadow = true
  g.add(ramp)

  // faixa branca de pista correndo pelo topo do til
  const crest = new THREE.CatmullRomCurve3(
    P.map((p, i) => new THREE.Vector3(p.x + Nn[i].x * (H + 0.032), p.y + Nn[i].y * (H + 0.032), 0)),
  )
  const stripe = new THREE.Mesh(new THREE.TubeGeometry(crest, 96, 0.022, 8, false), mat(LINE, { roughness: 0.5 }))
  stripe.scale.z = 1
  g.add(stripe)

  // pilares brancos: sob a ponta esquerda, sob a corcova e sob a ponta direita
  for (const i of [0, 16, N]) {
    const p = P[i]
    const bottom = p.y - H
    for (const z of [-0.27, 0.27]) {
      const pil = cylinder(0.045, 0.055, bottom, '#e8e4dc', { roughness: 0.5 })
      pil.position.set(p.x, bottom / 2, z)
      g.add(pil)
      const foot = cylinder(0.08, 0.09, 0.03, '#b8b3aa', { roughness: 0.6 })
      foot.position.set(p.x, 0.015, z)
      g.add(foot)
    }
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- pista ---------------------------------------------------------------
  const pista = new THREE.Group()
  const soil = rbox(5.0, 0.16, 2.5, 0.06, SOIL, { roughness: 0.9 })
  soil.position.y = 0.08
  pista.add(soil)
  const grass = rbox(5.04, 0.06, 2.54, 0.03, GRASS, { roughness: 0.92 })
  grass.position.y = GY - 0.03
  pista.add(grass)
  const track = rbox(4.9, 0.05, 1.5, 0.02, BRICK, { roughness: 0.85 })
  track.position.y = TY - 0.025
  pista.add(track)
  for (const z of [-0.52, 0.52]) {
    const l = rbox(4.86, 0.01, 0.05, 0.004, LINE, { roughness: 0.6 })
    l.position.set(0, TY + 0.003, z)
    pista.add(l)
  }
  for (const z of [-0.75, 0.75]) {
    const l = rbox(4.9, 0.012, 0.035, 0.004, LINE, { roughness: 0.6 })
    l.position.set(0, TY + 0.001, z)
    pista.add(l)
  }
  // moitas no gramado do fundo
  for (const [x, z, r, s] of [[-2.1, -1.0, 0.2, 3], [2.2, -1.02, 0.17, 5], [0.9, -1.05, 0.13, 7]] as const) {
    const m = puff(r, GRASS_DARK, 5, s, { roughness: 0.9 })
    m.position.set(x, GY + r * 0.6, z)
    m.scale.y = 0.75
    pista.add(m)
  }
  root.add(pista)

  // ---- linha de largada xadrez ----------------------------------------------
  const largada = new THREE.Group()
  largada.position.set(-0.05, TY, 0)
  const SQ = 1.04 / 8
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 8; c++) {
      const dark = (r + c) % 2 === 0
      const sq = rbox(SQ, 0.012, SQ, 0.003, dark ? CHECK_DARK : LINE, { roughness: 0.6 })
      sq.position.set((r - 0.5) * SQ, 0.006, -0.52 + SQ / 2 + c * SQ)
      largada.add(sq)
    }
  }
  root.add(largada)

  // ---- rampa ~ ---------------------------------------------------------------
  const rampa = tildeRamp()
  rampa.position.set(0, TY, -0.05)
  root.add(rampa)

  // ---- rastro de baba --------------------------------------------------------
  const baba = new THREE.Group()
  baba.position.set(-2.0, TY, 0)
  const slimeMat = mat('#e4f5c8', { roughness: 0.04, detail: 0 })
  slimeMat.transparent = true
  slimeMat.opacity = 0.7
  const fita = new THREE.Mesh(new THREE.CapsuleGeometry(0.12, 0.6, 6, 16), slimeMat)
  fita.rotation.z = Math.PI / 2
  fita.scale.set(1, 1, 0.08)
  fita.rotation.x = Math.PI / 2
  fita.position.set(-0.38, 0.008, 0)
  baba.add(fita)
  for (const [x, z, r] of [[-0.62, 0.05, 0.04], [-0.3, -0.06, 0.03], [-0.85, -0.02, 0.025]] as const) {
    const gota = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), slimeMat)
    gota.scale.y = 0.4
    gota.position.set(x, 0.012, z)
    baba.add(gota)
  }
  root.add(baba)

  // ---- CARACOL (corpo orgânico) ----------------------------------------------
  const caracol = new THREE.Group()
  caracol.position.set(0, TY, 0)
  root.add(caracol)

  const pe = sphere(1, SNAIL, { roughness: 0.35 })
  pe.scale.set(1.0, 0.15, 0.34)
  pe.position.set(-1.25, 0.12, 0)
  caracol.add(pe)

  const manto = sphere(1, SNAIL, { roughness: 0.35 })
  manto.scale.set(0.72, 0.3, 0.32)
  manto.position.set(-1.35, 0.22, 0)
  caracol.add(manto)

  const cauda = sphere(1, SNAIL, { roughness: 0.35 })
  cauda.scale.set(0.42, 0.11, 0.2)
  cauda.position.set(-2.05, 0.09, 0)
  caracol.add(cauda)

  const pescoco = capsule(0.21, 0.42, SNAIL, { roughness: 0.35 })
  pescoco.position.set(-0.55, 0.4, 0)
  pescoco.rotation.z = -0.32
  caracol.add(pescoco)

  const cabeca = sphere(0.26, SNAIL, { roughness: 0.35 })
  cabeca.position.copy(HEAD)
  caracol.add(cabeca)

  const focinho = sphere(0.19, SNAIL_LIGHT, { roughness: 0.4 })
  focinho.scale.set(1, 0.85, 0.95)
  focinho.position.set(-0.26, 0.7, 0)
  caracol.add(focinho)

  // sorriso determinado + bochechas
  const boca = capsule(0.022, 0.1, '#3a2420', { roughness: 0.5 })
  boca.position.set(-0.12, 0.64, 0.1)
  boca.rotation.set(0.5, 0.6, Math.PI / 2 - 0.3)
  caracol.add(boca)
  const bochecha = sphere(0.05, '#c98a6a', { roughness: 0.6 })
  bochecha.scale.z = 0.5
  bochecha.position.set(-0.22, 0.7, 0.18)
  caracol.add(bochecha)

  // pintinhas na lateral do pé
  for (const [x, y] of [[-0.9, 0.1], [-1.6, 0.1], [-0.65, 0.22]] as const) {
    const pinta = sphere(0.035, SNAIL_DARK, { roughness: 0.5 })
    pinta.scale.z = 0.4
    pinta.position.set(x, y, 0.3)
    caracol.add(pinta)
  }

  // ---- concha em espiral -----------------------------------------------------
  const concha = new THREE.Group()
  concha.position.copy(SHELL_C)
  caracol.add(concha)

  const casco = sphere(SHELL_R, SHELL, { roughness: 0.35 })
  casco.scale.z = SHELL_SZ
  concha.add(casco)

  for (const side of [-1, 1]) {
    const pts: THREE.Vector3[] = []
    const TURNS = 2.6
    for (let i = 0; i <= 90; i++) {
      const t = (i / 90) * TURNS
      const r = 0.5 * (1 - t / (TURNS + 0.25))
      const a = t * Math.PI * 2 + 0.6
      const z = SHELL_SZ * Math.sqrt(Math.max(0, SHELL_R * SHELL_R - r * r)) + 0.012
      pts.push(new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, side * z))
    }
    const espiral = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, 0.032, 10, false),
      mat(SHELL_CREAM, { roughness: 0.4 }),
    )
    espiral.castShadow = true
    concha.add(espiral)
    const umbigo = sphere(0.07, SHELL_CREAM, { roughness: 0.4 })
    umbigo.scale.z = 0.6
    umbigo.position.set(0, 0, side * SHELL_SZ * SHELL_R * 0.98)
    concha.add(umbigo)
  }
  // ---- antenas com olhos esbugalhados -----------------------------------------
  const antenas = new THREE.Group()
  antenas.position.set(HEAD.x + 0.02, HEAD.y + 0.2, 0)
  caracol.add(antenas)

  const up = new THREE.Vector3(0, 1, 0)
  const tips: THREE.Vector3[] = []
  for (const [dx, dz] of [[0.62, 0.14], [-0.05, -0.12]] as const) {
    const dir = new THREE.Vector3(dx, 1, dz).normalize()
    const L = 0.55
    const haste = cylinder(0.026, 0.04, L, SNAIL, { roughness: 0.4 })
    haste.quaternion.setFromUnitVectors(up, dir)
    haste.position.copy(dir.clone().multiplyScalar(L / 2))
    antenas.add(haste)
    const tip = dir.clone().multiplyScalar(L + 0.06)
    tips.push(tip)
    const olho = sphere(0.11, '#ffffff', { roughness: 0.2 })
    olho.position.copy(tip)
    antenas.add(olho)
    const look = new THREE.Vector3(0.7, 0.05, 0.7).normalize()
    const pupila = sphere(0.055, '#151515', { roughness: 0.15 })
    pupila.position.copy(tip.clone().add(look.clone().multiplyScalar(0.085)))
    antenas.add(pupila)
    const brilho = sphere(0.016, '#ffffff', { roughness: 0.1 })
    brilho.position.copy(tip.clone().add(new THREE.Vector3(0.05, 0.12, 0.1).normalize().multiplyScalar(0.135)))
    antenas.add(brilho)
  }

  // ---- trevo de quatro folhas na antena da frente ------------------------------
  const trevo = new THREE.Group()
  const tf = tips[0]
  trevo.position.set(tf.x * 0.55 + 0.04, tf.y * 0.55, tf.z * 0.55 + 0.06)
  trevo.rotation.set(-0.1, 0.35, 0.2)
  antenas.add(trevo)
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4
    const folha = new THREE.Group()
    folha.rotation.z = a
    for (const s of [-1, 1]) {
      const lobo = sphere(0.055, CLOVER, { roughness: 0.5 })
      lobo.scale.set(1, 1, 0.3)
      lobo.position.set(0.075, s * 0.035, 0)
      folha.add(lobo)
    }
    trevo.add(folha)
  }
  const miolo = sphere(0.03, '#2d8a35', { roughness: 0.5 })
  trevo.add(miolo)
  const caule = cylinder(0.01, 0.012, 0.16, '#2d8a35', { roughness: 0.5 })
  caule.position.set(0.02, -0.09, -0.01)
  caule.rotation.z = 0.25
  trevo.add(caule)
  const laco = torus(0.035, 0.012, '#e4c64a', { roughness: 0.4 })
  laco.position.set(0.035, -0.16, -0.02)
  laco.rotation.x = Math.PI / 2
  trevo.add(laco)

  // ---- capacete de corrida ----------------------------------------------------
  const capacete = new THREE.Group()
  capacete.position.set(HEAD.x - 0.02, HEAD.y + 0.08, 0)
  capacete.rotation.z = -0.28
  caracol.add(capacete)

  const domo = lathe(
    [[0.285, -0.02], [0.29, 0.05], [0.272, 0.14], [0.225, 0.22], [0.15, 0.27], [0.07, 0.29], [0, 0.295]],
    HELMET,
    { roughness: 0.22 },
  )
  capacete.add(domo)
  const aba = torus(0.285, 0.025, '#9e2a20', { roughness: 0.3 })
  aba.rotation.x = Math.PI / 2
  aba.position.y = -0.02
  capacete.add(aba)
  const viseira = new THREE.Mesh(
    new THREE.SphereGeometry(0.3, 32, 12, Math.PI - 1.0, 2.0, 1.12, 0.36),
    mat(VISOR, { roughness: 0.08, metalness: 0.6 }),
  )
  viseira.castShadow = true
  capacete.add(viseira)
  const faixa = new THREE.Mesh(new THREE.TorusGeometry(0.293, 0.022, 10, 40, Math.PI * 0.9), mat(LINE, { roughness: 0.4 }))
  faixa.rotation.z = Math.PI * 0.05
  capacete.add(faixa)

  // ---- FOGUETE amarrado na concha ---------------------------------------------
  const foguete = new THREE.Group()
  foguete.position.set(ROCKET_X0, ROCKET_Y, 0)
  caracol.add(foguete)

  const corpo = lathe(
    [[0.1, 0], [0.135, 0.05], [0.145, 0.15], [0.145, 0.78], [0.13, 0.84]],
    SILVER,
    { roughness: 0.25, metalness: 0.7 },
  )
  corpo.rotation.z = -Math.PI / 2
  foguete.add(corpo)
  const bico = lathe(
    [[0.132, 0], [0.122, 0.08], [0.095, 0.17], [0.05, 0.25], [0, 0.29]],
    HELMET,
    { roughness: 0.25 },
  )
  bico.rotation.z = -Math.PI / 2
  bico.position.x = 0.83
  foguete.add(bico)
  const anel = torus(0.142, 0.018, HELMET, { roughness: 0.3 })
  anel.rotation.y = Math.PI / 2
  anel.position.x = 0.62
  foguete.add(anel)
  const bocal = cone(0.1, 0.14, '#4a4f56', { roughness: 0.4, metalness: 0.6 })
  bocal.rotation.z = -Math.PI / 2
  bocal.position.x = -0.05
  foguete.add(bocal)
  // janelinha virada para a câmera
  const janela = cylinder(0.05, 0.05, 0.03, '#7cc6e8', { roughness: 0.1 })
  janela.rotation.x = Math.PI / 2
  janela.position.set(0.48, 0.03, 0.135)
  foguete.add(janela)
  const aro = torus(0.055, 0.014, '#8d959c', { roughness: 0.3, metalness: 0.6 })
  aro.position.set(0.48, 0.03, 0.15)
  foguete.add(aro)
  // aletas: em cima e nos dois lados
  for (const a of [Math.PI / 2, 0, Math.PI]) {
    const aleta = rbox(0.26, 0.16, 0.025, 0.012, HELMET, { roughness: 0.3 })
    const ax = new THREE.Group()
    ax.rotation.x = a === Math.PI / 2 ? 0 : a === 0 ? Math.PI / 2 : -Math.PI / 2
    aleta.position.set(0.12, 0.2, 0)
    aleta.rotation.z = 0.35
    ax.add(aleta)
    foguete.add(ax)
  }
  // cordas: da lateral da concha, por cima do foguete
  for (const xr of [0.36, 0.86]) {
    const xs = ROCKET_X0 + xr - SHELL_C.x // x relativo ao centro da concha
    const rs = Math.sqrt(Math.max(0.01, SHELL_R * SHELL_R - xs * xs))
    const zr = rs * SHELL_SZ
    const yRocket = ROCKET_Y - SHELL_C.y
    const pts: THREE.Vector3[] = []
    for (const side of [-1, 1]) {
      const half = [
        [zr * 1.03, -0.05],
        [zr * 0.88, rs * 0.55],
        [0.2, yRocket - 0.12],
        [0.17, yRocket],
        [0.12, yRocket + 0.12],
      ].map(([z, y]) => new THREE.Vector3(xr, y + SHELL_C.y - ROCKET_Y, side * z))
      if (side < 0) pts.push(...half)
      else pts.push(...half.reverse())
    }
    pts.splice(5, 0, new THREE.Vector3(xr, 0.175, 0))
    const corda = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 80, 0.028, 8, false),
      mat(ROPE, { roughness: 0.85 }),
    )
    corda.castShadow = true
    foguete.add(corda)
    const no = sphere(0.045, ROPE, { roughness: 0.85 })
    no.position.set(xr, 0.15, 0.08)
    foguete.add(no)
  }

  // ---- pavio aceso atrás do foguete -------------------------------------------
  const pavio = new THREE.Group()
  pavio.position.set(-0.1, 0, 0)
  foguete.add(pavio)
  const fusePts = [
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(-0.12, 0.03, 0.03),
    new THREE.Vector3(-0.2, 0.15, 0.05),
    new THREE.Vector3(-0.16, 0.32, 0.06),
  ]
  const fio = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(fusePts), 32, 0.018, 8, false),
    mat('#3b3129', { roughness: 0.8 }),
  )
  fio.castShadow = true
  pavio.add(fio)
  const chama = sphere(0.07, '#ffe36b', { emissive: '#ffcc33', emissiveIntensity: 1.6 })
  chama.position.copy(fusePts[3]).add(new THREE.Vector3(0, 0.04, 0))
  chama.scale.y = 1.3
  pavio.add(chama)
  const halo = sphere(0.1, '#ff9a2e', { emissive: '#ff7a1a', emissiveIntensity: 1.1 })
  halo.material.transparent = true
  halo.material.opacity = 0.45
  halo.castShadow = false
  halo.position.copy(chama.position)
  halo.scale.y = 1.35
  pavio.add(halo)
  for (const [x, y, z] of [[-0.3, 0.46, 0.1], [-0.04, 0.48, 0.02], [-0.32, 0.3, 0.14]] as const) {
    const fagulha = sphere(0.018, '#fff2a8', { emissive: '#ffd84a', emissiveIntensity: 1.8 })
    fagulha.position.set(x, y, z)
    pavio.add(fagulha)
  }

  // ---- peças -------------------------------------------------------------------
  const parts = [
    { name: 'pista', group: 'pista', object: pista },
    { name: 'largada', group: 'pista', object: largada },
    { name: 'rampa', group: 'til', object: rampa },
    { name: 'caracol', group: 'caracol', object: caracol },
    { name: 'concha', group: 'caracol', object: concha },
    { name: 'baba', group: 'caracol', object: baba },
    { name: 'antenas', group: 'maluca', object: antenas },
    { name: 'capacete', group: 'caracol', object: capacete },
    { name: 'foguete', group: 'foguete', object: foguete },
    { name: 'pavio', group: 'foguete', object: pavio },
    { name: 'trevo', group: 'sorte', object: trevo },
  ]

  const s3 = (from: number, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const capY = capacete.position.y
  const fogY = foguete.position.y

  const build = [
    seq('pista-rise', 'pista', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Uma pista de corrida sobe do chão: são os 100 metros rasos.',
    }),
    seq('largada-abre', 'largada', 0.6, 0.5, [ch('scale.z', 0.01, 1)], { ease: 'easeOut' }),

    seq('rampa-cresce', 'rampa', 1.8, 0.9, [ch('scale.y', 0.01, 1), ch('scale.x', 0.6, 1)], {
      ease: 'easeOut',
      caption: 'Mas no lugar das barreiras tem uma rampa gigante em forma de TIL (~)!',
    }),

    seq('caracol-rise', 'caracol', 3.6, 0.9, [riseFrom(TY, 1.6)], {
      ease: 'easeOut',
      caption: 'Na largada, de capacete de corrida, a Dona Caracol: a MALUCA da pista — (ma)LÜ-CA.',
    }),
    seq('concha-gira', 'concha', 3.9, 0.9, [...s3(0.3), ch('rotation.z', -3.2, 0)], { ease: 'easeOut' }),
    seq('baba-escorre', 'baba', 4.3, 0.7, [ch('scale.x', 0.05, 1)], { ease: 'easeOut' }),

    seq('antenas-sobem', 'antenas', 5.6, 0.6, [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)], {
      ease: 'easeOut',
      caption: 'As antenas sobem, de olhos esbugalhados, encarando o TIL…',
    }),
    seq('capacete-cai', 'capacete', 4.15, 0.45, [ch('position.y', capY + 0.9, capY)], { ease: 'easeIn' }),

    seq('foguete-cai', 'foguete', 7.4, 0.6, [ch('position.y', fogY + 1.6, fogY)], {
      ease: 'easeIn',
      caption: 'Pra compensar a lentidão: um FOGUETE amarrado na concha!',
    }),
    seq('pavio-acende', 'pavio', 8.8, 0.5, s3(0.01), {
      ease: 'easeOut',
      caption: 'O pavio acende e chia…',
    }),

    seq('trevo-brota', 'trevo', 10.0, 0.6, [...s3(0.01), ch('rotation.z', -2.5, 0.2)], {
      ease: 'easeOut',
      caption: '…e um trevo de quatro folhas balança na antena: ela vai precisar de MUITA sorte.',
    }),

    seq('antenas-tremem', 'antenas', 11.4, 0.7, [ch('rotation.x', 0.18, 0)], {
      ease: 'easeOut',
      caption: 'Diante do TIL, todo mundo grita pra MALUCA: (ma)LÜ-CA, TIL!',
    }),
    seq('foguete-tranco', 'foguete', 12.9, 0.4, [ch('position.x', ROCKET_X0 - 0.06, ROCKET_X0)], {
      ease: 'easeOut',
      caption: 'Lycka till! — Boa sorte!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.05, 1.7, 5.1], target: [-0.12, 0.92, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'lycka-till',
    contexto:
      'Antes de prova, entrevista de emprego, körprov, cirurgia ou mudança — em voz alta ou escrito em cartão e mensagem.',
    fraseFonte: 'Boa sorte!',
    fraseAlvo: 'Lycka till!',
    pronuncia:
      "LÜK-ka TIL ('y' = Ü: lábios de U com língua de I, o 'u' do francês; o K é dobrado e seco; 'till' com T duro — nunca 'tchil' — e L de língua no fim, nunca 'tiu')",
    ponteSonora:
      "(ma)LÜ-CA, TIL! (3 sílabas, força no LÜ e de novo no TIL; é MALUCA sem o MA — mas o LÜ é de BICO DE PATO: lábios de U com língua de I, o 'u' do francês, igual ao MÜ de 'mycket'; com o U chapado de 'maluca' sai 'lucka' (portinhola), outra palavra; o Ü é CURTO e o C é um K DOBRADO — a língua segura o K um instante antes de soltar o -a, nunca o 'lu-uuca' arrastado de 'maluca'; TIL = o mesmo TIL (~) do gongo do 'en gång till': T DURO, nunca 'tchil', I curto e L de língua no céu da boca, nunca 'tiu')",
    historia:
      'A Dona Caracol, a MALUCA da pista, se inscreveu nos 100 metros rasos e, pra compensar a lentidão, amarrou um foguete na concha. Só que a pista não tem barreiras: tem uma rampa gigante em forma de TIL (~) bem no meio, onda pra cima, onda pra baixo. Na largada as antenas tremem, o pavio chia, o trevo de quatro folhas balança... e só sai da sua boca o que se grita pra quem vai precisar de muita sorte: (ma)LÜCA, TIL! — boa sorte!',
  },
  createScene,
  refine: { organic: ['caracol'] },
}

export default card
