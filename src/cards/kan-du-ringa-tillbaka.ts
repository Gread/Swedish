import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Kan du ringa tillbaka?" — CAN-DU... RING A TIL-BÁ(r)CA?
 *
 * Meio-dia num rio da savana. O GUEPARDO, o bicho mais rápido do mundo,
 * chegou um segundo atrasado: a TIL-BARCA — a MESMA barca de madeira torta,
 * curvada feito um til, de 'Jag vill lämna tillbaka den här' — já vai no meio
 * da água. Ele desaba na areia de língua de fora e chicoteia com o rabo o sino
 * de bronze de chamar a barca (o MESMO sino de 'Ring 112!'): RING!… RING!
 * E a barca faz a curva do til e volta.
 *
 * Diorama: disco de rio azul-esverdeado com a margem de areia dourada na
 * frente; o guepardo deitado de través, cabeça à esquerda virada para a
 * câmera, rabo subindo à direita até o sino no poste; a barca ao fundo, de
 * través, e a esteira em U que a meia-volta riscou. Acento saturado
 * RESERVADO: o amarelo dos arcos de som (o RING).
 */

const RIO = '#3d93a6'          // azul-esverdeado da savana (mais azul que o rio da barca do dente)
const RIO_FUNDO = '#1f5566'
const RIO_CLARO = '#86c9cf'
const ESPUMA = '#eef7f5'
const AREIA = '#e3c27e'
const AREIA_ESC = '#d2ad69'
const AREIA_MOLHADA = '#b8955f'
const CAPIM = '#c9a14a'
const CAPIM_ESC = '#a8823a'
const CAPIM_CLARO = '#dcc07a'
const PEDRA = '#9a8f80'
const POSTE = '#4a3524'
const POSTE_ESC = '#38281b'
const FERRO = '#3b3b3e'
const BRONZE = '#b8862f'
const BRONZE_ESC = '#8f6520'
const MADEIRA = '#8b5a32'
const MADEIRA_ESC = '#5d3a1e'
const MADEIRA_CLARA = '#b37d48'
const FRISO = '#efe2c4'
const PELO = '#d68f34'          // guepardo: dourado-alaranjado, mais saturado que a areia
const CREME = '#f5e8cc'
const PINTA = '#2a1f17'
const NARIZ = '#3a2622'
const BOCA = '#5a1d24'
const LINGUA = '#ec7f93'
const OLHO = '#c98b22'
const SUOR = '#6cc0f2'
const SOM = '#ffd23a'          // acento: o RING

// ---- medidas -----------------------------------------------------------------
const R = 2.7                  // raio do disco
const WY = 0.15                // superfície da água
const SY = 0.25                // topo da areia seca

// guepardo (frente local = -x; +z local = lado voltado para a câmera)
const GX = 0.0
const GZ = 1.0
const GYAW = 0.15
const HEAD: [number, number, number] = [-1.02, 0.56, 0.1]
const HEAD_S = 1.3
const HEAD_ROT: [number, number, number] = [0.02, -0.12, 0.1]
const HEAD_UP = -0.3          // cabeça erguida no grito (rotation.x)
const RUMP: [number, number, number] = [0.84, 0.4, 0]

// sino
const POST: [number, number] = [2.15, 0.3]
const ARM_Y = 2.0
const PIVX = 1.32
const BELL_S = 1.2
const BELL_TILT = -0.3         // pose final: empurrado pelo rabo para a esquerda

// rabo: giro em torno da base (rotation.z)
const TAIL_DOWN = -0.9
const TAIL_BACK = -0.42

// barca (mesma til-barca da carta do dente, em escala de fundo)
const BS = 0.6
const BL = 3.7                 // comprimento (espaço da barca)
const BH0 = 0.66
const BA = 0.3
const BWL = 0.25
const BTH = 0.045
const BNSE = 5
const BY = WY - BWL * BS
const B_START: [number, number, number] = [0.5, -1.9, Math.PI]            // indo embora, proa à esquerda
const B_AWAY: [number, number, number] = [-0.45, -1.9, Math.PI]
const B_MID: [number, number, number] = [-0.95, -1.62, 1.25 * Math.PI]   // meia-volta: proa para a margem
const B_END: [number, number, number] = [0.2, -1.25, 2 * Math.PI - 0.28]  // voltando, proa à direita

const CAM: [number, number, number] = [0.2, 2.9, 4.7]

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

function shadedMesh(geo: THREE.BufferGeometry, material: THREE.Material) {
  const m = new THREE.Mesh(geo, material)
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Cápsula ligando dois pontos. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts = {}) {
  const len = a.distanceTo(b)
  const m = capsule(r, Math.max(0.001, len), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), b.clone().sub(a).normalize())
  return m
}

/** Tubo por uma curva, afinando de r0 a r1. */
function tube(points: THREE.Vector3[], r0: number, r1: number, color: string, opts = {}, closed = false) {
  const curve = new THREE.CatmullRomCurve3(points, closed, 'centripetal')
  const seg = Math.max(24, points.length * 6)
  const rad = 10
  const g = new THREE.TubeGeometry(curve, seg, 1, rad, closed)
  const pos = g.attributes.position
  const P = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= seg; i++) {
    curve.getPointAt(i / seg, P)
    const r = r0 + (r1 - r0) * (i / seg)
    for (let j = 0; j <= rad; j++) {
      const n = i * (rad + 1) + j
      v.fromBufferAttribute(pos, n).sub(P).multiplyScalar(r).add(P)
      pos.setXYZ(n, v.x, v.y, v.z)
    }
  }
  g.computeVertexNormals()
  return shadedMesh(g, mat(color, { roughness: 0.6, size: 0.4, ...opts }))
}

/** Primeiro ponto da superfície (e normal) de `meshes` no raio origem→alvo. */
function castOnto(meshes: THREE.Object3D[], origin: THREE.Vector3, target: THREE.Vector3) {
  const rc = new THREE.Raycaster(origin, target.clone().sub(origin).normalize())
  const hits = rc.intersectObjects(meshes, false)
  const h = hits[0]
  if (!h || !h.face) return null
  const n = h.face.normal.clone()
    .applyNormalMatrix(new THREE.Matrix3().getNormalMatrix(h.object.matrixWorld))
    .normalize()
  return { point: h.point.clone(), normal: n, object: h.object }
}

/** Pinta achatada colada na pele, deitada na normal. */
function spotAt(point: THREE.Vector3, normal: THREE.Vector3, r: number) {
  const s = sphere(r, PINTA, { roughness: 0.8 }, 12)
  s.position.copy(point)
  s.lookAt(point.clone().add(normal))
  s.scale.set(1, 0.9, 0.42)
  return s
}

// ---- til-barca: seções em U ao longo de x, borda desenhando um til -----------
const xOf = (t: number) => -BL / 2 + t * BL
const halfTop = (t: number) => {
  if (t < 0.25) return 0.5 * (0.8 + 0.2 * Math.sin((t / 0.25) * (Math.PI / 2)))
  if (t < 0.55) return 0.5
  const u = (t - 0.55) / 0.45
  return Math.max(0.07, 0.5 * Math.pow(Math.max(0, 1 - u * u), 0.55))
}
const halfBot = (t: number) => halfTop(t) * 0.74
/** A borda é o til: sobe na popa, desce na proa e a ponta da proa volta a subir. */
const sheer = (t: number) =>
  BH0 + BA * Math.sin(2 * Math.PI * t) + 0.2 * Math.pow(Math.max(0, (t - 0.86) / 0.14), 2)
const keel = (t: number) =>
  0.16 * Math.pow(Math.max(0, (t - 0.8) / 0.2), 2) + 0.06 * Math.pow(Math.max(0, (0.1 - t) / 0.1), 2)

function hullPoint(t: number, phi: number, inset = 0): [number, number] {
  const s = Math.sin(phi)
  const c = Math.cos(phi)
  const z0 = Math.sign(s) * Math.pow(Math.abs(s), 2 / BNSE)
  const y0 = -Math.pow(Math.abs(c), 2 / BNSE)
  const top = sheer(t)
  const bot = keel(t) + inset
  const hw = halfBot(t) + (halfTop(t) - halfBot(t)) * (1 + y0) - inset
  return [z0 * hw, top + y0 * (top - bot)]
}

function sectionZ(t: number, y: number, inset = 0) {
  const top = sheer(t)
  const bot = keel(t) + inset
  const y0 = Math.max(-1, Math.min(0, (y - top) / (top - bot)))
  const z0 = Math.pow(Math.max(0, 1 - Math.pow(-y0, BNSE)), 1 / BNSE)
  return z0 * (halfBot(t) + (halfTop(t) - halfBot(t)) * (1 + y0) - inset)
}

function hullShell() {
  const NS = 72
  const NC = 24
  const ring = 2 * (NC + 1)
  const pos: number[] = []
  const uv: number[] = []
  const idx: number[] = []
  for (let i = 0; i <= NS; i++) {
    const t = i / NS
    const x = xOf(t)
    for (let j = 0; j <= NC; j++) {
      const [z, y] = hullPoint(t, -Math.PI / 2 + (Math.PI * j) / NC)
      pos.push(x, y, z)
      uv.push(t * 3, j / ring)
    }
    for (let j = 0; j <= NC; j++) {
      const [z, y] = hullPoint(t, Math.PI / 2 - (Math.PI * j) / NC, BTH)
      pos.push(x, y, z)
      uv.push(t * 3, (NC + 1 + j) / ring)
    }
  }
  for (let i = 0; i < NS; i++) {
    for (let k = 0; k < ring; k++) {
      const a = i * ring + k
      const b = a + ring
      const a1 = i * ring + ((k + 1) % ring)
      const b1 = a1 + ring
      idx.push(a, b, a1, b, b1, a1)
    }
  }
  const g = new THREE.BufferGeometry()
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  g.setIndex(idx)
  g.computeVertexNormals()
  return g
}

function sectionSlab(t: number, yTop: number, inset: number, depth: number) {
  const bot = keel(t) + inset
  const n = 14
  const s = new THREE.Shape()
  const ys: number[] = []
  for (let i = 0; i <= n; i++) ys.push(yTop - ((yTop - bot) * i) / n)
  ys.forEach((y, i) => {
    const z = -sectionZ(t, y, inset)
    if (i === 0) s.moveTo(z, y)
    else s.lineTo(z, y)
  })
  for (let i = n; i >= 0; i--) s.lineTo(sectionZ(t, ys[i], inset), ys[i])
  s.closePath()
  const g = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false })
  g.rotateY(Math.PI / 2)
  return g
}

function alongSide(side: number, y: (t: number) => number, off: number, t0 = 0.004, t1 = 0.996, n = 48) {
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= n; i++) {
    const t = t0 + ((t1 - t0) * i) / n
    const yy = y(t)
    pts.push(V(xOf(t), yy, side * (sectionZ(t, yy) + off)))
  }
  return pts
}

// ---- margem: linha d'água ondulada de uma borda do disco à outra -------------
const SHORE_Z = 0.0
function shoreZ(x: number, dz: number, xe: number) {
  const k = Math.max(0, 1 - (x / xe) * (x / xe))
  return SHORE_Z + dz + (0.13 * Math.sin(1.5 * x + 0.4) + 0.06 * Math.sin(3.1 * x + 1.0)) * k
}

/** Laje de areia: da linha d'água (deslocada dz) até a borda da frente do disco. */
function bankSlab(dz: number, top: number, bottom: number, color: string, rad = R) {
  const ze = SHORE_Z + dz
  const xe = Math.sqrt(rad * rad - ze * ze)
  const s = new THREE.Shape()
  const n = 64
  for (let i = 0; i <= n; i++) {
    const x = -xe + (2 * xe * i) / n
    const z = shoreZ(x, dz, xe)
    if (i === 0) s.moveTo(x, -z)
    else s.lineTo(x, -z)
  }
  const a0 = Math.atan2(ze, xe)
  const a1 = Math.PI - a0
  for (let i = 1; i < n; i++) {
    const a = a0 + ((a1 - a0) * i) / n
    s.lineTo(rad * Math.cos(a), -rad * Math.sin(a))
  }
  s.closePath()
  const bev = Math.min(0.05, (top - bottom) / 3)
  const depth = Math.max(0.005, top - bottom - 2 * bev)
  const g = new THREE.ExtrudeGeometry(s, {
    depth, bevelEnabled: true, bevelThickness: bev, bevelSize: 0.07, bevelSegments: 4, curveSegments: 48,
  })
  g.rotateX(-Math.PI / 2)
  const m = shadedMesh(g, mat(color, { roughness: 0.95, size: 1.2 }))
  m.position.y = bottom + bev
  return m
}

/** Tufo de capim seco da savana. */
function tufo(seed: number, h = 0.36) {
  const g = new THREE.Group()
  const rand = rng(seed)
  const cores = [CAPIM, CAPIM_ESC, CAPIM_CLARO]
  for (let k = 0; k < 11; k++) {
    const a = rand() * Math.PI * 2
    const hh = h * (0.6 + rand() * 0.5)
    const folha = cone(0.022, hh, cores[k % 3], { roughness: 0.85 }, 6)
    const lean = 0.15 + rand() * 0.45
    folha.position.set(Math.cos(a) * 0.04, hh / 2 - 0.01, Math.sin(a) * 0.04)
    folha.rotation.set(Math.sin(a) * lean, 0, -Math.cos(a) * lean)
    folha.scale.z = 0.45
    g.add(folha)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- rio ---------------------------------------------------------------------
  const rio = new THREE.Group()
  const leito = cylinder(R + 0.08, R + 0.16, 0.1, RIO_FUNDO, { roughness: 0.85 })
  leito.position.y = 0.05
  rio.add(leito)
  const agua = cylinder(R + 0.02, R + 0.06, 0.06, RIO, { roughness: 0.12 })
  agua.position.y = WY - 0.03
  rio.add(agua)
  for (const [ox, oz, r] of [[1.7, -0.95, 0.15], [1.75, -1.85, 0.12], [0.45, -2.35, 0.13]] as const) {
    for (const k of [1, 1.7]) {
      const onda = torus(r * k, 0.01, RIO_CLARO, { roughness: 0.2 })
      onda.rotation.x = Math.PI / 2
      onda.position.set(ox + (rand() - 0.5) * 0.04, WY + 0.002, oz)
      onda.castShadow = false
      rio.add(onda)
    }
  }
  // touceira de junco na água, à direita do poste
  const juncos = new THREE.Group()
  juncos.position.set(2.4, WY, -0.62)
  for (let k = 0; k < 8; k++) {
    const h = 0.45 + rand() * 0.4
    const hx = (rand() - 0.5) * 0.32
    const hz = (rand() - 0.5) * 0.26
    const haste = cylinder(0.011, 0.017, h, '#6f7f3a', { roughness: 0.7 }, 8)
    haste.position.set(hx, h / 2, hz)
    haste.rotation.z = (rand() - 0.5) * 0.3
    juncos.add(haste)
    if (k % 2 === 0) {
      const taboa = capsule(0.026, 0.08, '#6b4a2c', { roughness: 0.9 })
      taboa.position.set(hx - haste.rotation.z * h * 0.5, h - 0.02, hz)
      juncos.add(taboa)
    }
  }
  rio.add(juncos)
  root.add(rio)

  // ---- margem de areia dourada --------------------------------------------------
  const areia = new THREE.Group()
  areia.add(bankSlab(-0.13, WY + 0.03, 0.1, AREIA_MOLHADA))
  areia.add(bankSlab(0, SY, 0.1, AREIA))
  for (const [x, z, h, s] of [[-2.25, 0.45, 0.34, 4], [-1.75, 1.6, 0.28, 5], [2.4, 0.75, 0.32, 6], [0.9, 2.15, 0.24, 7]] as const) {
    const t = tufo(s, h)
    t.position.set(x, SY, z)
    areia.add(t)
  }
  for (const [x, z, r, s] of [[-2.05, 0.95, 0.09, 3], [-1.9, 1.08, 0.06, 4], [1.95, 1.75, 0.08, 5], [0.25, 2.3, 0.07, 6], [2.45, 0.35, 0.09, 7]] as const) {
    const p = rock(r, PEDRA, s, { roughness: 0.85 })
    p.position.set(x, SY + r * 0.35, z)
    p.scale.y = 0.65
    areia.add(p)
  }
  // rastro da freada: dois sulcos rasos e pegadas vindo da direita
  for (const dz of [-0.08, 0.08]) {
    const sulco = sphere(0.5, AREIA_MOLHADA, { roughness: 0.95 }, 24)
    sulco.scale.set(0.9, 0.012, 0.045)
    sulco.rotation.y = -0.1
    sulco.position.set(1.8, SY, 1.25 + dz)
    areia.add(sulco)
  }
  for (const [x, z, ry] of [[2.3, 1.12, -0.1], [2.15, 0.93, -0.1]] as const) {
    const pegada = new THREE.Group()
    pegada.position.set(x, SY, z)
    pegada.rotation.y = ry
    const almofada = sphere(0.05, AREIA_ESC, { roughness: 0.95 }, 12)
    almofada.scale.set(1, 0.06, 0.85)
    pegada.add(almofada)
    for (let d = 0; d < 4; d++) {
      const dedo = sphere(0.018, AREIA_ESC, { roughness: 0.95 }, 8)
      dedo.scale.y = 0.15
      dedo.position.set(-0.068, 0, (d - 1.5) * 0.03)
      pegada.add(dedo)
    }
    areia.add(pegada)
  }
  root.add(areia)

  // ---- poste com braço (madeira escura, fincado na areia) ------------------------
  const pivot = V(PIVX, ARM_Y - 0.1, POST[1])
  const poste = new THREE.Group()
  poste.position.set(POST[0], SY, POST[1])
  root.add(poste)
  {
    const mH = ARM_Y + 0.12 - SY
    const mastro = rbox(0.15, mH, 0.15, 0.03, POSTE, { roughness: 0.85 })
    mastro.position.y = mH / 2
    poste.add(mastro)
    const monte = sphere(0.26, AREIA, { roughness: 0.95 })
    monte.scale.set(1, 0.22, 1)
    monte.position.y = 0
    poste.add(monte)
    const capitel = rbox(0.19, 0.05, 0.19, 0.015, POSTE_ESC, { roughness: 0.85 })
    capitel.position.y = mH + 0.02
    poste.add(capitel)
    const comp = POST[0] - PIVX
    const braco = rbox(comp + 0.18, 0.12, 0.12, 0.025, POSTE, { roughness: 0.85 })
    braco.position.set(-comp / 2 + 0.02, ARM_Y - SY, 0)
    poste.add(braco)
    const maoFrancesa = rbox(0.5, 0.08, 0.08, 0.02, POSTE_ESC, { roughness: 0.85 })
    maoFrancesa.position.set(-0.17, ARM_Y - SY - 0.17, 0)
    maoFrancesa.rotation.z = -Math.PI / 4
    poste.add(maoFrancesa)
    // amarras de corda no topo do mastro
    for (const dy of [0.17, 0.23]) {
      const volta = torus(0.088, 0.014, '#cdb48a', { roughness: 0.95 })
      volta.rotation.x = Math.PI / 2
      volta.position.y = ARM_Y - SY - dy - 0.12
      poste.add(volta)
    }
    const garra = rbox(0.05, 0.13, 0.05, 0.01, FERRO, { roughness: 0.45, metalness: 0.6 })
    garra.position.set(PIVX - POST[0], ARM_Y - SY - 0.075, 0)
    poste.add(garra)
  }

  // ---- sino de bronze (o mesmo de 'Ring 112!') ------------------------------------
  const sino = new THREE.Group()
  sino.position.copy(pivot)
  sino.rotation.z = BELL_TILT
  root.add(sino)
  {
    const k = new THREE.Group()
    k.scale.setScalar(BELL_S)
    sino.add(k)
    const campana = lathe(
      [
        [0.0, -0.05], [0.07, -0.07], [0.1, -0.13], [0.12, -0.22], [0.165, -0.32], [0.19, -0.37],
        [0.215, -0.39], [0.222, -0.375], [0.2, -0.35], [0.16, -0.28], [0.135, -0.2],
        [0.125, -0.12], [0.105, -0.05], [0.07, -0.015], [0.0, 0.0],
      ],
      BRONZE,
      { roughness: 0.3, metalness: 0.75 },
      48,
    )
    ;(campana.material as THREE.Material).side = THREE.DoubleSide
    k.add(campana)
    for (const [y, r] of [[-0.27, 0.15], [-0.34, 0.183]] as const) {
      const cinta = torus(r, 0.011, BRONZE_ESC, { roughness: 0.35, metalness: 0.75 })
      cinta.rotation.x = Math.PI / 2
      cinta.position.y = y
      k.add(cinta)
    }
    const coroa = torus(0.035, 0.014, FERRO, { roughness: 0.45, metalness: 0.6 })
    coroa.position.y = 0.02
    k.add(coroa)
    const haste = cylinder(0.01, 0.01, 0.3, FERRO, { roughness: 0.45, metalness: 0.6 })
    haste.position.y = -0.22
    k.add(haste)
    const badalo = sphere(0.045, '#6e5a35', { roughness: 0.35, metalness: 0.7 })
    badalo.position.y = -0.38
    k.add(badalo)
  }
  root.updateMatrixWorld(true)
  // ponto do flanco direito do sino onde a ponta do rabo bate
  const contato = sino.localToWorld(V(0.205 * BELL_S + 0.045, -0.3 * BELL_S, 0))
  const centroSino = sino.localToWorld(V(0, -0.24 * BELL_S, 0))

  // ---- três arcos de som saindo do sino, para o lado do rio ------------------------
  const ondas = new THREE.Group()
  ondas.position.copy(centroSino)
  root.add(ondas)
  for (const [k, r] of [0.4, 0.53, 0.66].entries()) {
    const span = 0.95 - k * 0.12
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(r, 0.03, 10, 40, span),
      mat(SOM, { emissive: SOM, emissiveIntensity: 1.0, size: r }),
    )
    arco.rotation.z = 2.35 - span / 2
    ondas.add(arco)
  }

  // ---- GUEPARDO deitado de barriga ---------------------------------------------------
  const guepardo = new THREE.Group()
  const corpo: THREE.Mesh[] = []
  const add = <T extends THREE.Mesh>(m: T, skin = true) => {
    guepardo.add(m)
    if (skin) corpo.push(m)
    return m
  }
  {
    const peito = add(sphere(0.3, PELO, { roughness: 0.85 }))
    peito.scale.set(1.2, 0.95, 0.9)
    peito.position.set(-0.42, 0.3, 0)
    const cintura = add(capsule(0.235, 0.55, PELO, { roughness: 0.85 }))
    cintura.rotation.z = Math.PI / 2
    cintura.position.set(0.06, 0.27, 0)
    const quadril = add(sphere(0.27, PELO, { roughness: 0.85 }))
    quadril.scale.set(1.1, 0.95, 0.95)
    quadril.position.set(0.5, 0.29, 0)
    for (const s of [-1, 1]) {
      const escapula = add(sphere(0.1, PELO, { roughness: 0.85 }))
      escapula.position.set(-0.45, 0.45, s * 0.11)
    }
    add(limb(V(-0.6, 0.36, 0.02), V(-0.9, 0.5, 0.07), 0.14, PELO, { roughness: 0.85 }))

    // patas da frente esticadas na areia (compridas)
    for (const s of [-1, 1]) {
      add(limb(V(-0.5, 0.3, s * 0.17), V(-0.66, 0.09, s * 0.21), 0.095, PELO, { roughness: 0.85 }))
      add(limb(V(-0.66, 0.08, s * 0.21), V(-1.2, 0.066, s * 0.22), 0.068, PELO, { roughness: 0.85 }))
      const pe = add(sphere(0.085, PELO, { roughness: 0.85 }))
      pe.scale.set(1.35, 0.6, 1.05)
      pe.position.set(-1.27, 0.055, s * 0.22)
      for (let d = 0; d < 3; d++) {
        const dedo = add(sphere(0.03, PELO, { roughness: 0.85 }, 12), false)
        dedo.position.set(-1.37, 0.05, s * 0.22 + (d - 1) * 0.04)
      }
    }
    // coxas; a de perto esticada para trás (desabou), a de longe encolhida
    for (const s of [-1, 1]) {
      const coxa = add(sphere(0.21, PELO, { roughness: 0.85 }))
      coxa.scale.set(1.25, 1.0, 0.65)
      coxa.position.set(0.52, 0.24, s * 0.16)
    }
    add(limb(V(0.66, 0.12, 0.24), V(1.12, 0.066, 0.36), 0.074, PELO, { roughness: 0.85 }))
    const peT = add(sphere(0.08, PELO, { roughness: 0.85 }))
    peT.scale.set(1.35, 0.6, 1.05)
    peT.rotation.y = -0.25
    peT.position.set(1.2, 0.055, 0.38)
    add(limb(V(0.45, 0.1, -0.24), V(0.1, 0.066, -0.3), 0.07, PELO, { roughness: 0.85 }))
    const peL = add(sphere(0.08, PELO, { roughness: 0.85 }))
    peL.scale.set(1.35, 0.6, 1.05)
    peL.position.set(0.03, 0.055, -0.3)
  }

  // pintas pretas e cheias: raios de fora para dentro achando a pele. Ficam
  // numa sub-peça própria, fora da pele refinada: assim o bake de oclusão da
  // pele não ganha riscos escuros entre as pintas.
  const pelagem = new THREE.Group()
  guepardo.add(pelagem)
  guepardo.updateMatrixWorld(true)
  {
    const pintas: THREE.Mesh[] = []
    const tenta = (o: THREE.Vector3, alvo: THREE.Vector3, r: number) => {
      const h = castOnto(corpo, o, alvo)
      if (!h || h.point.y < 0.1) return
      if (h.point.x < -0.66 && h.point.y > 0.28) return // pescoço/garganta claros
      pintas.push(spotAt(h.point, h.normal, r))
    }
    // dorso e flancos
    for (let i = 0; i < 16; i++) {
      for (let j = 0; j < 9; j++) {
        if (rand() < 0.2) continue
        const x = -0.72 + i * 0.1 + (rand() - 0.5) * 0.06
        const phi = -1.7 + (j * 3.4) / 8 + (rand() - 0.5) * 0.22
        const o = V(x, 0.28 + 1.5 * Math.cos(phi), 1.5 * Math.sin(phi))
        tenta(o, V(x, 0.28, 0), 0.026 + rand() * 0.012)
      }
    }
    // patas: de cima e de lado, ao longo de cada eixo
    const eixos: [THREE.Vector3, THREE.Vector3, number][] = [
      [V(-0.62, 0.08, 0.21), V(-1.18, 0.066, 0.22), 4],
      [V(-0.62, 0.08, -0.21), V(-1.18, 0.066, -0.22), 4],
      [V(0.7, 0.11, 0.25), V(1.1, 0.066, 0.36), 4],
      [V(0.36, 0.2, 0.16), V(0.66, 0.26, 0.2), 4],
    ]
    for (const [a, b, n] of eixos) {
      for (let k = 0; k < n; k++) {
        const p = a.clone().lerp(b, (k + 0.5) / n)
        const d = V((rand() - 0.5) * 0.5, 0.45 + rand() * 0.35, Math.sign(a.z) * (0.7 + rand() * 0.3)).normalize()
        tenta(p.clone().addScaledVector(d, 1), p, 0.02 + rand() * 0.008)
      }
    }
    for (const p of pintas) pelagem.add(p)
  }
  guepardo.position.set(GX, SY, GZ)
  guepardo.rotation.y = GYAW
  root.add(guepardo)

  // ---- cabeça: lágrimas pretas, boca aberta ofegando ----------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(...HEAD)
  cabeca.rotation.set(...HEAD_ROT)
  cabeca.scale.setScalar(HEAD_S)
  guepardo.add(cabeca)
  const rosto: THREE.Mesh[] = []
  const addR = <T extends THREE.Mesh>(m: T, skin = true) => {
    cabeca.add(m)
    if (skin) rosto.push(m)
    return m
  }
  {
    const cranio = addR(sphere(0.21, PELO, { roughness: 0.85 }))
    cranio.scale.set(1.08, 0.92, 0.98)
    // focinho branco curto, nariz escuro no topo dele
    const focinho = addR(sphere(0.1, CREME, { roughness: 0.85 }))
    focinho.scale.set(1.25, 0.82, 0.9)
    focinho.position.set(0, -0.095, 0.155)
    addR(limb(V(0, 0.04, 0.17), V(0, -0.03, 0.2), 0.036, PELO, { roughness: 0.85 }))
    const nariz = addR(sphere(0.036, NARIZ, { roughness: 0.35 }))
    nariz.scale.set(1.35, 0.72, 0.8)
    nariz.position.set(0, -0.045, 0.235)
    const boca = addR(sphere(0.075, BOCA, { roughness: 0.6 }))
    boca.scale.set(1.15, 0.85, 0.8)
    boca.position.set(0, -0.16, 0.17)
    const queixo = addR(sphere(0.078, CREME, { roughness: 0.85 }))
    queixo.scale.set(1.1, 0.55, 1.0)
    queixo.position.set(0, -0.225, 0.12)
    for (const s of [-1, 1]) {
      const bochecha = addR(sphere(0.1, PELO, { roughness: 0.85 }))
      bochecha.position.set(s * 0.12, -0.075, 0.06)
      const orelha = addR(sphere(0.07, PELO, { roughness: 0.85 }))
      orelha.scale.set(1, 0.95, 0.42)
      orelha.position.set(s * 0.15, 0.16, -0.04)
      orelha.rotation.z = -s * 0.45
      const dentroOrelha = addR(sphere(0.048, CREME, { roughness: 0.85 }, 16), false)
      dentroOrelha.scale.set(1, 0.9, 0.3)
      dentroOrelha.position.set(s * 0.148, 0.155, -0.015)
      dentroOrelha.rotation.z = -s * 0.45
      // olhos âmbar delineados de preto, meio fechados de cansaço
      const delineado = addR(sphere(0.044, PINTA, { roughness: 0.5 }, 16), false)
      delineado.scale.z = 0.55
      delineado.position.set(s * 0.085, 0.035, 0.168)
      const iris = addR(sphere(0.038, OLHO, { roughness: 0.25 }, 16), false)
      iris.scale.z = 0.6
      iris.position.set(s * 0.085, 0.035, 0.176)
      const pupila = addR(sphere(0.02, '#141414', { roughness: 0.2 }, 12), false)
      pupila.position.set(s * 0.083, 0.03, 0.197)
      const brilho = addR(sphere(0.008, '#ffffff', { roughness: 0.1 }, 8), false)
      brilho.position.set(s * 0.077, 0.042, 0.202)
      const palpebra = addR(sphere(0.046, PELO, { roughness: 0.85 }, 16), false)
      palpebra.scale.set(1.05, 0.5, 0.72)
      palpebra.position.set(s * 0.085, 0.068, 0.168)
      palpebra.rotation.z = -s * 0.32
      // risco branco embaixo do olho
      const branco = addR(limb(V(s * 0.06, -0.008, 0.19), V(s * 0.12, 0.0, 0.16), 0.012, CREME, { roughness: 0.85 }), false)
      branco.scale.z = 0.6
    }
  }
  root.updateMatrixWorld(true)
  {
    // as duas "lágrimas" pretas do guepardo: do canto do olho até o canto da boca
    const local = new THREE.Matrix4().copy(cabeca.matrixWorld).invert()
    const tear: THREE.Vector3[][] = [[], []]
    for (const [si, s] of [-1, 1].entries()) {
      for (let i = 0; i <= 6; i++) {
        const t = i / 6
        const x = 0.048 + 0.05 * t * t
        const y = 0.016 - 0.15 * t
        const o = cabeca.localToWorld(V(s * x, y, 1))
        const a = cabeca.localToWorld(V(s * x, y, 0))
        const h = castOnto(rosto, o, a)
        if (!h) continue
        tear[si].push(h.point.addScaledVector(h.normal, 0.004).applyMatrix4(local))
      }
      if (tear[si].length >= 3) cabeca.add(tube(tear[si], 0.011, 0.008, PINTA, { roughness: 0.8 }))
    }
    // pintinhas na testa
    for (const [x, y] of [[-0.1, 0.13], [-0.035, 0.112], [0.035, 0.122], [0.1, 0.135], [-0.066, 0.17], [0.0, 0.16], [0.066, 0.175]] as const) {
      const o = cabeca.localToWorld(V(x, y, 1))
      const a = cabeca.localToWorld(V(x, y, 0))
      const h = castOnto(rosto, o, a)
      if (!h) continue
      const p = h.point.clone().applyMatrix4(local)
      const n = h.normal.clone().transformDirection(local)
      const pinta = spotAt(p, n, 0.011 + rand() * 0.005)
      cabeca.add(pinta)
    }
  }

  // ---- língua pendurada (dobradiça na boca) ------------------------------------------
  const lingua = new THREE.Group()
  lingua.position.set(0, -0.17, 0.2)
  lingua.rotation.x = -0.35
  cabeca.add(lingua)
  {
    const l = capsule(0.042, 0.13, LINGUA, { roughness: 0.35 })
    l.scale.set(1.4, 1, 0.5)
    l.position.y = -0.09
    lingua.add(l)
    const sulco = capsule(0.006, 0.12, '#c95a6e', { roughness: 0.4 })
    sulco.position.set(0, -0.09, 0.02)
    lingua.add(sulco)
  }

  // ---- gotas de suor sobre a cabeça ----------------------------------------------------
  root.updateMatrixWorld(true)
  const topo = cabeca.localToWorld(V(0, 0.2, 0))
  const suor = new THREE.Group()
  suor.position.set(topo.x, topo.y + 0.1, topo.z)
  root.add(suor)
  for (const [x, y, rz] of [[-0.21, 0.0, 0.6], [0.0, 0.08, 0], [0.21, 0.0, -0.6]] as const) {
    const gota = new THREE.Group()
    gota.position.set(x, y, 0)
    gota.rotation.z = rz
    const bojo = sphere(0.046, SUOR, { roughness: 0.15 }, 16)
    gota.add(bojo)
    const ponta = cone(0.044, 0.085, SUOR, { roughness: 0.15 }, 16)
    ponta.position.y = 0.057
    gota.add(ponta)
    const reflexo = sphere(0.01, '#ffffff', { roughness: 0.1 }, 8)
    reflexo.position.set(-0.015, 0.008, 0.033)
    gota.add(reflexo)
    suor.add(gota)
  }

  // ---- rabo comprido: pintado na base, anéis pretos no fim e ponta branca ---------------
  const base = guepardo.localToWorld(V(...RUMP))
  const rabo = new THREE.Group()
  rabo.position.copy(base)
  root.add(rabo)
  {
    const c = contato.clone().sub(base)
    const caminho = new THREE.CatmullRomCurve3(
      [
        V(0, 0, 0),
        V(0.28, 0.02, -0.1),
        V(0.6, 0.2, -0.3),
        V(c.x + 0.28, c.y - 0.2, c.z + 0.2),
        V(c.x + 0.24, c.y + 0.08, c.z + 0.05),
        c,
      ],
      false,
      'catmullrom',
      0.45,
    )
    const SEG = 140
    const RAD = 16
    const raio = (t: number) => 0.068 - t * 0.024
    const g = new THREE.TubeGeometry(caminho, SEG, 1, RAD, false)
    const pos = g.attributes.position
    const v = new THREE.Vector3()
    const P = new THREE.Vector3()
    for (let j = 0; j <= SEG; j++) {
      caminho.getPointAt(j / SEG, P)
      for (let i = 0; i <= RAD; i++) {
        const k = j * (RAD + 1) + i
        v.fromBufferAttribute(pos, k).sub(P).multiplyScalar(raio(j / SEG)).add(P)
        pos.setXYZ(k, v.x, v.y, v.z)
      }
    }
    g.computeVertexNormals()
    g.clearGroups()
    // 0 = pelo, 1 = anel preto, 2 = ponta branca
    const faixa = (t: number) => (t > 0.9 ? 2 : t > 0.5 && ((t - 0.5) * 12.5) % 1 < 0.42 ? 1 : 0)
    let ini = 0
    for (let j = 1; j <= SEG; j++) {
      if (j === SEG || faixa(j / SEG) !== faixa(ini / SEG)) {
        g.addGroup(ini * RAD * 6, (j - ini) * RAD * 6, faixa(ini / SEG))
        ini = j
      }
    }
    const tubo = new THREE.Mesh(g, [
      mat(PELO, { roughness: 0.85, size: 0.15 }),
      mat(PINTA, { roughness: 0.8, size: 0.15 }),
      mat(CREME, { roughness: 0.85, size: 0.15 }),
    ])
    tubo.castShadow = true
    tubo.receiveShadow = true
    rabo.add(tubo)
    const ponteira = puff(raio(1) * 1.1, CREME, 4, 9, { roughness: 0.9 })
    ponteira.position.copy(c)
    rabo.add(ponteira)
    const raiz = sphere(raio(0) * 1.05, PELO, { roughness: 0.85 })
    rabo.add(raiz)
    // pintas da metade de cima do rabo
    for (let k = 0; k < 7; k++) {
      const t = 0.08 + k * 0.058
      const p = caminho.getPointAt(t)
      const tg = caminho.getTangentAt(t)
      const lado = V(0, 1, 0).cross(tg).normalize()
      const n = V(0, 1, 0).addScaledVector(lado, k % 2 ? 0.6 : -0.6).normalize()
      const r = raio(t)
      rabo.add(spotAt(p.clone().addScaledVector(n, r * 0.92), n, 0.022))
    }
  }

  // ---- a TIL-BARCA ao fundo -------------------------------------------------------
  const barca = new THREE.Group()
  barca.position.set(B_END[0], BY, B_END[1])
  barca.rotation.y = B_END[2]
  root.add(barca)
  {
    const k = new THREE.Group()
    k.scale.setScalar(BS)
    barca.add(k)
    const madeira = mat(MADEIRA, { roughness: 0.72, size: 1.4 })
    madeira.side = THREE.DoubleSide
    k.add(shadedMesh(hullShell(), madeira))
    const espelho = shadedMesh(sectionSlab(0, sheer(0), 0, 0.05), mat(MADEIRA, { roughness: 0.72, size: 1 }))
    espelho.position.x = -BL / 2 - 0.03
    k.add(espelho)
    const bico = shadedMesh(sectionSlab(1, sheer(1), 0, 0.05), mat(MADEIRA, { roughness: 0.72, size: 1 }))
    bico.position.x = BL / 2 - 0.02
    k.add(bico)
    for (const side of [-1, 1]) {
      k.add(tube(alongSide(side, (t) => sheer(t) - 0.03, 0.012), 0.04, 0.04, MADEIRA_ESC, { roughness: 0.7 }))
      const cap: THREE.Vector3[] = []
      for (let i = 0; i <= 48; i++) {
        const t = 0.004 + (0.992 * i) / 48
        cap.push(V(xOf(t), sheer(t) + 0.008, side * (halfTop(t) - BTH / 2)))
      }
      k.add(tube(cap, 0.036, 0.036, MADEIRA_CLARA, { roughness: 0.6 }))
      // o til pintado no costado
      k.add(tube(alongSide(side, (t) => sheer(t) - 0.11, 0.006), 0.03, 0.03, FRISO, { roughness: 0.5 }))
      for (const kk of [0.22, 0.34]) {
        k.add(tube(alongSide(side, (t) => sheer(t) - kk, 0.003), 0.011, 0.011, MADEIRA_ESC, { roughness: 0.8 }))
      }
    }
    k.add(limb(V(-BL / 2 - 0.02, sheer(0) + 0.008, -halfTop(0)), V(-BL / 2 - 0.02, sheer(0) + 0.008, halfTop(0)), 0.034, MADEIRA_CLARA))
    // roda de proa terminando num caracol
    k.add(tube(
      [V(BL / 2 - 0.01, 0.32, 0), V(BL / 2 + 0.04, 0.62, 0), V(BL / 2 + 0.06, 0.9, 0), V(BL / 2 + 0.0, 1.03, 0), V(BL / 2 - 0.08, 1.0, 0)],
      0.055, 0.035, MADEIRA_ESC, { roughness: 0.7 },
    ))
    const pomo = sphere(0.045, MADEIRA_ESC, { roughness: 0.7 })
    pomo.position.set(BL / 2 - 0.09, 0.985, 0)
    k.add(pomo)
    // cavernas, fundo e dois bancos
    for (const t of [0.2, 0.32, 0.44, 0.56, 0.68, 0.8]) {
      const pts: THREE.Vector3[] = []
      for (let j = 0; j <= 12; j++) {
        const [z, y] = hullPoint(t, -Math.PI / 2 + (Math.PI * j) / 12, BTH + 0.012)
        pts.push(V(xOf(t), Math.min(y, sheer(t) - 0.03), z))
      }
      k.add(tube(pts, 0.022, 0.022, MADEIRA_ESC, { roughness: 0.75 }))
    }
    for (const z of [-0.17, 0, 0.17]) {
      const x0 = xOf(0.12)
      const x1 = xOf(0.82)
      const fundo = rbox(x1 - x0, 0.025, 0.15, 0.01, MADEIRA_CLARA, { roughness: 0.75 })
      fundo.position.set((x0 + x1) / 2, 0.08, z)
      k.add(fundo)
    }
    for (const t of [0.3, 0.62]) {
      const y = sheer(t) - 0.16
      const w = 2 * sectionZ(t, y, BTH) - 0.01
      const banco = rbox(0.2, 0.05, w, 0.015, MADEIRA_CLARA, { roughness: 0.65 })
      banco.position.set(xOf(t), y, 0)
      k.add(banco)
    }
    // vara de barqueiro deitada nos bancos
    k.add(limb(V(xOf(0.18), sheer(0.3) - 0.1, 0.24), V(xOf(0.85), sheer(0.62) - 0.08, 0.14), 0.022, MADEIRA_CLARA, { roughness: 0.6 }))
    // espuma na linha d'água
    const pts: THREE.Vector3[] = []
    const n = 40
    for (let i = 0; i <= n; i++) {
      const t = 0.003 + (0.994 * i) / n
      pts.push(V(xOf(t), 0, sectionZ(t, BWL) + 0.02))
    }
    for (let i = n; i >= 0; i--) {
      const t = 0.003 + (0.994 * i) / n
      pts.push(V(xOf(t), 0, -sectionZ(t, BWL) - 0.02))
    }
    const espuma = tube(pts, 0.05, 0.05, ESPUMA, { roughness: 0.6 }, true)
    espuma.position.y = BWL + 0.004
    espuma.scale.y = 0.3
    espuma.castShadow = false
    k.add(espuma)
    for (const s of [-1, 1]) {
      const marola = puff(0.09, ESPUMA, 4, s > 0 ? 3 : 5, { roughness: 0.6 })
      marola.scale.set(1.6, 0.35, 0.9)
      marola.position.set(xOf(0.92), BWL + 0.01, s * (sectionZ(0.9, BWL) + 0.12))
      k.add(marola)
    }
  }

  // ---- esteira em U: a meia-volta que a barca riscou -------------------------------------
  const dirF = V(Math.cos(B_END[2]), 0, -Math.sin(B_END[2]))
  const popa = V(B_END[0], WY, B_END[1]).addScaledVector(dirF, -(BL / 2) * BS - 0.04)
  const esteira = new THREE.Group()
  esteira.position.copy(popa)
  root.add(esteira)
  {
    const trilha = [
      V(0, 0, 0),
      V(-0.42, 0, -0.04),
      V(-0.66, 0, -0.18),
      V(-0.68, 0, -0.4),
      V(-0.44, 0, -0.56),
      V(-0.02, 0, -0.62),
      V(0.45, 0, -0.62),
      V(0.9, 0, -0.58),
    ]
    for (const [dz, w0, w1] of [[0, 0.07, 0.03], [0.1, 0.035, 0.015]] as const) {
      const pts = trilha.map((p) => p.clone().multiplyScalar(1 - dz * 0.6).add(V(dz * 0.4, 0, dz * 0.3)))
      const faixa = tube(pts, w0, w1, ESPUMA, { roughness: 0.6 })
      faixa.scale.y = 0.3
      faixa.position.y = 0.006
      faixa.castShadow = false
      esteira.add(faixa)
    }
    const curva = new THREE.CatmullRomCurve3(trilha, false, 'centripetal')
    for (let k = 0; k < 12; k++) {
      const p = curva.getPointAt(0.04 + (k / 11) * 0.8)
      const bolha = sphere(0.022 + rand() * 0.025, ESPUMA, { roughness: 0.6 }, 10)
      bolha.scale.y = 0.3
      bolha.position.set(p.x + (rand() - 0.5) * 0.12, 0.008, p.z + (rand() - 0.5) * 0.12)
      bolha.castShadow = false
      esteira.add(bolha)
    }
  }

  // ---- peças --------------------------------------------------------------------------
  const parts = [
    { name: 'rio', group: 'rio', object: rio },
    { name: 'areia', group: 'rio', object: areia },
    { name: 'barca', group: 'barca', object: barca },
    { name: 'poste', group: 'sino', object: poste },
    { name: 'sino', group: 'sino', object: sino },
    { name: 'guepardo', group: 'guepardo', object: guepardo },
    { name: 'cabeca', group: 'guepardo', object: cabeca },
    { name: 'pintas', group: 'guepardo', object: pelagem },
    { name: 'lingua', group: 'cansado', object: lingua },
    { name: 'suor', group: 'cansado', object: suor },
    { name: 'rabo', group: 'ring', object: rabo },
    { name: 'ondas', group: 'ring', object: ondas },
    { name: 'esteira', group: 'volta', object: esteira },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  // ---- montagem -----------------------------------------------------------------------
  const build = [
    seq('rio-sobe', 'rio', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Meio-dia na savana: um rio azul-esverdeado e a margem de areia dourada.',
    }),
    seq('areia-sobe', 'areia', 0.25, 0.8, [riseFrom(0, 0.7)], { ease: 'easeOut' }),

    seq('barca-surge', 'barca', 1.5, 0.8, [
      riseFrom(BY, 0.6), ch('position.x', B_START[0], B_START[0]), ch('position.z', B_START[1], B_START[1]),
      ch('rotation.y', B_START[2], B_START[2]),
    ], {
      ease: 'easeOut',
      caption: 'No meio do rio já vai a TIL-BARCA: barca de madeira torta, curvada feito um til (~).',
    }),
    seq('barca-parte', 'barca', 2.3, 1.2, [ch('position.x', B_START[0], B_AWAY[0])], { ease: 'easeInOut' }),

    seq('poste-sobe', 'poste', 3.2, 0.75, [riseFrom(SY, 2.4)], {
      ease: 'easeOut',
      caption: 'Na margem, um poste com o sino de bronze de chamar a barca.',
    }),
    seq('sino-desce', 'sino', 3.5, 0.7, [ch('position.y', pivot.y + 1.0, pivot.y), ch('rotation.z', 0, 0), ...s3(0.3, 1)], {
      ease: 'easeOut',
    }),

    seq('guepardo-chega', 'guepardo', 4.7, 0.55, [ch('position.x', 3.9, GX), ch('position.y', SY + 0.22, SY)], {
      ease: 'easeOut',
      caption: 'Chega correndo o GUEPARDO, o bicho mais rápido do mundo… um segundo atrasado!',
    }),
    seq('cabeca-chega', 'cabeca', 4.7, 0.55, [ch('rotation.x', HEAD_ROT[0] - 0.5, HEAD_ROT[0])], { ease: 'easeOut' }),
    seq('pintas-chegam', 'pintas', 4.7, 0.55, [ch('scale.x', 1, 1)]),

    seq('lingua-cai', 'lingua', 5.9, 0.45, [ch('rotation.x', 1.4, -0.35)], {
      ease: 'easeOut',
      caption: 'Desaba na areia de língua de fora, sem fôlego nem pra levantar a pata.',
    }),
    seq('suor-pinga', 'suor', 6.2, 0.4, [...s3(0.01, 1), ch('position.y', suor.position.y - 0.15, suor.position.y)], {
      ease: 'easeOut',
    }),

    seq('rabo-surge', 'rabo', 7.3, 0.4, [...s3(0.01, 1), ch('rotation.z', TAIL_DOWN, TAIL_DOWN)], {
      ease: 'easeOut',
      caption: 'Com o rabo, ele chicoteia o sino: RING!… RING!',
    }),
    seq('rabo-bate-a', 'rabo', 7.8, 0.22, [ch('rotation.z', TAIL_DOWN, 0)], { ease: 'easeIn' }),
    seq('sino-bate-a', 'sino', 8.0, 0.25, [ch('rotation.z', 0, -0.6)], { ease: 'easeOut' }),
    seq('ondas-a', 'ondas', 8.02, 0.3, s3(0.2, 1), { ease: 'easeOut' }),
    seq('rabo-recua', 'rabo', 8.05, 0.3, [ch('rotation.z', 0, TAIL_BACK)], { ease: 'easeOut' }),
    seq('sino-volta', 'sino', 8.25, 0.35, [ch('rotation.z', -0.6, 0.22)], { ease: 'easeInOut' }),
    seq('rabo-bate-b', 'rabo', 8.4, 0.2, [ch('rotation.z', TAIL_BACK, 0)], { ease: 'easeIn' }),
    seq('ondas-b', 'ondas', 8.6, 0.3, s3(0.4, 1), { ease: 'easeOut' }),
    seq('sino-bate-b', 'sino', 8.6, 0.3, [ch('rotation.z', 0.22, -0.55)], { ease: 'easeOut' }),
    seq('sino-assenta', 'sino', 8.9, 0.45, [ch('rotation.z', -0.55, BELL_TILT)], { ease: 'easeInOut' }),

    seq('cabeca-grita', 'cabeca', 9.6, 0.35, [ch('rotation.x', HEAD_ROT[0], HEAD_UP)], {
      ease: 'easeOut',
      caption: 'Ofegante, grita pro rio: CAN-DU… RING A TIL-BARCA?!',
    }),
    seq('cabeca-desaba', 'cabeca', 10.7, 0.45, [ch('rotation.x', HEAD_UP, HEAD_ROT[0])], { ease: 'easeInOut' }),

    seq('barca-vira-a', 'barca', 11.0, 0.9, [
      ch('position.x', B_AWAY[0], B_MID[0]), ch('position.z', B_AWAY[1], B_MID[1]), ch('rotation.y', B_AWAY[2], B_MID[2]),
    ], {
      ease: 'easeIn',
      caption: 'E a barca faz a curva do til e vem DE VOLTA: tocar de novo pra que volte.',
    }),
    seq('barca-vira-b', 'barca', 11.9, 1.0, [
      ch('position.x', B_MID[0], B_END[0]), ch('position.z', B_MID[1], B_END[1]), ch('rotation.y', B_MID[2], B_END[2]),
    ], { ease: 'easeOut' }),
    seq('esteira-risca', 'esteira', 11.3, 1.4, s3(0.01, 1), { ease: 'easeOut' }),

    seq('ondas-pulsa', 'ondas', 13.2, 0.4, s3(0.75, 1), {
      ease: 'easeOut',
      caption: 'Kan du ringa tillbaka? — Você pode me ligar de volta?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: [0.25, 0.9, 0.25] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-du-ringa-tillbaka',
    contexto:
      "Telefone: quando ele toca numa hora ruim — no ônibus, numa reunião, com criança no colo — ou quando a ligação está péssima e você quer que a pessoa ligue de novo. Costuma vir com o quando: 'Kan du ringa tillbaka om tio minuter?' (daqui a dez minutos?) ou '... senare?' (mais tarde?).",
    fraseFonte: 'Você pode me ligar de volta?',
    fraseAlvo: 'Kan du ringa tillbaka?',
    pronuncia:
      "kan dü ríng-a til-BÁÁ-ka? ('kan du' com A curto e o 'du' de bico — Ü; 'ringa' com R de um toque só, I curto, o NG só no nariz — o G não estala — e o -a fraquinho, tudo leve e rápido: em verbo com partícula a força vai toda pra partícula, ringa tillBAKA; 'tillbaka' com o 'till' fraquinho, L de verdade, e a força no BÁ, A longo; o -ka fraco)",
    ponteSonora:
      "CAN-DU... RING A TIL-BÁ(r)CA? (7 sílabas: kan-dü-ríng-a-til-BÁÁ-ka; a força vai TODA pro BÁ — em verbo com partícula a pancada cai na partícula, ringa tillBAKA, como 'lämna tillBAKA' e 'ta MED' — e o RING A corre leve; CAN-DU é o 'kan du' de sempre — C+A+N como em 'cana', sem o glide de 'quando', e o DU com BICO DE PATO (Ü); RING = o MESMO RING do RINGUE de 'Jag ringer dig senare' e do sino de 'Ring 112!', cortado no NG: o NG fica no nariz, como no inglês 'ring', SEM estalar o G e sem 'gue'; emende DU-RING num fôlego só — 'dü-ring' — pro R sair de um toque só (ou tremido na ponta da língua), nunca o RR soprado de garganta, que vira 'hing'; A = o 'a' de 'A til-barca', fraquinho e colado no RING: é ele que dá o -a de 'ringa', o verbo pelado depois de 'kan du' — com -ER seria 'ringer', 'eu ligo'; TIL-BÁ(r)CA = a MESMA barca torta, curvada feito um til, de 'Jag vill lämna tillbaka den här': TIL fraquinho, com L de verdade (nunca 'tiu'), e BÁ(r)CA sem o R, A LONGO e com toda a força — com o R vira 'barka', descascar árvore; e a barca curvada é o próprio 'de volta': o til faz a curva e retorna)",
    historia:
      'O guepardo, o bicho mais rápido do mundo, chega à margem do rio um segundo atrasado: a TIL-BARCA — a barca de madeira torta, curvada feito um til — já vai no meio da água. Ele desaba na areia de língua de fora, sem fôlego nem pra levantar a pata, e chicoteia com o rabo o sino de chamar a barca: RING!... RING! Ofegante, grita pro rio como quem fala ao telefone: CAN-DU... RING A TIL-BARCA?! E a barca faz a curva do til e vem de volta. Em sueco, pedir pra alguém ligar de volta é isso: tocar de novo pra que volte.',
  },
  createScene,
  refine: { organic: ['guepardo', 'cabeca'] },
}

export default card
