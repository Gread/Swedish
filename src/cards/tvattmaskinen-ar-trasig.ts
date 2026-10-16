import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Tvättmaskinen är trasig." — TVÉT! MA-RRÍÍÍ-NEN... É TRÁS(t)E!
 *
 * Alguém lavou um PÔNEI: ele está entalado na escotilha da máquina, do peito
 * pra fora, com as patas dianteiras caídas sobre a borda. A toalha listrada
 * no pescoço estala (TVÉT!), ele relincha de beiço em bico (MA-RRÍÍÍ-NEN) e
 * a patada arranca o T do bilhete TRASTE colado na máquina: TRAS·E.
 *
 * Diorama: piso de ladrilho, parede de azulejo azul-claro, máquina branca de
 * frente com o painel amassado e fumegando, espuma pra todo lado. O amarelo
 * do bilhete (e do pedaço com o T) é o único acento saturado da cena.
 */

const GROUT = '#a7adb2'
const FLOOR = '#d3d7da'
const WALL = '#a3c8dc'
const WALL_GROUT = '#88afc5'
const MACHINE = '#eceeef'
const PANEL = '#c9ced3'
const CHROME = '#c9ced3'
const DARK = '#24292e'
const FOAM = '#fbfdff'
const PONY = '#f4ecdd'
const SPOT = '#8d5a35'
const MANE = '#5b3a25'
const HOOF = '#3b3431'
const LIP = '#9c8580'
const MUZZLE = '#ddd3cb'
const TOWEL = '#2f6fb0'
const TOWEL_W = '#f3f1ec'
const SMOKE = '#80868c'
const INK = '#26221f'
const YELLOW = '#f5c242' // ACENTO reservado: o bilhete TRASTE e o pedaço com o T

const GY = 0.16 // topo do piso
const MZ = -0.75 // centro da máquina em z
const FZ = MZ + 0.55 // face da frente da máquina
const PH = 1.0 // altura (local da máquina) do centro da escotilha
const PO = new THREE.Vector3(0, GY + PH, FZ) // boca da escotilha no mundo

const NOTE_Y = GY + 0.25
const SLOT_X = 0.23 // onde estava o T do meio
const T_FINAL: [number, number, number] = [0.78, GY + 0.33, 0.62]

/** Cápsula entre dois pontos — patas, pescoço, mechas. */
function seg(
  a: [number, number, number],
  b: [number, number, number],
  r: number,
  color: string,
  opts = { roughness: 0.7 },
) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const dir = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, dir.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize())
  return m
}

/** Traço de letra de pincel atômico: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.014, 0.006, INK, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** T R A S E — letras de traço grosso, ~0.2 de altura. */
function letter(which: 'T' | 'R' | 'A' | 'S' | 'E') {
  const g = new THREE.Group()
  const t = 0.036
  if (which === 'T') {
    g.add(stroke(0.15, t, 0, 0.082))
    g.add(stroke(t, 0.18, 0, -0.012))
  } else if (which === 'R') {
    g.add(stroke(t, 0.2, -0.05, 0))
    g.add(stroke(0.1, t, -0.008, 0.082))
    g.add(stroke(0.1, t, -0.008, 0.004))
    g.add(stroke(t, 0.08, 0.044, 0.043))
    g.add(stroke(t, 0.11, 0.022, -0.05, 0.45))
  } else if (which === 'A') {
    g.add(stroke(t, 0.205, -0.032, 0, -0.3))
    g.add(stroke(t, 0.205, 0.032, 0, 0.3))
    g.add(stroke(0.075, 0.03, 0, -0.028))
  } else if (which === 'S') {
    // S curvo (de caixas ele vira um 5): tubo achatado ao longo de uma curva
    const curva = new THREE.CatmullRomCurve3(
      [
        [0.05, 0.07], [0.0, 0.092], [-0.045, 0.066], [-0.035, 0.022], [0.0, 0.0],
        [0.037, -0.022], [0.047, -0.066], [0.0, -0.092], [-0.052, -0.07],
      ].map(([x, y]) => new THREE.Vector3(x, y, 0)),
    )
    const s = new THREE.Mesh(new THREE.TubeGeometry(curva, 48, t / 2, 10, false), mat(INK, { roughness: 0.5, size: 0.2 }))
    s.scale.z = 0.4
    s.castShadow = true
    g.add(s)
    for (const p of [curva.getPoint(0), curva.getPoint(1)]) {
      const tampa = sphere(t / 2, INK, { roughness: 0.5 }, 12)
      tampa.position.copy(p)
      tampa.scale.z = 0.4
      g.add(tampa)
    }
  } else {
    g.add(stroke(t, 0.2, -0.045, 0))
    g.add(stroke(0.11, t, 0.0, 0.082))
    g.add(stroke(0.09, t, -0.01, 0))
    g.add(stroke(0.11, t, 0.0, -0.082))
  }
  return g
}

/** Fita de pano ao longo de uma curva: largura e torção variam com t. */
function ribbon(
  curve: THREE.Curve<THREE.Vector3>,
  t0: number,
  t1: number,
  width: (t: number) => number,
  twist: (t: number) => number,
  color: string,
  segs = 14,
) {
  const pos: number[] = []
  const idx: number[] = []
  const Z = new THREE.Vector3(0, 0, 1)
  for (let i = 0; i <= segs; i++) {
    const t = t0 + ((t1 - t0) * i) / segs
    const p = curve.getPoint(t)
    const tan = curve.getTangent(t)
    const n = new THREE.Vector3(-tan.y, tan.x, 0).normalize()
    const phi = twist(t)
    const w = Z.clone().multiplyScalar(Math.cos(phi)).addScaledVector(n, Math.sin(phi))
      .multiplyScalar(width(t) / 2)
    pos.push(p.x + w.x, p.y + w.y, p.z + w.z, p.x - w.x, p.y - w.y, p.z - w.z)
    if (i < segs) {
      const a = i * 2
      idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const m = mat(color, { roughness: 0.92, size: 0.4 })
  m.side = THREE.DoubleSide
  const mesh = new THREE.Mesh(geo, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- lavanderia: piso de ladrilho + parede de azulejo azul ----------------
  const base = new THREE.Group()

  const laje = rbox(3.7, 0.12, 2.9, 0.05, GROUT, { roughness: 0.85 })
  laje.position.set(0, 0.06, -0.15)
  base.add(laje)
  const piso = rbox(3.62, 0.04, 2.82, 0.015, FLOOR, { roughness: 0.35 })
  piso.position.set(0, GY - 0.02, -0.15)
  base.add(piso)
  // rejunte: linhas finas sobre o piso
  for (let i = -4; i <= 4; i++) {
    const linha = rbox(0.018, 0.008, 2.8, 0.003, GROUT, { roughness: 0.8 })
    linha.position.set(i * 0.4, GY + 0.002, -0.15)
    base.add(linha)
  }
  for (let j = -3; j <= 3; j++) {
    const linha = rbox(3.6, 0.008, 0.018, 0.003, GROUT, { roughness: 0.8 })
    linha.position.set(0, GY + 0.002, -0.15 + j * 0.4)
    base.add(linha)
  }
  // ralo e poça
  const ralo = cylinder(0.11, 0.11, 0.016, '#b4bbc1', { roughness: 0.35, metalness: 0.4 })
  ralo.position.set(-0.4, GY + 0.006, 0.9)
  base.add(ralo)
  for (let i = -2; i <= 2; i++) {
    const fenda = rbox(0.13 - Math.abs(i) * 0.025, 0.006, 0.016, 0.003, '#59616a', { roughness: 0.6 })
    fenda.position.set(-0.4, GY + 0.015, 0.9 + i * 0.035)
    base.add(fenda)
  }
  const poca = cylinder(0.5, 0.52, 0.008, '#b9d3e2', { roughness: 0.08 })
  poca.position.set(-0.3, GY + 0.003, 0.85)
  poca.scale.z = 0.6
  base.add(poca)

  // parede de azulejo
  const parede = rbox(3.7, 2.5, 0.14, 0.04, WALL, { roughness: 0.3 })
  parede.position.set(0, GY + 1.25, -1.53)
  base.add(parede)
  for (let i = -4; i <= 4; i++) {
    const v = rbox(0.016, 2.46, 0.01, 0.004, WALL_GROUT, { roughness: 0.8 })
    v.position.set(i * 0.4, GY + 1.25, -1.455)
    base.add(v)
  }
  for (let j = 1; j <= 6; j++) {
    const h = rbox(3.66, 0.016, 0.01, 0.004, WALL_GROUT, { roughness: 0.8 })
    h.position.set(0, GY + j * 0.36, -1.455)
    base.add(h)
  }

  // cesto de roupa (vime) à esquerda
  const cesto = lathe(
    [[0, 0], [0.27, 0.01], [0.33, 0.34], [0.36, 0.37], [0.34, 0.37], [0.3, 0.05], [0, 0.03]],
    '#b8935e',
    { roughness: 0.85 },
  )
  cesto.position.set(-1.4, GY, 0.72)
  base.add(cesto)
  for (const [rx, ry, rz, cor] of [[0, 0.36, 0, '#d27d6b'], [0.08, 0.41, -0.05, '#7f9fbf'], [-0.07, 0.43, 0.06, '#e8e1d2']] as const) {
    const roupa = puff(0.13, cor, 3, 70 + rx * 100, { roughness: 0.9 })
    roupa.scale.set(1, 0.55, 1)
    roupa.position.set(-1.4 + rx, GY + ry, 0.72 + rz)
    base.add(roupa)
  }

  // frasco de sabão à direita
  const frasco = lathe(
    [[0, 0], [0.12, 0], [0.13, 0.04], [0.13, 0.3], [0.08, 0.38], [0.045, 0.4], [0.045, 0.46], [0, 0.46]],
    '#6fa08a',
    { roughness: 0.3 },
  )
  frasco.position.set(1.45, GY, -0.05)
  frasco.rotation.z = -0.08
  base.add(frasco)
  const tampa = cylinder(0.05, 0.05, 0.06, '#e9e6df', { roughness: 0.4 })
  tampa.position.set(1.45 + 0.04, GY + 0.48, -0.05)
  base.add(tampa)

  root.add(base)

  // ---- espuma: montes no piso e um colar em volta da escotilha --------------
  const espuma = new THREE.Group()
  const FOAM_OPTS = { roughness: 0.32 }
  const montes: [number, number, number, number][] = [
    [-1.05, 0.0, -0.45, 0.32],
    [-0.85, 0.0, 0.25, 0.22],
    [1.0, 0.0, -0.55, 0.3],
    [0.95, 0.0, 0.2, 0.2],
    [T_FINAL[0], 0.0, T_FINAL[2] - 0.05, 0.2],
    [-0.15, 0.0, 0.45, 0.12],
    [1.5, 0.0, 0.55, 0.14],
    [-1.55, 0.0, -0.2, 0.18],
    [0.35, 0.0, 0.15, 0.1],
  ]
  montes.forEach(([x, , z, r], i) => {
    const monte = puff(r, FOAM, 6, 90 + i, FOAM_OPTS)
    monte.scale.set(1.25, 0.75, 1.15)
    monte.position.set(x, GY + r * 0.45, z)
    espuma.add(monte)
    // bolhinhas soltas ao redor
    for (let k = 0; k < 3; k++) {
      const b = sphere(0.025 + rand() * 0.035, FOAM, FOAM_OPTS, 16)
      const a = rand() * Math.PI * 2
      b.position.set(x + Math.cos(a) * r * 1.6, GY + 0.03, z + Math.sin(a) * r * 1.4)
      espuma.add(b)
    }
  })
  // colar de espuma transbordando da escotilha (em volta do peito do pônei)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.2
    if (Math.sin(a) > 0.55) continue // o pescoço sai por cima
    const bolha = sphere(0.075 + rand() * 0.04, FOAM, FOAM_OPTS, 20)
    bolha.position.set(PO.x + Math.cos(a) * 0.37, PO.y + Math.sin(a) * 0.37, PO.z + 0.09)
    espuma.add(bolha)
  }
  // espuma escorrendo da tampa
  const topoEsp = puff(0.17, FOAM, 5, 120, FOAM_OPTS)
  topoEsp.scale.set(1.3, 0.6, 1)
  topoEsp.position.set(0.5, GY + 1.74, MZ + 0.05)
  espuma.add(topoEsp)
  root.add(espuma)

  // ---- máquina de lavar branca, de frente ---------------------------------
  const maquina = new THREE.Group()
  maquina.position.set(0, GY, MZ)

  const corpo = rbox(1.5, 1.62, 1.1, 0.09, MACHINE, { roughness: 0.3 })
  corpo.position.y = 0.86
  maquina.add(corpo)

  // tampa de cima, empenada
  const tampo = rbox(1.5, 0.05, 1.08, 0.02, '#dfe2e4', { roughness: 0.35 })
  tampo.position.set(0, 1.685, 0)
  tampo.rotation.set(-0.025, 0, 0.035)
  maquina.add(tampo)

  // moldura, aro cromado e o escuro do tambor
  const moldura = torus(0.47, 0.06, '#d9dde0', { roughness: 0.35 })
  moldura.scale.z = 0.35
  moldura.position.set(0, PH, 0.555)
  maquina.add(moldura)
  const aro = torus(0.43, 0.065, CHROME, { roughness: 0.18, metalness: 0.9 })
  aro.position.set(0, PH, 0.575)
  maquina.add(aro)
  const fundoTambor = cylinder(0.41, 0.41, 0.04, DARK, { roughness: 0.7 })
  fundoTambor.rotation.x = Math.PI / 2
  fundoTambor.position.set(0, PH, 0.5)
  maquina.add(fundoTambor)
  const borracha = torus(0.39, 0.035, '#4a5057', { roughness: 0.6 })
  borracha.position.set(0, PH, 0.53)
  maquina.add(borracha)
  // dobradiça da porta, à esquerda do aro
  const dobradica = rbox(0.08, 0.2, 0.06, 0.02, CHROME, { roughness: 0.2, metalness: 0.85 })
  dobradica.position.set(-0.5, PH, 0.58)
  maquina.add(dobradica)
  // rodapé e pés
  const rodape = rbox(1.36, 0.02, 0.01, 0.005, '#c7ccd0', { roughness: 0.5 })
  rodape.position.set(0, 0.1, 0.556)
  maquina.add(rodape)
  for (const [px, pz] of [[-0.62, 0.45], [0.62, 0.45], [-0.62, -0.45], [0.62, -0.45]] as const) {
    const pe = cylinder(0.06, 0.07, 0.05, '#3d4349', { roughness: 0.75 })
    pe.position.set(px, 0.025, pz)
    maquina.add(pe)
  }
  root.add(maquina)

  // ---- porta de vidro aberta, rachada (dobradiça à esquerda) ---------------
  const porta = new THREE.Group()
  porta.position.set(-0.5, GY + PH, FZ + 0.06)
  porta.rotation.y = -2.2
  const anelPorta = torus(0.38, 0.065, CHROME, { roughness: 0.18, metalness: 0.9 })
  anelPorta.position.x = 0.46
  porta.add(anelPorta)
  const vidro = cylinder(0.34, 0.34, 0.03, '#bfe0ee', { roughness: 0.05 }, 40)
  const vidroMat = vidro.material as THREE.MeshStandardMaterial
  vidroMat.transparent = true
  vidroMat.opacity = 0.42
  vidroMat.normalMap = null
  vidro.castShadow = false
  vidro.rotation.x = Math.PI / 2
  vidro.position.set(0.46, 0, 0.01)
  porta.add(vidro)
  // rachaduras: raios tortos a partir de um ponto de impacto
  const impacto = new THREE.Vector2(0.52, 0.06)
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + rand() * 0.5
    const len = 0.14 + rand() * 0.12
    for (const face of [-1, 1]) {
      const risco = rbox(0.012, len, 0.004, 0.002, '#f4fbff', { roughness: 0.2 })
      risco.position.set(
        impacto.x + Math.cos(a) * len * 0.5,
        impacto.y + Math.sin(a) * len * 0.5,
        0.01 + face * 0.018,
      )
      risco.rotation.z = a - Math.PI / 2
      porta.add(risco)
    }
  }
  const pegador = rbox(0.06, 0.16, 0.06, 0.02, '#9aa1a8', { roughness: 0.3, metalness: 0.6 })
  pegador.position.set(0.86, 0, 0.02)
  porta.add(pegador)
  const charneira = rbox(0.07, 0.18, 0.05, 0.02, CHROME, { roughness: 0.2, metalness: 0.85 })
  porta.add(charneira)
  root.add(porta)

  // ---- painel de controle amassado com a marca da ferradura ----------------
  // a dobra fica à ESQUERDA (x<0), longe da cabeça do pônei, para ser vista
  const painel = new THREE.Group()
  painel.position.set(0, GY + 1.5, FZ + 0.03)
  const painelD = rbox(0.9, 0.27, 0.07, 0.025, PANEL, { roughness: 0.4 })
  painelD.position.set(0.29, 0, 0)
  painel.add(painelD)
  // metade esquerda afundada: dobra em V no ponto da patada
  const DENT = new THREE.Euler(0.14, -0.22, 0.08)
  const painelE = rbox(0.6, 0.27, 0.07, 0.025, PANEL, { roughness: 0.4 })
  painelE.position.set(-0.45, -0.015, -0.035)
  painelE.rotation.copy(DENT)
  painel.add(painelE)
  const gaveta = rbox(0.32, 0.17, 0.03, 0.02, '#e3e6e8', { roughness: 0.35 })
  gaveta.position.set(0.52, 0, 0.045)
  painel.add(gaveta)
  const puxador = rbox(0.17, 0.025, 0.02, 0.008, '#a9b0b6', { roughness: 0.4 })
  puxador.position.set(0.52, -0.05, 0.065)
  painel.add(puxador)
  const seletor = cylinder(0.075, 0.075, 0.05, CHROME, { roughness: 0.2, metalness: 0.85 })
  seletor.rotation.x = Math.PI / 2
  seletor.position.set(0.22, 0, 0.055)
  painel.add(seletor)
  const visor = rbox(0.18, 0.09, 0.02, 0.01, '#2c3238', { roughness: 0.2 })
  visor.position.set(-0.02, 0.02, 0.042)
  painel.add(visor)
  const erro = rbox(0.1, 0.035, 0.01, 0.005, '#ff6b4a', { emissive: '#ff5533', emissiveIntensity: 1.4 })
  erro.position.set(-0.02, 0.02, 0.055)
  painel.add(erro)
  // ferradura escura estampada na dobra (abertura para baixo)
  const marca = new THREE.Group()
  marca.position.set(-0.43, -0.01, -0.03)
  marca.rotation.copy(DENT)
  const ARC = Math.PI * 1.35
  const ferradura = new THREE.Mesh(
    new THREE.TorusGeometry(0.075, 0.019, 10, 28, ARC),
    mat(HOOF, { roughness: 0.8, size: 0.15 }),
  )
  ferradura.rotation.z = -Math.PI / 2 - ARC / 2 + Math.PI
  ferradura.position.z = 0.042
  marca.add(ferradura)
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 2 + (i - 1.5) * 0.55
    const prego = sphere(0.011, '#1c1816', { roughness: 0.5 }, 10)
    prego.position.set(Math.cos(a) * 0.075, Math.sin(a) * 0.075, 0.062)
    marca.add(prego)
  }
  // trincas saindo da marca
  for (const [ang, len] of [[0.5, 0.13], [2.7, 0.12], [-0.6, 0.1], [3.6, 0.09]] as const) {
    const trinca = rbox(0.01, len, 0.01, 0.003, '#59616a', { roughness: 0.7 })
    trinca.position.set(Math.cos(ang) * (0.1 + len / 2), Math.sin(ang) * (0.1 + len / 2), 0.042)
    trinca.rotation.z = ang - Math.PI / 2
    marca.add(trinca)
  }
  painel.add(marca)
  root.add(painel)

  // ---- fumacinha cinza saindo da dobra do painel ---------------------------
  const fumaca = new THREE.Group()
  fumaca.position.set(-0.5, GY + 1.68, FZ - 0.05)
  for (const [fx, fy, fr, s] of [[0, 0.05, 0.1, 1], [-0.07, 0.24, 0.13, 2], [-0.02, 0.45, 0.16, 3]] as const) {
    const nuvem = puff(fr, SMOKE, 5, 140 + s, { roughness: 0.95 })
    nuvem.position.set(fx, fy, 0)
    fumaca.add(nuvem)
  }
  root.add(fumaca)

  // ---- PÔNEI entalado (corpo + pata esquerda + pescoço) --------------------
  const PONY_OPTS = { roughness: 0.75 }
  const ponei = new THREE.Group()
  ponei.position.copy(PO)

  // peito/tronco: metade fica dentro do tambor
  const tronco = seg([0, -0.1, -0.55], [0, 0.1, 0.18], 0.33, PONY, PONY_OPTS)
  ponei.add(tronco)
  // pescoço arqueado para a frente
  ponei.add(seg([0, 0.1, 0.18], [0, 0.5, 0.3], 0.2, PONY, PONY_OPTS))
  ponei.add(seg([0, 0.5, 0.3], [0, 0.74, 0.44], 0.17, PONY, PONY_OPTS))
  // crina escura e molhada caindo para o lado da câmera (+x)
  for (let i = 0; i < 6; i++) {
    const k = i / 5
    const y = 0.22 + k * 0.56
    const z = 0.06 + k * 0.3
    const mecha = seg(
      [0.03, y + 0.05, z - 0.17],
      [0.14 + rand() * 0.04, y - 0.1, z - 0.1],
      0.055,
      MANE,
      { roughness: 0.6 },
    )
    ponei.add(mecha)
  }
  // manchas marrons no peito
  for (const [mx, my, mz, mr] of [[0.21, 0.06, 0.2, 0.13], [-0.17, -0.05, 0.26, 0.1], [0.12, 0.42, 0.4, 0.09]] as const) {
    const mancha = sphere(mr, SPOT, PONY_OPTS)
    mancha.scale.set(1, 1, 0.45)
    mancha.position.set(mx, my, mz)
    mancha.lookAt(new THREE.Vector3(mx * 3, my, mz + 1))
    ponei.add(mancha)
  }
  // pata esquerda apoiada na borda da escotilha (às 8 horas)
  ponei.add(seg([-0.17, -0.08, 0.26], [-0.28, -0.2, 0.24], 0.09, PONY, PONY_OPTS))
  ponei.add(seg([-0.28, -0.2, 0.24], [-0.33, -0.3, 0.14], 0.075, PONY, PONY_OPTS))
  const cascoE = seg([-0.33, -0.3, 0.14], [-0.35, -0.34, 0.08], 0.075, HOOF, { roughness: 0.5 })
  ponei.add(cascoE)
  root.add(ponei)

  // ---- pata direita (peça própria: dá a patada) ----------------------------
  const pataD = new THREE.Group()
  pataD.position.set(PO.x + 0.17, PO.y - 0.08, PO.z + 0.26)
  pataD.add(seg([0, 0, 0], [0.11, -0.12, -0.02], 0.09, PONY, PONY_OPTS))
  pataD.add(seg([0.11, -0.12, -0.02], [0.16, -0.22, -0.12], 0.075, PONY, PONY_OPTS))
  const manchaPata = sphere(0.08, SPOT, PONY_OPTS)
  manchaPata.scale.set(1, 1.2, 0.6)
  manchaPata.position.set(0.09, -0.08, 0.04)
  pataD.add(manchaPata)
  pataD.add(seg([0.16, -0.22, -0.12], [0.18, -0.26, -0.18], 0.075, HOOF, { roughness: 0.5 }))
  root.add(pataD)

  // ---- cabeça de cavalo relinchando, de beiço em bico ----------------------
  const cabeca = new THREE.Group()
  cabeca.rotation.order = 'YXZ' // empina o focinho e DEPOIS vira de perfil
  cabeca.position.set(PO.x, PO.y + 0.86, PO.z + 0.5)
  cabeca.rotation.set(-0.3, 1.3, 0.05)

  const cranio = sphere(0.21, PONY, PONY_OPTS)
  cranio.scale.set(0.85, 0.95, 1.1)
  cranio.position.set(0, 0.04, -0.02)
  cabeca.add(cranio)
  const bochecha = sphere(0.17, PONY, PONY_OPTS)
  bochecha.position.set(0, -0.07, 0.04)
  cabeca.add(bochecha)
  cabeca.add(seg([0, -0.02, 0.08], [0, -0.1, 0.38], 0.13, PONY, PONY_OPTS))
  const narizPonta = sphere(0.14, MUZZLE, PONY_OPTS)
  narizPonta.scale.set(0.95, 0.85, 0.9)
  narizPonta.position.set(0, -0.12, 0.42)
  cabeca.add(narizPonta)
  // mancha marrom em volta do olho (lado da câmera)
  const manchaOlho = sphere(0.12, SPOT, PONY_OPTS)
  manchaOlho.scale.set(0.45, 0.9, 1.1)
  manchaOlho.position.set(0.14, 0.06, 0.02)
  cabeca.add(manchaOlho)
  // beiço em bico: lábios projetados em funil + boca escura no meio
  const dirBoca = new THREE.Vector3(0, -0.15, 1).normalize()
  const labios = torus(0.055, 0.04, LIP, { roughness: 0.45 })
  labios.position.set(0, -0.15, 0.57)
  labios.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dirBoca)
  cabeca.add(labios)
  const boca = sphere(0.058, '#2e171a', { roughness: 0.5 })
  boca.position.set(0, -0.15, 0.565)
  cabeca.add(boca)
  for (const side of [-1, 1]) {
    const narina = sphere(0.035, '#4a3a36', { roughness: 0.5 }, 12)
    narina.scale.set(0.7, 1, 0.5)
    narina.position.set(side * 0.08, -0.06, 0.5)
    narina.rotation.y = side * 0.5
    cabeca.add(narina)

    const esclera = sphere(0.068, '#ffffff', { roughness: 0.25 })
    esclera.position.set(side * 0.155, 0.08, 0.06)
    esclera.scale.set(0.6, 1, 1)
    const pupila = sphere(0.038, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * 0.185, 0.085, 0.075)
    pupila.scale.set(0.6, 1, 1)
    const brilho = sphere(0.012, '#ffffff', { emissive: '#ffffff', emissiveIntensity: 0.8 }, 8)
    brilho.position.set(side * 0.2, 0.11, 0.08)
    cabeca.add(esclera, pupila, brilho)

    const orelha = cone(0.05, 0.18, PONY, PONY_OPTS)
    orelha.position.set(side * 0.09, 0.26, -0.08)
    orelha.rotation.set(-0.15, 0, -side * 0.25)
    cabeca.add(orelha)
  }
  // franja bagunçada e encharcada caindo na testa
  for (let i = 0; i < 6; i++) {
    const x = -0.1 + i * 0.04
    const mecha = seg(
      [x * 0.5, 0.25, -0.02],
      [x + (rand() - 0.5) * 0.05, 0.02 + rand() * 0.06, 0.17 + rand() * 0.03],
      0.038,
      MANE,
      { roughness: 0.6 },
    )
    cabeca.add(mecha)
  }
  root.add(cabeca)

  // ---- toalha listrada no pescoço ------------------------------------------
  const toalha = new THREE.Group()
  toalha.position.set(PO.x, PO.y + 0.33, PO.z + 0.25)
  toalha.rotation.x = 0.3 - Math.PI / 2
  for (const [off, cor, tubo] of [[-0.06, TOWEL, 0.045], [0, TOWEL_W, 0.05], [0.06, TOWEL, 0.045]] as const) {
    const faixa = torus(0.225, tubo, cor, { roughness: 0.92 })
    faixa.position.z = off
    toalha.add(faixa)
  }
  // nó do lado direito
  const no = sphere(0.08, TOWEL_W, { roughness: 0.92 })
  no.position.set(0.24, 0, 0)
  toalha.add(no)
  root.add(toalha)

  // ---- ponta da toalha estalando no ar (peça própria) ----------------------
  // fita de pano em onda, torcida (mostra face e quina) e alargando na barra
  // listrada: o chicote TVÉT! — com gotas espirrando da ponta
  const chicote = new THREE.Group()
  chicote.position.set(PO.x + 0.3, PO.y + 0.33, PO.z + 0.3)
  chicote.rotation.set(0.15, 0, 0)
  const curvaPano = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0),
    new THREE.Vector3(0.16, -0.1, 0.06),
    new THREE.Vector3(0.32, 0.06, 0.1),
    new THREE.Vector3(0.5, 0.0, 0.08),
    new THREE.Vector3(0.64, -0.2, 0.04),
    new THREE.Vector3(0.82, -0.18, 0.0),
  ])
  const faixas: [number, number, string][] = [
    [0, 0.66, TOWEL_W], [0.66, 0.72, TOWEL], [0.72, 0.78, TOWEL_W],
    [0.78, 0.84, TOWEL], [0.84, 1, TOWEL_W],
  ]
  for (const [t0, t1, cor] of faixas) {
    chicote.add(ribbon(curvaPano, t0, t1, (t) => 0.2 + t * 0.12, (t) => 1.45 - Math.sin(t * Math.PI) * 0.55, cor))
  }
  const fim = curvaPano.getPoint(1)
  const tanFim = curvaPano.getTangent(1)
  for (let i = 0; i < 8; i++) {
    const gota = sphere(0.014 + rand() * 0.016, '#9fd0ee', { roughness: 0.05 }, 12)
    gota.position.copy(fim)
      .addScaledVector(tanFim, 0.06 + rand() * 0.2)
      .add(new THREE.Vector3(0, (rand() - 0.5) * 0.3, (rand() - 0.5) * 0.15))
    chicote.add(gota)
  }
  root.add(chicote)

  // ---- bilhete amarelo TRAS·E colado na máquina ----------------------------
  const bilhete = new THREE.Group()
  bilhete.position.set(0, NOTE_Y, FZ + 0.01)
  bilhete.rotation.z = -0.025
  const papel = rbox(1.02, 0.31, 0.012, 0.004, YELLOW, { roughness: 0.8 })
  bilhete.add(papel)
  for (const side of [-1, 1]) {
    const fita = rbox(0.13, 0.05, 0.006, 0.002, '#eef2f2', { roughness: 0.3 })
    fita.position.set(side * 0.47, 0.15, 0.008)
    fita.rotation.z = side * 0.5
    bilhete.add(fita)
  }
  const letras: ['T' | 'R' | 'A' | 'S' | 'E', number][] = [
    ['T', -0.39], ['R', -0.235], ['A', -0.075], ['S', 0.075], ['E', 0.385],
  ]
  for (const [glyph, lx] of letras) {
    const l = letter(glyph)
    l.position.set(lx, -0.005, 0.012)
    bilhete.add(l)
  }
  // buraco rasgado onde estava o T
  const buraco = rbox(0.13, 0.23, 0.004, 0.01, MACHINE, { roughness: 0.3 })
  buraco.position.set(SLOT_X, -0.005, 0.007)
  bilhete.add(buraco)
  for (const [bx, by, br] of [[-0.07, 0.07, 0.6], [0.07, -0.05, -0.5], [0.02, 0.12, 0.3], [-0.03, -0.12, -0.4]] as const) {
    const rebarba = rbox(0.035, 0.025, 0.006, 0.002, MACHINE, { roughness: 0.3 })
    rebarba.position.set(SLOT_X + bx, by - 0.005, 0.007)
    rebarba.rotation.z = br
    bilhete.add(rebarba)
  }
  root.add(bilhete)

  // ---- pedaço amarelo com o T (arrancado pela patada) ----------------------
  const papelT = new THREE.Group()
  papelT.position.set(...T_FINAL)
  papelT.rotation.set(-0.95, 0.25, 0.3)
  const caco = rbox(0.17, 0.26, 0.012, 0.004, YELLOW, { roughness: 0.8 })
  papelT.add(caco)
  const tLetra = letter('T')
  tLetra.position.z = 0.012
  papelT.add(tLetra)
  root.add(papelT)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'lavanderia', object: base },
    { name: 'maquina', group: 'maquina', object: maquina },
    { name: 'espuma', group: 'maquina', object: espuma },
    { name: 'porta', group: 'maquina', object: porta },
    { name: 'ponei', group: 'ponei', object: ponei },
    { name: 'pataD', group: 'ponei', object: pataD },
    { name: 'cabeca', group: 'ponei', object: cabeca },
    { name: 'toalha', group: 'tvett', object: toalha },
    { name: 'ponta', group: 'tvett', object: chicote },
    { name: 'painel', group: 'trasig', object: painel },
    { name: 'fumaca', group: 'trasig', object: fumaca },
    { name: 'bilhete', group: 'traste', object: bilhete },
    { name: 'papelT', group: 'traste', object: papelT },
  ]

  // ---- montagem ------------------------------------------------------------
  const CAB: [number, number, number] = [PO.x, PO.y + 0.86, PO.z + 0.5]
  const PATA_REST = 0
  const PATA_UP = -1.25
  const SLOT: [number, number, number] = [SLOT_X, NOTE_Y - 0.01, FZ + 0.03]
  const PICO_Y = GY + 0.95

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Chega o seu horário na lavanderia do prédio: piso de ladrilho, azulejo azul…',
    }),

    seq('maquina-rise', 'maquina', 1.2, 0.8, [riseFrom(GY, 2.0)], {
      ease: 'easeOut',
      caption: '…e a máquina de lavar já está tremendo e espumando.',
    }),
    seq('maquina-treme', 'maquina', 2.0, 0.5, [ch('rotation.z', 0.04, 0)], { ease: 'easeOut' }),
    seq('espuma-cresce', 'espuma', 1.9, 0.8, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),
    seq('porta-abre', 'porta', 2.1, 0.7, [ch('rotation.y', 0, -2.2)], { ease: 'easeOut' }),

    seq('ponei-sai', 'ponei', 3.4, 0.9, [
      ch('position.z', PO.z - 0.75, PO.z),
      ch('scale.x', 0.6, 1), ch('scale.y', 0.6, 1), ch('scale.z', 0.6, 1),
    ], {
      ease: 'easeOut',
      caption: 'E ela RELINCHA: alguém lavou um PÔNEI! Entalado na escotilha, do peito pra fora.',
    }),
    seq('cabeca-sai', 'cabeca', 3.55, 0.9, [
      ch('position.y', PO.y + 0.1, CAB[1]),
      ch('position.z', PO.z - 0.4, CAB[2]),
      ch('scale.x', 0.4, 1), ch('scale.y', 0.4, 1), ch('scale.z', 0.4, 1),
    ], { ease: 'easeOut' }),
    seq('pata-cai', 'pataD', 3.9, 0.6, [ch('rotation.x', -1.6, PATA_REST), ch('scale.y', 0.3, 1)], {
      ease: 'easeOut',
    }),

    seq('toalha-enrola', 'toalha', 5.2, 0.5, [
      ch('scale.x', 0.2, 1), ch('scale.y', 0.2, 1), ch('scale.z', 0.2, 1),
    ], {
      ease: 'easeOut',
      caption: 'No pescoço, uma toalha encharcada: ele sacode a crina e ela estala — TVÉT!',
    }),
    seq('ponta-pende', 'ponta', 5.3, 0.4, [ch('scale.x', 0.1, 1), ch('rotation.z', -1.3, -1.3)], {
      ease: 'easeOut',
    }),
    seq('cabeca-sacode1', 'cabeca', 5.8, 0.25, [ch('rotation.z', 0.05, -0.3)], { ease: 'easeOut' }),
    seq('cabeca-sacode2', 'cabeca', 6.05, 0.25, [ch('rotation.z', -0.3, 0.3)], { ease: 'easeInOut' }),
    seq('cabeca-sacode3', 'cabeca', 6.3, 0.25, [ch('rotation.z', 0.3, 0.05)], { ease: 'easeIn' }),
    seq('ponta-estala', 'ponta', 6.2, 0.3, [ch('rotation.z', -1.3, 0)], { ease: 'easeIn' }),

    seq('cabeca-relincha', 'cabeca', 7.3, 0.6, [ch('rotation.x', 0.3, -0.3)], {
      ease: 'easeOut',
      caption: 'Tenta dizer "a máquina", mas relincha no QUI, de beiço em bico: MA… RRÍÍÍ… NEN!',
    }),

    seq('painel-amassa', 'painel', 9.0, 0.35, [
      ch('scale.x', 1.15, 1), ch('scale.y', 1.4, 1), ch('scale.z', 1, 1),
    ], {
      ease: 'easeIn',
      caption: 'O painel já está amassado com a marca da ferradura — e solta fumaça.',
    }),
    seq('fumaca-sobe', 'fumaca', 9.2, 0.9, [
      ch('position.y', GY + 1.45, GY + 1.68),
      ch('scale.x', 0.1, 1), ch('scale.y', 0.1, 1), ch('scale.z', 0.1, 1),
    ], { ease: 'easeOut' }),

    seq('bilhete-cola', 'bilhete', 10.4, 0.4, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('rotation.z', 0.3, -0.025),
    ], {
      ease: 'easeOut',
      caption: 'Na porta, o vizinho colou o bilhete furioso: TRASTE!',
    }),
    seq('t-cola', 'papelT', 10.4, 0.4, [
      ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1), ch('scale.z', 1, 1),
      ch('position.x', SLOT[0], SLOT[0]),
      ch('position.y', SLOT[1], SLOT[1]),
      ch('position.z', SLOT[2], SLOT[2]),
      ch('rotation.x', 0, 0), ch('rotation.y', 0, 0), ch('rotation.z', -0.025, -0.025),
    ], { ease: 'easeOut' }),

    seq('pata-ergue', 'pataD', 11.6, 0.4, [ch('rotation.x', PATA_REST, PATA_UP)], {
      ease: 'easeOut',
      caption: 'A patada do pônei arranca o T do meio, que voa e afunda na espuma: TRÁS·E!',
    }),
    seq('pata-bate', 'pataD', 12.0, 0.18, [ch('rotation.x', PATA_UP, PATA_REST)], { ease: 'easeIn' }),
    seq('t-voa', 'papelT', 12.15, 0.35, [
      ch('position.x', SLOT[0], (SLOT[0] + T_FINAL[0]) / 2),
      ch('position.y', SLOT[1], PICO_Y),
      ch('position.z', SLOT[2], (SLOT[2] + T_FINAL[2]) / 2),
      ch('rotation.z', -0.025, 1.5),
    ], { ease: 'easeOut' }),
    seq('t-cai', 'papelT', 12.5, 0.45, [
      ch('position.x', (SLOT[0] + T_FINAL[0]) / 2, T_FINAL[0]),
      ch('position.y', PICO_Y, T_FINAL[1]),
      ch('position.z', (SLOT[2] + T_FINAL[2]) / 2, T_FINAL[2]),
      ch('rotation.x', 0, -0.95),
      ch('rotation.y', 0, 0.25),
      ch('rotation.z', 1.5, 0.3),
    ], { ease: 'easeIn' }),

    seq('fumaca-final', 'fumaca', 13.3, 0.5, [ch('scale.y', 0.85, 1)], {
      ease: 'easeOut',
      caption: 'Tvättmaskinen är trasig. — A máquina de lavar está quebrada.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.0, 2.45, 4.05], target: [0.0, 1.13, -0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'tvattmaskinen-ar-trasig',
    contexto:
      "Moradia: na lavanderia comum do prédio (tvättstugan) — avisando o zelador ou a administradora (hyresvärden, ou a föreningen se o apartamento for próprio), num bilhete colado na máquina pro próximo vizinho, ou ao telefone com a assistência técnica. 'Trasig' serve pra tudo que quebrou: hissen är trasig (o elevador), cykeln är trasig, mobilen är trasig.",
    fraseFonte: 'A máquina de lavar está quebrada.',
    fraseAlvo: 'Tvättmaskinen är trasig.',
    pronuncia:
      "TVÉT-ma-RRÍÍ-nen é TRÁÁ-si ('tvättmaskinen' é palavra composta: a força principal cai no TVÄTT — T e V colados num golpe só, É aberto e curto, TT seco — e uma segunda força no SKI; esse 'sk' antes de I não soa 'sk' nem o 'ch' de chuva: é o sopro do 'sj' de 'sjuk', um RR carioca raspado com os lábios em bico, seguido de I longo; o -nen do fim é fraquinho, sem nasal; 'är' = é; 'trasig' com a força no TRÁ, A longo, S de cobra — nunca Z — e, na fala, o -g some: TRÁ-si)",
    ponteSonora:
      "TVÉT! MA-RRÍÍÍ-NEN... É TRÁS(t)E! (7 sílabas: TVÉT-ma-RRÍÍ-nen-é-TRÁÁ-si; força principal no TVÉT, uma segunda no RRÍÍ e outra no TRÁ; TVÉT = o MESMO estalo de toalha molhada de 'Hur bokar man tvättstugan?' (a toalha da dona Carman) — aqui é a toalha encharcada no pescoço do pônei —: T e V colados num golpe só, sem vogal no meio, É ABERTO e CURTO, TT seco; MA-RRÍÍÍ-NEN = a MÁQUINA do jeito que um pônei entalado nela consegue falar: o MA sai normal e fraquinho, mas no QUI ele RELINCHA — RRÍÍÍ! —, e o relincho é exatamente o som do 'sk' antes de I em sueco: um sopro raspado, tipo RR carioca, com os beiços em BICO, o MESMO de RRÜÜK ('sjuk') e RRÍCA ('skicka'), seguido de I LONGO; nunca 'ski' nem o CH de 'chuva'; o relincho leva a força — ma-RRÍÍ-nen, nunca 'MÁ-ki-na' —; e o -NA do fim vira NEN, fraquinho, N na língua e sem nasal: é o -EN sueco, o 'a' grudado no fim ('maskin' é uma máquina; 'maskinen', A máquina), o mesmo -EN de BRASILIEN; É = o 'är' de sempre, aberto e curto — em português também é 'é'; TRÁS(t)E = TRASTE sem o T do meio, que a patada do pônei arrancou do bilhete: TRÁS-si, força no TRÁ, A LONGO e bem aberto, S de COBRA, sibilante — nunca o Z de 'trase' nem o X chiado do carioca ('trashte') —, e o E do fim sai como o brasileiro já fala, um I fraquinho; o -g de 'trasig' some na fala; com o T de volta sai 'traste', e terminando em -A ('trasa') vira PANO DE CHÃO em sueco)",
    historia:
      "Chega o seu horário na lavanderia do prédio e a máquina já está tremendo, espumando e... relinchando: alguém lavou um PÔNEI. Ele está entalado na escotilha, do peito pra fora, com uma toalha encharcada no pescoço, e quando sacode a crina a toalha estala — TVÉT! —, o mesmo estalo da toalha da dona Carman. Você pergunta o que houve; ele tenta dizer 'a máquina', mas pônei não pronuncia QUI e relincha bem no meio, de beiço em bico: 'MA... RRÍÍÍÍ... NEN!' Na porta, o vizinho já colou o bilhete furioso, TRASTE!, e a patada do pônei acerta o T do meio, que voa e afunda na espuma: TRAS·E. É TRASTE: a máquina de lavar está quebrada.",
  },
  createScene,
  refine: { organic: ['ponei', 'pataD', 'cabeca'] },
}

export default card
