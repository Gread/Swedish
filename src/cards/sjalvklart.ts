import * as THREE from 'three'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, lathe,
} from '../rig/helpers'

/**
 * "Självklart!" — RRÉLV... CLÁR-T!
 *
 * O vizinho sueco não tem cortador de grama: tem uma PIRANHA. Ela salta do
 * gramado, escancara a mandíbula prognata e sai voando rente ao chão roncando
 * feito motor (RRÉLV = RELVA sem o -A), deixando atrás uma faixa perfeita de
 * grama aparada. No fim da faixa as mandíbulas fecham num estalo: CLÁR-T!
 *
 * Diorama: gramado verde-escuro de capim alto, cerquinha branca ao fundo com o
 * cortador vermelho encostado e aposentado; a piranha cinza-prateada de barriga
 * vermelho-alaranjada (o acento) atravessa o disco na diagonal, a faixa
 * verde-clara desenrolando atrás dela.
 *
 * A faixa e o capim da faixa são duas peças que andam juntas: a faixa cresce
 * a partir da borda do disco e o capim da faixa encolhe na direção da boca,
 * com a mesma borda — a grama é "cortada" exatamente onde a faixa chega.
 */

const TERRA = '#4d3a2a'
const GRAMA = '#2b5227'          // disco do gramado
const CAPIM = ['#3a6b31', '#467a39', '#305d2b'] // lâminas altas, três tons
const FAIXA = '#a3d36c'          // grama aparada
const FAIXA_CLARA = '#b9e283'    // listra de corte
const APARA = ['#8cc95a', '#a9d978', '#5e9a44']
const CERCA = '#f1efe8'
const CORTADOR = '#9f4740'       // vermelho desbotado: aposentado
const PRETO = '#2a2c30'
const METAL = '#9aa1a8'
const PRATA = '#b9c3cb'
const DORSO = '#8a96a1'
const PALPEBRA = '#6a7681'
const BARBATANA = '#4e5862'
const BARBATANA_ESC = '#30363d'
const BARRIGA = '#e4532a'        // acento saturado RESERVADO: barriga e mandíbula
const BOCA = '#4a1a1e'
const DENTE = '#f6f3ea'
const OLHO = '#f3c21b'

const GY = 0.16 // topo do gramado

// ---- geometria da corrida -------------------------------------------------
const YAW = -0.4 // a piranha aponta para a direita, um pouco para a câmera
const PITCH = -0.08 // nariz levemente para baixo: a boca raspa a grama
const U = new THREE.Vector2(Math.cos(YAW), -Math.sin(YAW)) // frente (x, z)
const NRM = new THREE.Vector2(Math.sin(YAW), Math.cos(YAW)) // lado (+z local)
const PC = new THREE.Vector3(-0.1, 1.1, 0.45) // centro final da piranha
const PY_HOVER = 1.3 // altura em que ela espera antes da corrida
const RUN = 1.3 // quanto ela anda na corrida
const MOUTH_AHEAD = 1.2 // da boca ao centro, ao longo de U
const W = 1.0 // largura da faixa
const R_FAIXA = 2.42 // a faixa começa na borda do disco

// fim da faixa (sob a boca) e começo (na borda do disco)
const E = new THREE.Vector2(PC.x, PC.z).addScaledVector(U, MOUTH_AHEAD)
const L = (() => {
  const eu = E.dot(U)
  return eu + Math.sqrt(eu * eu - E.lengthSq() + R_FAIXA * R_FAIXA)
})()
const S = E.clone().addScaledVector(U, -L)
const C0 = new THREE.Vector2(PC.x, PC.z).addScaledVector(U, -RUN) // centro no início da corrida

// abertura da mandíbula (rotação em z em torno da dobradiça)
const JAW_OPEN = -0.68
const JAW_SHUT = -0.15 // fechada: os dentes de baixo encaixam na frente do lábio

// cortador encostado na cerca, à direita, ao fundo
const R_CERCA = 2.3
const THETA_CORT = -0.24

/** Posição na pista: (ao longo de U a partir de S, de lado a partir do eixo). */
function lane(x: number, z: number) {
  const dx = x - S.x
  const dz = z - S.y
  return { along: dx * U.x + dz * U.y, across: dx * NRM.x + dz * NRM.y }
}

interface Blade { x: number; z: number; h: number; lean: number; yaw: number; tone: number }

/**
 * Milhares de lâminas de capim fundidas em poucas malhas (uma por tom): cada
 * lâmina é uma pirâmide triangular achatada, inclinada para fora do tufo.
 */
function bladeField(blades: Blade[], y0: number) {
  const g = new THREE.Group()
  for (let tone = 0; tone < CAPIM.length; tone++) {
    const geos: THREE.BufferGeometry[] = []
    for (const b of blades) {
      if (b.tone !== tone) continue
      const geo = new THREE.ConeGeometry(0.026, b.h, 3, 1, true)
      geo.scale(1, 1, 0.45)
      geo.translate(0, b.h / 2, 0)
      geo.rotateZ(b.lean)
      geo.rotateY(b.yaw)
      geo.translate(b.x, y0, b.z)
      geos.push(geo)
    }
    if (geos.length === 0) continue
    const merged = mergeGeometries(geos)
    for (const geo of geos) geo.dispose()
    const mesh = new THREE.Mesh(merged, mat(CAPIM[tone], { roughness: 0.82, size: 0.3 }))
    mesh.castShadow = true
    mesh.receiveShadow = true
    g.add(mesh)
  }
  return g
}

/** Tufos espalhados numa grade com jitter; `keep` decide quais ficam. */
function tufts(
  rand: () => number,
  x0: number, x1: number, z0: number, z1: number,
  keep: (x: number, z: number) => boolean,
  step = 0.15,
) {
  const out: Blade[] = []
  for (let gx = x0; gx <= x1; gx += step) {
    for (let gz = z0; gz <= z1; gz += step) {
      const cx = gx + (rand() - 0.5) * step * 0.9
      const cz = gz + (rand() - 0.5) * step * 0.9
      if (!keep(cx, cz)) continue
      const n = 3 + Math.floor(rand() * 3)
      for (let k = 0; k < n; k++) {
        const a = rand() * Math.PI * 2
        const off = 0.015 + rand() * 0.03
        out.push({
          x: cx + Math.cos(a) * off,
          z: cz + Math.sin(a) * off,
          h: 0.17 + rand() * 0.13,
          lean: 0.12 + rand() * 0.3,
          yaw: -a + Math.PI,
          tone: Math.floor(rand() * CAPIM.length),
        })
      }
    }
  }
  return out
}

/** Barbatana: contorno 2D extrudado fino, com borda arredondada. */
function fin(outline: (s: THREE.Shape) => void, depth: number, color: string) {
  const shape = new THREE.Shape()
  outline(shape)
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth,
    bevelEnabled: true,
    bevelThickness: depth * 0.45,
    bevelSize: depth * 0.45,
    bevelSegments: 2,
    curveSegments: 20,
  })
  geo.translate(0, 0, -depth / 2)
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, mat(color, { roughness: 0.45, size: 0.6 }))
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Raio de barbatana: filete escuro de (x0,y0) a (x1,y1), em pé no plano xy. */
function ray(x0: number, y0: number, x1: number, y1: number, depth: number) {
  const len = Math.hypot(x1 - x0, y1 - y0)
  const r = rbox(len, 0.018, depth, 0.008, BARBATANA_ESC, { roughness: 0.5 })
  r.position.set((x0 + x1) / 2, (y0 + y1) / 2, 0)
  r.rotation.z = Math.atan2(y1 - y0, x1 - x0)
  return r
}

// elipsoide do corpo (x, y, z): para colar detalhes na pele
const BODY = [1.0, 0.74, 0.36] as const
function bodyZ(x: number, y: number) {
  const k = 1 - (x / BODY[0]) ** 2 - (y / BODY[1]) ** 2
  return BODY[2] * Math.sqrt(Math.max(0, k))
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- base: terra + gramado verde-escuro de capim alto ---------------------
  const base = new THREE.Group()

  const terra = cylinder(2.62, 2.7, 0.1, TERRA, { roughness: 0.9 })
  terra.position.y = 0.05
  base.add(terra)

  const gramado = cylinder(2.56, 2.6, 0.06, GRAMA, { roughness: 0.95 })
  gramado.position.y = GY - 0.03
  base.add(gramado)

  // pegada do cortador (rodas dentro do capim, mas nada atravessa o chassi)
  const CORT = new THREE.Vector2(Math.cos(THETA_CORT), Math.sin(THETA_CORT)).multiplyScalar(R_CERCA - 0.5)

  const capimBase = tufts(rand, -2.5, 2.5, -2.5, 2.5, (x, z) => {
    if (Math.hypot(x, z) > 2.47) return false
    const p = lane(x, z)
    if (p.along > -0.05 && p.along < L && Math.abs(p.across) < W / 2 + 0.02) return false
    if (Math.hypot(x - CORT.x, z - CORT.y) < 0.36) return false
    return true
  })
  base.add(bladeField(capimBase, GY))
  root.add(base)

  // ---- capim da faixa: encolhe em direção à boca durante a corrida ----------
  // origem no fim da faixa (E), lâminas em x local ∈ [-L, 0]
  const capim = new THREE.Group()
  capim.position.set(E.x, 0, E.y)
  capim.rotation.y = YAW
  capim.scale.x = 0.02 // pose final: tudo já foi cortado
  const capimFaixa = tufts(rand, -L, 0, -W / 2, W / 2, (x, z) => {
    if (Math.abs(z) > W / 2 - 0.035 || x > -0.02 || x < -L) return false
    const wx = E.x + x * U.x + z * NRM.x
    const wz = E.y + x * U.y + z * NRM.y
    return Math.hypot(wx, wz) < 2.47
  })
  capim.add(bladeField(capimFaixa, GY))
  root.add(capim)

  // ---- faixa aparada: cresce a partir da borda do disco ----------------------
  const faixa = new THREE.Group()
  faixa.position.set(S.x, 0, S.y)
  faixa.rotation.y = YAW
  root.add(faixa)

  const tapete = rbox(L, 0.03, W, 0.012, FAIXA, { roughness: 0.9 })
  tapete.position.set(L / 2, GY + 0.004, 0)
  faixa.add(tapete)
  // listra clara do corte, no meio da faixa (como gramado de estádio)
  const listra = rbox(L - 0.02, 0.03, W * 0.36, 0.01, FAIXA_CLARA, { roughness: 0.9 })
  listra.position.set(L / 2, GY + 0.006, 0)
  faixa.add(listra)
  // aparas largadas pelas beiras da faixa
  for (let i = 0; i < 34; i++) {
    const along = 0.15 + rand() * (L - 0.35)
    const side = rand() < 0.5 ? 1 : -1
    const lasca = rbox(0.08, 0.012, 0.03, 0.005, APARA[i % 3], { roughness: 0.85 })
    lasca.position.set(along, GY + 0.026, side * (W / 2 - 0.04 - rand() * 0.16))
    lasca.rotation.set(0, rand() * Math.PI, (rand() - 0.5) * 0.3)
    faixa.add(lasca)
  }

  // ---- cerquinha branca de ripas ao fundo ------------------------------------
  const cerca = new THREE.Group()
  root.add(cerca)
  const T0 = Math.PI * 1.1
  const T1 = Math.PI * 2.02
  const nRipas = 40
  for (let i = 0; i <= nRipas; i++) {
    const t = T0 + ((T1 - T0) * i) / nRipas
    const ripa = new THREE.Group()
    ripa.position.set(Math.cos(t) * R_CERCA, GY, Math.sin(t) * R_CERCA)
    ripa.rotation.y = Math.atan2(-Math.cos(t), -Math.sin(t)) // face para o centro
    const tabua = rbox(0.1, 0.46, 0.035, 0.012, CERCA, { roughness: 0.6 })
    tabua.position.y = 0.23
    ripa.add(tabua)
    const ponta = rbox(0.072, 0.072, 0.035, 0.01, CERCA, { roughness: 0.6 })
    ponta.position.y = 0.46
    ponta.rotation.z = Math.PI / 4
    ripa.add(ponta)
    cerca.add(ripa)
  }
  // travessas atrás das ripas
  for (const ry of [0.13, 0.36]) {
    const geo = new THREE.TorusGeometry(R_CERCA + 0.035, 0.022, 8, 96, T1 - T0)
    geo.rotateX(Math.PI / 2)
    geo.rotateY(-T0)
    geo.scale(1, 1.7, 1)
    const travessa = new THREE.Mesh(geo, mat(CERCA, { roughness: 0.6, size: 1 }))
    travessa.castShadow = true
    travessa.receiveShadow = true
    travessa.position.y = GY + ry
    cerca.add(travessa)
  }
  // mourões a cada tantas ripas
  for (let i = 0; i <= nRipas; i += 8) {
    const t = T0 + ((T1 - T0) * (i + 0.5)) / nRipas
    const mourao = rbox(0.1, 0.56, 0.1, 0.025, CERCA, { roughness: 0.6 })
    mourao.position.set(Math.cos(t) * (R_CERCA + 0.07), GY + 0.28, Math.sin(t) * (R_CERCA + 0.07))
    mourao.rotation.y = Math.atan2(-Math.cos(t), -Math.sin(t))
    cerca.add(mourao)
  }

  // ---- cortador vermelho encostado na cerca ---------------------------------
  // frente em +x local; o guidão sobe para trás (-x) até apoiar nas ripas
  const cortador = new THREE.Group()
  cortador.position.set(CORT.x, GY, CORT.y)
  cortador.rotation.y = Math.PI - THETA_CORT + 0.35 // de costas para a cerca
  root.add(cortador)

  const WR = 0.08
  for (const wx of [-0.17, 0.17]) {
    for (const wz of [-0.21, 0.21]) {
      const roda = cylinder(WR, WR, 0.05, PRETO, { roughness: 0.75 })
      roda.rotation.x = Math.PI / 2
      roda.position.set(wx, WR, wz)
      cortador.add(roda)
      const cubo = cylinder(0.035, 0.035, 0.06, METAL, { roughness: 0.3, metalness: 0.7 })
      cubo.rotation.x = Math.PI / 2
      cubo.position.set(wx, WR, wz)
      cortador.add(cubo)
    }
  }
  const chassi = rbox(0.5, 0.11, 0.4, 0.045, CORTADOR, { roughness: 0.4 })
  chassi.position.y = WR + 0.06
  cortador.add(chassi)
  const tampa = lathe(
    [[0, 0], [0.2, 0], [0.19, 0.03], [0.14, 0.06], [0, 0.065]],
    CORTADOR,
    { roughness: 0.4 },
  )
  tampa.position.y = WR + 0.11
  cortador.add(tampa)
  const motor = cylinder(0.1, 0.11, 0.12, PRETO, { roughness: 0.5 })
  motor.position.set(0.03, WR + 0.23, 0)
  cortador.add(motor)
  const filtro = rbox(0.07, 0.08, 0.1, 0.02, '#3d4148', { roughness: 0.5 })
  filtro.position.set(0.1, WR + 0.24, 0.1)
  cortador.add(filtro)
  const tampao = cylinder(0.032, 0.032, 0.03, METAL, { roughness: 0.3, metalness: 0.6 })
  tampao.position.set(-0.01, WR + 0.305, -0.03)
  cortador.add(tampao)
  // guidão: duas barras inclinadas + travessa com manopla
  const BETA = 0.95
  const HL = 0.72
  const hx0 = -0.2
  const hy0 = WR + 0.1
  const hx1 = hx0 - Math.sin(BETA) * HL
  const hy1 = hy0 + Math.cos(BETA) * HL
  for (const hz of [-0.16, 0.16]) {
    const barra = cylinder(0.016, 0.016, HL, METAL, { roughness: 0.3, metalness: 0.7 })
    barra.position.set((hx0 + hx1) / 2, (hy0 + hy1) / 2, hz)
    barra.rotation.z = BETA
    cortador.add(barra)
  }
  const travessa = cylinder(0.018, 0.018, 0.36, METAL, { roughness: 0.3, metalness: 0.7 })
  travessa.rotation.x = Math.PI / 2
  travessa.position.set(hx1, hy1, 0)
  cortador.add(travessa)
  const manopla = capsule(0.03, 0.2, PRETO, { roughness: 0.8 })
  manopla.rotation.x = Math.PI / 2
  manopla.position.set(hx1, hy1, 0)
  cortador.add(manopla)
  // saco de grama pendurado entre as barras, vazio e murcho
  const saco = rbox(0.28, 0.2, 0.28, 0.07, '#5c6656', { roughness: 0.92 })
  saco.position.set(-0.38, WR + 0.17, 0)
  saco.rotation.z = 0.45
  cortador.add(saco)

  // ---- PIRANHA ---------------------------------------------------------------
  // frente em +x local, dorso em +y, flanco da câmera em +z
  const piranha = new THREE.Group()
  piranha.position.copy(PC)
  piranha.rotation.set(0, YAW, PITCH)
  root.add(piranha)

  const PRATA_M = { roughness: 0.34, metalness: 0.5 }
  const corpo = sphere(1, PRATA, PRATA_M)
  corpo.scale.set(...BODY)
  piranha.add(corpo)

  // dorso escuro, fundido no corpo: degradê de peixe (escuro em cima)
  const dorso = sphere(1, DORSO, { roughness: 0.4, metalness: 0.4 })
  dorso.scale.set(0.82, 0.36, 0.33)
  dorso.position.set(-0.08, 0.41, 0)
  piranha.add(dorso)

  const cabeca = sphere(1, PRATA, PRATA_M)
  cabeca.scale.set(0.48, 0.54, 0.33)
  cabeca.position.set(0.6, 0.02, 0)
  piranha.add(cabeca)

  const pedunculo = sphere(1, PRATA, PRATA_M)
  pedunculo.scale.set(0.52, 0.2, 0.14)
  pedunculo.position.set(-0.95, 0.02, 0)
  piranha.add(pedunculo)

  // barriga e garganta vermelho-alaranjadas: peça própria, fundida à parte —
  // assim a divisa com o prateado sai num vinco limpo, sem a cor "vazar"
  const barriga = new THREE.Group()
  piranha.add(barriga)

  const ventre = sphere(1, BARRIGA, { roughness: 0.45, metalness: 0.15 })
  ventre.scale.set(0.8, 0.42, 0.385)
  ventre.position.set(0.12, -0.34, 0)
  barriga.add(ventre)

  const garganta = sphere(1, BARRIGA, { roughness: 0.45, metalness: 0.15 })
  garganta.scale.set(0.36, 0.25, 0.3)
  garganta.position.set(0.6, -0.3, 0)
  barriga.add(garganta)

  // lábio de cima: focinho rombudo onde ficam os dentes de cima
  const labio = sphere(1, PRATA, PRATA_M)
  labio.scale.set(0.27, 0.16, 0.26)
  labio.position.set(0.95, -0.15, 0)
  piranha.add(labio)

  // fundo da boca: escuro, aparece quando a mandíbula abre
  const goela = sphere(1, BOCA, { roughness: 0.6 })
  goela.scale.set(0.32, 0.2, 0.23)
  goela.position.set(0.8, -0.34, 0)
  piranha.add(goela)

  // ---- barbatanas e cauda (finas: ficam fora do refinamento) -----------------
  const barbatanas = new THREE.Group()
  piranha.add(barbatanas)

  const FD = 0.05
  const cauda = fin((s) => {
    s.moveTo(-1.2, 0.15)
    s.quadraticCurveTo(-1.5, 0.38, -1.95, 0.76)
    s.quadraticCurveTo(-1.84, 0.36, -1.64, 0.03)
    s.quadraticCurveTo(-1.84, -0.3, -1.95, -0.66)
    s.quadraticCurveTo(-1.5, -0.32, -1.2, -0.11)
    s.closePath()
  }, FD, BARBATANA)
  barbatanas.add(cauda)
  for (const [x1, y1] of [[-1.88, 0.66], [-1.72, 0.42], [-1.72, -0.35], [-1.88, -0.57]] as const) {
    barbatanas.add(ray(-1.3, 0.02, x1, y1, FD + 0.03))
  }
  // faixa escura na borda da cauda
  const bordaCauda = fin((s) => {
    s.moveTo(-1.95, 0.76)
    s.quadraticCurveTo(-1.84, 0.36, -1.64, 0.03)
    s.quadraticCurveTo(-1.84, -0.3, -1.95, -0.66)
    s.lineTo(-1.84, -0.5)
    s.quadraticCurveTo(-1.74, -0.25, -1.57, 0.03)
    s.quadraticCurveTo(-1.74, 0.3, -1.84, 0.6)
    s.closePath()
  }, FD + 0.012, BARBATANA_ESC)
  barbatanas.add(bordaCauda)

  const dorsal = fin((s) => {
    s.moveTo(0.12, 0.64)
    s.quadraticCurveTo(0.0, 1.04, -0.32, 1.1)
    s.quadraticCurveTo(-0.38, 0.86, -0.52, 0.64)
    s.closePath()
  }, FD, BARBATANA)
  barbatanas.add(dorsal)
  for (const [x0, x1, y1] of [[0.02, -0.12, 1.01], [-0.15, -0.28, 1.03], [-0.32, -0.4, 0.86]] as const) {
    barbatanas.add(ray(x0, 0.7, x1, y1, FD + 0.03))
  }

  const adiposa = fin((s) => {
    s.moveTo(-0.8, 0.36)
    s.quadraticCurveTo(-0.88, 0.58, -1.05, 0.53)
    s.quadraticCurveTo(-1.02, 0.34, -1.1, 0.19)
    s.closePath()
  }, FD, BARBATANA)
  barbatanas.add(adiposa)

  const anal = fin((s) => {
    s.moveTo(-0.3, -0.42)
    s.quadraticCurveTo(-0.5, -0.86, -0.98, -0.62)
    s.quadraticCurveTo(-0.92, -0.42, -0.86, -0.18)
    s.closePath()
  }, FD, BARBATANA)
  barbatanas.add(anal)

  // peitorais abertas feito asas (ela VOA) e pélvicas sob a barriga
  for (const side of [-1, 1]) {
    const peitoral = fin((s) => {
      s.moveTo(0, 0.06)
      s.quadraticCurveTo(-0.32, 0.14, -0.56, 0.02)
      s.quadraticCurveTo(-0.34, -0.1, 0, -0.06)
      s.closePath()
    }, 0.035, BARBATANA)
    peitoral.position.set(0.36, -0.22, side * (bodyZ(0.36, -0.22) - 0.04))
    peitoral.rotation.set(side * 0.25, side * 0.75, -0.25)
    barbatanas.add(peitoral)

    const pelvica = fin((s) => {
      s.moveTo(0, 0.04)
      s.quadraticCurveTo(-0.2, 0.0, -0.3, -0.12)
      s.quadraticCurveTo(-0.12, -0.08, 0, -0.04)
      s.closePath()
    }, 0.03, BARBATANA)
    pelvica.position.set(0.05, -0.66, side * 0.1)
    pelvica.rotation.y = side * 0.35
    barbatanas.add(pelvica)
  }

  // ---- olho amarelo de olhar mau ---------------------------------------------
  const olho = new THREE.Group()
  olho.position.set(0.8, 0.17, 0)
  piranha.add(olho)
  for (const side of [-1, 1]) {
    const ez = side * 0.3
    const iris = sphere(0.105, OLHO, { roughness: 0.25 })
    iris.position.set(0, 0, ez)
    iris.scale.z = 0.55
    olho.add(iris)
    const pupila = sphere(0.05, '#141414', { roughness: 0.2 })
    pupila.position.set(0.02, -0.01, ez + side * 0.05)
    pupila.scale.z = 0.5
    olho.add(pupila)
    const brilho = sphere(0.016, '#ffffff', { roughness: 0.1 })
    brilho.position.set(0.045, 0.035, ez + side * 0.065)
    olho.add(brilho)
    // pálpebra caída em diagonal: corta o topo do olho → cara de mau
    const palpebra = sphere(0.115, PALPEBRA, { roughness: 0.4, metalness: 0.3 })
    palpebra.scale.set(1.05, 0.5, 0.62)
    palpebra.position.set(0.0, 0.065, ez)
    palpebra.rotation.z = -0.45
    olho.add(palpebra)
    const sobrancelha = capsule(0.028, 0.18, BARBATANA_ESC, { roughness: 0.5 })
    sobrancelha.position.set(-0.01, 0.13, ez + side * 0.02)
    sobrancelha.rotation.z = Math.PI / 2 - 0.5
    olho.add(sobrancelha)
  }

  // ---- dentes de cima: fileira em arco sob o lábio ---------------------------
  const dentes = new THREE.Group()
  dentes.position.set(0.8, -0.25, 0)
  piranha.add(dentes)
  const N_DENTES = 7
  for (let i = 0; i < N_DENTES; i++) {
    const a = -1.2 + (i / (N_DENTES - 1)) * 2.4
    const dente = cone(0.058, 0.15, DENTE, { roughness: 0.25 }, 4)
    dente.scale.z = 0.45
    dente.position.set(0.36 * Math.cos(a), -0.06, 0.25 * Math.sin(a))
    dente.rotation.set(Math.PI, Math.PI / 2 - a, 0)
    dentes.add(dente)
  }

  // ---- mandíbula de baixo: enorme, prognata, escancarada ----------------------
  const mandibula = new THREE.Group()
  mandibula.position.set(0.5, -0.3, 0) // dobradiça
  mandibula.rotation.z = JAW_OPEN
  piranha.add(mandibula)

  const queixo = sphere(1, BARRIGA, { roughness: 0.45, metalness: 0.15 })
  queixo.scale.set(0.52, 0.2, 0.31)
  queixo.position.set(0.4, -0.03, 0)
  mandibula.add(queixo)
  const queixada = sphere(1, BARRIGA, { roughness: 0.45, metalness: 0.15 })
  queixada.scale.set(0.17, 0.17, 0.21)
  queixada.position.set(0.8, -0.08, 0)
  mandibula.add(queixada)
  // céu da boca de baixo: escuro, dentro do U do beiço
  const assoalho = sphere(1, BOCA, { roughness: 0.6 })
  assoalho.scale.set(0.36, 0.06, 0.21)
  assoalho.position.set(0.42, 0.09, 0)
  mandibula.add(assoalho)
  const lingua = sphere(1, '#b4454c', { roughness: 0.5 })
  lingua.scale.set(0.22, 0.05, 0.13)
  lingua.position.set(0.32, 0.12, 0)
  mandibula.add(lingua)
  // beiço prateado em U, onde a fileira de baixo está cravada
  const RIM: [number, number, number] = [0.42, 0.11, 0]
  const beicoGeo = new THREE.TorusGeometry(1, 0.13, 8, 48, 3.8)
  beicoGeo.rotateX(Math.PI / 2)
  beicoGeo.rotateY(1.9)
  beicoGeo.scale(0.36, 0.3, 0.25)
  const beico = new THREE.Mesh(beicoGeo, mat(PRATA, { ...PRATA_M, size: 0.7 }))
  beico.castShadow = true
  beico.receiveShadow = true
  beico.position.set(...RIM)
  mandibula.add(beico)
  for (let i = 0; i < N_DENTES; i++) {
    const a = -1.35 + (i / (N_DENTES - 1)) * 2.7
    const dente = cone(0.065, 0.17, DENTE, { roughness: 0.25 }, 4)
    dente.scale.z = 0.45
    dente.position.set(RIM[0] + 0.36 * Math.cos(a), RIM[1] + 0.135, 0.25 * Math.sin(a))
    dente.rotation.y = Math.PI / 2 - a
    mandibula.add(dente)
  }
  // fiapos de capim presos nos dentes
  for (const [fx, fz, fr] of [[0.72, 0.12, 0.5], [0.8, -0.05, -0.3], [0.62, 0.2, 0.9]] as const) {
    const fiapo = cone(0.022, 0.22, CAPIM[1], { roughness: 0.8 }, 3)
    fiapo.position.set(fx, 0.22, fz)
    fiapo.rotation.set(0.3, fr, -1.0)
    fiapo.scale.z = 0.45
    mandibula.add(fiapo)
  }

  // ---- nuvem de aparas cuspida da boca ---------------------------------------
  const aparas = new THREE.Group()
  aparas.position.set(1.2, -0.38, 0)
  piranha.add(aparas)
  for (let i = 0; i < 46; i++) {
    const tau = 0.14 + rand() * 0.42
    const vx = 0.05 + rand() * 0.7
    const vy = 1.5 + rand() * 0.8
    const vz = (rand() - 0.5) * 2.4
    const s = 0.75 + tau * 1.1
    const bit =
      i % 4 === 0
        ? cone(0.02 * s, 0.13 * s, APARA[2], { roughness: 0.8 }, 3)
        : rbox(0.085 * s, 0.014, 0.034 * s, 0.006, APARA[i % 2], { roughness: 0.85 })
    bit.position.set(vx * tau, vy * tau - 2.4 * tau * tau, vz * tau)
    bit.rotation.set(rand() * Math.PI, rand() * Math.PI, rand() * Math.PI)
    aparas.add(bit)
  }

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'jardim', object: base },
    { name: 'capim', group: 'jardim', object: capim },
    { name: 'cerca', group: 'jardim', object: cerca },
    { name: 'cortador', group: 'cortador', object: cortador },
    { name: 'piranha', group: 'piranha', object: piranha },
    { name: 'barriga', group: 'piranha', object: barriga },
    { name: 'mandibula', group: 'piranha', object: mandibula },
    { name: 'barbatanas', group: 'piranha', object: barbatanas },
    { name: 'olho', group: 'piranha', object: olho },
    { name: 'dentes', group: 'boca', object: dentes },
    { name: 'faixa', group: 'relva', object: faixa },
    { name: 'aparas', group: 'relva', object: aparas },
  ]

  // ---- montagem ----------------------------------------------------------------
  const T_OPEN = 5.0
  const T_RUN = 6.4
  const RUN_DUR = 2.3
  const T_SNAP = T_RUN + RUN_DUR + 0.15
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Num jardim sueco de cerquinha branca, a RELVA cresceu alta demais…',
    }),
    seq('capim-rise', 'capim', 0, 0.8, [riseFrom(0, 0.8)], { ease: 'easeOut' }),
    seq('cerca-rise', 'cerca', 0.35, 0.8, [riseFrom(0, 0.9)], { ease: 'easeOut' }),

    seq('cortador-rise', 'cortador', 1.6, 0.8, [riseFrom(GY, 0.9)], {
      ease: 'easeOut',
      caption: '…e o cortador vermelho do vizinho? Encostado na cerca, desligado.',
    }),

    seq(
      'piranha-salta',
      'piranha',
      3.0,
      0.9,
      [ch('position.y', -0.9, PY_HOVER), ch('rotation.z', 0.7, 0)],
      {
        ease: 'easeOut',
        caption: 'Porque ele tem uma PIRANHA! Ela salta da grama e ele aponta: dá conta dessa RELVA?',
      },
    ),
    seq('barriga-estufa', 'barriga', 3.0, 0.9, [ch('scale.z', 0.6, 1)], { ease: 'easeOut' }),
    seq('mandibula-salta', 'mandibula', 3.0, 0.9, [ch('rotation.z', -0.4, JAW_SHUT)], { ease: 'easeOut' }),
    seq(
      'barbatanas-abrem',
      'barbatanas',
      3.4,
      0.6,
      [ch('scale.x', 0.3, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.3, 1)],
      { ease: 'easeOut' },
    ),
    seq(
      'olho-abre',
      'olho',
      3.7,
      0.45,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('piranha-paira', 'piranha', 4.2, 0.8, [ch('position.y', PY_HOVER, PY_HOVER + 0.08)]),
    seq('piranha-paira-desce', 'piranha', 5.0, 0.9, [ch('position.y', PY_HOVER + 0.08, PY_HOVER)]),

    seq('mandibula-escancara', 'mandibula', T_OPEN, 0.6, [ch('rotation.z', JAW_SHUT, JAW_OPEN)], {
      ease: 'easeOut',
      caption: 'Ela nem responde: escancara a mandíbula prognata, dentes pra fora…',
    }),
    seq(
      'dentes-surgem',
      'dentes',
      T_OPEN + 0.15,
      0.45,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    // a corrida: piranha, faixa e capim da faixa andam no mesmo compasso
    seq(
      'piranha-voa',
      'piranha',
      T_RUN,
      RUN_DUR,
      [ch('position.x', C0.x, PC.x), ch('position.z', C0.y, PC.z)],
      {
        ease: 'linear',
        caption: '…e sai voando rente ao chão, roncando feito motor: RRÉLV! — engolindo a RELVA.',
      },
    ),
    seq('piranha-mergulha', 'piranha', T_RUN, 1.6, [
      ch('position.y', PY_HOVER, PC.y), ch('rotation.z', 0, PITCH),
    ], { ease: 'easeOut' }),
    seq('faixa-corta', 'faixa', T_RUN, RUN_DUR, [ch('scale.x', 0.001, 1)], { ease: 'linear' }),
    seq('capim-corta', 'capim', T_RUN, RUN_DUR, [ch('scale.x', 1, 0.02)], { ease: 'linear' }),
    seq(
      'aparas-cospe',
      'aparas',
      T_RUN + 0.1,
      0.5,
      [ch('scale.x', 0.01, 1.15), ch('scale.y', 0.01, 1.15), ch('scale.z', 0.01, 1.15)],
      { ease: 'easeOut' },
    ),

    // CLÁR-T: as mandíbulas fecham num estalo e reabrem
    seq('mandibula-estala', 'mandibula', T_SNAP, 0.13, [ch('rotation.z', JAW_OPEN, JAW_SHUT)], {
      ease: 'easeIn',
      caption: 'No fim da faixa, as mandíbulas fecham num estalo seco: CLÁR-T! Piranha, morder? Claro!',
    }),
    seq('piranha-tranco', 'piranha', T_SNAP + 0.1, 0.15, [ch('rotation.z', PITCH, PITCH + 0.07)], {
      ease: 'easeOut',
    }),
    seq('piranha-assenta', 'piranha', T_SNAP + 0.25, 0.5, [ch('rotation.z', PITCH + 0.07, PITCH)]),
    seq('mandibula-reabre', 'mandibula', T_SNAP + 0.55, 0.5, [ch('rotation.z', JAW_SHUT, JAW_OPEN)], {
      ease: 'easeOut',
    }),

    seq(
      'aparas-assentam',
      'aparas',
      T_SNAP + 1.2,
      0.7,
      [ch('scale.x', 1.15, 1), ch('scale.y', 1.15, 1), ch('scale.z', 1.15, 1)],
      { caption: 'Självklart! — Claro! / Com certeza!' },
    ),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.55, 3.0, 4.6], target: [0.1, 0.85, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'sjalvklart',
    contexto:
      "Resposta a qualquer pedido — 'Kan du hjälpa mig?' 'Självklart!' — no trabalho, com vizinho, com amigo.",
    fraseFonte: 'Claro! / Com certeza!',
    fraseAlvo: 'Självklart!',
    pronuncia:
      "RRÉLV-klaart! ('sj' = sopro forte e raspado, o mesmo de 'sjuk'; 'själv' com É aberto e L de língua; a força principal cai no RRÉLV e o 'klart' vem logo atrás com A longo; o 'rt' do fim é um T de língua enrolada pra trás, sem R vibrado; na fala rápida o v quase some: 'RRÉL-klaart')",
    ponteSonora:
      "RRÉLV... CLÁR-T! (2 batidas, força principal no RRÉLV e a segunda no CLÁR; RRÉLV = RELVA, a grama, sem o -A; o RR da frente é o sopro do 'sj' — FORTE e raspado, o ronco de motor de cortador, o mesmo sopro de RRÜÜK ('sjuk') e RRÍCA ('skicka'), bem mais forte que o h leve de RRÁ ('ha'), com os lábios já em bico no sopro; É ABERTO e curto; o L é de LÍNGUA no céu da boca — nunca o 'RRÉU-va' do português — e o V morde o lábio e já emenda no C; CLÁR-T = o CLARO! do português com o -O trocado por um T seco, o estalo das mandíbulas: A LONGO, e o R não vibra nem raspa — a língua enrola pra trás e cai direto no T, como no CÓRT de 'kort'; sem o T sobra 'självklar', o adjetivo — a resposta é 'klart'. E é literal: själv-klart = claro por si só)",
    historia:
      'O vizinho sueco não tem cortador de grama: tem uma piranha. Ele aponta o gramado e pergunta se ela dá conta de toda aquela RELVA — e a piranha nem espera: sai voando rente ao chão com um ronco de motor, RRRÉLV!, cuspindo aparas verdes pros lados e deixando atrás uma faixa perfeita. No fim da faixa ela fecha as mandíbulas num estalo seco — CLÁR-T! — e o cortador de verdade, encostado na cerca, fica aposentado. Perguntar a uma piranha se ela quer morder alguma coisa? Claro, óbvio.',
  },
  createScene,
  refine: { organic: ['piranha', 'barriga'] },
}

export default card
