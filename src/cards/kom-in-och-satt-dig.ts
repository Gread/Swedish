import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Kom in och sätt dig!" — CÓM-MÍN! Ó, SÉT-DÊI!
 *
 * Neva lá fora. Dentro de uma toca no barranco, a raposa anfitriã de avental
 * xadrez enrolou o rabo no SEU gorro azul e te arrastou pela portinha
 * redonda (CÓM-MÍN = vem com mim). Agora aponta a única poltrona da casa,
 * gorda e vermelha, com um SETE dourado no encosto: Ó, SÉT! — DÊI!
 *
 * Leitura da esquerda para a direita: porta (entrar) → raposa → poltrona
 * (sentar). O acento saturado é reservado à placa dourada do 7.
 */

const TERRA = '#7a5638'
const TERRA_ESC = '#5e4029'
const TERRA_CLARA = '#9a7350'
const MUSGO = '#6f8048'
const MUSGO_ESC = '#55663a'
const MADEIRA = '#7a5230'
const MADEIRA_ESC = '#553620'
const NEVE = '#eef3f8'
const NOITE = '#2a3a58'
const FERRO = '#3a3836'
const LUZ = '#ffc95a'
const RAPOSA = '#d9702a'
const BRANCO = '#f3ebdd'
const PRETO = '#2a211d'
const VERMELHO = '#a8392f'
const VERMELHO_ESC = '#86291f'
const AZUL = '#4c78b0'
const AZUL_ESC = '#3a5f8f'
const OURO = '#f2b52b' // acento saturado RESERVADO: a placa do SETE

const FY = 0.12 // topo do chão de terra
const R_IN = 2.0 // raio interno da parede da toca
const WALL_H = 2.05
const R_FACE = R_IN - 0.08 // face interna real (o bevel da extrusão avança 0.08)

// porta redonda: no fundo à esquerda, virada para o centro da toca
const DOOR_A = (146 * Math.PI) / 180
const DOOR_POS = new THREE.Vector3(Math.cos(DOOR_A) * (R_FACE - 0.04), FY, -Math.sin(DOOR_A) * (R_FACE - 0.04))
const DOOR_R = 0.52
const FOLHA_ABERTA = 2.0

// raposa
const FOX: [number, number, number] = [-0.18, FY, 0.42]
const FOX_ROT = 0.32
const PATA_REPOUSO = 0.18
const PATA_APONTA = 1.22

// poltrona
const CHAIR: [number, number, number] = [1.1, FY, 0.1]
const CHAIR_ROT = -0.52

/** Tecido xadrez verde do avental, desenhado num canvas. */
function plaid() {
  const c = document.createElement('canvas')
  c.width = c.height = 64
  const g = c.getContext('2d')!
  g.fillStyle = '#6c9152'
  g.fillRect(0, 0, 64, 64)
  g.fillStyle = 'rgba(40, 70, 36, 0.55)'
  g.fillRect(0, 20, 64, 22)
  g.fillRect(20, 0, 22, 64)
  g.fillStyle = 'rgba(245, 236, 210, 0.75)'
  g.fillRect(0, 30, 64, 3)
  g.fillRect(30, 0, 3, 64)
  const t = new THREE.CanvasTexture(c)
  t.wrapS = t.wrapT = THREE.RepeatWrapping
  t.repeat.set(3, 3)
  t.colorSpace = THREE.SRGBColorSpace
  return t
}

/** Pano curvo que acompanha o corpo (tronco de cone aberto, só a frente). */
function pano(rTop: number, rBottom: number, h: number, arc: number, tex: THREE.Texture) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, h, 24, 1, true, -arc / 2, arc)
  const m = mat('#ffffff', { roughness: 0.9, size: h })
  m.map = tex
  m.side = THREE.DoubleSide
  const mesh = new THREE.Mesh(geo, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

/** Traço do número 7. */
function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.03, 0.01, '#5a2414', { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(17)

  // ---- chão de terra batida + tapete redondo de musgo -----------------------
  const base = new THREE.Group()

  const chao = cylinder(2.38, 2.46, 0.12, TERRA, { roughness: 0.95 })
  chao.position.y = 0.06
  base.add(chao)

  const tapete = cylinder(1.12, 1.14, 0.03, MUSGO, { roughness: 0.95 })
  tapete.position.set(0.25, FY + 0.015, 0.45)
  base.add(tapete)
  for (const [rr, tube] of [[1.1, 0.03], [0.78, 0.018], [0.42, 0.018]] as const) {
    const anel = torus(rr, tube, MUSGO_ESC, { roughness: 0.95 })
    anel.rotation.x = Math.PI / 2
    anel.position.set(0.25, FY + 0.03, 0.45)
    base.add(anel)
  }

  // pedrinhas e torrões no chão, longe das peças principais
  for (const [px, pz, r] of [[-1.55, 1.25, 0.1], [1.75, 1.05, 0.08], [-0.9, 1.75, 0.07], [1.95, -0.2, 0.11]] as const) {
    const pedra = rock(r, '#6e655a', Math.floor(rand() * 100), { roughness: 0.95 })
    pedra.position.set(px, FY + r * 0.4, pz)
    base.add(pedra)
  }
  root.add(base)

  // ---- parede da toca: meia-lua de terra com neve por cima -------------------
  const parede = new THREE.Group()
  {
    const a0 = (8 * Math.PI) / 180
    const a1 = (172 * Math.PI) / 180
    const shape = new THREE.Shape()
    shape.absarc(0, 0, R_IN + 0.3, a0, a1, false)
    shape.absarc(0, 0, R_IN, a1, a0, true)
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth: WALL_H,
      bevelEnabled: true,
      bevelThickness: 0.08,
      bevelSize: 0.08,
      bevelSegments: 4,
      curveSegments: 64,
    })
    geo.rotateX(-Math.PI / 2)
    const muro = new THREE.Mesh(geo, mat(TERRA_CLARA, { roughness: 0.95, size: 2 }))
    muro.castShadow = true
    muro.receiveShadow = true
    muro.position.y = FY - 0.08
    parede.add(muro)

    // pedras encravadas no pé da parede
    for (const [a, r, h] of [[0.35, 0.16, 0.1], [0.95, 0.12, 0.06], [1.75, 0.14, 0.08], [2.2, 0.11, 0.05]] as const) {
      const pedra = rock(r, '#7b7166', Math.round(a * 10), { roughness: 0.95 })
      pedra.position.set(Math.cos(a) * (R_FACE - 0.02), FY + h, -Math.sin(a) * (R_FACE - 0.02))
      parede.add(pedra)
    }

    // raízes penduradas da borda
    for (const a of [0.45, 0.85, 1.75, 2.15]) {
      const ang = a
      const len = 0.3 + rand() * 0.3
      const raiz = capsule(0.022, len, TERRA_ESC, { roughness: 0.9 })
      raiz.position.set(Math.cos(ang) * (R_FACE - 0.02), FY + WALL_H - len / 2 - 0.02, -Math.sin(ang) * (R_FACE - 0.02))
      raiz.rotation.z = (rand() - 0.5) * 0.4
      parede.add(raiz)
    }

    // neve acumulada no topo do barranco
    for (let i = 0; i <= 22; i++) {
      const a = a0 + ((a1 - a0) * i) / 22
      const s = puff(0.17 + rand() * 0.05, NEVE, 3, 60 + i, { roughness: 0.9 })
      s.position.set(Math.cos(a) * (R_IN + 0.15), FY + WALL_H + 0.02, -Math.sin(a) * (R_IN + 0.15))
      s.scale.set(1, 0.45, 1)
      parede.add(s)
    }

    // braço de ferro onde pende a lamparina
    const aL = (68 * Math.PI) / 180
    const suporte = new THREE.Group()
    suporte.position.set(Math.cos(aL) * R_FACE, FY + 1.82, -Math.sin(aL) * R_FACE)
    suporte.rotation.y = Math.atan2(-suporte.position.x, -suporte.position.z)
    const chapa = rbox(0.12, 0.2, 0.03, 0.01, FERRO, { roughness: 0.5, metalness: 0.6 })
    suporte.add(chapa)
    const haste = cylinder(0.018, 0.018, 0.5, FERRO, { roughness: 0.5, metalness: 0.6 })
    haste.rotation.x = Math.PI / 2
    haste.position.set(0, 0.04, 0.25)
    suporte.add(haste)
    const mao = torus(0.035, 0.012, FERRO, { roughness: 0.5, metalness: 0.6 })
    mao.position.set(0, 0.01, 0.48)
    suporte.add(mao)
    parede.add(suporte)
  }
  root.add(parede)

  // ---- porta redonda (batente + vão nevado) ---------------------------------
  const porta = new THREE.Group()
  porta.position.copy(DOOR_POS)
  porta.rotation.y = Math.atan2(-DOOR_POS.x, -DOOR_POS.z)
  {
    const batente = torus(DOOR_R, 0.075, MADEIRA, { roughness: 0.7 })
    batente.position.set(0, DOOR_R - 0.04, 0.02)
    porta.add(batente)
    // pedras-chave no batente
    for (let i = 0; i < 9; i++) {
      const a = -Math.PI / 2 + 0.35 + (i * (2 * Math.PI - 0.7)) / 8
      const cunha = rbox(0.1, 0.06, 0.06, 0.02, MADEIRA_ESC, { roughness: 0.8 })
      cunha.position.set(Math.cos(a) * DOOR_R, DOOR_R - 0.04 + Math.sin(a) * DOOR_R, 0.08)
      cunha.rotation.z = a
      porta.add(cunha)
    }
    // o lado de fora: noite azul com flocos caindo
    const vao = cylinder(DOOR_R - 0.02, DOOR_R - 0.02, 0.02, NOITE, { emissive: '#22324f', emissiveIntensity: 0.5 })
    vao.rotation.x = Math.PI / 2
    vao.position.set(0, DOOR_R - 0.04, 0.02)
    porta.add(vao)
    for (let i = 0; i < 9; i++) {
      const fl = sphere(0.022 + rand() * 0.012, '#ffffff', { emissive: '#dfe8f5', emissiveIntensity: 0.5 }, 10)
      const a = rand() * Math.PI * 2
      const d = Math.sqrt(rand()) * (DOOR_R - 0.1)
      fl.position.set(Math.cos(a) * d, DOOR_R - 0.04 + Math.sin(a) * d, 0.04)
      porta.add(fl)
    }
    // monte de neve lá fora, visto pelo vão
    const monte = sphere(0.4, NEVE, { roughness: 0.9 })
    monte.scale.set(1.1, 0.35, 0.5)
    monte.position.set(0, 0, 0.0)
    porta.add(monte)
  }
  root.add(porta)

  // folha da porta: dobradiça no lado de trás, aberta para dentro
  const folha = new THREE.Group()
  folha.position.set(DOOR_R - 0.02, 0, 0.05)
  folha.rotation.y = FOLHA_ABERTA
  {
    const tabua = cylinder(DOOR_R - 0.05, DOOR_R - 0.05, 0.06, '#5f7a46', { roughness: 0.7 })
    tabua.rotation.x = Math.PI / 2
    tabua.position.set(-(DOOR_R - 0.05), DOOR_R - 0.04, 0)
    folha.add(tabua)
    for (const dy of [-0.24, 0.24]) {
      const travessa = rbox(0.84, 0.07, 0.03, 0.015, MADEIRA_ESC, { roughness: 0.7 })
      travessa.position.set(-(DOOR_R - 0.05), DOOR_R - 0.04 + dy, 0.04)
      folha.add(travessa)
    }
    const macaneta = sphere(0.045, '#c9a250', { roughness: 0.3, metalness: 0.8 })
    macaneta.position.set(-(DOOR_R - 0.05) * 2 + 0.1, DOOR_R - 0.04, 0.07)
    folha.add(macaneta)
  }
  porta.add(folha)

  // ---- neve que entrou pela soleira -----------------------------------------
  const neve = new THREE.Group()
  neve.position.copy(DOOR_POS)
  neve.rotation.y = porta.rotation.y
  {
    const montinho = puff(0.22, NEVE, 6, 71, { roughness: 0.9 })
    montinho.scale.set(1.6, 0.4, 1.1)
    montinho.position.set(-0.05, 0.03, 0.25)
    neve.add(montinho)
    const espalhado = sphere(0.3, NEVE, { roughness: 0.9 })
    espalhado.scale.set(1.2, 0.12, 0.9)
    espalhado.position.set(0.05, 0.0, 0.55)
    neve.add(espalhado)
    // flocos entrando na toca
    for (const [fx, fy, fz] of [[0.1, 0.9, 0.45], [-0.25, 1.2, 0.65], [0.3, 1.35, 0.8], [-0.05, 0.6, 0.9]] as const) {
      const fl = sphere(0.025, '#ffffff', { emissive: '#dfe8f5', emissiveIntensity: 0.4 }, 10)
      fl.position.set(fx, fy, fz)
      neve.add(fl)
    }
  }
  root.add(neve)

  // ---- lamparina pendurada (pivô no gancho do braço de ferro) --------------
  const lamparina = new THREE.Group()
  {
    const aL = (68 * Math.PI) / 180
    const dir = new THREE.Vector3(-Math.cos(aL), 0, Math.sin(aL)) // para o centro
    lamparina.position.set(Math.cos(aL) * R_FACE + dir.x * 0.48, FY + 1.83, -Math.sin(aL) * R_FACE + dir.z * 0.48)
    const corrente = cylinder(0.01, 0.01, 0.18, FERRO, { roughness: 0.5, metalness: 0.6 })
    corrente.position.y = -0.09
    lamparina.add(corrente)
    const argola = torus(0.03, 0.01, FERRO, { roughness: 0.5, metalness: 0.6 })
    argola.position.y = -0.19
    lamparina.add(argola)
    const chapeu = cone(0.12, 0.1, FERRO, { roughness: 0.5, metalness: 0.6 })
    chapeu.position.y = -0.27
    lamparina.add(chapeu)
    const vidro = cylinder(0.075, 0.075, 0.19, LUZ, { emissive: '#ffb83a', emissiveIntensity: 1.6 })
    vidro.position.y = -0.42
    lamparina.add(vidro)
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4
      const grade = cylinder(0.008, 0.008, 0.2, FERRO, { roughness: 0.5, metalness: 0.6 }, 8)
      grade.position.set(Math.cos(a) * 0.082, -0.42, Math.sin(a) * 0.082)
      lamparina.add(grade)
    }
    const pe = cylinder(0.09, 0.07, 0.04, FERRO, { roughness: 0.5, metalness: 0.6 })
    pe.position.y = -0.53
    lamparina.add(pe)
    const brilho = new THREE.PointLight('#ffbe5c', 1.4, 3.2, 2)
    brilho.position.y = -0.42
    lamparina.add(brilho)
  }
  root.add(lamparina)

  // ---- poltrona vermelha gorda ----------------------------------------------
  const poltrona = new THREE.Group()
  poltrona.position.set(...CHAIR)
  poltrona.rotation.y = CHAIR_ROT
  {
    const assento = rbox(1.0, 0.36, 0.86, 0.12, VERMELHO, { roughness: 0.85 })
    assento.position.y = 0.28
    poltrona.add(assento)
    const almofada = rbox(0.66, 0.17, 0.66, 0.08, VERMELHO, { roughness: 0.85 })
    almofada.position.set(0, 0.52, 0.08)
    poltrona.add(almofada)
    const encosto = rbox(1.0, 0.92, 0.3, 0.14, VERMELHO, { roughness: 0.85 })
    encosto.position.set(0, 0.86, -0.29)
    encosto.rotation.x = -0.08
    poltrona.add(encosto)
    const rolo = capsule(0.17, 0.72, VERMELHO, { roughness: 0.85 })
    rolo.rotation.z = Math.PI / 2
    rolo.position.set(0, 1.3, -0.33)
    poltrona.add(rolo)
    for (const side of [-1, 1]) {
      const braco = rbox(0.22, 0.42, 0.84, 0.08, VERMELHO, { roughness: 0.85 })
      braco.position.set(side * 0.46, 0.5, 0.0)
      poltrona.add(braco)
      const enrolado = capsule(0.13, 0.62, VERMELHO, { roughness: 0.85 })
      enrolado.rotation.x = Math.PI / 2
      enrolado.position.set(side * 0.47, 0.73, 0.04)
      poltrona.add(enrolado)
      const espiral = cylinder(0.1, 0.1, 0.02, VERMELHO_ESC, { roughness: 0.85 })
      espiral.rotation.x = Math.PI / 2
      espiral.position.set(side * 0.47, 0.73, 0.47)
      poltrona.add(espiral)
      const botaoE = sphere(0.025, VERMELHO_ESC, { roughness: 0.6 })
      botaoE.position.set(side * 0.47, 0.73, 0.485)
      poltrona.add(botaoE)
    }
    // vivo (debrum) na frente do assento
    const debrum = capsule(0.025, 0.9, VERMELHO_ESC, { roughness: 0.8 })
    debrum.rotation.z = Math.PI / 2
    debrum.position.set(0, 0.45, 0.43)
    poltrona.add(debrum)
    // capitonê do encosto
    for (const [bx, by] of [[-0.24, 0.7], [0.24, 0.7], [-0.24, 0.98], [0.24, 0.98]] as const) {
      const botao = sphere(0.028, VERMELHO_ESC, { roughness: 0.6 })
      botao.position.set(bx, by, -0.13 + (by - 0.86) * 0.08)
      poltrona.add(botao)
    }
    // pés torneados
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pe = lathe(
          [[0, 0], [0.045, 0], [0.06, 0.03], [0.045, 0.07], [0.06, 0.1], [0, 0.1]],
          MADEIRA_ESC,
          { roughness: 0.5 },
        )
        pe.position.set(sx * 0.42, 0, sz * 0.34)
        poltrona.add(pe)
      }
    }
  }
  root.add(poltrona)

  // ---- placa dourada com o 7 no encosto (filha da poltrona) ----------------
  const placa7 = new THREE.Group()
  placa7.position.set(0, 1.06, -0.115)
  placa7.rotation.x = -0.08
  {
    const disco = cylinder(0.2, 0.2, 0.035, OURO, { roughness: 0.25, metalness: 0.7 })
    disco.rotation.x = Math.PI / 2
    disco.scale.set(0.9, 1, 1.1)
    placa7.add(disco)
    const aro = torus(0.19, 0.018, '#c98f1c', { roughness: 0.3, metalness: 0.7 })
    aro.scale.set(0.9, 1.1, 1)
    aro.position.z = 0.02
    placa7.add(aro)
    const sete = new THREE.Group()
    sete.position.z = 0.03
    sete.add(stroke(0.17, 0.045, 0.0, 0.085))
    sete.add(stroke(0.045, 0.22, 0.015, -0.025, -0.38))
    placa7.add(sete)
  }
  poltrona.add(placa7)

  // ---- RAPOSA anfitriã (de pé, olha para a frente, +z) ----------------------
  const raposa = new THREE.Group()
  raposa.position.set(...FOX)
  raposa.rotation.y = FOX_ROT
  raposa.scale.setScalar(1.12)
  {
    // pés pretos e canelas de "meia"
    for (const side of [-1, 1]) {
      const pe = sphere(0.085, PRETO, { roughness: 0.8 })
      pe.scale.set(0.9, 0.6, 1.4)
      pe.position.set(side * 0.12, 0.05, 0.05)
      raposa.add(pe)
      const canela = capsule(0.065, 0.16, PRETO, { roughness: 0.8 })
      canela.position.set(side * 0.12, 0.17, 0)
      raposa.add(canela)
      const coxa = capsule(0.095, 0.14, RAPOSA, { roughness: 0.85 })
      coxa.position.set(side * 0.13, 0.34, 0)
      raposa.add(coxa)
    }
    const quadril = sphere(0.27, RAPOSA, { roughness: 0.85 })
    quadril.scale.set(1, 0.85, 0.9)
    quadril.position.y = 0.52
    raposa.add(quadril)
    const tronco = capsule(0.22, 0.32, RAPOSA, { roughness: 0.85 })
    tronco.position.y = 0.82
    raposa.add(tronco)
    // peito branco acima do avental
    const peito = sphere(0.16, BRANCO, { roughness: 0.9 })
    peito.scale.set(1.05, 1.0, 0.7)
    peito.position.set(0, 1.02, 0.1)
    raposa.add(peito)
    const pescoco = sphere(0.15, RAPOSA, { roughness: 0.85 })
    pescoco.position.set(0, 1.08, -0.02)
    raposa.add(pescoco)
    const ombros = capsule(0.11, 0.3, RAPOSA, { roughness: 0.85 })
    ombros.rotation.z = Math.PI / 2
    ombros.position.y = 0.98
    raposa.add(ombros)

    // braço direito (lado -x) de mão na cintura, cotovelo para fora
    const sup = capsule(0.06, 0.2, RAPOSA, { roughness: 0.85 })
    sup.position.set(-0.3, 0.88, 0)
    sup.rotation.z = -0.65
    raposa.add(sup)
    const ante = capsule(0.055, 0.18, RAPOSA, { roughness: 0.85 })
    ante.position.set(-0.32, 0.7, 0.03)
    ante.rotation.z = 0.75
    raposa.add(ante)
    const maoE = sphere(0.07, PRETO, { roughness: 0.8 })
    maoE.position.set(-0.24, 0.62, 0.05)
    raposa.add(maoE)
  }
  root.add(raposa)

  // ---- cabeça (sub-peça) -----------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.27, 0.02)
  cabeca.rotation.z = -0.1
  {
    const cranio = sphere(0.2, RAPOSA, { roughness: 0.85 })
    cranio.scale.set(1.08, 0.95, 1)
    cabeca.add(cranio)
    for (const side of [-1, 1]) {
      const bochecha = sphere(0.11, BRANCO, { roughness: 0.9 })
      bochecha.scale.set(1.1, 0.8, 0.9)
      bochecha.position.set(side * 0.13, -0.08, 0.08)
      cabeca.add(bochecha)

      const orelha = cone(0.085, 0.24, RAPOSA, { roughness: 0.85 })
      orelha.scale.z = 0.55
      orelha.position.set(side * 0.12, 0.24, -0.03)
      orelha.rotation.z = -side * 0.3
      cabeca.add(orelha)
      const ponta = cone(0.043, 0.1, PRETO, { roughness: 0.8 })
      ponta.scale.z = 0.6
      ponta.position.set(side * (0.12 + Math.sin(0.3) * 0.085), 0.24 + Math.cos(0.3) * 0.085, -0.03)
      ponta.rotation.z = -side * 0.3
      cabeca.add(ponta)
      const dentro = cone(0.05, 0.15, '#f0d6bf', { roughness: 0.9 })
      dentro.scale.z = 0.3
      dentro.position.set(side * 0.115, 0.215, 0.0)
      dentro.rotation.z = -side * 0.3
      cabeca.add(dentro)

      const olho = sphere(0.042, '#ffffff', { roughness: 0.25 })
      olho.scale.z = 0.6
      olho.position.set(side * 0.085, 0.045, 0.17)
      cabeca.add(olho)
      const pupila = sphere(0.026, '#1a1a1a', { roughness: 0.2 })
      pupila.position.set(side * 0.085, 0.045, 0.192)
      cabeca.add(pupila)
      const reflexo = sphere(0.008, '#ffffff', { roughness: 0.1 })
      reflexo.position.set(side * 0.085 + 0.01, 0.056, 0.214)
      cabeca.add(reflexo)
    }
    const focinho = cone(0.1, 0.26, RAPOSA, { roughness: 0.85 })
    focinho.rotation.x = Math.PI / 2
    focinho.scale.set(1, 1, 0.8)
    focinho.position.set(0, -0.03, 0.27)
    cabeca.add(focinho)
    const queixo = sphere(0.08, BRANCO, { roughness: 0.9 })
    queixo.scale.set(1, 0.6, 1.6)
    queixo.position.set(0, -0.1, 0.22)
    cabeca.add(queixo)
    const nariz = sphere(0.034, PRETO, { roughness: 0.3 })
    nariz.position.set(0, -0.025, 0.4)
    cabeca.add(nariz)
    // boca aberta: CÓM-MÍN!
    const boca = sphere(0.05, '#4a1c1c', { roughness: 0.6 })
    boca.scale.set(1.1, 0.55, 1)
    boca.position.set(0, -0.11, 0.3)
    cabeca.add(boca)
    const lingua = sphere(0.032, '#e0808c', { roughness: 0.4 })
    lingua.scale.set(1.1, 0.5, 1)
    lingua.position.set(0, -0.125, 0.32)
    cabeca.add(lingua)
  }
  raposa.add(cabeca)

  // ---- avental xadrez (sub-peça; pivô no pescoço: desenrola para baixo) -----
  const avental = new THREE.Group()
  avental.position.set(0, 1.1, 0)
  {
    const tex = plaid()
    const saia = pano(0.255, 0.31, 0.5, 1.9, tex)
    saia.position.set(0, -0.48, 0.0)
    avental.add(saia)
    const peitilho = pano(0.235, 0.245, 0.24, 1.3, tex)
    peitilho.position.set(0, -0.17, 0.0)
    avental.add(peitilho)
    const bolso = rbox(0.17, 0.12, 0.02, 0.02, '#4f723f', { roughness: 0.9 })
    bolso.position.set(0.09, -0.52, 0.29)
    bolso.rotation.y = 0.3
    avental.add(bolso)
    const cinto = torus(0.245, 0.022, '#f0e6cc', { roughness: 0.9 })
    cinto.rotation.x = Math.PI / 2
    cinto.position.y = -0.3
    avental.add(cinto)
    const alca = torus(0.15, 0.018, '#f0e6cc', { roughness: 0.9 })
    alca.rotation.x = Math.PI / 2 - 0.5
    alca.position.set(0, 0.02, 0.0)
    avental.add(alca)
  }
  raposa.add(avental)

  // ---- pata que aponta a poltrona (sub-peça; pivô no ombro, lado +x) --------
  const pata = new THREE.Group()
  pata.position.set(0.27, 0.98, 0.02)
  pata.rotation.z = PATA_APONTA
  {
    const braco = capsule(0.062, 0.32, RAPOSA, { roughness: 0.85 })
    braco.position.y = -0.2
    pata.add(braco)
    const mao = sphere(0.072, PRETO, { roughness: 0.8 })
    mao.scale.set(1, 1.15, 0.9)
    mao.position.y = -0.41
    pata.add(mao)
    const dedo = capsule(0.028, 0.08, PRETO, { roughness: 0.8 })
    dedo.position.y = -0.5
    pata.add(dedo)
  }
  raposa.add(pata)

  // ---- rabo felpudo enrolado no gorro (sub-peça; pivô na base do rabo) ------
  const rabo = new THREE.Group()
  rabo.position.set(-0.1, 0.45, -0.2)
  {
    const K = 0.74 // escala do traçado do rabo
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(-0.15, -0.03, -0.14),
      new THREE.Vector3(-0.4, 0.02, -0.16),
      new THREE.Vector3(-0.62, 0.18, -0.08),
      new THREE.Vector3(-0.78, 0.45, 0.0),
      new THREE.Vector3(-0.82, 0.7, 0.05),
      new THREE.Vector3(-0.72, 0.93, 0.08),
      new THREE.Vector3(-0.55, 1.02, 0.1),
      new THREE.Vector3(-0.38, 0.95, 0.14),
      new THREE.Vector3(-0.3, 0.8, 0.3),
      new THREE.Vector3(-0.42, 0.68, 0.55),
      new THREE.Vector3(-0.64, 0.68, 0.58),
      new THREE.Vector3(-0.78, 0.76, 0.44),
    ].map((v) => v.multiplyScalar(K)))
    const N = 56
    for (let i = 0; i <= N; i++) {
      const t = i / N
      // engrossa rápido, felpudo no meio, afina na ponta branca
      const r = 0.85 * (0.06 + 0.1 * Math.sin(Math.min(1, t * 1.6) * Math.PI * 0.5) - (t > 0.6 ? (t - 0.6) * 0.2 : 0) - (t > 0.82 ? (t - 0.82) * 0.22 : 0))
      const cor = t > 0.86 ? BRANCO : t > 0.83 ? '#e9c9a6' : RAPOSA
      const bola = sphere(r, cor, { roughness: 0.88 }, 20)
      bola.position.copy(curva.getPoint(t))
      rabo.add(bola)
    }
  }
  raposa.add(rabo)

  // ---- gorro azul de lã da visita (preso na volta do rabo) ------------------
  const gorro = new THREE.Group()
  gorro.position.set(-0.42, 0.67, 0.25)
  gorro.rotation.set(0.05, 0, 0.22)
  gorro.scale.setScalar(1.1)
  {
    const copa = lathe(
      [[0, 0.0], [0.14, 0.0], [0.15, 0.06], [0.15, 0.15], [0.13, 0.24], [0.08, 0.29], [0, 0.3]],
      AZUL,
      { roughness: 0.92 },
    )
    copa.position.y = -0.1
    gorro.add(copa)
    const barra = torus(0.15, 0.04, AZUL_ESC, { roughness: 0.92 })
    barra.rotation.x = Math.PI / 2
    barra.position.y = -0.07
    gorro.add(barra)
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2
      const nervura = rbox(0.02, 0.07, 0.02, 0.008, '#2f507a', { roughness: 0.95 })
      nervura.position.set(Math.cos(a) * 0.188, -0.07, Math.sin(a) * 0.188)
      nervura.rotation.y = -a
      gorro.add(nervura)
    }
    const pompom = puff(0.06, '#f3f0ea', 5, 81, { roughness: 0.95 })
    pompom.position.y = 0.22
    gorro.add(pompom)
  }
  rabo.add(gorro)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'toca', object: base },
    { name: 'parede', group: 'toca', object: parede },
    { name: 'porta', group: 'porta', object: porta },
    { name: 'folha', group: 'porta', object: folha },
    { name: 'neve', group: 'porta', object: neve },
    { name: 'raposa', group: 'raposa', object: raposa },
    { name: 'cabeca', group: 'raposa', object: cabeca },
    { name: 'avental', group: 'raposa', object: avental },
    { name: 'rabo', group: 'gorro', object: rabo },
    { name: 'gorro', group: 'gorro', object: gorro },
    { name: 'lamparina', group: 'poltrona', object: lamparina },
    { name: 'poltrona', group: 'poltrona', object: poltrona },
    { name: 'placa7', group: 'sete', object: placa7 },
    { name: 'pata', group: 'sete', object: pata },
  ]

  // ---- montagem ------------------------------------------------------------
  const s3 = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Neva lá fora. No barranco, uma toca: chão de terra batida e tapete de musgo.',
    }),
    seq('parede-rise', 'parede', 0.25, 0.9, [riseFrom(0, 2.3)], { ease: 'easeOut' }),

    seq('porta-cresce', 'porta', 1.6, 0.6, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Você bate na portinha redonda… e ela se abre.',
    }),
    seq('folha-abre', 'folha', 2.3, 0.7, [ch('rotation.y', 0, FOLHA_ABERTA)], { ease: 'easeInOut' }),
    seq('neve-entra', 'neve', 2.5, 0.7, s3(0.01, 1), { ease: 'easeOut' }),

    seq('raposa-rise', 'raposa', 3.5, 0.8, [riseFrom(FY, 2.0)], {
      ease: 'easeOut',
      caption: 'Quem abre é uma RAPOSA de avental xadrez.',
    }),
    seq('cabeca-sobe', 'cabeca', 3.75, 0.6, [ch('position.y', 0.95, 1.27)], { ease: 'easeOut' }),
    seq('avental-desce', 'avental', 4.1, 0.6, [ch('scale.y', 0.01, 1)], { ease: 'easeOut' }),

    seq('rabo-cresce', 'rabo', 5.2, 0.6, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Ela enrola o rabo no SEU gorro e te puxa pra dentro: CÓM-MÍN! Vem com mim!',
    }),
    seq('gorro-cresce', 'gorro', 5.45, 0.5, s3(0.01, 1.1), { ease: 'easeOut' }),
    seq('rabo-puxa', 'rabo', 6.0, 0.8, [ch('rotation.y', -0.95, 0)], { ease: 'easeInOut' }),

    seq('poltrona-rise', 'poltrona', 7.3, 0.8, [riseFrom(FY, 1.6), ch('rotation.y', CHAIR_ROT - 0.9, CHAIR_ROT)], {
      ease: 'easeOut',
      caption: 'Lá dentro só existe uma poltrona, gorda e vermelha…',
    }),
    seq('lamparina-acende', 'lamparina', 7.6, 0.5, s3(0.01, 1), { ease: 'easeOut' }),
    seq('lamparina-balanca', 'lamparina', 8.1, 0.9, [ch('rotation.z', 0.35, 0)], { ease: 'easeOut' }),

    seq('placa-gira', 'placa7', 8.9, 0.7, [...s3(0.01, 1), ch('rotation.z', -Math.PI * 2, 0)], {
      ease: 'easeOut',
      caption: '…com um SETE dourado no encosto.',
    }),

    seq('pata-aponta', 'pata', 10.0, 0.6, [ch('rotation.z', PATA_REPOUSO, PATA_APONTA)], {
      ease: 'easeOut',
      caption: 'A raposa aponta: Ó, SÉT! — e te afunda nela com uma patada: DÊI!',
    }),
    seq('poltrona-afunda', 'poltrona', 10.8, 0.25, [ch('scale.y', 1, 0.9)], { ease: 'easeIn' }),
    seq('poltrona-volta', 'poltrona', 11.05, 0.4, [ch('scale.y', 0.9, 1)], { ease: 'easeOut' }),
    seq('cabeca-orgulho', 'cabeca', 11.5, 0.5, [ch('rotation.z', 0.05, -0.1)], {
      ease: 'easeOut',
      caption: 'Kom in och sätt dig! — Entra e senta aí!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-1.0, 2.1, 4.15], target: [0.15, 1.08, 0.0] },
  }
}

export const card: Card = {
  meta: {
    id: 'kom-in-och-satt-dig',
    contexto:
      "Recebendo visita: na porta de casa, ou o colega/médico chamando você pra sala dele. Muitas vezes vem em dois pedaços: 'Kom in!' na porta, 'Sätt dig!' apontando a cadeira.",
    fraseFonte: 'Entra e senta aí!',
    fraseAlvo: 'Kom in och sätt dig!',
    pronuncia:
      "kom ÍN ó SÉT dêi! ('kom' com O curto e aberto e M de lábios fechados; força no IN e no SÄTT; 'och' = ó; 'dig' = dêi, rimando com 'mig' = mêi)",
    ponteSonora:
      "CÓM-MÍN! Ó, SÉT-DÊI! (5 sílabas: co-MÍN-ó-SÉT-dêi; tônicas em MÍN e SÉT; o gancho é VEM COM MIM — que é exatamente o que 'kom in' quer dizer —, dito de uma vez, com UM M só: co-MÍN; dois ajustes: o CÓ é Ó ABERTO de 'cópia' (o mesmo de CÓ-MA e CÓ-MER), não o 'cõ' nasal de 'com'; e o 'mim' do português termina só no nariz, sem consoante — aqui ele tem que fechar num N DE VERDADE, ponta da língua no céu da boca, como o começo de MINA (MÍ-na) cortado antes do -A; esse N emenda no 'och': co-MI-NÓ; Ó = o 'och' de sempre, de 'fem och åtta'; SÉT = SETE sem o -E, É aberto e T seco, nunca 'sétchi'; DÊI = 'dig', irmão do M'ÊI de 'mig', uma sílaba só e fraquinha)",
    historia:
      'Está nevando e você bate na portinha redonda de uma toca no barranco. Quem abre é uma raposa de avental xadrez, que enrola o rabo no seu gorro e te arrasta pra dentro: CÓM-MÍN! Vem com mim, vem! Lá dentro só existe uma poltrona, gorda e vermelha, com um SETE dourado no encosto. A raposa aponta, Ó, SÉT!, e te afunda nela com uma patada no ombro, toda orgulhosa: DÊI! Entrou, sentou: aqui a casa é sua.',
  },
  createScene,
  refine: { organic: ['raposa', 'cabeca', 'pata', 'rabo'] },
}

export default card
