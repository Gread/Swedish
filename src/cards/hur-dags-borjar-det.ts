import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus, puff,
} from '../rig/helpers'

/**
 * "Hur dags börjar det?" — RRÜR! DÁKS! BÓR—iar... DÊ?
 *
 * O baiacu noivo chegou à capela duas horas antes do casamento. Nervoso, ele
 * incha num ronco de bico (RRÜR) e vira uma bola de espinhos no degrau do
 * altar, com a gravata-borboleta esticada. Bancos vazios; na parede, o relógio
 * gigante pula mais um minuto (DÁKS!). Ele tenta gritar BORA!, mas o ar escapa
 * pelo bico: BÓR—iar... DÊ?
 *
 * Diorama: piso de tábuas claras, tapete vermelho no corredor, dois pares de
 * bancos vazios, altar branco de dois degraus, arco de flores, parede creme
 * com duas janelas e o relógio de aro de latão no alto.
 */

const PISO = '#d8b787'
const PISO_LINHA = '#bf9a68'
const TAPETE = '#a23a46'
const TAPETE_BORDA = '#7c2a35'
const MADEIRA = '#8a5a36'
const MADEIRA_ESC = '#6a4329'
const ALTAR = '#f2ede3'
const ALTAR_SOMBRA = '#ddd5c6'
const PAREDE = '#efe4d0'
const LAMBRI = '#c49a6a'
const VIDRO = '#c9dfea'
const LATAO = '#c9a24e'
const BRANCO = '#fbf8f1'
const ROSA = '#f1a2b8'
const FOLHA = '#6f9a5a'
const PRETO = '#1f1d22'
const PELE = '#ead595'      // bege-amarelado do baiacu
const BARRIGA = '#f6edcf'
const PINTA = '#9a6a3a'
const ESPINHO = '#d8bf82'
const NADADEIRA = '#f2c03c'
const BICO = '#e48a6c'
const BOCHECHA = '#f0465a' // acento saturado: o vermelho de segurar o ar (RRÜR)
const CINZA = '#8f9299'

const GY = 0.18 // topo do piso
const ALT_Y = GY + 0.2 // topo do degrau de cima do altar
const FISH_Z = -0.62
const FISH_ROT = -0.18 // vira de leve: o bico solta o ar para o lado, fora da cara
const R = 0.76 // raio do corpo do baiacu
const BODY_Y = R * 0.97 // centro do corpo, local ao grupo do baiacu (que pousa no degrau)
const ARCH_Z = -1.28
const POST_H = 1.0
const ARCH_R = 1.12
const CLOCK_Y = 2.98
const CLOCK_Z = -1.62
const CLOCK_R = 0.5

// ponteiro dos minutos: 10h06 → 10h07 (o pulo DÁKS)
const MIN6 = -(6 / 60) * Math.PI * 2
const MIN7 = -(7 / 60) * Math.PI * 2

/** Arco parcial de toro (meia-lua do arco de flores, ondas do estalo). */
function arc(r: number, tube: number, span: number, color: string, opts = {}) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 14, 48, span), mat(color, { size: r * 2, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Ponto na superfície do corpo do baiacu (centro local em (0, BODY_Y, 0)). */
function onBody(x: number, y: number, z: number, out = 0) {
  const v = new THREE.Vector3(x, y, z).normalize()
  return v.multiplyScalar(R + out).add(new THREE.Vector3(0, BODY_Y, 0))
}

/** Orienta um objeto para que seu +Y aponte na direção dada. */
function alignY(o: THREE.Object3D, dir: THREE.Vector3) {
  o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize())
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: piso de tábuas claras + tapete vermelho -----------------------
  const base = new THREE.Group()

  const solo = cylinder(2.62, 2.7, 0.12, '#7d5a3a', { roughness: 0.9 })
  solo.position.y = 0.06
  base.add(solo)

  const piso = cylinder(2.55, 2.6, 0.06, PISO, { roughness: 0.7 })
  piso.position.y = GY - 0.03
  base.add(piso)

  for (const x of [-2.0, -1.4, -0.8, 0.8, 1.4, 2.0]) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - x * x, 0.01))
    const linha = rbox(0.02, 0.012, len, 0.005, PISO_LINHA, { roughness: 0.8 })
    linha.position.set(x, GY + 0.002, 0)
    base.add(linha)
  }

  const tapete = rbox(0.82, 0.025, 3.0, 0.01, TAPETE, { roughness: 0.95 })
  tapete.position.set(0, GY + 0.012, 0.95)
  base.add(tapete)
  for (const side of [-1, 1]) {
    const borda = rbox(0.05, 0.03, 3.0, 0.01, TAPETE_BORDA, { roughness: 0.95 })
    borda.position.set(side * 0.37, GY + 0.015, 0.95)
    base.add(borda)
  }

  root.add(base)

  // ---- parede do fundo com janelas -----------------------------------------
  const parede = new THREE.Group()
  parede.position.set(0, 0, -1.78)

  const muro = rbox(3.5, 3.6, 0.16, 0.04, PAREDE, { roughness: 0.85 })
  muro.position.y = GY + 3.6 / 2
  parede.add(muro)

  const lambri = rbox(3.5, 0.72, 0.05, 0.02, LAMBRI, { roughness: 0.75 })
  lambri.position.set(0, GY + 0.36, 0.1)
  parede.add(lambri)
  const friso = rbox(3.52, 0.06, 0.07, 0.02, MADEIRA_ESC, { roughness: 0.7 })
  friso.position.set(0, GY + 0.74, 0.11)
  parede.add(friso)

  for (const side of [-1, 1]) {
    const janela = new THREE.Group()
    janela.position.set(side * 1.22, GY + 1.85, 0.09)
    const moldura = rbox(0.5, 1.12, 0.05, 0.03, MADEIRA, { roughness: 0.7 })
    janela.add(moldura)
    const vidro = rbox(0.4, 1.0, 0.03, 0.02, VIDRO, { roughness: 0.15 })
    vidro.position.z = 0.02
    janela.add(vidro)
    const topo = cylinder(0.25, 0.25, 0.05, MADEIRA, { roughness: 0.7 })
    topo.rotation.x = Math.PI / 2
    topo.position.y = 0.56
    janela.add(topo)
    const topoVidro = cylinder(0.2, 0.2, 0.03, VIDRO, { roughness: 0.15 })
    topoVidro.rotation.x = Math.PI / 2
    topoVidro.position.set(0, 0.56, 0.02)
    janela.add(topoVidro)
    const montanteV = rbox(0.03, 1.2, 0.04, 0.01, MADEIRA, { roughness: 0.7 })
    montanteV.position.set(0, 0.1, 0.04)
    janela.add(montanteV)
    const montanteH = rbox(0.4, 0.03, 0.04, 0.01, MADEIRA, { roughness: 0.7 })
    montanteH.position.set(0, 0.1, 0.04)
    janela.add(montanteH)
    const peitoril = rbox(0.58, 0.05, 0.12, 0.02, MADEIRA_ESC, { roughness: 0.7 })
    peitoril.position.set(0, -0.58, 0.05)
    janela.add(peitoril)
    parede.add(janela)
  }

  root.add(parede)

  // ---- altar: dois degraus brancos -----------------------------------------
  const altar = new THREE.Group()
  const degrauBaixo = rbox(2.9, 0.1, 1.45, 0.03, ALTAR_SOMBRA, { roughness: 0.6 })
  degrauBaixo.position.set(0, GY + 0.05, -0.92)
  altar.add(degrauBaixo)
  const degrauAlto = rbox(2.55, 0.2, 1.2, 0.04, ALTAR, { roughness: 0.55 })
  degrauAlto.position.set(0, GY + 0.1, -0.95)
  altar.add(degrauAlto)
  // continuação do tapete subindo o degrau
  const passadeira = rbox(0.82, 0.02, 0.5, 0.008, TAPETE, { roughness: 0.95 })
  passadeira.position.set(0, ALT_Y + 0.01, -0.55)
  altar.add(passadeira)
  root.add(altar)

  // ---- bancos vazios --------------------------------------------------------
  const bancos = new THREE.Group()
  for (const side of [-1, 1]) {
    for (const z of [0.2, 1.1]) {
      const banco = new THREE.Group()
      banco.position.set(side * 1.45, GY, z)
      const assento = rbox(1.0, 0.07, 0.36, 0.025, MADEIRA, { roughness: 0.6 })
      assento.position.y = 0.42
      banco.add(assento)
      const encosto = rbox(1.0, 0.42, 0.06, 0.025, MADEIRA, { roughness: 0.6 })
      encosto.position.set(0, 0.68, 0.17)
      encosto.rotation.x = 0.08
      banco.add(encosto)
      const corrimao = rbox(1.04, 0.05, 0.1, 0.02, MADEIRA_ESC, { roughness: 0.6 })
      corrimao.position.set(0, 0.9, 0.19)
      banco.add(corrimao)
      for (const ex of [-0.5, 0.5]) {
        const lateral = rbox(0.06, 0.86, 0.42, 0.03, MADEIRA_ESC, { roughness: 0.65 })
        lateral.position.set(ex, 0.43, 0.03)
        banco.add(lateral)
      }
      bancos.add(banco)
    }
  }
  root.add(bancos)

  // ---- arco de flores ------------------------------------------------------
  const arco = new THREE.Group()
  arco.position.set(0, ALT_Y, ARCH_Z)
  for (const side of [-1, 1]) {
    const poste = cylinder(0.05, 0.06, POST_H, BRANCO, { roughness: 0.5 })
    poste.position.set(side * ARCH_R, POST_H / 2, 0)
    arco.add(poste)
    const pe = cylinder(0.12, 0.14, 0.08, ALTAR_SOMBRA, { roughness: 0.5 })
    pe.position.set(side * ARCH_R, 0.04, 0)
    arco.add(pe)
  }
  const meiaLua = arc(ARCH_R, 0.05, Math.PI, BRANCO, { roughness: 0.5 })
  meiaLua.position.y = POST_H
  arco.add(meiaLua)
  // flores: brancas e rosas alternadas ao longo do arco e no alto dos postes
  const nFlores = 15
  for (let i = 0; i < nFlores; i++) {
    const a = (i / (nFlores - 1)) * Math.PI
    const fr = 0.1 + (i % 3 === 1 ? 0.025 : 0)
    const flor = sphere(fr, i % 2 === 0 ? BRANCO : ROSA, { roughness: 0.75 })
    flor.position.set(Math.cos(a) * ARCH_R, POST_H + Math.sin(a) * ARCH_R, 0.05)
    flor.scale.z = 0.7
    arco.add(flor)
    const miolo = sphere(0.035, i % 2 === 0 ? '#f3d36b' : '#fbe3ea', { roughness: 0.7 })
    miolo.position.set(Math.cos(a) * ARCH_R, POST_H + Math.sin(a) * ARCH_R, 0.05 + fr * 0.65)
    arco.add(miolo)
    if (i % 2 === 1) {
      const folha = sphere(0.06, FOLHA, { roughness: 0.8 })
      const b = a + 0.1
      folha.position.set(Math.cos(b) * (ARCH_R + 0.1), POST_H + Math.sin(b) * (ARCH_R + 0.1), -0.02)
      folha.scale.set(1.4, 0.6, 0.6)
      folha.rotation.z = b + Math.PI / 2
      arco.add(folha)
    }
  }
  for (const side of [-1, 1]) {
    for (const [fy, cor] of [[0.25, ROSA], [0.55, BRANCO], [0.82, ROSA]] as const) {
      const flor = sphere(0.085, cor, { roughness: 0.75 })
      flor.position.set(side * ARCH_R, fy, 0.06)
      flor.scale.z = 0.7
      arco.add(flor)
    }
    const buque = puff(0.12, FOLHA, 5, side > 0 ? 11 : 12, { roughness: 0.85 })
    buque.position.set(side * ARCH_R, 0.12, 0.04)
    buque.scale.y = 0.8
    arco.add(buque)
  }
  root.add(arco)

  // ---- relógio gigante da parede -------------------------------------------
  const relogio = new THREE.Group()
  relogio.position.set(0, CLOCK_Y, CLOCK_Z)

  const fundo = cylinder(CLOCK_R + 0.07, CLOCK_R + 0.07, 0.05, MADEIRA_ESC, { roughness: 0.6 })
  fundo.rotation.x = Math.PI / 2
  fundo.position.z = -0.02
  relogio.add(fundo)
  const mostrador = cylinder(CLOCK_R, CLOCK_R, 0.05, BRANCO, { roughness: 0.4 })
  mostrador.rotation.x = Math.PI / 2
  relogio.add(mostrador)
  const aro = torus(CLOCK_R + 0.02, 0.055, LATAO, { roughness: 0.3, metalness: 0.75 })
  aro.position.z = 0.03
  relogio.add(aro)
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2
    const grosso = h % 3 === 0
    const marca = rbox(grosso ? 0.05 : 0.028, grosso ? 0.12 : 0.07, 0.02, 0.008, PRETO, { roughness: 0.4 })
    const rr = CLOCK_R - (grosso ? 0.1 : 0.08)
    marca.position.set(Math.sin(a) * rr, Math.cos(a) * rr, 0.03)
    marca.rotation.z = -a
    relogio.add(marca)
  }
  // ponteiro das horas: um pouco depois das 10
  const horas = new THREE.Group()
  horas.rotation.z = -((10 + 6 / 60) / 12) * Math.PI * 2
  horas.position.z = 0.045
  const hastaH = rbox(0.055, 0.26, 0.02, 0.012, PRETO, { roughness: 0.35 })
  hastaH.position.y = 0.11
  horas.add(hastaH)
  relogio.add(horas)
  const pino = cylinder(0.045, 0.045, 0.04, LATAO, { roughness: 0.3, metalness: 0.75 })
  pino.rotation.x = Math.PI / 2
  pino.position.z = 0.08
  relogio.add(pino)
  const sino = sphere(0.07, LATAO, { roughness: 0.3, metalness: 0.75 })
  sino.position.set(0, CLOCK_R + 0.12, 0)
  relogio.add(sino)
  root.add(relogio)

  // ponteiro dos minutos (peça própria: é ele que pula — DÁKS!)
  const ponteiro = new THREE.Group()
  ponteiro.position.set(0, 0, 0.062)
  ponteiro.rotation.z = MIN7
  const hastaM = rbox(0.04, 0.4, 0.02, 0.01, PRETO, { roughness: 0.35 })
  hastaM.position.y = 0.17
  ponteiro.add(hastaM)
  const ponta = cone(0.04, 0.08, PRETO, { roughness: 0.35 })
  ponta.position.y = 0.4
  ponteiro.add(ponta)
  relogio.add(ponteiro)

  // três ondas de estalo saindo do lado do ponteiro
  const estalos = new THREE.Group()
  estalos.position.set(0, CLOCK_Y, CLOCK_Z + 0.05)
  const dirMin = Math.PI / 2 + MIN7 // ângulo matemático (a partir de +x) do ponteiro
  for (const [i, rr] of [0.72, 0.86, 1.0].entries()) {
    const span = 0.75 - i * 0.12
    const onda = arc(rr, 0.03, span, CINZA, { roughness: 0.5 })
    onda.rotation.z = dirMin - span / 2
    estalos.add(onda)
  }
  root.add(estalos)

  // ---- BAIACU NOIVO ----------------------------------------------------------
  const baiacu = new THREE.Group()
  baiacu.position.set(0, ALT_Y, FISH_Z)
  baiacu.rotation.y = FISH_ROT
  root.add(baiacu)

  const corpo = sphere(R, PELE, { roughness: 0.6 }, 48)
  corpo.position.y = BODY_Y
  baiacu.add(corpo)

  const barriga = sphere(R * 0.78, BARRIGA, { roughness: 0.6 })
  barriga.position.set(0, BODY_Y - R * 0.3, R * 0.25)
  baiacu.add(barriga)

  // pintas marrons no dorso e nos lados
  const pintas: [number, number, number][] = [
    [0.0, 1, 0.2], [0.45, 0.85, 0.15], [-0.45, 0.85, 0.15], [0.3, 0.95, -0.4], [-0.3, 0.95, -0.4],
    [0.85, 0.45, 0.1], [-0.85, 0.45, 0.1], [0.9, 0.15, 0.45], [-0.9, 0.15, 0.45],
    [0.65, 0.7, 0.45], [-0.65, 0.7, 0.45], [0.95, 0.3, -0.25], [-0.95, 0.3, -0.25],
  ]
  for (const [x, y, z] of pintas) {
    const p = sphere(0.07, PINTA, { roughness: 0.6 })
    p.position.copy(onBody(x, y, z, -0.04))
    alignY(p, new THREE.Vector3(x, y, z))
    p.scale.set(1, 0.5, 1)
    baiacu.add(p)
  }

  // olhos esbugalhados
  for (const side of [-1, 1]) {
    const dir = new THREE.Vector3(side * 0.36, 0.42, 0.83)
    const esclera = sphere(0.16, '#ffffff', { roughness: 0.25 })
    esclera.position.copy(onBody(dir.x, dir.y, dir.z, -0.05))
    baiacu.add(esclera)
    const pupila = sphere(0.065, PRETO, { roughness: 0.2 })
    pupila.position.copy(onBody(dir.x * 0.9, dir.y, dir.z, 0.075))
    baiacu.add(pupila)
    const brilho = sphere(0.022, '#ffffff', { roughness: 0.1 })
    brilho.position.copy(onBody(dir.x * 0.9 + 0.03, dir.y + 0.05, dir.z, 0.13))
    baiacu.add(brilho)
    // sobrancelha aflita, inclinada pra cima no meio
    const sobr = capsule(0.022, 0.13, PINTA, { roughness: 0.6 })
    sobr.position.copy(onBody(dir.x, dir.y + 0.28, dir.z - 0.05, 0.0))
    sobr.rotation.set(-0.5, 0, Math.PI / 2 + side * 0.4)
    baiacu.add(sobr)

    // bochechas vermelhas (o acento)
    const bochecha = sphere(0.13, BOCHECHA, { roughness: 0.5 })
    bochecha.position.copy(onBody(side * 0.6, 0.02, 0.8, -0.06))
    bochecha.scale.set(1, 0.75, 0.6)
    baiacu.add(bochecha)
  }

  // boquinha em bico
  const bicoDir = new THREE.Vector3(0, 0.02, 1)
  const bico = cylinder(0.1, 0.12, 0.16, BICO, { roughness: 0.45 })
  bico.position.copy(onBody(bicoDir.x, bicoDir.y, bicoDir.z, 0.02))
  bico.rotation.x = Math.PI / 2
  baiacu.add(bico)
  const labio = torus(0.085, 0.045, BICO, { roughness: 0.45 })
  labio.position.copy(onBody(bicoDir.x, bicoDir.y, bicoDir.z, 0.1))
  baiacu.add(labio)
  const furo = sphere(0.05, '#5a2a2a', { roughness: 0.6 })
  furo.position.copy(onBody(bicoDir.x, bicoDir.y, bicoDir.z, 0.1))
  furo.scale.z = 0.5
  baiacu.add(furo)

  // ---- espinhos (peça própria: saltam pra fora quando ele incha) -----------
  const espinhos = new THREE.Group()
  espinhos.position.y = BODY_Y
  baiacu.add(espinhos)
  const N = 110
  const golden = Math.PI * (3 - Math.sqrt(5))
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2
    const rr = Math.sqrt(1 - y * y)
    const th = i * golden
    const n = new THREE.Vector3(Math.cos(th) * rr, y, Math.sin(th) * rr)
    if (n.y < -0.62) continue // a parte que encosta no degrau
    // deixa a cara livre: olhos, bico, bochechas, gravata
    if (n.z > 0.55 && n.y > -0.75 && Math.abs(n.x) < 0.78) continue
    const esp = cone(0.04, 0.2, ESPINHO, { roughness: 0.55 })
    esp.position.copy(n.clone().multiplyScalar(R + 0.07))
    alignY(esp, n)
    espinhos.add(esp)
  }

  // ---- gravata-borboleta esticada -------------------------------------------
  const gravata = new THREE.Group()
  gravata.position.y = BODY_Y
  baiacu.add(gravata)
  const lat = -0.42 // seno da latitude da gravata
  const faixa = torus(R * Math.sqrt(1 - lat * lat) + 0.012, 0.022, PRETO, { roughness: 0.35 })
  faixa.rotation.x = Math.PI / 2
  faixa.position.y = R * lat
  gravata.add(faixa)
  const laco = new THREE.Group()
  const nLaco = new THREE.Vector3(0, lat, Math.sqrt(1 - lat * lat))
  laco.position.copy(nLaco.clone().multiplyScalar(R + 0.07))
  laco.rotation.x = Math.asin(-lat)
  gravata.add(laco)
  const no = rbox(0.12, 0.11, 0.08, 0.035, PRETO, { roughness: 0.3 })
  laco.add(no)
  for (const side of [-1, 1]) {
    const asa = cone(0.14, 0.32, PRETO, { roughness: 0.3 })
    asa.rotation.z = side * Math.PI / 2
    asa.position.x = side * 0.14
    asa.scale.set(1, 1, 0.45)
    const dobra = rbox(0.04, 0.2, 0.05, 0.02, '#3a363e', { roughness: 0.3 })
    dobra.position.set(side * 0.27, 0, 0.02)
    laco.add(dobra)
    laco.add(asa)
  }

  // ---- nadadeirinhas laterais amarelas --------------------------------------
  function nadadeira(side: number) {
    const g = new THREE.Group()
    g.position.copy(onBody(side, 0.05, 0.2, -0.04))
    g.rotation.z = side * 0.35
    for (let k = 0; k < 3; k++) {
      const raio = capsule(0.03, 0.2, NADADEIRA, { roughness: 0.5 })
      raio.position.set(side * 0.12, (k - 1) * 0.07, 0)
      raio.rotation.z = side * (Math.PI / 2 - (k - 1) * 0.35)
      g.add(raio)
    }
    const membrana = sphere(0.14, NADADEIRA, { roughness: 0.5 })
    membrana.scale.set(1.0, 0.85, 0.22)
    membrana.position.x = side * 0.12
    g.add(membrana)
    baiacu.add(g)
    return g
  }
  const nadE = nadadeira(-1)
  const nadD = nadadeira(1)

  // ---- fiozinho de ar saindo do bico ---------------------------------------
  const ar = new THREE.Group()
  const bocaPos = onBody(0, 0.02, 1, 0.12)
  ar.position.copy(bocaPos)
  baiacu.add(ar)
  // três tracinhos em leque saindo para a esquerda do bico (lado para onde ele vira)
  for (const [k, ang] of [Math.PI - 0.32, Math.PI + 0.02, Math.PI + 0.36].entries()) {
    const traco = capsule(0.03, 0.16 + (k === 1 ? 0.06 : 0), '#ffffff', { roughness: 0.3 })
    const d = 0.36 + (k === 1 ? 0.05 : 0)
    traco.position.set(Math.cos(ang) * d, Math.sin(ang) * d, 0.08)
    traco.rotation.z = ang - Math.PI / 2
    ar.add(traco)
  }
  const nuvem = puff(0.06, '#ffffff', 4, 7, { roughness: 0.4 })
  nuvem.position.set(-0.13, 0.0, 0.06)
  const nuvemFim = puff(0.07, '#ffffff', 4, 9, { roughness: 0.4 })
  nuvemFim.position.set(-0.68, 0.06, 0.06)
  ar.add(nuvemFim)
  ar.add(nuvem)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'capela', object: base },
    { name: 'parede', group: 'capela', object: parede },
    { name: 'altar', group: 'capela', object: altar },
    { name: 'bancos', group: 'bancos', object: bancos },
    { name: 'arco', group: 'bancos', object: arco },
    { name: 'baiacu', group: 'noivo', object: baiacu },
    { name: 'gravata', group: 'noivo', object: gravata },
    { name: 'nadadeiraE', group: 'noivo', object: nadE },
    { name: 'nadadeiraD', group: 'noivo', object: nadD },
    { name: 'espinhos', group: 'incha', object: espinhos },
    { name: 'relogio', group: 'relogio', object: relogio },
    { name: 'ponteiro', group: 'relogio', object: ponteiro },
    { name: 'estalos', group: 'dags', object: estalos },
    { name: 'ar', group: 'bora', object: ar },
  ]

  const s3 = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Dia de casamento: brota uma capelinha, com tapete vermelho no corredor…',
    }),
    seq('parede-cresce', 'parede', 0.3, 0.9, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),
    seq('altar-rise', 'altar', 0.6, 0.7, [riseFrom(0, 0.6)], { ease: 'easeOut' }),

    seq('bancos-rise', 'bancos', 1.5, 0.8, [riseFrom(0, 1.1)], {
      ease: 'easeOut',
      caption: '…bancos VAZIOS e um arco de flores no altar. Nada de noiva, nada de padre.',
    }),
    seq('arco-abre', 'arco', 1.8, 0.8, s3(0.01, 1), { ease: 'easeOut' }),

    seq('baiacu-chega', 'baiacu', 3.2, 0.6, [...s3(0.01, 0.5), ch('position.y', ALT_Y + 0.9, ALT_Y)], {
      ease: 'easeOut',
      caption: 'O noivo, um baiacu, chegou DUAS HORAS antes. E baiacu nervoso… incha!',
    }),
    seq('gravata-poe', 'gravata', 3.35, 0.4, s3(0.01, 1), { ease: 'easeOut' }),
    seq('nadE-poe', 'nadadeiraE', 3.4, 0.4, [ch('rotation.z', 1.2, -0.35)], { ease: 'easeOut' }),
    seq('nadD-poe', 'nadadeiraD', 3.4, 0.4, [ch('rotation.z', -1.2, 0.35)], { ease: 'easeOut' }),

    seq('baiacu-incha', 'baiacu', 4.6, 0.9, s3(0.5, 1), {
      ease: 'easeOut',
      caption: 'Num ronco comprido de bico — RRÜÜR! — ele vira uma bola de espinhos.',
    }),
    seq('espinhos-saltam', 'espinhos', 4.9, 0.5, s3(0.55, 1), { ease: 'easeOut' }),
    seq('gravata-estica', 'gravata', 5.3, 0.25, [ch('scale.x', 1, 1.1)], { ease: 'easeOut' }),
    seq('gravata-segura', 'gravata', 5.55, 0.35, [ch('scale.x', 1.1, 1)], { ease: 'easeInOut' }),

    seq('relogio-aparece', 'relogio', 6.6, 0.6, [...s3(0.01, 1), ch('rotation.z', 0.4, 0)], {
      ease: 'easeOut',
      caption: 'Na parede, o relógio gigante da capela…',
    }),
    seq('ponteiro-aparece', 'ponteiro', 6.7, 0.5, [ch('rotation.z', MIN6 + 0.8, MIN6)], { ease: 'easeOut' }),
    seq('ponteiro-pula', 'ponteiro', 7.9, 0.1, [ch('rotation.z', MIN6, MIN7 - 0.06)], {
      ease: 'easeIn',
      caption: '…pula mais um minuto: DÁKS!',
    }),
    seq('ponteiro-assenta', 'ponteiro', 8.0, 0.25, [ch('rotation.z', MIN7 - 0.06, MIN7)], { ease: 'easeOut' }),
    seq('estalos-saem', 'estalos', 7.95, 0.35, s3(0.6, 1), { ease: 'easeOut' }),
    seq('relogio-treme', 'relogio', 7.95, 0.12, [ch('rotation.z', 0, 0.05)], { ease: 'easeOut' }),
    seq('relogio-volta', 'relogio', 8.07, 0.3, [ch('rotation.z', 0.05, 0)], { ease: 'easeInOut' }),

    seq('ar-escapa', 'ar', 9.2, 0.5, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'Vermelho de segurar o ar, ele tenta gritar BORA!… mas o ar escapa pelo bico: BÓR—iar… DÊ?',
    }),
    seq('nadE-abana', 'nadadeiraE', 9.3, 0.35, [ch('rotation.z', -0.35, 0.5)], { ease: 'easeOut' }),
    seq('nadD-abana', 'nadadeiraD', 9.3, 0.35, [ch('rotation.z', 0.35, -0.5)], { ease: 'easeOut' }),
    seq('nadE-volta', 'nadadeiraE', 9.65, 0.4, [ch('rotation.z', 0.5, -0.35)], { ease: 'easeInOut' }),
    seq('nadD-volta', 'nadadeiraD', 9.65, 0.4, [ch('rotation.z', -0.5, 0.35)], { ease: 'easeInOut' }),

    seq('baiacu-espera', 'baiacu', 11.2, 0.5, [ch('rotation.y', FISH_ROT + 0.2, FISH_ROT)], {
      ease: 'easeInOut',
      caption: 'Hur dags börjar det? — A que horas começa?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.25, 2.5, 5.55], target: [0.0, 1.78, -0.7] },
  }
}

export const card: Card = {
  meta: {
    id: 'hur-dags-borjar-det',
    contexto:
      "Horários: pra saber a que horas começa qualquer coisa — o filme, o jogo, a festa, a reunião, a aula da SFI, o culto, o casamento. 'Hur dags' é o 'a que horas' do dia a dia, mais falado que 'vilken tid'; 'När börjar det?' (quando começa?) também serve.",
    fraseFonte: 'A que horas começa?',
    fraseAlvo: 'Hur dags börjar det?',
    pronuncia:
      "rrü DÁKS BÖR-iar dê? ('hur' com h soprado tipo RR carioca e Ü de bico — na fala o -r quase some antes do D: 'hu dags'; 'dags' = DÁKS, uma sílaba só, A CURTO e o G virando K colado no S; 'börjar' com a força no BÖR: Ö ABERTO e curto — boca redonda de Ó com a língua pra frente —, R de um toque só, e o 'j' = I deslizado: BÖR-iar; o R final é brando e se funde no D de 'det', que sai de língua enrolada, como o R caipira encostando no D; 'det' = dê; forças no DAGS e no BÖR)",
    ponteSonora:
      "RRÜR! DÁKS! BÓR—iar... DÊ? (5 sílabas: rrü-DÁKS-BÖR-iar-dê; força no DÁKS e no BÖR; RRÜR = o 'hur' de sempre, o MESMO de 'Hur kommer jag till Storgatan?', 'Hur långt är det?' e 'Hur stavar man det?' — aqui é o ronco comprido de bico do baiacu se enchendo de ar: RR soprado de carioca (é o h), lábios em BICO de U com a língua no I (o Ü, nunca o U chapado de 'urso') e o R final brando, que quase some antes do D: rrü-DÁKS; DÁKS = o MESMO DÁKS de 'Dags att sova!' (lá, o livro de historinha fechando de uma vez; aqui, o ponteiro do relógio gigante da capela pulando mais um minuto): D de 'dado', A CURTO e aberto, K e S colados no fim, sem vogal no meio — nunca 'DÁ-kis'; é parente do DÁG de 'idag', mas sem o S sobra 'dag' (dia) e some o 'a que horas'; BÓR = o BORA! brasileiro (vamos começar!) cortado no R: Ó aberto e com força — mantenha a boca redonda de Ó e empurre a língua pra frente, como pra dizer É: é o ö sueco aberto, o mesmo ÖR do (u)M'ÓRC de 'Det är så mörkt på vintern' — e R de UM toque só, o de 'caro'; -iar = o ar escapando pelo bico do baiacu no lugar do -A do BORA: um I curtinho e deslizado, colado no R (como o -ria de 'GLÓ-ria'), e depois o próprio AR, com R brando no fim — BÓR-iar, DUAS sílabas, a força sempre no BÓR, nunca 'bo-ri-AR'; o R do meio é de um toque só (na fala solta muito sueco quase o engole: 'böjjar'), mas fale; o do FIM é obrigatório: sem ele sobra 'börja', o infinitivo; esse R final derrete no D seguinte, como o R caipira encostando no D: BÖR-ia(r)-DÊ; DÊ = o 'det' de sempre, Ê fechado, sem T)",
    historia:
      "Dia do casamento do peixe-baiacu — e ele, de tão nervoso, chegou à capela duas horas antes. Baiacu nervoso incha: num ronco comprido de bico, RRÜÜR!, ele vira uma bola de espinhos no degrau do altar, com a gravata-borboleta esticada a ponto de estourar. Os bancos estão vazios, nada de noiva, nada de padre, e o relógio gigante da parede pula mais um minuto: DÁKS! Vermelho de segurar o ar, ele tenta gritar 'BORA!', mas o ar escapa pelo bico num guincho: BÓR—iar... DÊ? A que horas começa esse casamento?",
  },
  createScene,
  refine: { organic: ['baiacu'] },
}

export default card
