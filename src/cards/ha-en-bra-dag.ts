import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, cylinder, sphere, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Ha en bra dag!" — RRÁ! EN BRÁ... DÁG!
 *
 * Mar sueco gelado ao lado de um píer: ninguém pula. Uma estrela-do-mar
 * laranja solta a gargalhada soprada (RRÁ!), fica EM BRASA (EN BRÁ) ali
 * dentro D'ÁGUA (DÁG), o mar ferve em volta, o gelo derrete em vapor e ela
 * ergue UM braço só (EN = um) apontando a escadinha: pode pular.
 *
 * Diorama: disco de mar azul-petróleo, píer de tábuas cinza à esquerda com
 * escadinha de metal virada para a estrela, placas de gelo nas bordas.
 * Acento saturado RESERVADO à estrela em brasa (laranja + brasas + água
 * fervendo); o resto é frio: petróleo, cinza, branco-gelo.
 */

const MAR = '#1f5a68'        // azul-petróleo
const MAR_FUNDO = '#143e49'
const MAR_CLARO = '#4b8c9b'  // ondinhas
const GELO = '#e6f1f7'
const GELO_SOMBRA = '#b4cfdd'
const NEVE = '#f4f8fb'
const TABUA = '#c4c0b8'
const TABUA_ESC = '#aaa59c'
const POSTE = '#78736b'
const METAL = '#b9c2ca'
const CREME = '#efe7d8'
const LISTRA = '#3f6f86'
const LARANJA = '#f2561a'    // corpo da estrela (acento)
const PINTA = '#ffc83a'
const BRASA = '#ff2a0a'
const BRASA_NUCLEO = '#ffcc3a'
const CARVAO = '#7a2410'
const FERVURA = '#ff5a14'
const VAPOR = '#f3f5f7'
const BOCA = '#33090a'
const LINGUA = '#ff8f86'
const ESCURO = '#2a120c'

const WY = 0.2   // superfície do mar
const DY = 0.72  // topo do deck do píer
const SX = 0.5   // centro da estrela
const SZ = 0.2

// píer: faixa em x, do fundo (Z0) até a ponta (Z1)
const PX0 = -1.86
const PX1 = -1.06
const PZ0 = -1.7
const PZ1 = 0.45
const LZ = -0.32 // escadinha, na lateral direita do píer
const LX = PX1 + 0.1

// braços: o UM aponta para a escadinha; os outros quatro a cada 72°
const TH_UM = Math.atan2(LZ - SZ, LX - 0.15 - SX)
const ARM_LEN = 1.22
const ARM_R = 0.3
const FLAT = 0.6 // achatamento vertical dos braços

// cúpula central (elipsoide) e sua inclinação para a câmera
const DOMO: [number, number, number] = [0.6, 0.42, 0.6]
const TILT = 0.36
const DOMO_Y = 0.16 // a cúpula fica acima da linha d'água: o rosto não afunda

// braço erguido: deitado (montagem) → erguido (pose final)
const UM_DEITADO = -0.04
const UM_ERGUIDO = 1.05
const UM_DOBRA = 0.7

/** perfil normalizado [raio, comprimento] do braço afunilado */
const PERFIL: [number, number][] = [
  [0, 0], [1, 0], [1, 0.1], [0.86, 0.33], [0.64, 0.58], [0.42, 0.8], [0.24, 0.93], [0.1, 0.99], [0, 1],
]

function raioEm(t: number) {
  for (let i = 2; i < PERFIL.length; i++) {
    const [r0, t0] = PERFIL[i - 1]
    const [r1, t1] = PERFIL[i]
    if (t <= t1) return r0 + ((r1 - r0) * (t - t0)) / (t1 - t0)
  }
  return 0
}

/** Braço deitado ao longo de +x, achatado na vertical. */
function bracoMesh(len: number, r0: number) {
  const m = lathe(PERFIL.map(([r, t]) => [r * r0, t * len] as [number, number]), LARANJA, { roughness: 0.5 })
  m.rotation.z = -Math.PI / 2 // eixo do torno (+y) → +x
  m.scale.x = FLAT // raio local x vira a espessura vertical
  return m
}

/** Ponto e normal na superfície da cúpula, na direção dada. */
function naCupula(dir: [number, number, number]) {
  const [a, b, c] = DOMO
  const d = new THREE.Vector3(...dir).normalize()
  const k = 1 / Math.sqrt((d.x / a) ** 2 + (d.y / b) ** 2 + (d.z / c) ** 2)
  const p = d.multiplyScalar(k)
  const n = new THREE.Vector3(p.x / (a * a), p.y / (b * b), p.z / (c * c)).normalize()
  return { p, n }
}

/** Orienta o objeto com +z na normal e +y "para cima" no rosto. */
function orientar(obj: THREE.Object3D, n: THREE.Vector3) {
  const z = n.clone().normalize()
  const x = new THREE.Vector3(0, 1, 0).cross(z).normalize()
  const y = z.clone().cross(x)
  obj.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(x, y, z))
}

function translucido(mesh: THREE.Mesh, opacity: number) {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  m.depthWrite = false
  mesh.castShadow = false
  return mesh
}

/**
 * Brasa de carvão: crosta escura, miolo vermelho-vivo e núcleo amarelo, rente
 * à superfície (+z local = normal).
 */
function brasa(r: number) {
  const g = new THREE.Group()
  const crosta = sphere(r * 1.14, CARVAO, { roughness: 0.9 })
  crosta.scale.set(1, 1, 0.3)
  g.add(crosta)
  const fogo = sphere(r, '#b81804', { emissive: BRASA, emissiveIntensity: 0.55, roughness: 0.9 })
  fogo.scale.set(1, 1, 0.4)
  fogo.position.z = r * 0.06
  g.add(fogo)
  const miolo = sphere(r * 0.42, '#e89a10', { emissive: BRASA_NUCLEO, emissiveIntensity: 0.6, roughness: 0.9 })
  miolo.scale.set(1, 1, 0.5)
  miolo.position.z = r * 0.26
  g.add(miolo)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(19)

  // ---- mar azul-petróleo ----------------------------------------------------
  const base = new THREE.Group()

  const fundo = cylinder(2.64, 2.74, 0.14, MAR_FUNDO, { roughness: 0.6 })
  fundo.position.y = 0.07
  base.add(fundo)

  const mar = cylinder(2.6, 2.62, 0.08, MAR, { roughness: 0.16 })
  mar.position.y = WY - 0.04
  base.add(mar)

  // ondinhas concêntricas espalhadas (rng fixo), longe da estrela
  for (const [ox, oz, r] of [[-0.55, 1.55, 0.28], [1.95, -0.25, 0.22], [-0.2, -1.45, 0.3], [1.15, 1.95, 0.2]] as const) {
    for (const k of [1, 1.6]) {
      const onda = torus(r * k, 0.012, MAR_CLARO, { roughness: 0.2 })
      onda.rotation.x = Math.PI / 2
      onda.position.set(ox + (rand() - 0.5) * 0.05, WY + 0.002, oz)
      base.add(onda)
    }
  }
  root.add(base)

  // ---- placas de gelo boiando nas bordas ------------------------------------
  const gelo = new THREE.Group()
  const placas: [number, number, number, number][] = [
    [2.05, -1.0, 0.34, 3], [1.55, 1.78, 0.28, 5], [-0.78, 1.86, 0.3, 7],
    [0.25, -1.98, 0.36, 9], [1.86, 0.62, 0.17, 11], [-2.18, 1.0, 0.22, 13], [-0.62, -1.6, 0.24, 15],
  ]
  for (const [gx, gz, r, s] of placas) {
    const placa = new THREE.Group()
    placa.position.set(gx, WY, gz)
    placa.rotation.y = rand() * Math.PI
    const topo = rock(r, GELO, s, { roughness: 0.3 })
    topo.scale.set(1, 0.26, 0.82)
    topo.position.y = 0.02
    placa.add(topo)
    const saia = rock(r * 1.08, GELO_SOMBRA, s + 1, { roughness: 0.3 })
    saia.scale.set(1, 0.14, 0.86)
    saia.position.y = -0.01
    placa.add(saia)
    gelo.add(placa)
  }
  root.add(gelo)

  // ---- píer de tábuas com escadinha de metal --------------------------------
  const pier = new THREE.Group()
  const PW = PX1 - PX0
  const PCX = (PX0 + PX1) / 2

  const nTabuas = 9
  const passo = (PZ1 - PZ0) / nTabuas
  for (let i = 0; i < nTabuas; i++) {
    const t = rbox(PW + 0.1, 0.06, passo - 0.025, 0.015, i % 2 ? TABUA : TABUA_ESC, { roughness: 0.8 })
    t.position.set(PCX + (rand() - 0.5) * 0.03, DY - 0.03, PZ0 + passo * (i + 0.5))
    t.rotation.y = (rand() - 0.5) * 0.03
    pier.add(t)
  }
  for (const sx of [PX0 + 0.08, PX1 - 0.08]) {
    const longarina = rbox(0.08, 0.1, PZ1 - PZ0, 0.02, POSTE, { roughness: 0.85 })
    longarina.position.set(sx, DY - 0.11, (PZ0 + PZ1) / 2)
    pier.add(longarina)
  }
  // postes: os da ponta passam um pouco do deck (cabeços de amarração)
  for (const pz of [PZ0 + 0.1, -0.62, PZ1 + 0.05]) {
    for (const px of [PX0, PX1]) {
      const ponta = pz > PZ1 - 0.1
      const h = (ponta ? DY + 0.16 : DY - 0.04) - 0.05
      const poste = cylinder(0.065, 0.07, h, POSTE, { roughness: 0.85 })
      poste.position.set(px, 0.05 + h / 2, pz)
      pier.add(poste)
      if (ponta) {
        const tampa = sphere(0.068, POSTE, { roughness: 0.85 })
        tampa.position.set(px, 0.05 + h, pz)
        tampa.scale.y = 0.5
        pier.add(tampa)
      }
      const anel = torus(0.11, 0.012, MAR_CLARO, { roughness: 0.2 })
      anel.rotation.x = Math.PI / 2
      anel.position.set(px, WY + 0.003, pz)
      pier.add(anel)
    }
  }

  // montinhos de neve no deck
  for (const [nx, nz, nr, s] of [[PX0 + 0.2, PZ0 + 0.25, 0.14, 21], [PX0 + 0.16, -0.2, 0.1, 23], [PX1 - 0.18, PZ0 + 0.3, 0.1, 25]] as const) {
    const neve = puff(nr, NEVE, 4, s, { roughness: 0.9 })
    neve.scale.y = 0.45
    neve.position.set(nx, DY + 0.02, nz)
    pier.add(neve)
  }

  // escadinha: dois corrimãos que sobem do mar e fazem a curva por cima do deck
  const escada = new THREE.Group()
  escada.position.set(LX, 0, LZ)
  for (const side of [-1, 1]) {
    const trilho = cylinder(0.026, 0.026, DY + 0.36, METAL, { roughness: 0.25, metalness: 0.8 })
    trilho.position.set(0, (DY + 0.36) / 2 - 0.02, side * 0.17)
    escada.add(trilho)
    const curva = new THREE.Mesh(
      new THREE.TorusGeometry(0.15, 0.026, 12, 24, Math.PI),
      mat(METAL, { roughness: 0.25, metalness: 0.8 }),
    )
    curva.castShadow = true
    curva.position.set(-0.15, DY + 0.34, side * 0.17)
    escada.add(curva)
    const desce = cylinder(0.026, 0.026, 0.34, METAL, { roughness: 0.25, metalness: 0.8 })
    desce.position.set(-0.3, DY + 0.17, side * 0.17)
    escada.add(desce)
    const flange = cylinder(0.05, 0.05, 0.02, METAL, { roughness: 0.25, metalness: 0.8 })
    flange.position.set(-0.3, DY + 0.01, side * 0.17)
    escada.add(flange)
  }
  for (const dy of [0.1, 0.32, 0.54]) {
    const degrau = rbox(0.12, 0.035, 0.34, 0.012, METAL, { roughness: 0.3, metalness: 0.75 })
    degrau.position.set(0.02, dy, 0)
    escada.add(degrau)
  }
  pier.add(escada)
  root.add(pier)

  // ---- toalha listrada jogada na ponta do píer, pendendo para o mar ---------
  // origem = quina da ponta do deck; a parte de cima deita no deck, a dobra
  // contorna a quina e a aba pende na frente
  const TY = DY
  const TZ = PZ1 + 0.02
  const toalha = new THREE.Group()
  toalha.position.set(PCX + 0.04, TY, TZ)
  toalha.rotation.y = 0.06
  const TW = 0.5
  const deitada = rbox(TW, 0.03, 0.42, 0.012, CREME, { roughness: 0.92 })
  deitada.position.set(0, 0.015, -0.2)
  toalha.add(deitada)
  const dobra = cylinder(0.045, 0.045, TW, CREME, { roughness: 0.92 })
  dobra.rotation.z = Math.PI / 2
  dobra.position.set(0, -0.01, 0.025)
  toalha.add(dobra)
  const aba = rbox(TW, 0.42, 0.03, 0.012, CREME, { roughness: 0.92 })
  aba.position.set(0, -0.22, 0.06)
  aba.rotation.x = 0.06
  toalha.add(aba)
  for (const ly of [-0.11, -0.2, -0.34]) {
    const listra = rbox(TW + 0.005, ly < -0.3 ? 0.07 : 0.04, 0.034, 0.01, LISTRA, { roughness: 0.92 })
    listra.position.set(0, ly, 0.062 - ly * 0.06)
    listra.rotation.x = 0.06
    toalha.add(listra)
  }
  for (const lz of [-0.12, -0.28]) {
    const listra = rbox(TW + 0.005, 0.034, 0.05, 0.01, LISTRA, { roughness: 0.92 })
    listra.position.set(0, 0.016, lz)
    toalha.add(listra)
  }
  // franjinha na barra
  for (let i = 0; i < 7; i++) {
    const fio = cylinder(0.008, 0.008, 0.05, CREME, { roughness: 0.92 })
    fio.position.set(-TW / 2 + 0.04 + i * ((TW - 0.08) / 6), -0.455, 0.075)
    toalha.add(fio)
  }
  root.add(toalha)

  // ---- ESTRELA-DO-MAR (corpo + quatro braços deitados) ----------------------
  const estrela = new THREE.Group()
  estrela.position.set(SX, WY, SZ)
  root.add(estrela)

  const disco = new THREE.Group()
  disco.position.y = DOMO_Y
  disco.rotation.x = TILT
  estrela.add(disco)

  const domo = sphere(DOMO[0], LARANJA, { roughness: 0.5 })
  domo.scale.set(1, DOMO[1] / DOMO[0], DOMO[2] / DOMO[0])
  disco.add(domo)

  const angulos = [1, 2, 3, 4].map((k) => TH_UM + (k * 2 * Math.PI) / 5)
  const bracoFrames: THREE.Group[] = []
  for (const th of angulos) {
    const frame = new THREE.Group()
    frame.position.y = 0.09
    frame.rotation.order = 'YZX'
    frame.rotation.set(0, -th, -0.1)
    frame.add(bracoMesh(ARM_LEN, ARM_R))
    // pontinhos amarelos em duas fileiras no dorso
    for (const t of [0.5, 0.69, 0.87]) {
      const r = raioEm(t) * ARM_R
      for (const side of [-1, 1]) {
        const pinta = sphere(0.042 * (1.15 - t * 0.4), PINTA, { roughness: 0.45 })
        pinta.position.set(t * ARM_LEN, FLAT * r * 0.9 - 0.008, side * r * 0.42)
        pinta.scale.y = 0.7
        frame.add(pinta)
      }
    }
    estrela.add(frame)
    bracoFrames.push(frame)
  }

  // ---- carinha gargalhando (na frente da cúpula) ----------------------------
  const carinha = new THREE.Group()
  disco.add(carinha)

  for (const s of [-1, 1]) {
    const { p, n } = naCupula([s * 0.3, 1.0, 0.55])
    const olho = new THREE.Mesh(new THREE.TorusGeometry(0.085, 0.028, 12, 24, Math.PI), mat(ESCURO, { roughness: 0.5 }))
    orientar(olho, n)
    olho.position.copy(p).addScaledVector(n, 0.004)
    carinha.add(olho)

    const q = naCupula([s * 0.5, 0.62, 0.62])
    const bochecha = sphere(0.062, '#e8604c', { roughness: 0.7 })
    orientar(bochecha, q.n)
    bochecha.scale.set(1, 0.7, 0.3)
    bochecha.position.copy(q.p)
    carinha.add(bochecha)
  }
  {
    const { p, n } = naCupula([0, 0.62, 1])
    const boca = new THREE.Group()
    orientar(boca, n)
    boca.position.copy(p).addScaledVector(n, -0.03)
    carinha.add(boca)
    // "D" deitado: borda reta em cima, redonda embaixo
    const goela = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.08, 32, 1, false, -Math.PI / 2, Math.PI).rotateX(Math.PI / 2),
      mat(BOCA, { roughness: 0.85 }),
    )
    boca.add(goela)
    const dentes = rbox(0.26, 0.04, 0.03, 0.014, '#fbf4e8', { roughness: 0.35 })
    dentes.position.set(0, -0.026, 0.035)
    boca.add(dentes)
    const lingua = sphere(0.075, LINGUA, { roughness: 0.45 })
    lingua.scale.set(1.3, 0.6, 0.45)
    lingua.position.set(0, -0.115, 0.03)
    boca.add(lingua)
  }

  // ---- brasas no dorso (emissivas, fora do refinamento) ---------------------
  const brasas = new THREE.Group()
  estrela.add(brasas)
  const brasasDomo = new THREE.Group()
  brasasDomo.position.copy(disco.position)
  brasasDomo.rotation.copy(disco.rotation)
  brasas.add(brasasDomo)
  for (const [dir, r] of [
    [[0.02, 1, -0.3], 0.11], [[-0.48, 0.75, -0.3], 0.085], [[0.5, 0.72, -0.28], 0.09],
    [[-0.15, 0.8, -0.85], 0.075], [[0.3, 0.8, -0.8], 0.06],
  ] as [[number, number, number], number][]) {
    const { p, n } = naCupula(dir)
    const b = brasa(r)
    orientar(b, n)
    b.position.copy(p).addScaledVector(n, -0.008)
    brasasDomo.add(b)
  }
  for (const [i, frame] of bracoFrames.entries()) {
    const f = new THREE.Group()
    f.position.copy(frame.position)
    f.rotation.copy(frame.rotation)
    brasas.add(f)
    for (const t of [0.36 + (i % 2) * 0.04, 0.68]) {
      const r = raioEm(t) * ARM_R
      const b = brasa(0.095 * (1.2 - t * 0.6))
      b.rotation.x = -Math.PI / 2
      b.position.set(t * ARM_LEN, FLAT * r - 0.01, 0)
      f.add(b)
    }
  }

  // ---- o UM: quinto braço, erguido na direção da escadinha ------------------
  const yawUm = new THREE.Group()
  yawUm.position.set(Math.cos(TH_UM) * 0.3, 0.13, Math.sin(TH_UM) * 0.3)
  yawUm.rotation.y = -TH_UM
  estrela.add(yawUm)

  const bracoUm = new THREE.Group()
  bracoUm.rotation.z = UM_ERGUIDO
  yawUm.add(bracoUm)

  const UM_BASE = 1.0
  const UM_JR = 0.2 // raio na dobra
  const baseUm = lathe(
    [[0, -0.12], [0.22, -0.1], [ARM_R, 0], [ARM_R, 0.12], [0.27, 0.45], [0.23, 0.8], [UM_JR, UM_BASE], [0, UM_BASE + 0.02]],
    LARANJA,
    { roughness: 0.5 },
  )
  baseUm.rotation.z = -Math.PI / 2
  baseUm.scale.x = FLAT
  bracoUm.add(baseUm)

  const junta = sphere(UM_JR, LARANJA, { roughness: 0.5 })
  junta.scale.y = FLAT
  junta.position.x = UM_BASE
  bracoUm.add(junta)

  const ponta = new THREE.Group()
  ponta.position.x = UM_BASE
  ponta.rotation.z = -UM_DOBRA
  bracoUm.add(ponta)
  const pontaMesh = lathe(
    [[0, 0], [UM_JR, 0], [0.19, 0.15], [0.15, 0.36], [0.09, 0.55], [0.04, 0.66], [0, 0.68]],
    LARANJA,
    { roughness: 0.5 },
  )
  pontaMesh.rotation.z = -Math.PI / 2
  pontaMesh.scale.x = FLAT
  ponta.add(pontaMesh)

  for (const [x, r, alvo] of [
    [0.35, 0.27, bracoUm], [0.6, 0.24, bracoUm], [0.84, 0.21, bracoUm], [0.2, 0.18, ponta], [0.42, 0.13, ponta],
  ] as [number, number, THREE.Group][]) {
    for (const side of [-1, 1]) {
      const pinta = sphere(0.04 * (0.6 + r * 1.6), PINTA, { roughness: 0.45 })
      pinta.position.set(x, FLAT * r * 0.9 - 0.008, side * r * 0.42)
      pinta.scale.y = 0.7
      alvo.add(pinta)
    }
  }

  // ---- água fervendo em volta (translúcida) + calor ------------------------
  const fervura = new THREE.Group()
  fervura.position.set(SX, WY, SZ)
  root.add(fervura)

  // degradê de calor: discos translúcidos empilhados, mais quentes no centro
  for (const [r, op, y] of [[1.5, 0.22, 0.008], [1.18, 0.28, 0.012], [0.88, 0.4, 0.016]] as const) {
    const lamina = translucido(
      cylinder(r, r, 0.012, FERVURA, { emissive: FERVURA, emissiveIntensity: 0.75 }, 64),
      op,
    )
    lamina.position.y = y
    lamina.receiveShadow = false
    fervura.add(lamina)
  }
  // marolas da fervura (anéis finos, sem borda dura)
  for (const [r, op] of [[1.32, 0.45], [1.56, 0.3]] as const) {
    const marola = translucido(torus(r, 0.016, '#ff9a4a', { emissive: '#ff7a2a', emissiveIntensity: 0.8 }), op)
    marola.rotation.x = Math.PI / 2
    marola.position.y = 0.012
    fervura.add(marola)
  }

  // bolhas estourando, cada uma com sua marolinha
  const bolhaRand = rng(77)
  for (let i = 0; i < 20; i++) {
    const a = (i / 20) * Math.PI * 2 + bolhaRand() * 0.25
    const rr = 0.92 + bolhaRand() * 0.55
    const r = 0.024 + bolhaRand() * 0.03
    const bolha = sphere(r, '#ffd6a6', { emissive: '#ff8a3a', emissiveIntensity: 0.55, roughness: 0.15 })
    bolha.scale.y = 0.75
    bolha.position.set(Math.cos(a) * rr, 0.01, Math.sin(a) * rr)
    fervura.add(bolha)
    if (i % 2 === 0) {
      const anel = translucido(torus(r * 2.1, 0.008, '#ffb070', { emissive: '#ff8a3a', emissiveIntensity: 0.7 }), 0.6)
      anel.rotation.x = Math.PI / 2
      anel.position.set(bolha.position.x, 0.014, bolha.position.z)
      fervura.add(anel)
    }
  }

  const calor = new THREE.PointLight('#ff8a3a', 2.4, 4.0, 1.6)
  calor.position.set(0, 1.2, -0.1)
  fervura.add(calor)

  // ---- três colunas de vapor: nascem finas na água e abrem para cima --------
  function vaporColuna(seed: number, escala: number) {
    const g = new THREE.Group()
    const r0 = rng(seed)
    for (const [k, [y, r]] of ([[0.04, 0.1], [0.24, 0.15], [0.52, 0.21], [0.86, 0.25]] as const).entries()) {
      const p = puff(r * escala, VAPOR, 5, seed + k, { roughness: 0.95 })
      p.position.set((r0() - 0.5) * 0.1 + k * 0.03, y * escala, (r0() - 0.5) * 0.08)
      g.add(p)
    }
    return g
  }
  const V1: [number, number, number] = [1.86, WY + 0.06, 0.62]
  const V2: [number, number, number] = [1.3, WY, -0.95]
  const V3: [number, number, number] = [-0.3, WY, -1.0]
  const vapor1 = vaporColuna(31, 0.85)
  vapor1.position.set(...V1)
  root.add(vapor1)
  const vapor2 = vaporColuna(41, 1.2)
  vapor2.position.set(...V2)
  root.add(vapor2)
  const vapor3 = vaporColuna(51, 0.95)
  vapor3.position.set(...V3)
  root.add(vapor3)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'mar', object: base },
    { name: 'gelo', group: 'mar', object: gelo },
    { name: 'pier', group: 'pier', object: pier },
    { name: 'toalha', group: 'pier', object: toalha },
    { name: 'estrela', group: 'estrela', object: estrela },
    { name: 'bracoUm', group: 'estrela', object: bracoUm },
    { name: 'carinha', group: 'riso', object: carinha },
    { name: 'brasas', group: 'brasa', object: brasas },
    { name: 'fervura', group: 'brasa', object: fervura },
    { name: 'vapor1', group: 'vapor', object: vapor1 },
    { name: 'vapor2', group: 'vapor', object: vapor2 },
    { name: 'vapor3', group: 'vapor', object: vapor3 },
  ]

  const cresce = (from = 0.01) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const sobeVapor = (name: string, at: number, v: [number, number, number], caption?: string) =>
    seq(`${name}-sobe`, name, at, 0.8, [riseFrom(v[1], 0.7), ...cresce(0.3)], { ease: 'easeOut', caption })

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'O mar sueco é tão gelado que ninguém tem coragem de pular: placas de gelo boiando…',
    }),
    seq('gelo-boia', 'gelo', 0.5, 0.7, [ch('position.y', -0.5, 0.06)], { ease: 'easeOut' }),

    seq('pier-rise', 'pier', 1.5, 0.9, [riseFrom(0, 1.3)], {
      ease: 'easeOut',
      caption: '…e o píer com a escadinha vazia. Toalha pendurada, e ninguém desce.',
    }),
    seq('toalha-cai', 'toalha', 2.1, 0.6, [ch('position.y', TY + 0.9, TY), ch('rotation.x', -0.5, 0)], {
      ease: 'easeOut',
    }),

    seq('estrela-sobe', 'estrela', 3.3, 0.9, [riseFrom(WY, 1.1)], {
      ease: 'easeOut',
      caption: 'Aí sobe do fundo uma estrela-do-mar laranja…',
    }),
    seq('um-deitado', 'bracoUm', 3.3, 0.9, [ch('rotation.z', UM_DEITADO, UM_DEITADO)]),

    seq('carinha-ri', 'carinha', 4.6, 0.4, cresce(), {
      ease: 'easeOut',
      caption: '…e solta uma gargalhada soprada: RRÁ!',
    }),
    seq('estrela-pula', 'estrela', 4.6, 0.25, [ch('position.y', WY, WY + 0.14)], { ease: 'easeOut' }),
    seq('estrela-cai', 'estrela', 4.85, 0.3, [ch('position.y', WY + 0.14, WY)], { ease: 'easeIn' }),

    seq('brasas-acendem', 'brasas', 6.2, 0.7, cresce(), {
      ease: 'easeOut',
      caption: 'E fica EM BRASA — EN BRÁ! — vermelha feito carvão, ali dentro D\'ÁGUA: DÁG!',
    }),
    seq('fervura-abre', 'fervura', 6.4, 0.8, [ch('scale.x', 0.15, 1), ch('scale.z', 0.15, 1)], {
      ease: 'easeOut',
    }),
    seq('gelo-derrete', 'gelo', 6.6, 1.0, [ch('position.y', 0.06, 0)], { ease: 'easeInOut' }),

    sobeVapor('vapor1', 8.0, V1, 'O mar ferve em volta, o gelo derrete chiando e sobe vapor…'),
    sobeVapor('vapor2', 8.2, V2),
    sobeVapor('vapor3', 8.4, V3),

    seq('um-ergue', 'bracoUm', 9.8, 0.9, [ch('rotation.z', UM_DEITADO, UM_ERGUIDO + 0.12)], {
      ease: 'easeOut',
      caption: '…e ela ergue UM braço só (EN = um) pra escadinha: pode pular!',
    }),
    seq('um-acena-a', 'bracoUm', 11.1, 0.3, [ch('rotation.z', UM_ERGUIDO + 0.12, UM_ERGUIDO - 0.1)], {
      caption: 'Ha en bra dag! — Tenha um bom dia!',
    }),
    seq('um-acena-b', 'bracoUm', 11.4, 0.4, [ch('rotation.z', UM_ERGUIDO - 0.1, UM_ERGUIDO)], {
      ease: 'easeOut',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.78, 2.2, 4.5], target: [0.16, 0.8, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'ha-en-bra-dag',
    contexto:
      'Atendimento: no caixa do mercado, na farmácia, no café, no fim de uma ligação — e de manhã, se despedindo de quem vai trabalhar.',
    fraseFonte: 'Tenha um bom dia!',
    fraseAlvo: 'Ha en bra dag!',
    pronuncia:
      "rrá en BRÁ DÁG! ('ha' com h soprado tipo RR carioca, A longo e sem R; 'en' curtinho e sem nasal; 'bra' e 'dag' com A longo de 'pá'; o g de 'dag' é duro e seco — na fala rápida às vezes some: 'bra da')",
    ponteSonora:
      "RRÁ! EN BRÁ... DÁG! (4 sílabas: rrá-en-BRÁ-DÁG; tônicas em BRÁ e DÁG; RRÁ = a gargalhada soprada de sempre, o MESMO RRÁ de 'Ha det bra' — h soprado como RR carioca, A longo e SEM R no fim: com R vira 'har', outro verbo; EN = o EM de EM BRASA, mas ORAL: E curto e N batido na língua, nunca o 'ẽi' nasal do português — é o mesmo EN = 'um' das outras cartas, por isso a estrela ergue UM braço só; BRÁ = o BRÁ de BRASA, R brando e A longo, o mesmo 'bra' de 'Ha det bra' e 'Jag mår bra'; DÁG = D'ÁGUA cortado no G: A longo e G DURO de 'gato' fechando seco — nunca 'DÁ-gui' nem 'DÁ-gua'; é o mesmo DÁG de 'idag'. Do 'Ha det bra' do dragão ela troca o DÊ pelo UM e ganha um DÁG no fim: uma brasa d'água)",
    historia:
      "O mar sueco é tão gelado que ninguém tem coragem de pular do píer. Aí uma estrela-do-mar laranja solta uma gargalhada soprada — RRÁ! — e fica EM BRASA, vermelha feito carvão de churrasco, ali mesmo, dentro D'ÁGUA. O mar ferve em volta dela, as placas de gelo derretem chiando, sobe vapor, e ela ergue UM braço só na direção da escadinha: pode pular. É a única brasa d'água do mundo, e ela acende toda manhã só pra você ter um bom dia.",
  },
  createScene,
  refine: { organic: ['estrela', 'bracoUm'] },
}

export default card
