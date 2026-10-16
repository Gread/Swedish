import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, lathe,
} from '../rig/helpers'

/**
 * "Jag är orolig." — IÁ! É… ÚÚÚ-ROLI(mã)!
 *
 * No topo da ladeira mais íngreme do bairro, o salsicha comprido demais para o
 * carrinho de ROLIMÃ (traseiro e rabo sobrando pra fora da tábua) agarra a
 * barra da frente, olha a descida sem fim e solta um uivo de aflição: ÚÚÚ…
 * ROLI! — três arcos azuis de som saem do focinho apontado pro céu.
 *
 * Diorama: bloco de rua em corte, plano de paralelepípedos à esquerda e a
 * ladeira descendo para a direita (em diagonal, na direção da câmera);
 * calçada com meio-fio branco ao fundo, poste no alto, placa amarela de
 * descida perigosa na ladeira.
 */

const SOIL = '#6b5242'
const SOIL_DARK = '#57412f'
const STREET = '#5c5e62'
const STONE = ['#9a9ca1', '#8b8e94', '#a8aaae', '#93959a'] as const
const WALK = '#c2bbae'
const CURB = '#efede6'
const POLE = '#6f767d'
const POLE_DARK = '#4f555b'
const BULB = '#fff1c9'
const SIGN = '#e9b52f'
const INK = '#1f1d1c'
const WOOD = '#dcb67e'
const WOOD_DARK = '#b38a55'
const STEEL = '#c9ced4'
const STEEL_DARK = '#7f878f'
const ROPE = '#ad3a2e'
const DOG = '#a5502b'
const DOG_DARK = '#6a2f17'
const DOG_LIGHT = '#bb6a3f'
const NOSE = '#1d1a1a'
const MOUTH = '#4a1a1c'
const TONGUE = '#d9707c'
const HOWL = '#4cc3ff' // acento saturado RESERVADO: o uivo ÚÚÚ

const TY = 0.8 // topo do plano (alto da ladeira)
const CREST = 0.45 // onde o plano vira ladeira
const END_X = 2.35
const END_Y = 0.1
const SLOPE = Math.atan2(TY - END_Y, END_X - CREST)
const STONE_H = 0.05

// carrinho e cão compartilham o mesmo referencial (frente = +x, ladeira abaixo)
const CART: [number, number, number] = [-0.15, TY + STONE_H, 0.12]
const YB = 0.25 // topo da tábua, no referencial do carrinho
const HEAD: [number, number, number] = [0.33, 0.93, 0]
const HOWL_UP = 0.88 // cabeça erguida no uivo (pose final)
const LOOK_DOWN = -0.32 // cabeça olhando a descida (antes do uivo)

/** Altura do topo da rua no x dado (plano + ladeira). */
function groundY(x: number) {
  if (x <= CREST) return TY
  return TY - (x - CREST) * Math.tan(SLOPE)
}

/** Bloco de rua em corte: o perfil plano+ladeira extrudado em z. */
function profileBlock(lift: number, z0: number, z1: number, color: string, rough = 0.9) {
  const s = new THREE.Shape()
  s.moveTo(-2.3, 0)
  s.lineTo(END_X, 0)
  s.lineTo(END_X, END_Y + lift)
  s.lineTo(CREST, TY + lift)
  s.lineTo(-2.3, TY + lift)
  s.closePath()
  const depth = z1 - z0
  const geo = new THREE.ExtrudeGeometry(s, {
    depth,
    bevelEnabled: true,
    bevelThickness: 0.025,
    bevelSize: 0.025,
    bevelSegments: 2,
    curveSegments: 4,
  })
  geo.translate(0, 0, z0)
  const m = new THREE.Mesh(geo, mat(color, { roughness: rough, size: 2 }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Arco de som no plano da tela, centrado na boca, aberto para `dir`. */
function soundArc(r: number, dir: number) {
  const span = 1.5
  const geo = new THREE.TorusGeometry(r, 0.026, 12, 40, span)
  const m = new THREE.Mesh(geo, mat(HOWL, { roughness: 0.3, emissive: HOWL, emissiveIntensity: 0.45 }))
  m.rotation.z = dir - span / 2
  m.castShadow = true
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // tudo gira um pouco: a ladeira desce para a direita E na direção da câmera
  const mundo = new THREE.Group()
  mundo.rotation.y = -0.34
  mundo.position.set(0.05, 0, 0)
  root.add(mundo)

  // ---- a ladeira: bloco em corte + paralelepípedos + calçada ---------------
  const ladeira = new THREE.Group()
  mundo.add(ladeira)

  // pedestal escuro sob o bloco de terra
  const pedestal = rbox(4.85, 0.1, 2.8, 0.04, SOIL_DARK, { roughness: 0.9 })
  pedestal.position.set(0.02, 0.0, 0)
  ladeira.add(pedestal)
  ladeira.add(profileBlock(-0.06, -1.3, 1.33, SOIL))
  ladeira.add(profileBlock(0, -0.92, 1.3, STREET, 0.8))

  // paralelepípedos do plano (fiada em amarração)
  const step = 0.22
  for (let row = 0; row < 10; row++) {
    const z = -0.8 + row * step
    const off = row % 2 === 0 ? 0 : step / 2
    for (let x = -2.2 + off; x <= CREST - 0.1; x += step) {
      const p = rbox(0.19, STONE_H, 0.19, 0.035, STONE[Math.floor(rand() * 4)], { roughness: 0.8 })
      p.position.set(x, TY + STONE_H / 2 + rand() * 0.008, z)
      p.rotation.y = (rand() - 0.5) * 0.12
      ladeira.add(p)
    }
  }
  // paralelepípedos da ladeira: num grupo inclinado a partir da crista
  const rampa = new THREE.Group()
  rampa.position.set(CREST, TY, 0)
  rampa.rotation.z = -SLOPE
  ladeira.add(rampa)
  const rampLen = Math.hypot(END_X - CREST, TY - END_Y)
  for (let row = 0; row < 10; row++) {
    const z = -0.8 + row * step
    const off = row % 2 === 0 ? step / 2 : 0
    for (let s = 0.1 + off; s <= rampLen - 0.1; s += step) {
      const p = rbox(0.19, STONE_H, 0.19, 0.035, STONE[Math.floor(rand() * 4)], { roughness: 0.8 })
      p.position.set(s, STONE_H / 2 + rand() * 0.008, z)
      p.rotation.y = (rand() - 0.5) * 0.12
      rampa.add(p)
    }
  }

  // calçada ao fundo + meio-fio branco acompanhando a ladeira
  ladeira.add(profileBlock(0.1, -1.3, -0.98, WALK, 0.85))
  ladeira.add(profileBlock(0.11, -0.99, -0.91, CURB, 0.6))

  // ---- poste de luz no alto ------------------------------------------------
  const poste = new THREE.Group()
  poste.position.set(-1.7, TY + 0.1, -1.14)
  poste.scale.setScalar(0.84)
  mundo.add(poste)

  const pe = lathe([[0, 0], [0.13, 0], [0.13, 0.05], [0.09, 0.09], [0.07, 0.22], [0, 0.22]], POLE_DARK, {
    roughness: 0.45, metalness: 0.6,
  })
  poste.add(pe)
  const haste = cylinder(0.035, 0.045, 1.75, POLE, { roughness: 0.4, metalness: 0.6 })
  haste.position.y = 1.0
  poste.add(haste)
  const braco = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 1.8, 0),
        new THREE.Vector3(0.02, 1.98, 0.1),
        new THREE.Vector3(0.05, 2.02, 0.32),
        new THREE.Vector3(0.06, 1.97, 0.48),
      ]),
      24, 0.026, 8, false,
    ),
    mat(POLE, { roughness: 0.4, metalness: 0.6, size: 0.6 }),
  )
  braco.castShadow = true
  poste.add(braco)
  const cupula = lathe([[0, 0.12], [0.17, 0], [0.15, -0.02], [0.05, 0.1], [0, 0.11]], POLE_DARK, {
    roughness: 0.4, metalness: 0.6,
  })
  cupula.position.set(0.06, 1.82, 0.5)
  poste.add(cupula)
  const lampada = sphere(0.07, BULB, { emissive: BULB, emissiveIntensity: 0.5 })
  lampada.scale.y = 0.7
  lampada.position.set(0.06, 1.8, 0.5)
  poste.add(lampada)

  // ---- placa amarela de descida perigosa, na ladeira -----------------------
  const placa = new THREE.Group()
  const PX = 1.1
  placa.position.set(PX, groundY(PX) + 0.1, -1.14)
  placa.rotation.y = 0.34 // de frente para a câmera
  mundo.add(placa)

  const mastro = cylinder(0.028, 0.028, 1.05, POLE, { roughness: 0.4, metalness: 0.6 })
  mastro.position.y = 0.52
  placa.add(mastro)
  const placaG = new THREE.Group()
  placaG.position.set(0, 1.12, 0.04)
  placa.add(placaG)
  const borda = rbox(0.46, 0.46, 0.025, 0.04, INK, { roughness: 0.5 })
  borda.rotation.z = Math.PI / 4
  placaG.add(borda)
  const chapa = rbox(0.4, 0.4, 0.035, 0.035, SIGN, { roughness: 0.45 })
  chapa.rotation.z = Math.PI / 4
  chapa.position.z = 0.005
  placaG.add(chapa)
  // triângulo preto: rampa descendo para a direita
  const tri = new THREE.Shape()
  tri.moveTo(-0.15, -0.08)
  tri.lineTo(0.15, -0.08)
  tri.lineTo(-0.15, 0.1)
  tri.closePath()
  const triMesh = new THREE.Mesh(
    new THREE.ExtrudeGeometry(tri, { depth: 0.012, bevelEnabled: false }),
    mat(INK, { roughness: 0.5, size: 0.3 }),
  )
  triMesh.position.z = 0.024
  placaG.add(triMesh)

  // ---- carrinho de rolimã --------------------------------------------------
  const carrinho = new THREE.Group()
  carrinho.position.set(...CART)
  mundo.add(carrinho)

  const tabua = rbox(1.12, 0.05, 0.42, 0.02, WOOD, { roughness: 0.6 })
  tabua.position.y = YB - 0.025
  carrinho.add(tabua)
  for (const z of [-0.07, 0.07]) {
    const junta = rbox(1.1, 0.006, 0.008, 0.002, WOOD_DARK, { roughness: 0.7 })
    junta.position.set(0, YB + 0.001, z)
    carrinho.add(junta)
  }
  for (const ax of [-0.42, 0.42]) {
    const eixo = rbox(0.1, 0.06, 0.66, 0.02, WOOD_DARK, { roughness: 0.65 })
    eixo.position.set(ax, YB - 0.08, 0)
    carrinho.add(eixo)
    for (const side of [-1, 1]) {
      const rol = new THREE.Group()
      rol.position.set(ax, 0.085, side * 0.3)
      const aro = cylinder(0.085, 0.085, 0.055, STEEL, { roughness: 0.35, metalness: 0.45 })
      aro.rotation.x = Math.PI / 2
      rol.add(aro)
      const pista = cylinder(0.06, 0.06, 0.06, STEEL_DARK, { roughness: 0.4, metalness: 0.45 })
      pista.rotation.x = Math.PI / 2
      rol.add(pista)
      const miolo = cylinder(0.035, 0.035, 0.064, STEEL, { roughness: 0.35, metalness: 0.45 })
      miolo.rotation.x = Math.PI / 2
      rol.add(miolo)
      carrinho.add(rol)
    }
    for (const side of [-1, 1]) {
      const prego = sphere(0.013, STEEL_DARK, { roughness: 0.4, metalness: 0.7 })
      prego.position.set(ax, YB + 0.003, side * 0.16)
      carrinho.add(prego)
    }
  }

  // ---- barra de direção com a corda vermelha -------------------------------
  const barra = new THREE.Group()
  barra.position.set(CART[0] + 0.46, CART[1] + 0.34, CART[2])
  mundo.add(barra)

  const calco = rbox(0.1, 0.09, 0.12, 0.02, WOOD_DARK, { roughness: 0.65 })
  calco.position.y = -0.07
  barra.add(calco)
  const vara = cylinder(0.032, 0.032, 0.74, WOOD, { roughness: 0.55 })
  vara.rotation.x = Math.PI / 2
  barra.add(vara)
  for (const side of [-1, 1]) {
    const ponta = sphere(0.042, WOOD_DARK, { roughness: 0.6 })
    ponta.position.z = side * 0.37
    barra.add(ponta)
    const no = sphere(0.032, ROPE, { roughness: 0.85 })
    no.position.set(0, 0, side * 0.33)
    no.scale.set(1.2, 1.2, 0.8)
    barra.add(no)
  }
  const corda = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3([
        new THREE.Vector3(0, 0, 0.33),
        new THREE.Vector3(0.1, -0.05, 0.38),
        new THREE.Vector3(0.2, -0.13, 0.22),
        new THREE.Vector3(0.23, -0.15, 0),
        new THREE.Vector3(0.2, -0.13, -0.22),
        new THREE.Vector3(0.1, -0.05, -0.38),
        new THREE.Vector3(0, 0, -0.33),
      ]),
      48, 0.017, 8, false,
    ),
    mat(ROPE, { roughness: 0.85, size: 0.4 }),
  )
  corda.castShadow = true
  barra.add(corda)

  // ---- o salsicha (corpo, patas traseiras, rabo) ---------------------------
  const salsicha = new THREE.Group()
  salsicha.position.set(...CART)
  mundo.add(salsicha)

  const tronco = capsule(0.19, 0.8, DOG, { roughness: 0.75 })
  tronco.rotation.z = Math.PI / 2 + 0.05
  tronco.position.set(-0.47, YB + 0.17, 0)
  salsicha.add(tronco)

  const peito = capsule(0.2, 0.26, DOG, { roughness: 0.75 })
  peito.rotation.z = -0.58
  peito.position.set(0.13, 0.6, 0)
  salsicha.add(peito)

  const pescoco = capsule(0.135, 0.12, DOG, { roughness: 0.75 })
  pescoco.rotation.z = -0.41
  pescoco.position.set(0.27, 0.8, 0)
  salsicha.add(pescoco)

  for (const side of [-1, 1]) {
    const coxa = sphere(0.13, DOG, { roughness: 0.75 })
    coxa.scale.set(1.25, 1, 0.75)
    coxa.position.set(-0.8, 0.37, side * 0.13)
    salsicha.add(coxa)

    const perna = capsule(0.05, 0.1, DOG, { roughness: 0.75 })
    perna.position.set(-0.86, 0.21, side * 0.14)
    perna.rotation.z = -0.2
    salsicha.add(perna)

    const pata = sphere(0.055, DOG_DARK, { roughness: 0.75 })
    pata.scale.set(1.4, 0.7, 1)
    pata.position.set(-0.83, 0.13, side * 0.14)
    salsicha.add(pata)
  }

  const rabo = capsule(0.04, 0.3, DOG, { roughness: 0.75 })
  rabo.rotation.z = 2.13
  rabo.position.set(-1.21, 0.35, 0)
  salsicha.add(rabo)
  const ponteira = sphere(0.032, DOG_DARK, { roughness: 0.75 })
  ponteira.position.set(-1.36, 0.25, 0)
  salsicha.add(ponteira)

  // ---- patinhas dianteiras agarradas na barra ------------------------------
  const patas = new THREE.Group()
  patas.position.set(...CART)
  mundo.add(patas)
  for (const side of [-1, 1]) {
    const braco = capsule(0.056, 0.14, DOG, { roughness: 0.75 })
    braco.rotation.z = -2.11
    braco.position.set(0.32, 0.47, side * 0.11)
    patas.add(braco)
    const mao = sphere(0.062, DOG_DARK, { roughness: 0.75 })
    mao.scale.set(1.3, 0.8, 1.05)
    mao.position.set(0.45, 0.385, side * 0.11)
    patas.add(mao)
  }

  // ---- cabeça: focinho pro alto, boca aberta, sobrancelhas de aflição ------
  const cabeca = new THREE.Group()
  cabeca.position.set(CART[0] + HEAD[0], CART[1] + HEAD[1], CART[2] + HEAD[2])
  cabeca.rotation.z = HOWL_UP
  mundo.add(cabeca)

  const cranio = sphere(0.165, DOG, { roughness: 0.75 })
  cranio.scale.set(1.05, 0.95, 0.92)
  cabeca.add(cranio)

  const focinho = capsule(0.075, 0.17, DOG_LIGHT, { roughness: 0.7 })
  focinho.rotation.z = -Math.PI / 2
  focinho.position.set(0.21, -0.015, 0)
  cabeca.add(focinho)

  const nariz = sphere(0.05, NOSE, { roughness: 0.3 })
  nariz.scale.set(0.9, 0.85, 1.05)
  nariz.position.set(0.38, 0.0, 0)
  cabeca.add(nariz)

  const queixo = capsule(0.05, 0.12, DOG_LIGHT, { roughness: 0.7 })
  queixo.rotation.z = -Math.PI / 2 - 0.5
  queixo.position.set(0.18, -0.14, 0)
  cabeca.add(queixo)

  const boca = sphere(0.065, MOUTH, { roughness: 0.5 })
  boca.scale.set(1.35, 0.6, 0.8)
  boca.position.set(0.2, -0.085, 0)
  cabeca.add(boca)

  const lingua = capsule(0.035, 0.07, TONGUE, { roughness: 0.4 })
  lingua.rotation.z = -Math.PI / 2 - 0.45
  lingua.scale.set(1, 1, 1.4)
  lingua.position.set(0.21, -0.12, 0)
  cabeca.add(lingua)

  for (const side of [-1, 1]) {
    const olho = sphere(0.047, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.7
    olho.position.set(0.08, 0.06, side * 0.115)
    cabeca.add(olho)
    // pupilas puxadas pra frente e pra baixo: ele olha a descida
    const pupila = sphere(0.025, '#141414', { roughness: 0.2 })
    pupila.position.set(0.108, 0.038, side * 0.148)
    cabeca.add(pupila)

    const sobrancelha = capsule(0.022, 0.075, DOG_DARK, { roughness: 0.8 })
    sobrancelha.rotation.x = side > 0 ? 2.03 : 1.11
    sobrancelha.position.set(0.09, 0.118, side * 0.112)
    cabeca.add(sobrancelha)
  }

  // ---- orelhas compridas jogadas pra trás (filhas da cabeça) ---------------
  const orelhas = new THREE.Group()
  orelhas.position.set(-0.03, 0.08, 0)
  cabeca.add(orelhas)
  for (const side of [-1, 1]) {
    const orelha = capsule(0.072, 0.2, DOG_DARK, { roughness: 0.8 })
    orelha.scale.set(1, 1, 0.38)
    orelha.rotation.set(side * 0.22, 0, 2.4)
    orelha.position.set(-0.115, -0.125, side * 0.165)
    orelhas.add(orelha)
  }

  // ---- arcos do uivo: ÚÚÚ ---------------------------------------------------
  // a boca no mundo (pose final) e a direção do focinho na tela
  const mouthLocal = new THREE.Vector3(0.36, -0.02, 0)
  mouthLocal.applyAxisAngle(new THREE.Vector3(0, 0, 1), HOWL_UP)
  const mouth = new THREE.Vector3(
    CART[0] + HEAD[0] + mouthLocal.x,
    CART[1] + HEAD[1] + mouthLocal.y,
    CART[2] + HEAD[2],
  )
  const screenDir = Math.atan2(Math.sin(HOWL_UP), Math.cos(HOWL_UP) * Math.cos(0.34))
  const aneis: THREE.Group[] = []
  for (const r of [0.14, 0.26, 0.38]) {
    const g = new THREE.Group()
    g.position.copy(mouth)
    g.rotation.y = 0.34 // contra-gira o mundo: arcos no plano da tela
    g.add(soundArc(r, screenDir))
    mundo.add(g)
    aneis.push(g)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'ladeira', group: 'rua', object: ladeira },
    { name: 'poste', group: 'rua', object: poste },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'carrinho', group: 'rolima', object: carrinho },
    { name: 'barra', group: 'rolima', object: barra },
    { name: 'salsicha', group: 'cao', object: salsicha },
    { name: 'cabeca', group: 'cao', object: cabeca },
    { name: 'orelhas', group: 'cao', object: orelhas },
    { name: 'patas', group: 'ia', object: patas },
    { name: 'anel1', group: 'uivo', object: aneis[0] },
    { name: 'anel2', group: 'uivo', object: aneis[1] },
    { name: 'anel3', group: 'uivo', object: aneis[2] },
  ]

  const grow = (from = 0.05) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const HY = CART[1] + HEAD[1]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('ladeira-rise', 'ladeira', 0, 0.9, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Sobe a ladeira mais íngreme do bairro: paralelepípedos e meio-fio branco.',
    }),
    seq('poste-rise', 'poste', 0.7, 0.7, [riseFrom(TY + 0.1, 2.2)], { ease: 'easeOut' }),

    seq('placa-cresce', 'placa', 1.9, 0.6, grow(), {
      ease: 'easeOut',
      caption: 'Na descida, a placa amarela avisa: ladeira perigosa, sem fim.',
    }),

    seq('carrinho-rise', 'carrinho', 3.2, 0.7, [riseFrom(CART[1], 0.6)], {
      ease: 'easeOut',
      caption: 'Lá no alto, um carrinho de ROLIMÃ: tábua clara e rolamentos de aço — sem freio.',
    }),
    seq('barra-cresce', 'barra', 3.6, 0.5, grow(0.1), { ease: 'easeOut' }),

    seq('salsicha-cai', 'salsicha', 5.0, 0.6, [ch('position.y', CART[1] + 1.6, CART[1])], {
      ease: 'easeIn',
      caption: 'A criançada senta nele um salsicha comprido demais: o traseiro e o rabo sobram pra fora!',
    }),
    seq('cabeca-cai', 'cabeca', 5.0, 0.6, [ch('position.y', HY + 1.6, HY)], { ease: 'easeIn' }),
    seq('orelhas-cai', 'orelhas', 5.0, 0.6, [ch('scale.y', 0.6, 1)], { ease: 'easeOut' }),

    seq('patas-agarram', 'patas', 6.4, 0.45, [ch('position.y', CART[1] + 0.18, CART[1])], {
      ease: 'easeOut',
      caption: 'Ainda no plano, ele agarra a barra e banca o caubói: IÁ!',
    }),

    seq('cabeca-uiva', 'cabeca', 7.9, 0.9, [ch('rotation.z', LOOK_DOWN, HOWL_UP)], {
      ease: 'easeInOut',
      caption: 'Aí olha a descida sem fim… o grito murcha num É… e vira uivo: ÚÚÚ… ROLI!',
    }),
    seq('anel1-sai', 'anel1', 8.7, 0.45, grow(0.2), { ease: 'easeOut' }),
    seq('anel2-sai', 'anel2', 9.0, 0.45, grow(0.2), { ease: 'easeOut' }),
    seq('anel3-sai', 'anel3', 9.3, 0.45, grow(0.2), { ease: 'easeOut' }),

    seq('orelhas-tremem-1', 'orelhas', 10.4, 0.16, [ch('rotation.z', 0.22, 0)], {
      caption: 'As orelhas tremem antes do primeiro empurrão. Ninguém no bairro está mais preocupado.',
    }),
    seq('orelhas-tremem-2', 'orelhas', 10.6, 0.16, [ch('rotation.z', -0.18, 0)]),
    seq('orelhas-tremem-3', 'orelhas', 10.8, 0.16, [ch('rotation.z', 0.15, 0)]),
    seq('orelhas-tremem-4', 'orelhas', 11.0, 0.16, [ch('rotation.z', -0.1, 0)]),

    seq('anel1-pulsa', 'anel1', 12.0, 0.4, grow(0.7), {
      ease: 'easeOut',
      caption: 'Jag är orolig. — Estou preocupado(a).',
    }),
    seq('anel2-pulsa', 'anel2', 12.12, 0.4, grow(0.75), { ease: 'easeOut' }),
    seq('anel3-pulsa', 'anel3', 12.24, 0.4, grow(0.8), { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.15, 1.72, 3.75], target: [-0.12, 1.47, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ar-orolig',
    contexto:
      "Família: quando o filho não voltou da escola na hora, quando o resultado do exame da vårdcentral demora, quando a decisão do Migrationsverket não chega. Com o parceiro, com a professora (förskolan, skolan) ou ao telefone com o 1177. Com complemento: 'Jag är orolig för min son' (estou preocupado com meu filho).",
    fraseFonte: 'Estou preocupado(a).',
    fraseAlvo: 'Jag är orolig.',
    pronuncia:
      "iá é ÚÚ-ru-li ('jag' = iá, o G não soa; 'är' = É aberto e curto; 'orolig' com a força TODA no primeiro O, que é um U LONGO de bico bem fechado (é o 'o' longo sueco, nunca o Ô de 'ouro'); o -ro- vem fraco, de novo com U e R de um toque só, como em 'caro', nunca o RR de 'rato'; o -lig é fraquinho, e no dia a dia o G some: 'li'. Esse O do começo é um 'não' (o- = des-): sem ele sobra 'rolig', que quer dizer DIVERTIDO)",
    ponteSonora:
      "IÁ! É... ÚÚÚ-ROLI(mã)! (5 sílabas: iá-é-ÚÚ-ru-li; a força TODA no ÚÚ; IÁ É = o 'jag är' de sempre, o MESMO de 'Jag är trött', 'Jag är klar' e 'Jag är mätt': I de IOGA, nunca o J chiado de 'já', e o É aberto e curto; ÚÚÚ = o uivo de aflição do salsicha, um U LONGO de bico fechado, e é nele que cai a força: é o 'o' longo sueco, que soa U, então não abra pra Ô de 'ouro'; ROLI = o carrinho de ROLImã sem o -MÃ, GRUDADO no uivo e sem pausa (ÚÚ-ru-li): assim o R cai entre vogais e sai BRANDO, um toque de língua como em 'caro'. Dito sozinho, o R de 'rolimã' viraria o RR soprado de 'rato', e aí sai outra coisa; o O de ROLI já sai U e fraco, do jeito que o brasileiro fala 'ru-li-MÃ', e a força NÃO vai pro LI, porque no rolimã ela mora no MÃ, que ficou pra trás; o -g do fim não soa na fala. E não engula o uivo: sem o ÚÚ sobra 'rolig', DIVERTIDO, o oposto do que o salsicha sente)",
    historia:
      "No alto da ladeira mais íngreme do bairro, a criançada senta o cachorro salsicha num carrinho de ROLIMÃ, e ele é tão comprido que o traseiro e o rabo sobram pra fora da tábua. Ainda no plano, ele banca o valente e solta um 'IÁ!' de caubói. Aí olha pra baixo, vê a descida sem fim e o carrinho sem freio, e o grito murcha num 'É...' que vira um uivo comprido de aflição: ÚÚÚÚ... ROLI! As orelhas tremem antes mesmo do primeiro empurrão. Ninguém no bairro está mais preocupado que ele: orolig.",
  },
  createScene,
  refine: { organic: ['salsicha', 'cabeca', 'patas', 'orelhas'] },
}

export default card
