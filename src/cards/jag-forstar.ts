import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  capsule,
  ch,
  cylinder,
  person,
  rbox,
  riseFrom,
  rng,
  seq,
  shoulderPivot,
  sphere,
  torus,
} from '../rig/helpers'

/**
 * jag-förstår — "Eu entendo. / Entendi."
 * Diorama: sala de museu em Estocolmo, piso de mármore. A múmia sai da
 * vitrine de vidro aberta sem entender o sueco dos visitantes. No pedestal
 * com a placa THOR, o martelo em exposição zumbe e dispara o MESMO feixe
 * dourado de runas da carta "Ursäkta, jag förstår inte" — só que agora o
 * feixe NÃO atravessa: termina dentro da testa, e a cabeça enfaixada acende
 * feito abajur. Dedo erguido: "IÁ... FEIXE-THOR!" — entendi.
 *
 * Paleta: mármore cinza-claro e pedestal branco, madeira escura da vitrine,
 * faixas creme. Acento ouro (#f2a93b) reservado ao feixe + cabeça acesa
 * (mesmas cores do feixe da carta-irmã); corda vermelha de isolamento.
 */
const OURO = '#f2a93b'
const OURO_CLARO = '#f7c948'
const RUNA = '#d97b29'
const FAIXA = '#ddd0ad'
const FAIXA_ESCURA = '#c4b38a'
const MADEIRA = '#4a3022'
const MARMORE = '#cfcdc8'
const GY = 0.16 // topo do piso
const ALTURA = 1.7 // múmia

/** Traço de letra da placa: caixinha fina em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.007, '#2f2a26', { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

/** T H O R — letras de traço grosso. */
function letter(which: 'T' | 'H' | 'O' | 'R') {
  const g = new THREE.Group()
  const t = 0.028
  if (which === 'T') {
    g.add(stroke(0.11, t, 0, 0.066))
    g.add(stroke(t, 0.16, 0, -0.007))
  } else if (which === 'H') {
    g.add(stroke(t, 0.16, -0.04, 0))
    g.add(stroke(t, 0.16, 0.04, 0))
    g.add(stroke(0.07, t, 0, 0))
  } else if (which === 'O') {
    g.add(stroke(t, 0.15, -0.04, 0))
    g.add(stroke(t, 0.15, 0.04, 0))
    g.add(stroke(0.09, t, 0, 0.066))
    g.add(stroke(0.09, t, 0, -0.066))
  } else {
    g.add(stroke(t, 0.16, -0.042, 0))
    g.add(stroke(0.07, t, -0.008, 0.067))
    g.add(stroke(0.07, t, -0.008, 0.006))
    g.add(stroke(t, 0.058, 0.03, 0.036))
    g.add(stroke(t, 0.09, 0.026, -0.045, 0.5))
  }
  return g
}

function vidro() {
  const m = new THREE.MeshStandardMaterial({
    color: '#bfe0ec',
    roughness: 0.08,
    metalness: 0.1,
    transparent: true,
    opacity: 0.26,
    depthWrite: false,
  })
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(4217)

  // ─── base: piso de mármore com faixa de inlay ──────────────────────────
  const base = new THREE.Group()
  const piso = cylinder(2.6, 2.66, 0.16, MARMORE, { roughness: 0.25 })
  piso.position.y = 0.08
  base.add(piso)
  const inlay = torus(2.25, 0.035, '#9d9a94', { roughness: 0.3 })
  inlay.rotation.x = Math.PI / 2
  inlay.position.y = GY
  base.add(inlay)
  for (let i = 0; i < 5; i++) {
    // veios do mármore
    const veio = rbox(0.5 + rand() * 0.6, 0.006, 0.025, 0.003, '#b3b0aa', { roughness: 0.3 })
    veio.position.set((rand() - 0.5) * 3, GY + 0.001, (rand() - 0.5) * 2.4)
    veio.rotation.y = rand() * Math.PI
    base.add(veio)
  }
  root.add(base)

  // ─── vitrine de museu aberta ao fundo ──────────────────────────────────
  const vitrine = new THREE.Group()
  const VW = 1.05
  const VD = 0.7
  const VH = 1.95
  const plinto = rbox(VW + 0.1, 0.3, VD + 0.1, 0.03, MADEIRA, { roughness: 0.6 })
  plinto.position.y = 0.15
  vitrine.add(plinto)
  const tampo = rbox(VW + 0.1, 0.12, VD + 0.1, 0.03, MADEIRA, { roughness: 0.6 })
  tampo.position.y = VH - 0.06
  vitrine.add(tampo)
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const coluna = rbox(0.06, VH - 0.4, 0.06, 0.015, MADEIRA, { roughness: 0.6 })
      coluna.position.set((sx * VW) / 2, VH / 2 + 0.06, (sz * VD) / 2)
      vitrine.add(coluna)
    }
  }
  const vidroFundo = new THREE.Mesh(new THREE.BoxGeometry(VW - 0.04, VH - 0.42, 0.02), vidro())
  vidroFundo.position.set(0, VH / 2 + 0.06, -VD / 2)
  vitrine.add(vidroFundo)
  for (const sx of [-1, 1]) {
    const lado = new THREE.Mesh(new THREE.BoxGeometry(0.02, VH - 0.42, VD - 0.04), vidro())
    lado.position.set((sx * VW) / 2, VH / 2 + 0.06, 0)
    vitrine.add(lado)
  }
  // fundo de veludo e etiqueta "vazia"
  const veludo = rbox(VW - 0.1, VH - 0.5, 0.03, 0.01, '#5b2f3a', { roughness: 0.95 })
  veludo.position.set(0, VH / 2 + 0.06, -VD / 2 - 0.03)
  vitrine.add(veludo)
  const etiqueta = rbox(0.26, 0.12, 0.02, 0.008, '#efe9da', { roughness: 0.7 })
  etiqueta.position.set(0, 0.22, VD / 2 + 0.06)
  vitrine.add(etiqueta)
  vitrine.position.set(0.55, GY, -1.05)
  root.add(vitrine)

  // porta de vidro escancarada — dobradiça no canto frontal direito
  const porta = new THREE.Group()
  porta.position.set(VW / 2, VH / 2 + 0.06, VD / 2)
  const folha = new THREE.Mesh(new THREE.BoxGeometry(VW - 0.04, VH - 0.42, 0.02), vidro())
  folha.position.x = -(VW - 0.04) / 2
  porta.add(folha)
  for (const y of [-(VH - 0.42) / 2, (VH - 0.42) / 2]) {
    const caixilho = rbox(VW - 0.02, 0.05, 0.04, 0.012, MADEIRA, { roughness: 0.6 })
    caixilho.position.set(-(VW - 0.04) / 2, y, 0)
    porta.add(caixilho)
  }
  const montante = rbox(0.05, VH - 0.38, 0.04, 0.012, MADEIRA, { roughness: 0.6 })
  montante.position.set(-(VW - 0.04), 0, 0)
  porta.add(montante)
  const puxador = sphere(0.03, '#b08d57', { roughness: 0.3, metalness: 0.8 })
  puxador.position.set(-(VW - 0.12), 0, 0.04)
  porta.add(puxador)
  porta.rotation.y = 1.6
  vitrine.add(porta)

  // ─── múmia: faixas creme, de pé à frente da vitrine ────────────────────
  const mumia = person({ body: FAIXA, skin: FAIXA, height: ALTURA, armAngle: 0.35 })
  const corpoM = mumia.getObjectByName('body')!
  const bodyR = ALTURA * 0.17
  for (let i = 0; i < 7; i++) {
    const y = 0.14 + i * 0.105
    const r = bodyR * (i < 2 ? 1.0 : i > 5 ? 0.92 : 1.02)
    const faixa = torus(r, 0.022, i % 2 ? FAIXA_ESCURA : '#e6dcbf', { roughness: 0.92 })
    faixa.rotation.x = Math.PI / 2 + (i % 2 ? 0.22 : -0.18) + (rand() - 0.5) * 0.1
    faixa.rotation.y = (rand() - 0.5) * 0.3
    faixa.scale.z = 0.6
    faixa.position.y = y
    corpoM.parent!.add(faixa)
  }
  const cabeca = mumia.getObjectByName('head')!
  const headR = ALTURA * 0.19
  for (const [y, tilt] of [
    [0.2, 0.25],
    [-0.12, -0.2],
    [-0.26, 0.15],
  ] as const) {
    const fc = torus(headR * Math.sqrt(1 - y * y) * 1.0, 0.024, FAIXA_ESCURA, { roughness: 0.92 })
    fc.rotation.x = Math.PI / 2
    fc.rotation.z = tilt
    fc.position.y = y * headR
    cabeca.add(fc)
  }
  for (const nome of ['armL', 'armR']) {
    const braco = mumia.getObjectByName(nome)!
    shoulderPivot(braco, ALTURA)
    for (let i = 0; i < 3; i++) {
      const fb = torus(bodyR * 0.42, 0.016, FAIXA_ESCURA, { roughness: 0.92 })
      fb.rotation.x = Math.PI / 2 + (rand() - 0.5) * 0.4
      fb.position.y = -0.1 - i * 0.1
      braco.add(fb)
    }
  }
  mumia.position.set(0.35, GY, 0.05)
  mumia.rotation.y = -0.32 // vira o rosto para o martelo
  root.add(mumia)

  // braço direito erguido com o indicador para cima
  const braco = mumia.getObjectByName('armR')!
  const mao = braco.children.find((c) => (c as THREE.Mesh).isMesh && c.position.y < -0.3)
  const dedo = capsule(0.035, 0.12, FAIXA, { roughness: 0.9 })
  dedo.position.set(0, -0.19, 0)
  if (mao) {
    dedo.position.set(mao.position.x, mao.position.y - 0.14, mao.position.z)
  }
  braco.add(dedo)
  const BRACO_REPOUSO = braco.rotation.z
  const BRACO_ERGUIDO = 2.75
  braco.rotation.z = BRACO_ERGUIDO

  // pontas de faixa soltas flutuando dos braços
  const bracoL = mumia.getObjectByName('armL')!
  for (const [alvo, dz, rx] of [
    [bracoL, 0.04, 0.6],
    [braco, -0.04, -0.5],
  ] as const) {
    const fita = new THREE.Group()
    for (let i = 0; i < 3; i++) {
      const seg = rbox(0.06, 0.16, 0.012, 0.005, i % 2 ? FAIXA : '#e6dcbf', { roughness: 0.92 })
      seg.position.set(0.02 * i, -0.13 * i, dz * i)
      seg.rotation.set(rx * 0.3 * i, 0, 0.35 * (i % 2 ? -1 : 1))
      fita.add(seg)
    }
    fita.position.set(0.06, -0.22, 0.06)
    alvo.add(fita)
  }

  // ─── luz: cabeça acesa por dentro (cresce quando o feixe chega) ────────
  const luz = new THREE.Group()
  const brilho = sphere(headR * 1.08, '#ffbf2e', { emissive: '#ff9a00', emissiveIntensity: 1.5 })
  luz.add(brilho)
  // faixas escuras por cima da luz — a luz vaza entre elas
  for (const [y, tilt] of [
    [0.55, 0.2],
    [0.22, -0.15],
    [-0.35, 0.12],
    [-0.68, -0.1],
  ] as const) {
    const fx = torus(headR * 1.08 * Math.sqrt(1 - y * y), 0.03, FAIXA_ESCURA, { roughness: 0.92 })
    fx.rotation.x = Math.PI / 2
    fx.rotation.z = tilt
    fx.position.y = y * headR * 1.08
    luz.add(fx)
  }
  for (const side of [-1, 1]) {
    const olho = sphere(headR * 0.2, '#ffffff', { roughness: 0.25 })
    olho.position.set(side * headR * 0.36, headR * 0.02, headR * 1.0)
    olho.scale.z = 0.5
    const pupila = sphere(headR * 0.09, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(side * headR * 0.36, headR * 0.04, headR * 1.09)
    luz.add(olho, pupila)
  }
  const boca = sphere(headR * 0.13, '#5a3a20', { roughness: 0.6 })
  boca.scale.set(1.4, 0.9, 0.4)
  boca.position.set(0, -headR * 0.45, headR * 0.98)
  luz.add(boca)
  cabeca.add(luz)

  // raios de abajur ao redor da cabeça
  const raios = new THREE.Group()
  for (let i = 0; i < 9; i++) {
    const a = -0.35 + (i / 8) * (Math.PI + 0.7)
    const raio = rbox(0.05, 0.2, 0.05, 0.02, OURO_CLARO, { emissive: '#ffb703', emissiveIntensity: 1.1 })
    raio.position.set(Math.cos(a) * headR * 1.65, Math.sin(a) * headR * 1.65, 0)
    raio.rotation.z = a - Math.PI / 2
    raios.add(raio)
  }
  cabeca.add(raios)

  // ─── pedestal branco com placa THOR ────────────────────────────────────
  const pedestal = new THREE.Group()
  const PH = 0.92
  const coluna = rbox(0.52, PH, 0.52, 0.03, '#f3f1ec', { roughness: 0.5 })
  coluna.position.y = PH / 2
  pedestal.add(coluna)
  const capitel = rbox(0.62, 0.06, 0.62, 0.02, '#e4e1da', { roughness: 0.45 })
  capitel.position.y = PH + 0.03
  pedestal.add(capitel)
  const rodape = rbox(0.62, 0.08, 0.62, 0.02, '#e4e1da', { roughness: 0.45 })
  rodape.position.y = 0.04
  pedestal.add(rodape)
  const placa = rbox(0.42, 0.2, 0.025, 0.01, '#c9a96a', { roughness: 0.3, metalness: 0.7 })
  placa.position.set(0, PH * 0.66, 0.272)
  pedestal.add(placa)
  for (const [g, x] of [
    ['T', -0.135],
    ['H', -0.045],
    ['O', 0.045],
    ['R', 0.135],
  ] as const) {
    const l = letter(g)
    l.position.set(x, PH * 0.66, 0.29)
    l.scale.setScalar(0.85)
    pedestal.add(l)
  }
  pedestal.position.set(-1.3, GY, 0.25)
  pedestal.rotation.y = 0.3
  root.add(pedestal)

  // ─── martelo do Thor em pé sobre o pedestal ────────────────────────────
  const TOPO = GY + PH + 0.06
  const martelo = new THREE.Group()
  const cabecote = rbox(0.42, 0.26, 0.26, 0.05, '#87909f', { roughness: 0.4, metalness: 0.65 })
  cabecote.position.y = 0.13
  martelo.add(cabecote)
  for (const lado of [-1, 1]) {
    const cinta = rbox(0.05, 0.28, 0.28, 0.02, '#5d6673', { roughness: 0.4, metalness: 0.6 })
    cinta.position.set(lado * 0.14, 0.13, 0)
    martelo.add(cinta)
  }
  const cabo = cylinder(0.04, 0.045, 0.42, '#8b5a2b', { roughness: 0.8 })
  cabo.position.y = 0.47
  martelo.add(cabo)
  for (let i = 0; i < 3; i++) {
    const tira = torus(0.045, 0.011, '#5a3a1d', { roughness: 0.85 })
    tira.rotation.x = Math.PI / 2
    tira.position.y = 0.52 + i * 0.05
    martelo.add(tira)
  }
  const pomo = sphere(0.055, '#6e4522', { roughness: 0.75 })
  pomo.position.y = 0.7
  martelo.add(pomo)
  martelo.position.set(-1.3, TOPO, 0.25)
  martelo.rotation.y = -0.15
  root.add(martelo)

  // ─── corda vermelha de isolamento entre dois pilaretes ─────────────────
  const corda = new THREE.Group()
  const P1 = new THREE.Vector3(1.15, 0, 0.45)
  const P2 = new THREE.Vector3(1.95, 0, -0.25)
  for (const p of [P1, P2]) {
    const pe = cylinder(0.11, 0.13, 0.05, '#8a6d3e', { roughness: 0.3, metalness: 0.75 })
    pe.position.set(p.x, GY + 0.025, p.z)
    corda.add(pe)
    const haste = cylinder(0.028, 0.028, 0.62, '#a8854c', { roughness: 0.3, metalness: 0.75 })
    haste.position.set(p.x, GY + 0.34, p.z)
    corda.add(haste)
    const topo = sphere(0.05, '#a8854c', { roughness: 0.25, metalness: 0.8 })
    topo.position.set(p.x, GY + 0.68, p.z)
    corda.add(topo)
  }
  // corda em catenária: 6 elos de cápsula
  const N = 6
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const k = i / N
    const p = P1.clone().lerp(P2, k)
    p.y = GY + 0.64 - Math.sin(k * Math.PI) * 0.16
    pts.push(p)
  }
  for (let i = 0; i < N; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const len = a.distanceTo(b)
    const elo = capsule(0.028, len, '#a3302c', { roughness: 0.9 })
    elo.position.copy(a).add(b).multiplyScalar(0.5)
    elo.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())
    corda.add(elo)
  }
  root.add(corda)

  // ─── feixe de runas: do martelo até DENTRO da cabeça (acento ouro) ─────
  root.updateMatrixWorld(true)
  const alvo = cabeca.localToWorld(new THREE.Vector3(0, headR * 0.1, 0))
  const origem = martelo.localToWorld(new THREE.Vector3(0.24, 0.13, 0))
  const dir = alvo.clone().sub(origem)
  const L = dir.length()
  const feixe = new THREE.Group()
  const anel = torus(0.15, 0.026, OURO_CLARO, { emissive: '#ffb703', emissiveIntensity: 1.0 })
  anel.rotation.y = Math.PI / 2
  anel.position.x = 0.05
  feixe.add(anel)
  const jato = cylinder(0.085, 0.085, L, OURO, { roughness: 0.3, emissive: '#ff9e00', emissiveIntensity: 1.1 })
  jato.rotation.z = -Math.PI / 2
  jato.position.x = L / 2
  feixe.add(jato)
  for (const k of [0.25, 0.5, 0.74]) {
    const runa = rbox(0.17, 0.17, 0.17, 0.035, RUNA, { emissive: '#b45309', emissiveIntensity: 0.9 })
    runa.rotation.x = Math.PI / 4
    runa.rotation.z = (rand() - 0.5) * 0.6
    runa.position.x = L * k
    feixe.add(runa)
  }
  feixe.position.copy(origem)
  feixe.rotation.y = -Math.atan2(dir.z, dir.x)
  feixe.rotation.z = Math.atan2(dir.y, Math.hypot(dir.x, dir.z))
  feixe.rotation.order = 'YZX'
  root.add(feixe)

  const parts = [
    { name: 'base', group: 'museu', object: base },
    { name: 'vitrine', group: 'museu', object: vitrine },
    { name: 'corda', group: 'museu', object: corda },
    { name: 'mumia', group: 'mumia', object: mumia },
    { name: 'porta', group: 'mumia', object: porta },
    { name: 'braco', group: 'mumia', object: braco },
    { name: 'pedestal', group: 'martelo', object: pedestal },
    { name: 'martelo', group: 'martelo', object: martelo },
    { name: 'feixe', group: 'feixe', object: feixe },
    { name: 'luz', group: 'luz', object: luz },
    { name: 'raios', group: 'luz', object: raios },
    { name: 'dedo', group: 'dedo', object: dedo },
  ]

  const s3 = (v0: number, v1: number) => [ch('scale.x', v0, v1), ch('scale.y', v0, v1), ch('scale.z', v0, v1)]

  const build = [
    // museu
    seq('base-sobe', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Num museu em Estocolmo, a sala de exposição se monta: mármore, vitrine, corda de isolamento…',
    }),
    seq('vitrine-sobe', 'vitrine', 0.25, 0.8, [riseFrom(GY, 2.2)], { ease: 'easeOut' }),
    seq('porta-fechada', 'porta', 0.25, 0.1, [ch('rotation.y', 0, 0)]),
    seq('corda-sobe', 'corda', 0.45, 0.7, [riseFrom(0, 1.0)], { ease: 'easeOut' }),

    // múmia acorda e empurra o vidro
    seq('mumia-surge', 'mumia', 1.9, 0.9, [ch('position.z', -1.0, -1.0), riseFrom(GY, 1.8)], {
      ease: 'easeOut',
      caption: 'Dentro da vitrine, uma MÚMIA de 3000 anos acorda…',
    }),
    seq('braco-repouso', 'braco', 1.9, 0.1, [ch('rotation.z', BRACO_REPOUSO, BRACO_REPOUSO)]),
    seq('porta-abre', 'porta', 3.0, 0.6, [ch('rotation.y', 0, 1.6)], {
      ease: 'easeOut',
      caption: '…empurra o vidro e sai — mas não entende uma palavra do sueco dos visitantes.',
    }),
    seq('mumia-sai', 'mumia', 3.3, 0.9, [ch('position.z', -1.0, 0.05)]),
    seq('mumia-vira', 'mumia', 4.2, 0.5, [ch('rotation.y', 0, -0.32)]),

    // martelo do Thor
    seq('pedestal-sobe', 'pedestal', 5.0, 0.7, [riseFrom(GY, 1.3)], {
      ease: 'easeOut',
      caption: 'No pedestal ao lado, em exposição: o martelo do THOR.',
    }),
    seq('martelo-sobe', 'martelo', 5.3, 0.7, [riseFrom(TOPO, 1.5)], { ease: 'easeOut' }),
    seq('martelo-zumbe-1', 'martelo', 6.3, 0.15, [ch('rotation.z', 0, 0.09)], {
      caption: 'Ele começa a zumbir… zzzZZZ…',
    }),
    seq('martelo-zumbe-2', 'martelo', 6.45, 0.15, [ch('rotation.z', 0.09, -0.09)]),
    seq('martelo-zumbe-3', 'martelo', 6.6, 0.15, [ch('rotation.z', -0.09, 0.07)]),
    seq('martelo-zumbe-4', 'martelo', 6.75, 0.15, [ch('rotation.z', 0.07, 0)]),

    // feixe entra e fica
    seq('feixe-dispara', 'feixe', 7.3, 0.6, [ch('scale.x', 0.02, 1)], {
      ease: 'easeOut',
      caption: '…e dispara um FEIXE dourado direto na testa dela: FEIXE-THOR!',
    }),
    seq('luz-acende', 'luz', 8.3, 0.5, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Dessa vez o feixe NÃO atravessa: fica preso lá dentro, e a cabeça acende feito abajur.',
    }),
    seq('raios-abrem', 'raios', 8.6, 0.5, s3(0.01, 1), { ease: 'easeOut' }),

    // entendi!
    seq('braco-ergue', 'braco', 9.9, 0.55, [ch('rotation.z', BRACO_REPOUSO, BRACO_ERGUIDO)], {
      ease: 'easeOut',
      caption: "A múmia levanta o dedo, iluminada: 'IÁ… FEIXE-THOR!' — entendi tudo.",
    }),
    seq('dedo-estica', 'dedo', 10.3, 0.3, s3(0.01, 1), { ease: 'easeOut' }),
    seq('raios-pulsa', 'raios', 11.2, 0.6, s3(1.25, 1), {
      caption: 'Jag förstår. — Eu entendo. / Entendi.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 1.85, 3.75], target: [0.05, 1.12, 0] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-forstar',
    contexto:
      'Confirmando que acompanhou uma explicação: no médico, no banco, numa reunião, ao telefone. Também como "entendo" empático.',
    fraseFonte: 'Eu entendo. / Entendi.',
    fraseAlvo: 'Jag förstår.',
    pronuncia:
      "iá fesh-TÔR (mesmo 'förstår' da carta 'Ursäkta, jag förstår inte': o 'rs' vira CH/X; tônica no TÔR, com Ô FECHADO e LONGO de 'avô' — é o å sueco, não o Ó aberto de 'só'; o -R final é brando mas TEM que soar — sem ele vira 'förstå', o infinitivo)",
    ponteSonora:
      "IÁ... FEIXE-THOR! (3 batidas, tônica no THOR; é o MESMO âncora 'FEIXE-THOR' da carta 'Ursäkta, jag förstår inte' — mas aqui SEM o ÍNTEgro: o feixe fica dentro, você entendeu; IÁ = 'jag', I de ioga; FEIXE emendado no THOR sai 'fei-sh-TÔR' ≈ fesh-TÔR: o X de FEIXE é justamente o chiado do 'rs' — só corte o -e final ('feixi'), senão nasce uma sílaba a mais; THOR com Ô FECHADO de 'avô' (o å sueco), não o Ó aberto de 'só', e com o R final BRANDO e audível: sem ele sobra 'förstå', o infinitivo)",
    historia:
      "Num museu em Estocolmo, a múmia acorda depois de 3000 anos, empurra o vidro da vitrine e não entende uma palavra do sueco dos visitantes. No pedestal ao lado, o martelo do THOR em exposição começa a zumbir e dispara um FEIXE dourado direto na testa dela. Dessa vez o feixe não atravessa: fica preso lá dentro, e a cabeça enfaixada acende inteira feito abajur. A múmia levanta o dedo, iluminada: 'IÁ... FEIXE-THOR!' — entendi tudo.",
  },
  createScene,
}

export default card
