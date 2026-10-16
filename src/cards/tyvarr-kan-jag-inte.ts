import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat, shoulderPivot,
  rbox, capsule, cylinder, sphere, cone, torus, rock, puff, person,
} from '../rig/helpers'

/**
 * "Tyvärr kan jag inte." — tu-VÉRA... CANA, IÁ!... ÍNTE(gra).
 *
 * Beco sem saída de um labirinto de cana-de-açúcar. Um minotauro marrom de
 * chifres enormes segura o convite ROSA da festa da VERA (marca de batom) e
 * acaba de descer um golpe de caratê na parede de CANA — anéis de impacto,
 * cana intacta, ÍNTEGRA. Ele baixa a cabeça e bufa duas baforadas tristes.
 * Por cima do muro do fundo, as luzinhas da festa a que ele não pode ir.
 *
 * Rosa-choque é o acento: só o convite (VERA).
 */

const TERRA = '#cdb083'
const TERRA_ESC = '#ad8f63'
const TERRA_SOLO = '#6b5035'
const PEGADA = '#9a7b54'
const CANAS = ['#a9bd55', '#98b14b', '#bdc464']
const CANA_NO = '#6b5b2b'
const CANA_MIOLO = '#e7e2b2'
const FOLHAS = ['#6f9a3c', '#5d8733', '#86a948']
const FUNDO_CANA = '#3c4f26'
const PELO = '#7a4a2b'
const PELO_ESC = '#55331d'
const PELO_CLARO = '#93603b'
const TOPETE = '#3b2314'
const FOCINHO = '#b88c63'
const NARIZ = '#5e4141'
const COURO = '#3b2a1e'
const COURO_CLARO = '#5c412b'
const OURO = '#d9a93a'
const MARFIM = '#f0e5c8'
const MARFIM_BASE = '#a68c64'
const ROSA = '#ff3d8b' // acento saturado RESERVADO ao convite da VERA
const BATOM = '#a8001c'
const BRANCO = '#fff6f9'
const BAFO = '#f2f4f6'
const POSTE = '#4a3626'
const LUZES = ['#ffc65a', '#fff0c4', '#7fe3d2', '#ffa04d']

const GY = 0.17 // topo do chão de terra batida

// minotauro: person() alargado (tronco de touro) e grande
const MX = -0.12
const MZ = -0.2
const MR = 0.3
const MS = new THREE.Vector3(1.4, 1.28, 1.3)

// braço do golpe (ombro como pivô): erguido lá em cima → desce na parede
const GOLPE_Z = 1.92
const GOLPE_Y = -0.3
const ALTO_Z = 2.95
const ALTO_X = 0.5 // no alto, o braço vem pra frente e passa longe dos chifres
const REPOUSO_Z = 0.12

// cabeça: final cabisbaixa, de frente pra câmera
const CAB_X = 0.26
const CAB_Y = -0.4

// parede do golpe: face voltada para a câmera-esquerda
const PAREDE_PHI = -0.72

/** Acumula geometrias por cor e funde: uma parede de cana vira ~10 meshes. */
class Batch {
  private buckets = new Map<string, { color: string; opts: MatOpts; geos: THREE.BufferGeometry[] }>()

  add(color: string, opts: MatOpts, geo: THREE.BufferGeometry, m: THREE.Matrix4) {
    const key = `${color}|${opts.emissive ?? ''}`
    let b = this.buckets.get(key)
    if (!b) this.buckets.set(key, (b = { color, opts, geos: [] }))
    b.geos.push(geo.applyMatrix4(m))
  }

  into(group: THREE.Group) {
    for (const b of this.buckets.values()) {
      const merged = mergeGeometries(b.geos)
      if (!merged) continue
      const mesh = new THREE.Mesh(merged, mat(b.color, b.opts))
      mesh.castShadow = true
      mesh.receiveShadow = true
      group.add(mesh)
    }
    return group
  }
}

function M(x: number, y: number, z: number, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  return new THREE.Matrix4().compose(
    new THREE.Vector3(x, y, z),
    new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)),
    new THREE.Vector3(sx, sy, sz),
  )
}

/**
 * Parede de cana-de-açúcar ao longo de x local, face em +z, pé em GY:
 * colmos verde-amarelados encostados, nós escuros, topos com penacho de
 * folhas ou cortados (miolo claro) e um painel escuro atrás tapando frestas.
 */
function caneWall(len: number, h: number, seed: number, leafy = 0.6) {
  const rand = rng(seed)
  const b = new Batch()
  const step = 0.13
  const n = Math.floor(len / step)
  const x0 = -((n - 1) * step) / 2

  b.add(FUNDO_CANA, { roughness: 0.9, size: 1 }, new THREE.BoxGeometry(len, h * 0.86, 0.05), M(0, GY + h * 0.43, -0.07))

  for (let i = 0; i < n; i++) {
    const x = x0 + i * step + (rand() - 0.5) * 0.02
    const z = (rand() - 0.5) * 0.03
    const hh = h * (0.9 + rand() * 0.12)
    const r = 0.066 * (0.92 + rand() * 0.16)
    const base = M(x, GY, z, (rand() - 0.5) * 0.03, 0, (rand() - 0.5) * 0.05)
    const tone = CANAS[Math.floor(rand() * CANAS.length)]

    b.add(tone, { roughness: 0.42, size: 0.3 }, new THREE.CylinderGeometry(r, r * 1.06, hh, 14), base.clone().multiply(M(0, hh / 2, 0)))

    for (let y = 0.16 + rand() * 0.14; y < hh - 0.12; y += 0.26 + rand() * 0.05) {
      b.add(CANA_NO, { roughness: 0.6, size: 0.2 }, new THREE.TorusGeometry(r * 0.98, r * 0.2, 8, 18), base.clone().multiply(M(0, y, 0, Math.PI / 2)))
    }

    if (rand() < leafy) {
      // penacho: lâminas que sobem e tombam para fora
      const nLeaves = 2 + Math.floor(rand() * 2)
      for (let k = 0; k < nLeaves; k++) {
        const yaw = rand() * Math.PI * 2
        const a1 = 0.25 + rand() * 0.35
        const a2 = 0.7 + rand() * 0.6
        const leaf = FOLHAS[Math.floor(rand() * FOLHAS.length)]
        const top = base.clone().multiply(M(0, hh - 0.02, 0, 0, yaw, a1))
        const g1 = new THREE.BoxGeometry(0.05, 0.34, 0.012).translate(0, 0.17, 0)
        b.add(leaf, { roughness: 0.6, size: 0.3 }, g1, top)
        const g2 = new THREE.ConeGeometry(0.026, 0.42, 4).translate(0, 0.21, 0).scale(1, 1, 0.3)
        b.add(leaf, { roughness: 0.6, size: 0.3 }, g2, top.clone().multiply(M(0, 0.33, 0, 0, 0, a2 - a1)))
      }
    } else {
      b.add(CANA_MIOLO, { roughness: 0.7, size: 0.2 }, new THREE.CylinderGeometry(r * 0.9, r * 0.9, 0.012, 14), base.clone().multiply(M(0, hh + 0.002, 0)))
    }
  }
  return b.into(new THREE.Group())
}

/** Chifre afunilado ao longo de uma curva (TubeGeometry com raio por anel). */
function hornGeo(pts: THREE.Vector3[], r0: number, r1: number, t0: number, t1: number) {
  const full = new THREE.CatmullRomCurve3(pts)
  class Sub extends THREE.Curve<THREE.Vector3> {
    constructor() {
      super()
    }
    getPoint(t: number, target = new THREE.Vector3()) {
      return full.getPoint(t0 + (t1 - t0) * t, target)
    }
  }
  const sub = new Sub()
  const segs = 22
  const radial = 14
  const geo = new THREE.TubeGeometry(sub, segs, 1, radial, false)
  const pos = geo.attributes.position
  const c = new THREE.Vector3()
  const v = new THREE.Vector3()
  for (let i = 0; i <= segs; i++) {
    const u = i / segs
    sub.getPointAt(u, c)
    const tt = t0 + (t1 - t0) * u
    const r = r0 + (r1 - r0) * Math.pow(tt, 0.85)
    for (let j = 0; j <= radial; j++) {
      const idx = i * (radial + 1) + j
      v.fromBufferAttribute(pos, idx).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(idx, v.x, v.y, v.z)
    }
  }
  pos.needsUpdate = true
  return geo
}

function shade<T extends THREE.Mesh>(m: T) {
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Traço de letra do convite: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.022, 0.006, BRANCO, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** V E R A — letras de traço grosso, legíveis de longe. */
function letter(which: 'V' | 'E' | 'R' | 'A') {
  const g = new THREE.Group()
  const t = 0.034
  if (which === 'V') {
    g.add(stroke(t, 0.175, -0.03, 0.002, 0.3))
    g.add(stroke(t, 0.175, 0.03, 0.002, -0.3))
  } else if (which === 'E') {
    g.add(stroke(t, 0.17, -0.04, 0))
    g.add(stroke(0.088, t, 0.0, 0.068))
    g.add(stroke(0.07, t, -0.008, 0))
    g.add(stroke(0.088, t, 0.0, -0.068))
  } else if (which === 'R') {
    g.add(stroke(t, 0.17, -0.044, 0))
    g.add(stroke(0.076, t, -0.01, 0.068))
    g.add(stroke(0.076, t, -0.01, 0.006))
    g.add(stroke(t, 0.062, 0.034, 0.037))
    g.add(stroke(t, 0.096, 0.028, -0.046, 0.5))
  } else {
    g.add(stroke(t, 0.18, -0.03, 0, -0.32))
    g.add(stroke(t, 0.18, 0.03, 0, 0.32))
    g.add(stroke(0.066, 0.028, 0, -0.03))
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- chão de terra batida do labirinto -----------------------------------
  const chao = new THREE.Group()

  const solo = cylinder(2.62, 2.72, 0.12, TERRA_SOLO, { roughness: 0.95 })
  solo.position.y = 0.06
  chao.add(solo)

  const terra = cylinder(2.56, 2.62, 0.06, TERRA, { roughness: 0.92 })
  terra.position.y = GY - 0.03
  chao.add(terra)

  // borda de terra mais escura (assentamento das paredes)
  const borda = torus(2.5, 0.06, TERRA_ESC, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = GY - 0.01
  borda.scale.z = 0.4
  chao.add(borda)

  // trilha de cascos fendidos andando em círculos de tédio
  for (const [i, [px, pz, yaw]] of ([
    [-1.25, 1.55, 0.6], [-0.95, 1.25, 0.8], [-0.55, 1.12, 1.4], [-0.15, 1.2, 1.9], [0.3, 1.45, 2.3],
  ] as const).entries()) {
    const casco = new THREE.Group()
    casco.position.set(px + (i % 2) * 0.06, GY + 0.004, pz)
    casco.rotation.y = yaw
    for (const s of [-1, 1]) {
      const metade = cylinder(0.04, 0.04, 0.008, PEGADA, { roughness: 0.95 }, 14)
      metade.scale.set(0.7, 1, 1.15)
      metade.position.x = s * 0.034
      casco.add(metade)
    }
    chao.add(casco)
  }

  // folhas de cana caídas e pedrinhas
  for (const [px, pz, yaw, cor] of [
    [1.15, 0.95, 0.4, FOLHAS[0]], [-1.75, 0.95, 2.2, FOLHAS[1]], [0.45, 1.85, 1.1, FOLHAS[2]],
  ] as const) {
    const folhaG = new THREE.Group()
    folhaG.position.set(px, GY + 0.01, pz)
    folhaG.rotation.y = yaw
    const folha = cone(0.035, 0.62, cor, { roughness: 0.6 }, 4)
    folha.scale.z = 0.25
    folha.rotation.x = Math.PI / 2
    folhaG.add(folha)
    chao.add(folhaG)
  }
  for (const [px, pz, r, s] of [[1.55, 1.45, 0.08, 3], [-0.95, 1.9, 0.06, 5], [-2.05, 0.55, 0.09, 7]] as const) {
    const pedra = rock(r, '#8f8170', s, { roughness: 0.9 })
    pedra.position.set(px, GY + r * 0.4, pz)
    pedra.rotation.y = rand() * Math.PI
    chao.add(pedra)
  }
  // toco de cana cortado e bagaço no canto
  const toco = cylinder(0.065, 0.07, 0.28, CANAS[1], { roughness: 0.45 }, 14)
  toco.position.set(1.85, GY + 0.14, 1.05)
  toco.rotation.z = 0.08
  chao.add(toco)
  const tocoMiolo = cylinder(0.058, 0.058, 0.01, CANA_MIOLO, { roughness: 0.7 }, 14)
  tocoMiolo.position.set(1.86, GY + 0.285, 1.05)
  chao.add(tocoMiolo)
  const bagaco = puff(0.1, '#d8cf9a', 5, 13, { roughness: 0.95 })
  bagaco.position.set(2.05, GY + 0.04, 0.85)
  bagaco.scale.y = 0.4
  chao.add(bagaco)

  root.add(chao)

  // ---- paredes de cana: fundo e lateral esquerda ---------------------------
  const paredeFundo = caneWall(4.3, 1.75, 7, 0.3)
  paredeFundo.position.set(-0.2, 0, -1.25)
  root.add(paredeFundo)

  const paredeLado = caneWall(1.9, 2.0, 11, 0.5)
  paredeLado.position.set(-1.88, 0, -0.42)
  paredeLado.rotation.y = 0.64
  root.add(paredeLado)

  // ---- luzinhas da festa, do outro lado do muro ----------------------------
  const luzes = new THREE.Group()
  {
    const b = new Batch()
    const LZ = -1.62
    const postes = [-2.05, -0.55, 0.95]
    for (const px of postes) {
      b.add(POSTE, { roughness: 0.8, size: 0.5 }, new THREE.CylinderGeometry(0.032, 0.04, 2.75, 10), M(px, GY + 1.375, LZ))
      b.add(POSTE, { roughness: 0.8, size: 0.3 }, new THREE.SphereGeometry(0.05, 12, 12), M(px, GY + 2.76, LZ))
    }
    let k = 0
    for (let s = 0; s < postes.length - 1; s++) {
      const a = new THREE.Vector3(postes[s], GY + 2.72, LZ)
      const c = new THREE.Vector3(postes[s + 1], GY + 2.72, LZ)
      const N = 12
      const pts: THREE.Vector3[] = []
      for (let i = 0; i <= N; i++) {
        const u = i / N
        const p = a.clone().lerp(c, u)
        p.y -= 0.3 * 4 * u * (1 - u)
        p.z += 0.12 * 4 * u * (1 - u)
        pts.push(p)
      }
      for (let i = 0; i < N; i++) {
        const p0 = pts[i]
        const p1 = pts[i + 1]
        const d = p1.clone().sub(p0)
        const mid = p0.clone().add(p1).multiplyScalar(0.5)
        const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.clone().normalize())
        b.add('#2b2622', { roughness: 0.6, size: 0.2 }, new THREE.CylinderGeometry(0.008, 0.008, d.length(), 6),
          new THREE.Matrix4().compose(mid, q, new THREE.Vector3(1, 1, 1)))
      }
      for (let i = 1; i < N; i += 1) {
        const p = pts[i]
        b.add('#2b2622', { roughness: 0.6, size: 0.1 }, new THREE.CylinderGeometry(0.022, 0.022, 0.05, 10), M(p.x, p.y - 0.03, p.z))
        const cor = LUZES[k++ % LUZES.length]
        b.add(cor, { emissive: cor, emissiveIntensity: 1.4, roughness: 0.3 }, new THREE.SphereGeometry(0.055, 14, 14), M(p.x, p.y - 0.095, p.z, 0, 0, 0, 1, 1.25, 1))
      }
    }
    b.into(luzes)
  }
  root.add(luzes)

  // ---- minotauro: person() com tronco de touro -----------------------------
  const minotauro = person({ body: PELO, skin: PELO_ESC, height: 1.5, armAngle: 0.35 })
  minotauro.position.set(MX, GY, MZ)
  minotauro.rotation.y = MR
  minotauro.scale.copy(MS)
  root.add(minotauro)

  // pescoço-cupim de touro, ombros e peitoral
  const cupim = sphere(0.2, PELO, { roughness: 0.85 })
  cupim.scale.set(1.45, 0.75, 1.1)
  cupim.position.set(0, 0.79, -0.04)
  minotauro.add(cupim)
  for (const s of [-1, 1]) {
    const deltoide = sphere(0.11, PELO, { roughness: 0.85 })
    deltoide.position.set(s * 0.29, 0.73, 0)
    minotauro.add(deltoide)
    const peito = sphere(0.12, PELO_CLARO, { roughness: 0.85 })
    peito.scale.set(1.05, 0.75, 0.55)
    peito.position.set(s * 0.1, 0.6, 0.2)
    minotauro.add(peito)
  }

  // tanga de couro + cinto com fivela dourada
  const cinto = torus(0.262, 0.036, COURO, { roughness: 0.7 })
  cinto.rotation.x = Math.PI / 2
  cinto.position.y = 0.27
  minotauro.add(cinto)
  const faixa = cylinder(0.268, 0.272, 0.1, COURO_CLARO, { roughness: 0.8 })
  faixa.position.y = 0.21
  minotauro.add(faixa)
  const fivela = rbox(0.085, 0.07, 0.025, 0.012, OURO, { roughness: 0.3, metalness: 0.75 })
  fivela.position.set(0, 0.27, 0.29)
  minotauro.add(fivela)
  const aba = rbox(0.18, 0.17, 0.03, 0.03, COURO_CLARO, { roughness: 0.8 })
  aba.position.set(0, 0.17, 0.27)
  aba.rotation.x = -0.12
  minotauro.add(aba)
  for (const s of [-1, 1]) {
    const costura = rbox(0.012, 0.13, 0.012, 0.005, '#c9a77a', { roughness: 0.8 })
    costura.position.set(s * 0.065, 0.17, 0.29)
    costura.rotation.x = -0.12
    minotauro.add(costura)
  }

  // cascos fendidos com tufo de pelo por cima
  for (const s of [-1, 1]) {
    const casco = cylinder(0.075, 0.09, 0.08, '#2e221b', { roughness: 0.45 }, 20)
    casco.scale.z = 1.2
    casco.position.set(s * 0.1, 0.04, 0.1)
    minotauro.add(casco)
    const fenda = rbox(0.012, 0.075, 0.03, 0.004, '#120d0a', { roughness: 0.8 })
    fenda.position.set(s * 0.1, 0.04, 0.205)
    minotauro.add(fenda)
    const tufo = puff(0.07, PELO_ESC, 5, 70 + s, { roughness: 0.92 })
    tufo.scale.y = 0.55
    tufo.position.set(s * 0.1, 0.1, 0.09)
    minotauro.add(tufo)
  }

  // ---- braço esquerdo (segura o convite) -----------------------------------
  const bracoL = minotauro.getObjectByName('armL') as THREE.Mesh
  shoulderPivot(bracoL, 1.5)
  bracoL.rotation.set(-0.95, 0, -0.45)
  bracoL.scale.set(1.25, 1, 1.25)

  // ---- braço direito: golpe de caratê (peça própria) -----------------------
  const bracoGolpe = minotauro.getObjectByName('armR') as THREE.Mesh
  shoulderPivot(bracoGolpe, 1.5)
  bracoGolpe.scale.set(1.25, 1, 1.25)
  // troca a mão-luva por uma mão em LÂMINA: dedos juntos, polegar colado
  for (const c of [...bracoGolpe.children]) bracoGolpe.remove(c)
  const lamina = new THREE.Group()
  lamina.position.y = -0.47
  bracoGolpe.add(lamina)
  const palma = rbox(0.13, 0.22, 0.06, 0.028, PELO_ESC, { roughness: 0.8 })
  palma.position.y = -0.1
  lamina.add(palma)
  for (const dx of [-0.032, 0, 0.032]) {
    const vinco = rbox(0.008, 0.09, 0.008, 0.003, '#3a2414', { roughness: 0.9 })
    vinco.position.set(dx, -0.165, 0.03)
    lamina.add(vinco)
  }
  const polegar = capsule(0.026, 0.07, PELO_ESC, { roughness: 0.8 })
  polegar.position.set(0.066, -0.04, 0.012)
  polegar.rotation.z = 0.25
  lamina.add(polegar)
  const ponta = new THREE.Object3D()
  ponta.position.y = -0.215
  lamina.add(ponta)
  bracoGolpe.rotation.set(0, GOLPE_Y, GOLPE_Z)

  // ---- cabeça de touro (peça orgânica) -------------------------------------
  const cabeca = minotauro.getObjectByName('head') as THREE.Group
  cabeca.clear()
  cabeca.rotation.set(CAB_X, CAB_Y, 0)

  const cranio = sphere(0.27, PELO_ESC, { roughness: 0.85 })
  cranio.scale.set(1.08, 0.95, 1.0)
  cranio.position.set(0, 0.04, -0.02)
  cabeca.add(cranio)

  const queixada = sphere(0.22, PELO_ESC, { roughness: 0.85 })
  queixada.scale.set(1.12, 0.85, 1.1)
  queixada.position.set(0, -0.08, 0.1)
  cabeca.add(queixada)

  const focinho = sphere(0.19, FOCINHO, { roughness: 0.8 })
  focinho.scale.set(1.3, 0.85, 1.0)
  focinho.position.set(0, -0.12, 0.27)
  cabeca.add(focinho)

  const nariz = sphere(0.14, NARIZ, { roughness: 0.55 })
  nariz.scale.set(1.4, 0.75, 0.5)
  nariz.position.set(0, -0.085, 0.41)
  cabeca.add(nariz)

  for (const s of [-1, 1]) {
    const narina = sphere(0.04, '#22140f', { roughness: 0.6 })
    narina.scale.set(1, 1.2, 0.5)
    narina.position.set(s * 0.085, -0.08, 0.475)
    cabeca.add(narina)
  }

  const argola = torus(0.075, 0.016, OURO, { roughness: 0.25, metalness: 0.85 })
  argola.position.set(0, -0.16, 0.475)
  argola.rotation.x = -0.25
  cabeca.add(argola)

  // bico de beijo (e de pena)
  const bico = sphere(0.05, '#6e3a34', { roughness: 0.5 })
  bico.scale.set(1.25, 0.75, 0.9)
  bico.position.set(0, -0.285, 0.36)
  cabeca.add(bico)

  const topete = puff(0.09, TOPETE, 5, 21, { roughness: 0.92 })
  topete.scale.set(1.3, 0.7, 0.85)
  topete.position.set(0, 0.25, 0.13)
  cabeca.add(topete)

  for (const s of [-1, 1]) {
    const esclera = sphere(0.062, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.6
    esclera.position.set(s * 0.15, 0.08, 0.215)
    const pupila = sphere(0.03, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(s * 0.15, 0.062, 0.25)
    cabeca.add(esclera, pupila)

    // pálpebra caída: olhar de pena
    const palpebra = sphere(0.066, PELO_ESC, { roughness: 0.85 })
    palpebra.scale.set(1.05, 0.6, 0.7)
    palpebra.position.set(s * 0.15, 0.112, 0.214)
    cabeca.add(palpebra)

    const sobrancelha = capsule(0.02, 0.08, TOPETE, { roughness: 0.9 })
    sobrancelha.position.set(s * 0.15, 0.175, 0.235)
    sobrancelha.rotation.z = Math.PI / 2 - s * 0.38
    cabeca.add(sobrancelha)

    const orelha = sphere(0.09, PELO_ESC, { roughness: 0.85 })
    orelha.scale.set(1.6, 0.55, 0.9)
    orelha.position.set(s * 0.33, 0.04, -0.04)
    orelha.rotation.z = -s * 0.45
    cabeca.add(orelha)
    const orelhaDentro = sphere(0.06, '#a8705e', { roughness: 0.8 })
    orelhaDentro.scale.set(1.5, 0.4, 0.5)
    orelhaDentro.position.set(s * 0.36, 0.03, 0.0)
    orelhaDentro.rotation.z = -s * 0.45
    cabeca.add(orelhaDentro)
  }

  // ---- chifres de marfim (peça rígida, filha da cabeça) --------------------
  const chifres = new THREE.Group()
  cabeca.add(chifres)
  for (const s of [-1, 1]) {
    const pts = [
      [0.18, 0.18, 0.0], [0.36, 0.22, 0.04], [0.5, 0.32, 0.06],
      [0.58, 0.47, 0.04], [0.58, 0.61, 0.0], [0.52, 0.72, -0.04],
    ].map(([x, y, z]) => new THREE.Vector3(s * x, y, z))
    const corpo = shade(new THREE.Mesh(hornGeo(pts, 0.082, 0.012, 0.0, 1.0), mat(MARFIM, { roughness: 0.35, size: 0.4 })))
    chifres.add(corpo)
    const raiz = shade(new THREE.Mesh(hornGeo(pts, 0.088, 0.06, 0.0, 0.22), mat(MARFIM_BASE, { roughness: 0.6, size: 0.3 })))
    chifres.add(raiz)
    const pontaChifre = sphere(0.013, MARFIM, { roughness: 0.35 })
    pontaChifre.position.copy(pts[pts.length - 1])
    chifres.add(pontaChifre)
  }

  // ---- baforadas tristes (filhas da cabeça, saem das narinas) --------------
  const baforadas = new THREE.Group()
  baforadas.position.set(0, -0.08, 0.48)
  cabeca.add(baforadas)
  for (const s of [-1, 1]) {
    const jato = new THREE.Group()
    jato.position.x = s * 0.085
    jato.quaternion.setFromUnitVectors(
      new THREE.Vector3(0, 1, 0),
      new THREE.Vector3(s * 0.92, -0.14, 0.36).normalize(),
    )
    const cone1 = cone(0.05, 0.13, BAFO, { roughness: 0.9 })
    cone1.rotation.x = Math.PI
    cone1.position.y = 0.065
    jato.add(cone1)
    const nuvem1 = puff(0.055, BAFO, 4, 40 + s, { roughness: 0.9 })
    nuvem1.position.y = 0.16
    jato.add(nuvem1)
    const nuvem2 = puff(0.085, BAFO, 6, 30 + s, { roughness: 0.9 })
    nuvem2.position.set(s * 0.02, 0.31, 0)
    jato.add(nuvem2)
    baforadas.add(jato)
  }

  // ---- posições derivadas da pose final ------------------------------------
  root.updateMatrixWorld(true)
  const pontaMundo = ponta.getWorldPosition(new THREE.Vector3())
  const maoL = bracoL.children[0].getWorldPosition(new THREE.Vector3())

  // ---- parede de cana do golpe: a face passa exatamente pela ponta da mão --
  const paredeGolpe = caneWall(2.5, 2.5, 19)
  const n = new THREE.Vector3(Math.sin(PAREDE_PHI), 0, Math.cos(PAREDE_PHI))
  const t = new THREE.Vector3(Math.cos(PAREDE_PHI), 0, -Math.sin(PAREDE_PHI))
  const HIT_X = -0.25 // ponto do golpe, um pouco atrás do meio da parede
  const pg = pontaMundo.clone().addScaledVector(n, -0.06).addScaledVector(t, -HIT_X)
  paredeGolpe.position.set(pg.x, 0, pg.z)
  paredeGolpe.rotation.y = PAREDE_PHI
  root.add(paredeGolpe)

  // ---- três anéis de impacto no ponto do golpe -----------------------------
  const impacto = new THREE.Group()
  impacto.position.copy(pontaMundo).addScaledVector(n, 0.035)
  impacto.rotation.y = PAREDE_PHI
  for (const [r, tube] of [[0.1, 0.017], [0.19, 0.015], [0.28, 0.013]] as const) {
    const anel = torus(r, tube, '#ffffff', { roughness: 0.4, emissive: '#ffffff', emissiveIntensity: 0.35 })
    impacto.add(anel)
  }
  root.add(impacto)

  // ---- convite rosa da VERA (acento) ---------------------------------------
  const convite = new THREE.Group()
  const CONV_POS = maoL.clone().add(new THREE.Vector3(-0.33, 0.02, 0.06))
  const CONV_ROT = new THREE.Euler(-0.3, -0.05, 0.07)
  convite.position.copy(CONV_POS)
  convite.rotation.copy(CONV_ROT)

  const cartao = rbox(0.66, 0.46, 0.022, 0.03, ROSA, { roughness: 0.45 })
  convite.add(cartao)
  for (const [w, h, x, y] of [
    [0.58, 0.014, 0, 0.196], [0.58, 0.014, 0, -0.196], [0.014, 0.38, 0.288, 0], [0.014, 0.38, -0.288, 0],
  ] as const) {
    const filete = rbox(w, h, 0.006, 0.003, BRANCO, { roughness: 0.5 })
    filete.position.set(x, y, 0.013)
    convite.add(filete)
  }
  const glyphs: ['V' | 'E' | 'R' | 'A', number][] = [['V', -0.195], ['E', -0.065], ['R', 0.065], ['A', 0.195]]
  for (const [gl, lx] of glyphs) {
    const l = letter(gl)
    l.position.set(lx, -0.05, 0.016)
    convite.add(l)
  }
  // marca de batom no canto
  const beijo = new THREE.Group()
  beijo.position.set(-0.19, 0.12, 0.014)
  beijo.rotation.z = 0.3
  for (const s of [-1, 1]) {
    const labioSup = sphere(0.034, BATOM, { roughness: 0.35 })
    labioSup.scale.set(1.25, 0.55, 0.2)
    labioSup.position.set(s * 0.028, 0.012, 0)
    labioSup.rotation.z = s * 0.25
    beijo.add(labioSup)
  }
  const labioInf = sphere(0.044, BATOM, { roughness: 0.35 })
  labioInf.scale.set(1.45, 0.55, 0.2)
  labioInf.position.set(0, -0.024, 0)
  beijo.add(labioInf)
  convite.add(beijo)
  root.add(convite)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'chao', group: 'labirinto', object: chao },
    { name: 'paredeFundo', group: 'labirinto', object: paredeFundo },
    { name: 'paredeLado', group: 'labirinto', object: paredeLado },
    { name: 'paredeGolpe', group: 'labirinto', object: paredeGolpe },
    { name: 'luzes', group: 'festa', object: luzes },
    { name: 'minotauro', group: 'minotauro', object: minotauro },
    { name: 'cabeca', group: 'minotauro', object: cabeca },
    { name: 'chifres', group: 'minotauro', object: chifres },
    { name: 'bracoGolpe', group: 'minotauro', object: bracoGolpe },
    { name: 'convite', group: 'convite', object: convite },
    { name: 'impacto', group: 'golpe', object: impacto },
    { name: 'baforadas', group: 'bufa', object: baforadas },
  ]

  // ---- montagem ------------------------------------------------------------
  const SLIDE_Y = GY + 0.012
  const build = [
    seq('chao-rise', 'chao', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Sábado à noite, num labirinto de paredes de cana-de-açúcar…',
    }),
    seq('fundo-rise', 'paredeFundo', 0.2, 0.9, [riseFrom(0, 2.4)], { ease: 'easeOut' }),
    seq('lado-rise', 'paredeLado', 0.4, 0.9, [riseFrom(0, 2.5)], { ease: 'easeOut' }),
    seq('golpe-rise', 'paredeGolpe', 0.6, 0.9, [riseFrom(0, 2.7)], { ease: 'easeOut' }),

    seq('luzes-sobem', 'luzes', 1.9, 0.9, [riseFrom(0, 1.3)], {
      ease: 'easeOut',
      caption: '…do outro lado do muro, acendem as luzinhas de uma festa.',
    }),

    seq('minotauro-rise', 'minotauro', 3.3, 0.9, [riseFrom(GY, 2.5)], {
      ease: 'easeOut',
      caption: 'Aqui dentro, preso no beco sem saída, está o minotauro.',
    }),
    seq('cabeca-surge', 'cabeca', 3.3, 0.9, [ch('rotation.x', 0, 0), ch('rotation.y', 0, 0)]),
    seq('braco-surge', 'bracoGolpe', 3.3, 0.9, [
      ch('rotation.z', REPOUSO_Z, REPOUSO_Z), ch('rotation.y', 0, 0), ch('rotation.x', 0, 0),
    ]),
    seq(
      'chifres-crescem',
      'chifres',
      3.9,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq(
      'convite-desliza',
      'convite',
      5.0,
      0.85,
      [
        ch('position.x', -0.95, -0.8), ch('position.y', SLIDE_Y, SLIDE_Y), ch('position.z', -1.35, 0.35),
        ch('rotation.x', -Math.PI / 2, -Math.PI / 2), ch('rotation.y', 0, 0), ch('rotation.z', 0.5, 0.15),
      ],
      {
        ease: 'easeOut',
        caption: 'Por baixo da parede desliza um convite com marca de batom: festa na casa da VERA!',
      },
    ),
    seq('convite-sobe', 'convite', 5.9, 0.6, [
      ch('position.x', -0.8, CONV_POS.x), ch('position.y', SLIDE_Y, CONV_POS.y), ch('position.z', 0.35, CONV_POS.z),
      ch('rotation.x', -Math.PI / 2, CONV_ROT.x), ch('rotation.y', 0, CONV_ROT.y), ch('rotation.z', 0.15, CONV_ROT.z),
    ], { ease: 'easeOut' }),

    seq('cabeca-bico', 'cabeca', 6.7, 0.6, [ch('rotation.x', 0, 0.42), ch('rotation.y', 0, -0.6)], {
      ease: 'easeOut',
      caption: 'Ele faz BICO de beijo pro batom e suspira num fôlego só: tu-VÉRA…',
    }),

    seq('cabeca-mira', 'cabeca', 8.2, 0.45, [ch('rotation.x', 0.42, -0.08), ch('rotation.y', -0.6, 0.45)], {
      ease: 'easeOut',
    }),
    seq('braco-ergue', 'bracoGolpe', 8.2, 0.5, [
      ch('rotation.z', REPOUSO_Z, ALTO_Z), ch('rotation.y', 0, GOLPE_Y), ch('rotation.x', 0, ALTO_X),
    ], {
      ease: 'easeOut',
      caption: 'Parte pra saída e desce um golpe de caratê na parede: CANA, IÁ!',
    }),
    seq('braco-golpe', 'bracoGolpe', 8.8, 0.18, [
      ch('rotation.z', ALTO_Z, GOLPE_Z), ch('rotation.x', ALTO_X, 0),
    ], { ease: 'easeIn' }),
    seq(
      'impacto-estala',
      'impacto',
      8.98,
      0.3,
      [ch('scale.x', 0.01, 1.3), ch('scale.y', 0.01, 1.3), ch('scale.z', 0.01, 1.3)],
      { ease: 'easeOut' },
    ),
    seq('parede-treme', 'paredeGolpe', 8.98, 0.12, [ch('rotation.y', PAREDE_PHI, PAREDE_PHI + 0.012)]),
    seq('parede-firme', 'paredeGolpe', 9.1, 0.3, [ch('rotation.y', PAREDE_PHI + 0.012, PAREDE_PHI)]),

    seq(
      'impacto-assenta',
      'impacto',
      9.7,
      0.5,
      [ch('scale.x', 1.3, 1), ch('scale.y', 1.3, 1), ch('scale.z', 1.3, 1)],
      { ease: 'easeInOut', caption: 'A cana nem lasca: continua ÍNTEgra, sem um arranhão.' },
    ),

    seq('cabeca-baixa', 'cabeca', 11.1, 0.7, [ch('rotation.x', -0.08, CAB_X), ch('rotation.y', 0.45, CAB_Y)], {
      ease: 'easeInOut',
      caption: 'Ele baixa os chifres e bufa triste pelas narinas…',
    }),
    seq(
      'bafo-sai',
      'baforadas',
      11.6,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('bafo-fim', 'baforadas', 12.7, 0.6, [ch('position.y', -0.06, -0.08)], {
      ease: 'easeOut',
      caption: 'Tyvärr kan jag inte. — Infelizmente não posso.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.5, 2.3, 4.45], target: [0.15, 1.32, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'tyvarr-kan-jag-inte',
    contexto:
      "Vida social: pra recusar convite, pedido ou proposta com educação, por mensagem ou cara a cara. Na Suécia a recusa costuma vir com o motivo e, se der, outra data: 'Tyvärr kan jag inte på lördag, men nästa vecka?'.",
    fraseFonte: 'Infelizmente não posso.',
    fraseAlvo: 'Tyvärr kan jag inte.',
    pronuncia:
      "tü-VÉRR kan iá ÍN-te ('tyvärr' tem a força no fim: o 'ty' é curtinho e de bico — o Ü —, e o 'värr' tem É BEM aberto, quase puxando pra A, e R de 'caro', só que mais firme; 'kan jag' emenda em 'ka-niá', o g não soa; 'inte' com força no ÍN, T seco e -te fraquinho)",
    ponteSonora:
      "tu-VÉRA... CANA, IÁ!... ÍNTE(gra). (6 sílabas: tü-VÉR-ka-niá-ÍN-te; tônicas em VÉR e ÍN; tu-VÉRA num fôlego só, SEM vírgula e sem pausa — o 'tu' é a sílaba fraca de uma palavra só; com pausa ('Tu, Vera...') a força cai no TU e sai 'TY-värr', tônica errada; TU = o 'ty', curtinho e fraco, com BICO DE PATO e língua de I — é o Ü, o y sueco, o mesmo TÜ de 'Jag tycker att det låter bra' (lá com força, aqui sem) —, e é o bico de beijo que o minotauro faz pro batom do convite; VÉR(a) = VERA sem o -A, com toda a força: o É ABERTO do nome, de 'pé', bem escancarado — antes de R o ä abre quase até A —, e o R firme, de 'caro' esticado (pode até vibrar), sem vogal depois; nunca o Ê fechado de 'ver'; e não é a VARA de 'var' (onde): VERA é gente, o nome escrito no convite, e é o É do nome que segura a vogal certa; CANA, IÁ = o MESMO 'kan jag' da galinha de 'Kan jag få en påse?' e do gorila de 'Kan jag betala med kort?' — o grito de caratê com a cana —, emendado, CA-NIÁ, I de IOGA, nunca o J chiado de 'canja'; depois de 'tyvärr' o sueco põe o verbo antes do 'eu', e a ponte já vem nessa ordem; ÍNTE(gra) = o MESMO âncora de 'inte' do sorvete ÍNTEgro de 'Jag vet inte' e da PRATA ÍNTEgra de 'Jag pratar inte så bra svenska': força no ÍN, corta o '-gra', T seco de 'tatu', nunca 'íntchi')",
    historia:
      'Sábado à noite, por baixo da parede do labirinto desliza um convite com marca de batom: festa na casa da VERA. O minotauro faz BICO de beijo pro batom e suspira num fôlego só, a força toda no nome dela: tu-VERA... Aí parte pra saída: ergue a mão e desce um golpe de caratê na parede de CANA: CANA, IÁ! A cana nem lasca, continua ÍNTEGRA, sem um arranhão. Ele baixa os chifres, bufa triste pelas narinas e responde do jeito sueco, educado e com pena: infelizmente, não posso.',
  },
  createScene,
  refine: { organic: ['cabeca'] },
}

export default card
