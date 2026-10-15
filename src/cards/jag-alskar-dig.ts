import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, rock,
} from '../rig/helpers'

/**
 * "Jag älskar dig." — IÁ... ÉL'ESCAR-DÊI!
 *
 * No fundo do mar, o cavalo-marinho DOURADO tasca um beijo de surpresa (IÁ!)
 * no focinho da namorada AMARELINHA — e ELA fica ESCARlate na hora, do focinho
 * à ponta do rabo. Ele tenta gritar "ELA ESCAR…!", o resto vira bolha, e todo
 * orgulhoso só explica: DEI um beijo!
 *
 * Os dois ficam de perfil, de frente um pro outro, focinhos encostados: as
 * costas arqueadas fazem os lobos e os rabos trançados fazem a ponta de UM
 * coração. O vermelho-escarlate é o acento saturado, reservado a ela.
 */

const AREIA = '#e2cc98'
const AREIA_ESC = '#cdb37e'
const AREIA_FUNDO = '#a98d5c'
const PEDRA = '#6d7c88'
const PEDRA_ESC = '#55626e'
const ALGA = ['#3f8a4a', '#57a259', '#2f6e3d'] as const
const CONCHA = '#f2a3b5'
const CONCHA_CLARA = '#f8cdd7'
const CONCHA_ESC = '#de8aa0'
const BOLHA = '#eaf8ff'
const CORACAO = '#f2638a'
const OLHO_ESC = '#1d1416'

interface Pal { body: string; dark: string; belly: string; fin: string }
const DOURADO: Pal = { body: '#e5a823', dark: '#b5780f', belly: '#efc153', fin: '#f8de90' }
const AMARELO: Pal = { body: '#f4de66', dark: '#d2b740', belly: '#f8e98f', fin: '#fbf1c0' }
const ESCARLATE: Pal = { body: '#d3172b', dark: '#9a0c1c', belly: '#e0364a', fin: '#f27a88' }
const COROA = '#f4b829'

const SY = 0.14 // topo da areia
const H0 = SY + 0.2 // origem do "espaço do coração" (ponta de baixo dos rabos)
const YHIDE = -3.5 // a amarelinha termina escondida sob o palco

type V3 = [number, number, number]
type P4 = [number, number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

function shade<T extends THREE.Mesh>(m: T): T {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula de a até b. */
function limb(r: number, a: V3, b: V3, color: string, opts?: MatOpts) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

/**
 * Cadeia de esferas ao longo de uma curva, raio interpolado, fundida numa
 * malha só (fechada e grande: o Blender a funde com o corpo numa pele lisa).
 */
function chain(ctrl: P4[], color: string, opts?: MatOpts, spacing = 0.33) {
  const curve = new THREE.CatmullRomCurve3(ctrl.map(([x, y, z]) => new THREE.Vector3(x, y, z)), false, 'centripetal')
  const n = ctrl.length - 1
  const geos: THREE.BufferGeometry[] = []
  let last: THREE.Vector3 | null = null
  const SAMPLES = 900
  for (let i = 0; i <= SAMPLES; i++) {
    const t = i / SAMPLES
    const c = curve.getPoint(t)
    const f = t * n
    const k = Math.min(n - 1, Math.floor(f))
    const r = THREE.MathUtils.lerp(ctrl[k][3], ctrl[k + 1][3], f - k)
    if (last && c.distanceTo(last) < spacing * r && i < SAMPLES) continue
    const g = new THREE.SphereGeometry(r, 18, 14)
    g.translate(c.x, c.y, c.z)
    geos.push(g)
    last = c
  }
  const merged = mergeGeometries(geos)
  for (const g of geos) g.dispose()
  return shade(new THREE.Mesh(merged, mat(color, { ...opts, size: 0.3 })))
}

/** Lâmina de alga: tubo achatado, ondulado, mais largo no meio, ponta fina. */
function blade(h: number, amp: number, phase: number, width: number, color: string) {
  const pts: THREE.Vector3[] = []
  const N = 14
  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push(new THREE.Vector3(Math.sin(t * Math.PI * 2.6 + phase) * amp * (0.25 + 0.75 * t), t * h, 0))
  }
  const curve = new THREE.CatmullRomCurve3(pts)
  const SEG = 48
  const RAD = 10
  const geo = new THREE.TubeGeometry(curve, SEG, width, RAD, false)
  const pos = geo.attributes.position
  const c = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= SEG; i++) {
    const t = i / SEG
    curve.getPointAt(t, c)
    const tip = t > 0.82 ? Math.max(0.06, (1 - t) / 0.18) : 1
    const f = (0.55 + 0.55 * Math.sin(Math.PI * Math.min(1, t * 1.15))) * tip
    for (let j = 0; j <= RAD; j++) {
      const idx = i * (RAD + 1) + j
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(f)
      v.z *= 0.32
      v.add(c)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  return shade(new THREE.Mesh(geo, mat(color, { roughness: 0.6, size: 0.4 })))
}

/** Tufo de algas: lâminas de alturas e fases diferentes. */
function tuft(seed: number, h: number) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const n = 4
  for (let i = 0; i < n; i++) {
    const b = blade(
      h * (0.62 + rand() * 0.38),
      0.09 + rand() * 0.05,
      rand() * Math.PI * 2,
      0.06 + rand() * 0.015,
      ALGA[i % ALGA.length],
    )
    b.position.set((i - (n - 1) / 2) * 0.11 + (rand() - 0.5) * 0.04, -0.03, (rand() - 0.5) * 0.14)
    b.rotation.y = (rand() - 0.5) * 0.6
    g.add(b)
  }
  return g
}

/** Coração estufado (extrusão com chanfro), centrado na origem, ~2·s de largura. */
function heart(s: number, color: string) {
  const sh = new THREE.Shape()
  sh.moveTo(0, -1)
  sh.bezierCurveTo(-0.35, -0.6, -1, -0.3, -1, 0.25)
  sh.bezierCurveTo(-1, 0.85, -0.2, 1.0, 0, 0.55)
  sh.bezierCurveTo(0.2, 1.0, 1, 0.85, 1, 0.25)
  sh.bezierCurveTo(1, -0.3, 0.35, -0.6, 0, -1)
  const geo = new THREE.ExtrudeGeometry(sh, {
    depth: 0.35, bevelEnabled: true, bevelThickness: 0.22, bevelSize: 0.18,
    bevelSegments: 5, curveSegments: 28,
  })
  geo.center()
  geo.scale(s, s, s)
  return shade(new THREE.Mesh(geo, mat(color, { roughness: 0.3, size: s * 2 })))
}

/**
 * Cavalo-marinho de perfil no plano xy, olhando para o centro do coração.
 * Coordenadas escritas para o da ESQUERDA (ele, olhando +x); m = -1 espelha
 * para a da direita. Os rabos se trançam numa hélice dupla (z espelhado
 * também, para os dois fios não ocuparem o mesmo lugar).
 */
function seahorse(p: Pal, m: 1 | -1, eye: 'open' | 'closed') {
  const g = new THREE.Group()
  const X = (x: number) => m * x
  const at = (o: THREE.Object3D, x: number, y: number, z = 0) => {
    o.position.set(X(x), H0 + y, z)
    return o
  }
  const skin: MatOpts = { roughness: 0.45 }

  // ---- cabeça e focinho em tubo ----------------------------------------------
  const cranio = at(sphere(0.17, p.body, skin), -0.42, 1.62)
  cranio.scale.set(1.12, 0.95, 0.85)
  g.add(cranio)
  g.add(at(sphere(0.13, p.body, skin), -0.56, 1.6))
  const bochecha = at(sphere(0.12, p.body, skin), -0.31, 1.54)
  bochecha.scale.set(1.1, 0.88, 0.85)
  g.add(bochecha)
  // focinho como cadeia fundida (grande o bastante para virar pele contínua
  // com a cabeça — um tubo solto ficaria com a oclusão borrada)
  g.add(chain([
    [X(-0.3), H0 + 1.552, 0, 0.062],
    [X(-0.2), H0 + 1.546, 0, 0.056],
    [X(-0.12), H0 + 1.54, 0, 0.056],
    [X(-0.068), H0 + 1.536, 0, 0.066],
  ], p.body, skin))
  // coroinha embutida (a dela; a dele é a peça 'coroa')
  g.add(at(sphere(0.07, p.body, skin), -0.47, 1.75))

  // ---- pescoço arqueado, peito, costas e barriga -----------------------------
  // as costas arqueiam para fora: são o lobo do coração
  g.add(at(sphere(0.14, p.body, skin), -0.68, 1.5))
  g.add(at(sphere(0.17, p.body, skin), -0.79, 1.36))
  g.add(at(sphere(0.2, p.body, skin), -0.86, 1.19))
  g.add(at(sphere(0.21, p.body, skin), -0.9, 1.0))
  const barriga = at(sphere(0.25, p.belly, skin), -0.7, 1.0)
  barriga.scale.set(1, 1.05, 0.85)
  g.add(barriga)
  g.add(at(sphere(0.19, p.body, skin), -0.84, 0.8))
  g.add(at(sphere(0.155, p.body, skin), -0.76, 0.63))

  // ---- rabo: desce, trança com o dela na ponta e enrola do outro lado --------
  const tail: P4[] = [
    [-0.75, 0.63, 0, 0.15],
    [-0.67, 0.5, 0, 0.128],
    [-0.54, 0.42, 0, 0.108],
    [-0.37, 0.37, 0, 0.092],
    [-0.19, 0.33, 0, 0.08],
  ]
  // hélice dupla: 1,5 volta — o rabo dele sai do lado dela e vice-versa
  const R = 0.064
  const STEPS = 24
  for (let k = 0; k <= STEPS; k++) {
    const phi = (k / STEPS) * Math.PI * 3
    tail.push([
      -R * Math.cos(phi),
      THREE.MathUtils.lerp(0.29, 0.0, k / STEPS),
      -R * Math.sin(phi),
      THREE.MathUtils.lerp(0.07, 0.056, k / STEPS),
    ])
  }
  tail.push(
    [0.14, -0.05, 0, 0.052],
    [0.23, -0.02, 0, 0.047],
    [0.26, 0.06, 0, 0.043],
    [0.21, 0.11, 0, 0.04],
    [0.15, 0.09, 0, 0.038],
    [0.15, 0.04, 0, 0.036],
  )
  g.add(chain(tail.map(([x, y, z, r]) => [X(x), H0 + y, m * z, r] as P4), p.body, skin))

  // ---- relevo: calombos na crista das costas ---------------------------------
  for (const [x, y] of [[-0.66, 1.7], [-0.8, 1.58], [-0.95, 1.43], [-1.05, 1.25], [-1.02, 0.75], [-0.9, 0.54]] as const) {
    g.add(at(sphere(0.042, p.body, skin), x, y))
  }

  // ---- nadadeira dorsal: leque na silhueta das costas ------------------------
  const dorsal = at(sphere(0.17, p.fin, { roughness: 0.4 }), -1.13, 0.94)
  dorsal.scale.set(0.75, 1, 0.13)
  g.add(dorsal)
  for (let i = 0; i < 4; i++) {
    const a = -0.6 + i * 0.4
    g.add(limb(0.009, [X(-1.04), H0 + 0.94, 0.024], [X(-1.04 - Math.cos(a) * 0.2), H0 + 0.94 + Math.sin(a) * 0.15, 0.024], p.dark))
  }

  // ---- olho virado para a câmera -----------------------------------------------
  const EX = -0.4
  const EY = 1.665
  if (eye === 'open') {
    const esclera = at(sphere(0.066, '#ffffff', { roughness: 0.25 }), EX, EY, 0.122)
    esclera.scale.z = 0.6
    g.add(esclera)
    g.add(at(sphere(0.036, OLHO_ESC, { roughness: 0.2 }), EX + 0.02, EY, 0.152))
    g.add(at(sphere(0.012, '#ffffff', { roughness: 0.1 }), EX + 0.008, EY + 0.018, 0.182))
  } else {
    // olho fechado de beijo: pálpebra em arco "‿" + três cílios
    const arco = shade(new THREE.Mesh(
      new THREE.TorusGeometry(0.052, 0.013, 8, 20, Math.PI),
      mat(OLHO_ESC, { roughness: 0.4, size: 0.1 }),
    ))
    at(arco, EX, EY + 0.02, 0.14)
    arco.rotation.z = Math.PI
    g.add(arco)
    // cílios no canto de fora (lado da nuca), apontando para fora e para baixo
    for (const a of [0.55, 0.75, 0.95]) {
      const th = 1.5 * Math.PI + a * 0.5 * Math.PI
      const dx = -m * Math.cos(th)
      const dy = Math.sin(th)
      const bx = X(EX) + dx * 0.052
      const by = H0 + EY + 0.02 + dy * 0.052
      g.add(limb(0.008, [bx, by, 0.145], [bx + dx * 0.05, by + dy * 0.05, 0.145], OLHO_ESC))
    }
  }
  return g
}

/** Re-centraliza o grupo num pivô (sem mudar onde as malhas aparecem). */
function pivotAt(g: THREE.Group, pivot: THREE.Vector3) {
  for (const c of g.children) c.position.sub(pivot)
  g.position.copy(pivot)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- fundo do mar: disco de areia clara ---------------------------------------
  const base = new THREE.Group()
  const fundo = cylinder(2.56, 2.64, 0.08, AREIA_FUNDO, { roughness: 0.95 })
  fundo.position.y = 0.04
  base.add(fundo)
  const areia = cylinder(2.5, 2.56, 0.07, AREIA, { roughness: 0.95 })
  areia.position.y = 0.105
  base.add(areia)
  // montinhos de areia
  for (const [x, z, r] of [[-1.7, -0.9, 0.55], [1.5, -1.3, 0.6], [-0.9, 1.6, 0.42], [1.9, 0.5, 0.4]] as const) {
    const monte = sphere(r, AREIA, { roughness: 0.95 })
    monte.scale.set(1.3, 0.16, 1)
    monte.position.set(x, SY - 0.01, z)
    base.add(monte)
  }
  // ondulações da areia: arcos rasos
  for (const [x, z, R, a0] of [[0.2, 0.9, 0.9, 0.3], [-0.4, 1.35, 1.1, 0.4], [0.9, -0.5, 0.8, 3.3], [-1.2, 0.2, 0.7, 2.2]] as const) {
    const onda = shade(new THREE.Mesh(
      new THREE.TorusGeometry(R, 0.018, 6, 40, 1.1),
      mat(AREIA_ESC, { roughness: 0.95, size: 0.5 }),
    ))
    onda.rotation.set(-Math.PI / 2, 0, a0)
    onda.position.set(x, SY, z)
    base.add(onda)
  }
  // pedras azuladas na borda
  for (const [x, z, r, s] of [[-2.05, 0.55, 0.26, 3], [-1.75, 1.15, 0.14, 5], [2.1, -0.35, 0.24, 7], [1.85, 0.25, 0.12, 9], [-0.6, -1.95, 0.2, 11]] as const) {
    const pedra = rock(r, s % 2 ? PEDRA : PEDRA_ESC, s, { roughness: 0.8 })
    pedra.position.set(x, SY + r * 0.35, z)
    pedra.rotation.y = rand() * Math.PI
    base.add(pedra)
  }
  root.add(base)

  // ---- três tufos de algas -------------------------------------------------------
  const algas = new THREE.Group()
  root.add(algas)
  for (const [x, z, h, s] of [[-1.5, -0.75, 2.1, 3], [1.55, -0.85, 1.75, 8], [-1.75, 0.55, 1.15, 13]] as const) {
    const t = tuft(s, h)
    t.position.set(x, SY, z)
    algas.add(t)
  }
  // bolhinhas soltas subindo das algas
  for (const [x, y, z, r] of [
    [-1.38, 2.45, -0.7, 0.03], [-1.46, 2.62, -0.68, 0.022], [-1.35, 2.76, -0.72, 0.018],
    [1.62, 2.05, -0.82, 0.028], [1.55, 2.22, -0.8, 0.02],
  ] as const) {
    const b = sphere(r, BOLHA, { emissive: '#cdeefc', emissiveIntensity: 1.0 })
    const bm = b.material as THREE.MeshStandardMaterial
    bm.transparent = true
    bm.opacity = 0.7
    b.castShadow = false
    b.position.set(x, y, z)
    algas.add(b)
  }

  // ---- concha rosa (vieira) encostada numa pedrinha -------------------------------
  const concha = new THREE.Group()
  concha.position.set(1.2, SY, 1.0)
  concha.rotation.set(-0.75, -0.45, 0)
  root.add(concha)
  const leque = sphere(0.24, CONCHA_CLARA, { roughness: 0.45 })
  leque.scale.set(1, 0.82, 0.22)
  leque.position.set(0, 0.15, -0.02)
  concha.add(leque)
  for (let i = 0; i < 7; i++) {
    const a = (-60 + i * 20) * (Math.PI / 180)
    const gomo = sphere(0.14, CONCHA, { roughness: 0.4 })
    gomo.scale.set(0.27, 1, 0.3)
    gomo.position.set(-Math.sin(a) * 0.13, 0.02 + Math.cos(a) * 0.13, 0.02)
    gomo.rotation.z = a
    concha.add(gomo)
  }
  for (const side of [-1, 1]) {
    const orelha = rbox(0.09, 0.06, 0.04, 0.015, CONCHA_ESC, { roughness: 0.5 })
    orelha.position.set(side * 0.06, 0.0, 0.0)
    concha.add(orelha)
  }
  // pedrinhas ao redor (filhas da concha, mas assentadas na areia)
  const pedrinhas = new THREE.Group()
  pedrinhas.position.set(1.2, SY, 1.0)
  root.add(pedrinhas)
  for (const [x, z, r, s] of [[-0.3, 0.1, 0.07, 21], [0.25, 0.22, 0.05, 22], [0.05, -0.28, 0.08, 23], [-0.45, -0.2, 0.045, 24]] as const) {
    const p = rock(r, s % 2 ? '#8e8a82' : '#a39d90', s, { roughness: 0.8 })
    p.position.set(x, r * 0.4, z)
    pedrinhas.add(p)
  }

  // ---- ELE: cavalo-marinho dourado -------------------------------------------------
  const PIV_ELE = new THREE.Vector3(-0.7, H0 + 1.0, 0)
  const PIV_ELA = new THREE.Vector3(0.7, H0 + 1.0, 0)
  const ele = pivotAt(seahorse(DOURADO, 1, 'open'), PIV_ELE)
  root.add(ele)

  // coroinha de espinhos no alto da cabeça dele
  const coroa = new THREE.Group()
  coroa.position.set(-0.46 - PIV_ELE.x, H0 + 1.76 - PIV_ELE.y, 0)
  coroa.rotation.z = 0.15
  ele.add(coroa)
  const aro = cylinder(0.075, 0.085, 0.06, COROA, { roughness: 0.3, metalness: 0.6 })
  aro.position.y = 0.03
  coroa.add(aro)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const espinho = cone(0.024, 0.11, COROA, { roughness: 0.3, metalness: 0.6 })
    espinho.position.set(Math.cos(a) * 0.06, 0.1, Math.sin(a) * 0.06)
    espinho.rotation.set(Math.sin(a) * 0.3, 0, -Math.cos(a) * 0.3)
    coroa.add(espinho)
    const bolinha = sphere(0.018, COROA, { roughness: 0.3, metalness: 0.6 })
    bolinha.position.set(Math.cos(a) * 0.075, 0.16, Math.sin(a) * 0.075)
    coroa.add(bolinha)
  }

  // ---- ELA: amarelinha (antes do beijo) e escarlate (depois) -------------------
  const amarelinha = pivotAt(seahorse(AMARELO, -1, 'open'), PIV_ELA)
  amarelinha.position.y = YHIDE // pose final: sumiu (sob o palco)
  root.add(amarelinha)

  const ela = pivotAt(seahorse(ESCARLATE, -1, 'closed'), PIV_ELA)
  root.add(ela)

  // ---- bolhas: o resto do grito sobe do beijo ----------------------------------
  const BOLHAS_Y = H0 + 1.72
  const bolhas = new THREE.Group()
  bolhas.position.set(0.02, BOLHAS_Y, 0.04)
  root.add(bolhas)
  for (const [x, y, r] of [
    [0.0, 0.0, 0.035], [-0.05, 0.11, 0.045], [0.04, 0.25, 0.056], [-0.03, 0.41, 0.066],
    [0.07, 0.58, 0.05], [0.2, 0.33, 0.03], [-0.19, 0.27, 0.026], [-0.02, 0.72, 0.034],
  ] as const) {
    const b = sphere(r, BOLHA, { roughness: 0.05, detail: 0 })
    const bm = b.material as THREE.MeshStandardMaterial
    bm.transparent = true
    bm.opacity = 0.78
    bm.emissive.set('#cdeefc')
    bm.emissiveIntensity = 1.0
    b.castShadow = false
    b.position.set(x, y, 0)
    bolhas.add(b)
    const brilho = sphere(r * 0.28, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 })
    brilho.position.set(x - r * 0.38, y + r * 0.42, r * 0.7)
    brilho.castShadow = false
    bolhas.add(brilho)
  }

  // ---- três coraçõezinhos flutuando acima dos dois -----------------------------
  const C1: V3 = [-0.55, H0 + 2.0, 0.1]
  const C2: V3 = [0.52, H0 + 2.12, 0.1]
  const C3: V3 = [-0.2, H0 + 2.36, 0.05]
  const mkHeart = (pos: V3, s: number, rz: number) => {
    const g = new THREE.Group()
    g.position.set(...pos)
    g.rotation.z = rz
    g.add(heart(s, CORACAO))
    root.add(g)
    return g
  }
  const coracao1 = mkHeart(C1, 0.13, 0.25)
  const coracao2 = mkHeart(C2, 0.11, -0.2)
  const coracao3 = mkHeart(C3, 0.085, 0.1)

  // brilho frio de fundo do mar
  const luz = new THREE.PointLight('#9fdcff', 1.2, 6, 1.5)
  luz.position.set(0, 2.8, 1.6)
  root.add(luz)

  // ---- peças ----------------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'mar', object: base },
    { name: 'algas', group: 'mar', object: algas },
    { name: 'concha', group: 'mar', object: concha },
    { name: 'pedrinhas', group: 'mar', object: pedrinhas },
    { name: 'ele', group: 'ele', object: ele },
    { name: 'coroa', group: 'ele', object: coroa },
    { name: 'amarelinha', group: 'ela', object: amarelinha },
    { name: 'ela', group: 'escarlate', object: ela },
    { name: 'bolhas', group: 'escarlate', object: bolhas },
    { name: 'coracao1', group: 'dei', object: coracao1 },
    { name: 'coracao2', group: 'dei', object: coracao2 },
    { name: 'coracao3', group: 'dei', object: coracao3 },
  ]

  const grow = (from = 0.01, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const PRE_BEIJO = 0.22

  // ---- montagem ---------------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'No fundo do mar: areia clarinha, algas ondulando e uma concha rosa.',
    }),
    seq('algas-crescem', 'algas', 0.5, 1.0, [ch('scale.y', 0.05, 1)], { ease: 'easeOut' }),
    seq('concha-rise', 'concha', 0.8, 0.6, [riseFrom(SY, 0.6)], { ease: 'easeOut' }),
    seq('pedrinhas-rise', 'pedrinhas', 0.9, 0.5, [riseFrom(SY, 0.4)], { ease: 'easeOut' }),

    seq('ele-nada', 'ele', 2.0, 1.1, [
      ch('position.x', PIV_ELE.x - 1.7, PIV_ELE.x - PRE_BEIJO),
      ch('position.y', PIV_ELE.y + 0.6, PIV_ELE.y),
      ch('rotation.z', 0.3, 0),
    ], {
      ease: 'easeOut',
      caption: 'Chega nadando um cavalo-marinho DOURADO, de coroinha na cabeça…',
    }),
    seq('coroa-poe', 'coroa', 2.7, 0.5, grow(), { ease: 'easeOut' }),

    seq('amarelinha-nada', 'amarelinha', 3.6, 1.1, [
      ch('position.x', PIV_ELA.x + 1.7, PIV_ELA.x),
      ch('position.y', PIV_ELA.y + 0.6, PIV_ELA.y),
      ch('rotation.z', -0.3, 0),
    ], {
      ease: 'easeOut',
      caption: '…atrás da namorada dele, toda AMARELINHA. Os dois enrolam os rabos um no outro.',
    }),

    seq('ele-beija', 'ele', 5.4, 0.35, [ch('position.x', PIV_ELE.x - PRE_BEIJO, PIV_ELE.x)], {
      ease: 'easeIn',
      caption: 'De surpresa — IÁ! — ele tasca um beijo no focinho dela.',
    }),

    seq('amarelinha-some', 'amarelinha', 6.9, 0.3, grow(1, 0.02), {
      ease: 'easeIn',
      caption: 'Na hora, ELA fica ESCARlate — do focinho até a ponta do rabo!',
    }),
    seq('ela-cora', 'ela', 7.0, 0.3, grow(0.02, 1.12), { ease: 'easeOut' }),
    seq('ela-assenta', 'ela', 7.3, 0.3, grow(1.12, 1)),
    seq('amarelinha-esconde', 'amarelinha', 7.25, 0.05, [ch('position.y', PIV_ELA.y, YHIDE)]),
    seq('amarelinha-restaura', 'amarelinha', 7.35, 0.05, grow(0.02, 1)),

    seq('bolhas-sobem', 'bolhas', 8.4, 1.0, [
      ...grow(0.02, 1),
      ch('position.y', BOLHAS_Y - 0.5, BOLHAS_Y),
    ], {
      ease: 'easeOut',
      caption: "Ele tenta gritar 'ELA ESCAR…!' — ÉL'ESCAR — mas o resto da palavra vira bolha.",
    }),

    seq('coracao1-sobe', 'coracao1', 9.9, 0.6, [...grow(), ch('position.y', C1[1] - 0.4, C1[1])], {
      ease: 'easeOut',
      caption: 'Todo orgulhoso, ele só explica: DEI um beijo! — e os rabos trançados desenham um coração.',
    }),
    seq('coracao2-sobe', 'coracao2', 10.2, 0.6, [...grow(), ch('position.y', C2[1] - 0.4, C2[1])], { ease: 'easeOut' }),
    seq('coracao3-sobe', 'coracao3', 10.5, 0.6, [...grow(), ch('position.y', C3[1] - 0.4, C3[1])], { ease: 'easeOut' }),

    seq('coracao1-balanca', 'coracao1', 11.7, 0.7, [ch('rotation.z', -0.1, 0.25)], {
      caption: 'Jag älskar dig. — Eu te amo.',
    }),
    seq('coracao2-balanca', 'coracao2', 11.8, 0.7, [ch('rotation.z', 0.15, -0.2)]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0, 1.62, 4.85], target: [0, 1.4, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-alskar-dig',
    contexto:
      "Família: entre o casal, com os filhos na hora de dormir, com os pais ao telefone; em mensagem vira só 'Älskar dig!'. O sueco usa com parcimônia — não se diz pra amigos como o 'te amo' brasileiro; pra eles é 'Kram!' (abraço).",
    fraseFonte: 'Eu te amo.',
    fraseAlvo: 'Jag älskar dig.',
    pronuncia:
      "iá ÉLS-kar dêi ('jag' = iá; 'älskar' com força no ÉL, É aberto e curto, L de verdade (ponta da língua no céu da boca, nunca 'éu') e o S grudado no K: ÉLS-kar, duas sílabas; R de um toque que derrete no D; 'dig' = dêi — e atenção: não tem 'är' no meio, 'jag älskar' é iá + ÉLS-kar)",
    ponteSonora:
      "IÁ... ÉL'ESCAR-DÊI! (4 batidas: iá-ÉLS-car-dêi; força no ÉL; IÁ é o 'jag' de sempre, I de IOGA; ÉL'ESCAR = 'ELA ESCARlate' falado de uma vez e cortado antes do -LATE: o A do 'ela' some dentro do E de 'escarlate' — ÉL'IS-CAR — e esse I também quase some, ficando ÉLS-car, duas sílabas; o É é ABERTO, o mesmo É de 'ela', e é aqui a pancada; o L é DE VERDADE, porque no 'ela' ele vem antes de vogal — nunca 'éu-scar'; CUIDADO: não separe em 'é' + 'lscar' como se fosse 'jag är' — 'älskar' é uma palavra só que começa em ÉL; CAR com R de um toque só, que derrete no D seguinte SEM PAUSA, ÉLS-car-dêi num fôlego — parado no fim, o R brasileiro some e vira 'älska', o infinitivo; DÊI = o 'dig' de sempre, aqui o DEI de 'DEI um beijo')",
    historia:
      "No fundo do mar, o cavalo-marinho dourado enrola o rabo no rabo da namorada amarelinha e, IÁ!, tasca um beijo de surpresa no focinho dela. Na mesma hora ELA fica ESCARlate, do focinho até a ponta do rabo — ele começa a gritar 'ELA ESCAR...!', mas a vermelhidão é mais rápida que a palavra e o resto se perde nas bolhas. Todo orgulhoso, ele só consegue explicar: DEI um beijo! Os dois rabos enrolados desenham um coração: eu te amo.",
  },
  createScene,
  refine: { organic: ['ele', 'amarelinha', 'ela'] },
}

export default card
