import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Jag slutar klockan fem." — IÁ! SLU(rp)-TAR(de)! CLÓ-CAN... FÉM(ur)!
 *
 * Escritório em Londres, cinco da tarde: o buldogue inglês de chapéu-coco
 * joga a caneta longe (IÁ!), dá um SLURP de língua inteira no chá da TARDE,
 * o Big Ben badala lá fora (CLÓ-CAN) e ele molha no chá um FÊMUR.
 *
 * Diorama: assoalho escuro, parede verde com janela de céu laranja e o Big Ben
 * marcando cinco horas; escrivaninha de mogno de frente para a câmera, com o
 * buldogue sentado atrás numa cadeira de couro. A xícara é o ponto de fuga:
 * a língua entra pela esquerda e o fêmur pela direita.
 */

const PISO = '#5e4130'
const PISO_LINHA = '#47301f'
const PAREDE = '#35564f'
const RODAPE = '#2a443e'
const CREME = '#ebe3cf'        // caixilho da janela
const MOGNO = '#5a2e22'
const MOGNO_ESC = '#46231a'
const COURO_MESA = '#2f5443'
const LATAO = '#c9a250'
const COURO = '#6b4430'
const PAPEL = '#efe8d8'
const TAPETE = '#2e3d5c'
const TAPETE_BORDA = '#8a7a52'
const PEDRA = '#d6bd86'
const PEDRA_ESC = '#ad9562'
const ARDOSIA = '#3e4954'
const BRANCO = '#f2ede3'       // pelo do buldogue
const CARAMELO = '#c98a4b'
const CARAMELO_ESC = '#a8693a'
const FOCINHO = '#e6dccb'
const PRETO = '#1f1d20'
const PORCELANA = '#f8f6f0'
const AZUL = '#2f5fae'
const OSSO = '#eee0bc'
const LINGUA = '#f0577c'       // acento saturado RESERVADO: a língua do SLURP

const GY = 0.16                // topo do assoalho
const WALL_Z = -1.3
const WIN = { x0: -0.75, x1: 1.55, y0: 1.05, y1: 2.85 }
const BEN_X = 0.98
const CLK = 1.98               // centro do mostrador do Big Ben
const DESK_TOP = 0.9
const DOG = new THREE.Vector3(-0.1, 0.55, -0.45) // assento da cadeira
const CUP = new THREE.Vector3(0.3, DESK_TOP, 0.32)
const FEMUR_B = new THREE.Vector3(0.36, 1.0, 0.33)
const FEMUR_T = new THREE.Vector3(0.74, 1.8, -0.02)
const PAW = FEMUR_B.clone().lerp(FEMUR_T, 0.52) // pata que segura o fêmur
const TONGUE_END = new THREE.Vector3(0.25, 1.08, 0.33)
const PEN_FINAL = new THREE.Vector3(-0.32, DESK_TOP + 0.022, 0.6)

const UP = new THREE.Vector3(0, 1, 0)

/** Aponta o +y local do objeto de a para b (objeto posicionado em a). */
function aim(obj: THREE.Object3D, a: THREE.Vector3, b: THREE.Vector3) {
  obj.position.copy(a)
  obj.quaternion.setFromUnitVectors(UP, b.clone().sub(a).normalize())
  return a.distanceTo(b)
}

/** Cápsula de a até b (membros do buldogue). */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string) {
  const g = new THREE.Group()
  const len = aim(g, a, b)
  const c = capsule(r, Math.max(0.01, len), color, { roughness: 0.85 })
  c.position.y = len / 2
  g.add(c)
  return g
}

/** Arco de onda sonora ")" em volta do mostrador. */
function arc(r: number, tube: number, ang: number, center: number) {
  const m = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 12, 40, ang),
    mat('#fff3cf', { emissive: '#ffe2a0', emissiveIntensity: 0.8 }),
  )
  m.rotation.z = center - ang / 2
  return m
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(57)

  // ---- base: assoalho, tapete, parede verde com vão da janela ---------------
  const base = new THREE.Group()

  const solo = cylinder(2.62, 2.7, 0.1, '#3a281c', { roughness: 0.9 })
  solo.position.y = 0.05
  base.add(solo)
  const piso = cylinder(2.56, 2.6, 0.06, PISO, { roughness: 0.75 })
  piso.position.y = 0.13
  base.add(piso)
  for (let i = -6; i <= 6; i++) {
    const x = i * 0.38
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - x * x, 0.01))
    const fresta = rbox(0.02, 0.012, len, 0.005, PISO_LINHA, { roughness: 0.9 })
    fresta.position.set(x, GY + 0.002, 0)
    base.add(fresta)
  }

  const tapete = cylinder(1.75, 1.78, 0.025, TAPETE, { roughness: 0.95 })
  tapete.position.set(0, GY + 0.0125, 0.55)
  tapete.scale.z = 0.72
  base.add(tapete)
  const borda = torus(1.62, 0.03, TAPETE_BORDA, { roughness: 0.95 })
  borda.rotation.x = Math.PI / 2
  borda.scale.y = 0.72
  borda.position.set(0, GY + 0.026, 0.55)
  base.add(borda)

  // parede: quatro panos em volta do vão da janela
  const WT = 0.12
  const WX0 = -2.25
  const WX1 = 2.25
  const WTOP = 3.05
  const panos: [number, number, number, number][] = [
    [WX0, WX1, GY, WIN.y0],
    [WX0, WX1, WIN.y1, WTOP],
    [WX0, WIN.x0, WIN.y0, WIN.y1],
    [WIN.x1, WX1, WIN.y0, WIN.y1],
  ]
  for (const [x0, x1, y0, y1] of panos) {
    const p = rbox(x1 - x0, y1 - y0, WT, 0.01, PAREDE, { roughness: 0.85 })
    p.position.set((x0 + x1) / 2, (y0 + y1) / 2, WALL_Z)
    base.add(p)
  }
  // lambri escuro embaixo + rodapé
  const lambri = rbox(WX1 - WX0, 0.7, 0.03, 0.01, RODAPE, { roughness: 0.8 })
  lambri.position.set(0, GY + 0.35, WALL_Z + WT / 2 + 0.015)
  base.add(lambri)
  const friso = rbox(WX1 - WX0, 0.05, 0.06, 0.015, MOGNO, { roughness: 0.6 })
  friso.position.set(0, GY + 0.72, WALL_Z + WT / 2 + 0.03)
  base.add(friso)

  // estante de livros à esquerda
  const estante = new THREE.Group()
  estante.position.set(-1.62, GY, WALL_Z + 0.3)
  const caixa = rbox(0.78, 1.9, 0.4, 0.03, MOGNO_ESC, { roughness: 0.7 })
  caixa.position.y = 0.95
  estante.add(caixa)
  const fundo = rbox(0.68, 1.78, 0.02, 0.005, '#2a1712', { roughness: 0.9 })
  fundo.position.set(0, 0.97, 0.18)
  estante.add(fundo)
  const cores = ['#7a2f2a', '#2f4a6b', '#b08a3a', '#3f5a3a', '#5b3b5c', '#8a5a3a']
  for (const sy of [0.15, 0.65, 1.15, 1.6]) {
    const prat = rbox(0.7, 0.03, 0.38, 0.008, MOGNO, { roughness: 0.7 })
    prat.position.set(0, sy, 0.02)
    estante.add(prat)
    let x = -0.31
    while (x < 0.28) {
      const w = 0.045 + rand() * 0.04
      const h = 0.28 + rand() * 0.12
      const livro = rbox(w, h, 0.26, 0.008, cores[Math.floor(rand() * cores.length)], { roughness: 0.8 })
      livro.position.set(x + w / 2, sy + 0.015 + h / 2, 0.08)
      if (rand() < 0.15) livro.rotation.z = 0.18
      estante.add(livro)
      x += w + 0.008
    }
  }
  base.add(estante)

  // porta-guarda-chuva londrino à direita
  const portaG = new THREE.Group()
  portaG.position.set(1.75, GY, 0.55)
  const tubo = lathe([[0, 0], [0.13, 0], [0.14, 0.05], [0.13, 0.42], [0.145, 0.45], [0.12, 0.45], [0, 0.44]], '#3b3b40', { roughness: 0.35, metalness: 0.6 })
  portaG.add(tubo)
  const guarda = cone(0.09, 0.62, PRETO, { roughness: 0.6 }, 8)
  guarda.position.set(0.02, 0.6, 0)
  guarda.rotation.z = Math.PI + 0.1
  portaG.add(guarda)
  const cabo = cylinder(0.014, 0.014, 0.25, PRETO, { roughness: 0.5 })
  cabo.position.set(0.03, 0.98, 0)
  portaG.add(cabo)
  const curva = torus(0.05, 0.016, '#6b4430', { roughness: 0.4 })
  curva.position.set(0.08, 1.1, 0)
  curva.rotation.z = 0
  portaG.add(curva)
  base.add(portaG)

  // cesto de papel com bolas amassadas à esquerda
  const cesto = new THREE.Group()
  cesto.position.set(-1.55, GY, 0.75)
  const cestoCorpo = lathe([[0, 0], [0.15, 0], [0.19, 0.32], [0.2, 0.34], [0.18, 0.34], [0.17, 0.32], [0.13, 0.02], [0, 0.02]], '#4a5a52', { roughness: 0.7 })
  cesto.add(cestoCorpo)
  for (let i = 0; i < 3; i++) {
    const bola = puff(0.06, PAPEL, 4, 70 + i, { roughness: 0.9 })
    bola.position.set(-0.06 + i * 0.06, 0.34 + (i % 2) * 0.03, (i - 1) * 0.05)
    cesto.add(bola)
  }
  base.add(cesto)

  root.add(base)

  // ---- janela: céu de fim de tarde + silhueta de Londres + caixilho --------
  const janela = new THREE.Group()
  const wx = (WIN.x0 + WIN.x1) / 2
  const ww = WIN.x1 - WIN.x0 + 0.1
  const faixas: [number, number, string][] = [
    [WIN.y0 - 0.05, 1.55, '#f7c46c'],
    [1.55, 2.25, '#f0904f'],
    [2.25, WIN.y1 + 0.05, '#cf6a72'],
  ]
  for (const [y0, y1, cor] of faixas) {
    const c = rbox(ww, y1 - y0, 0.03, 0.005, cor, { emissive: cor, emissiveIntensity: 0.55 })
    c.position.set(wx, (y0 + y1) / 2, -1.78)
    janela.add(c)
  }
  const sol = cylinder(0.2, 0.2, 0.02, '#ffe3a0', { emissive: '#ffd27a', emissiveIntensity: 0.9 })
  sol.rotation.x = Math.PI / 2
  sol.position.set(-0.2, 1.38, -1.76)
  janela.add(sol)
  // telhados de Londres em silhueta
  const tel: [number, number, number][] = [
    [-0.62, 0.36, 0.3], [-0.3, 0.28, 0.22], [0.02, 0.42, 0.26], [0.32, 0.3, 0.3], [1.38, 0.34, 0.3],
  ]
  for (const [tx, th, tw] of tel) {
    const b = rbox(tw, th, 0.04, 0.01, '#6a3f5e', { roughness: 0.9 })
    b.position.set(tx, WIN.y0 + th / 2, -1.72)
    janela.add(b)
  }
  const domo = sphere(0.14, '#6a3f5e', { roughness: 0.9 })
  domo.scale.z = 0.3
  domo.position.set(-0.3, WIN.y0 + 0.3, -1.72)
  janela.add(domo)

  // caixilho creme
  const FZ = WALL_Z + 0.02
  const fr = 0.07
  const molduras: [number, number, number, number][] = [
    [wx, WIN.y0 + fr / 2, ww, fr],
    [wx, WIN.y1 - fr / 2, ww, fr],
    [WIN.x0 + fr / 2, (WIN.y0 + WIN.y1) / 2, fr, WIN.y1 - WIN.y0],
    [WIN.x1 - fr / 2, (WIN.y0 + WIN.y1) / 2, fr, WIN.y1 - WIN.y0],
    [wx, (WIN.y0 + WIN.y1) / 2, 0.05, WIN.y1 - WIN.y0],
    [wx, 1.6, ww, 0.045],
  ]
  for (const [mx, my, mw, mh] of molduras) {
    const m = rbox(mw, mh, 0.1, 0.012, CREME, { roughness: 0.5 })
    m.position.set(mx, my, FZ)
    janela.add(m)
  }
  const peitoril = rbox(ww + 0.2, 0.06, 0.24, 0.02, CREME, { roughness: 0.5 })
  peitoril.position.set(wx, WIN.y0 - 0.02, WALL_Z + 0.1)
  janela.add(peitoril)
  root.add(janela)

  // ---- Big Ben lá fora ------------------------------------------------------
  const bigben = new THREE.Group()
  bigben.position.set(BEN_X, 0, -1.55)
  const fuste = rbox(0.42, 1.6, 0.34, 0.02, PEDRA, { roughness: 0.75 })
  fuste.position.y = 0.95
  bigben.add(fuste)
  for (const nx of [-0.12, 0, 0.12]) {
    const nerv = rbox(0.03, 0.55, 0.02, 0.008, PEDRA_ESC, { roughness: 0.8 })
    nerv.position.set(nx, 1.45, 0.175)
    bigben.add(nerv)
  }
  const cinta = rbox(0.46, 0.05, 0.38, 0.01, PEDRA_ESC, { roughness: 0.8 })
  cinta.position.y = 1.72
  bigben.add(cinta)
  const caixaRel = rbox(0.5, 0.5, 0.4, 0.02, PEDRA, { roughness: 0.75 })
  caixaRel.position.y = CLK
  bigben.add(caixaRel)
  const mostrador = cylinder(0.18, 0.18, 0.02, '#fff6e2', { emissive: '#fff0cc', emissiveIntensity: 0.35 })
  mostrador.rotation.x = Math.PI / 2
  mostrador.position.set(0, CLK, 0.205)
  bigben.add(mostrador)
  const aro = torus(0.185, 0.016, '#8a6d2f', { roughness: 0.35, metalness: 0.6 })
  aro.position.set(0, CLK, 0.212)
  bigben.add(aro)
  for (let h = 0; h < 12; h++) {
    const a = (h / 12) * Math.PI * 2
    const big = h % 3 === 0
    const marca = rbox(big ? 0.022 : 0.012, big ? 0.04 : 0.025, 0.01, 0.003, PRETO)
    marca.position.set(Math.sin(a) * 0.145, CLK + Math.cos(a) * 0.145, 0.22)
    marca.rotation.z = -a
    bigben.add(marca)
  }
  // ponteiros: minutos no 12, horas no 5
  const minuto = rbox(0.02, 0.15, 0.012, 0.005, PRETO)
  minuto.position.set(0, CLK + 0.065, 0.228)
  bigben.add(minuto)
  const ah = -(5 / 12) * Math.PI * 2
  const hora = rbox(0.03, 0.1, 0.012, 0.006, PRETO)
  hora.position.set(-Math.sin(ah) * 0.045, CLK + Math.cos(ah) * 0.045, 0.23)
  hora.rotation.z = ah
  bigben.add(hora)
  const eixo = sphere(0.018, PRETO)
  eixo.position.set(0, CLK, 0.235)
  bigben.add(eixo)
  const campanario = rbox(0.44, 0.24, 0.36, 0.02, PEDRA, { roughness: 0.75 })
  campanario.position.y = CLK + 0.37
  bigben.add(campanario)
  for (const ax of [-0.1, 0.1]) {
    const arco = rbox(0.08, 0.15, 0.02, 0.03, '#4a3a2a', { roughness: 0.9 })
    arco.position.set(ax, CLK + 0.36, 0.18)
    bigben.add(arco)
  }
  const flecha = cone(0.3, 0.42, ARDOSIA, { roughness: 0.6 }, 4)
  flecha.rotation.y = Math.PI / 4
  flecha.position.y = CLK + 0.7
  bigben.add(flecha)
  for (const sx of [-1, 1]) {
    const pin = cone(0.035, 0.16, ARDOSIA, { roughness: 0.6 }, 6)
    pin.position.set(sx * 0.2, CLK + 0.57, 0.15)
    bigben.add(pin)
  }
  root.add(bigben)

  // ---- badaladas: ondas ")) ((" saindo do mostrador -------------------------
  const badaladas = new THREE.Group()
  badaladas.position.set(BEN_X, CLK, -1.18)
  for (const [i, r] of [0.28, 0.38, 0.48].entries()) {
    const ang = 1.15 - i * 0.12
    badaladas.add(arc(r, 0.02, ang, 0))
    badaladas.add(arc(r, 0.02, ang, Math.PI))
  }
  root.add(badaladas)

  // ---- escrivaninha de mogno (frente para a câmera) -------------------------
  const mesa = new THREE.Group()
  const tampo = rbox(2.1, 0.07, 0.8, 0.025, MOGNO, { roughness: 0.45 })
  tampo.position.set(0, DESK_TOP - 0.035, 0.32)
  mesa.add(tampo)
  const couro = rbox(1.7, 0.012, 0.55, 0.004, COURO_MESA, { roughness: 0.85 })
  couro.position.set(0, DESK_TOP + 0.002, 0.3)
  mesa.add(couro)
  for (const sx of [-1, 1]) {
    const ped = rbox(0.62, DESK_TOP - 0.07 - GY, 0.72, 0.02, MOGNO_ESC, { roughness: 0.6 })
    ped.position.set(sx * 0.7, GY + (DESK_TOP - 0.07 - GY) / 2, 0.33)
    mesa.add(ped)
    for (const dy of [0.13, 0.35, 0.56]) {
      const gaveta = rbox(0.52, 0.18, 0.03, 0.015, MOGNO, { roughness: 0.5 })
      gaveta.position.set(sx * 0.7, GY + dy, 0.7)
      mesa.add(gaveta)
      const puxador = sphere(0.025, LATAO, { roughness: 0.3, metalness: 0.8 })
      puxador.position.set(sx * 0.7, GY + dy, 0.725)
      mesa.add(puxador)
    }
  }
  const gavetaC = rbox(0.74, 0.09, 0.03, 0.012, MOGNO, { roughness: 0.5 })
  gavetaC.position.set(0, DESK_TOP - 0.12, 0.7)
  mesa.add(gavetaC)
  const puxC = rbox(0.12, 0.022, 0.025, 0.01, LATAO, { roughness: 0.3, metalness: 0.8 })
  puxC.position.set(0, DESK_TOP - 0.12, 0.725)
  mesa.add(puxC)
  const painel = rbox(0.78, 0.5, 0.04, 0.015, MOGNO_ESC, { roughness: 0.7 })
  painel.position.set(0, GY + 0.42, 0.0)
  mesa.add(painel)

  // pilha de papéis abandonada
  for (let i = 0; i < 4; i++) {
    const folha = rbox(0.34, 0.012, 0.26, 0.004, PAPEL, { roughness: 0.85 })
    folha.position.set(-0.56 + (rand() - 0.5) * 0.03, DESK_TOP + 0.012 + i * 0.013, 0.32 + (rand() - 0.5) * 0.03)
    folha.rotation.y = (rand() - 0.5) * 0.4
    mesa.add(folha)
  }
  for (const [lx, lz, lr] of [[-0.2, 0.52, 0.5], [-0.85, 0.5, -0.3]] as const) {
    const solta = rbox(0.3, 0.008, 0.22, 0.003, PAPEL, { roughness: 0.85 })
    solta.position.set(lx, DESK_TOP + 0.01, lz)
    solta.rotation.y = lr
    mesa.add(solta)
    for (let k = 0; k < 3; k++) {
      const linha = rbox(0.2, 0.002, 0.012, 0.001, '#9a9384')
      linha.position.set(0, 0.005, -0.05 + k * 0.045)
      solta.add(linha)
    }
  }

  // luminária de banqueiro (cúpula verde)
  const lum = new THREE.Group()
  lum.position.set(-0.8, DESK_TOP, 0.06)
  const lbase = lathe([[0, 0], [0.1, 0], [0.11, 0.02], [0.06, 0.04], [0, 0.045]], LATAO, { roughness: 0.3, metalness: 0.8 })
  lum.add(lbase)
  const haste = cylinder(0.014, 0.014, 0.3, LATAO, { roughness: 0.3, metalness: 0.8 })
  haste.position.y = 0.18
  lum.add(haste)
  const cupula = capsule(0.07, 0.2, '#2f6b4a', { roughness: 0.25 })
  cupula.rotation.z = Math.PI / 2
  cupula.scale.set(1, 1, 0.75)
  cupula.position.set(0, 0.36, 0.03)
  lum.add(cupula)
  mesa.add(lum)
  root.add(mesa)

  // ---- cadeira de couro ------------------------------------------------------
  const cadeira = new THREE.Group()
  const assento = rbox(0.9, 0.12, 0.75, 0.05, COURO, { roughness: 0.6 })
  assento.position.set(DOG.x, DOG.y - 0.06, DOG.z - 0.05)
  cadeira.add(assento)
  const encosto = rbox(1.0, 0.92, 0.16, 0.07, COURO, { roughness: 0.6 })
  encosto.position.set(DOG.x, DOG.y + 0.45, DOG.z - 0.45)
  encosto.rotation.x = -0.08
  cadeira.add(encosto)
  for (const bx of [-0.3, 0, 0.3]) {
    for (const by of [0.3, 0.62]) {
      const botao = sphere(0.022, '#4e3022', { roughness: 0.5 })
      botao.position.set(DOG.x + bx, DOG.y + by + 0.0, DOG.z - 0.36 + by * 0.08)
      cadeira.add(botao)
    }
  }
  for (const sx of [-1, 1]) {
    const braco = rbox(0.12, 0.3, 0.6, 0.05, COURO, { roughness: 0.6 })
    braco.position.set(DOG.x + sx * 0.5, DOG.y + 0.12, DOG.z - 0.08)
    cadeira.add(braco)
    for (const sz of [-1, 1]) {
      const perna = cylinder(0.03, 0.025, DOG.y - 0.12 - GY, MOGNO_ESC, { roughness: 0.6 })
      perna.position.set(DOG.x + sx * 0.36, GY + (DOG.y - 0.12 - GY) / 2, DOG.z - 0.05 + sz * 0.28)
      cadeira.add(perna)
    }
  }
  root.add(cadeira)

  // ---- buldogue: corpo atarracado (orgânico) ---------------------------------
  const buldogue = new THREE.Group()
  buldogue.position.copy(DOG)
  const L = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

  const quadril = sphere(0.36, BRANCO, { roughness: 0.85 })
  quadril.scale.set(1.2, 0.7, 1.0)
  quadril.position.set(0, 0.18, 0)
  buldogue.add(quadril)
  const tronco = sphere(0.42, BRANCO, { roughness: 0.85 })
  tronco.scale.set(1.2, 1.0, 0.95)
  tronco.position.set(0, 0.52, 0.05)
  buldogue.add(tronco)
  const peito = sphere(0.33, BRANCO, { roughness: 0.85 })
  peito.scale.set(1.15, 1.0, 0.9)
  peito.position.set(0, 0.62, 0.24)
  buldogue.add(peito)
  for (const sx of [-1, 1]) {
    const ombro = sphere(0.2, BRANCO, { roughness: 0.85 })
    ombro.position.set(sx * 0.32, 0.72, 0.14)
    buldogue.add(ombro)
  }
  const pescoco = sphere(0.3, BRANCO, { roughness: 0.85 })
  pescoco.scale.set(1.25, 1, 1)
  pescoco.position.set(0.02, 0.86, 0.2)
  buldogue.add(pescoco)
  const mancha1 = sphere(0.27, CARAMELO, { roughness: 0.85 })
  mancha1.position.set(-0.32, 0.66, -0.06)
  buldogue.add(mancha1)
  const mancha2 = sphere(0.2, CARAMELO, { roughness: 0.85 })
  mancha2.position.set(0.3, 0.38, -0.14)
  buldogue.add(mancha2)

  // pata direita (lado da câmera esquerdo) largada sobre os papéis
  buldogue.add(limb(L(-0.33, 0.68, 0.2), L(-0.46, 0.44, 0.66), 0.1, BRANCO))
  const pataR = sphere(0.12, BRANCO, { roughness: 0.85 })
  pataR.scale.set(1.15, 0.6, 1.25)
  pataR.position.set(-0.46, 0.43, 0.7)
  buldogue.add(pataR)
  // pata esquerda erguida, segurando o fêmur
  const pawL = PAW.clone().sub(DOG)
  buldogue.add(limb(L(0.33, 0.7, 0.2), pawL, 0.1, BRANCO))
  const pataL = sphere(0.12, BRANCO, { roughness: 0.85 })
  pataL.scale.set(1.1, 1.05, 1.0)
  pataL.position.copy(pawL)
  buldogue.add(pataL)
  for (let k = 0; k < 3; k++) {
    const dedo = sphere(0.045, BRANCO, { roughness: 0.85 })
    dedo.position.set(pawL.x - 0.08 + k * 0.02, pawL.y + 0.05 - k * 0.06, pawL.z + 0.1)
    buldogue.add(dedo)
  }
  for (let k = 0; k < 3; k++) {
    const dedo = sphere(0.042, BRANCO, { roughness: 0.85 })
    dedo.position.set(-0.52 + k * 0.06, 0.42, 0.83)
    buldogue.add(dedo)
  }
  root.add(buldogue)

  // ---- cabeça larga e enrugada (orgânica) ------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(DOG.x + 0.05, DOG.y + 1.08, DOG.z + 0.32)
  cabeca.rotation.set(0.12, 0.3, 0)

  const cranio = sphere(0.34, BRANCO, { roughness: 0.85 })
  cranio.scale.set(1.3, 0.92, 1.0)
  cranio.position.y = 0.05
  cabeca.add(cranio)
  const manchaOlho = sphere(0.19, CARAMELO, { roughness: 0.85 })
  manchaOlho.position.set(-0.19, 0.12, 0.15)
  cabeca.add(manchaOlho)
  for (const sx of [-1, 1]) {
    const bochecha = sphere(0.16, FOCINHO, { roughness: 0.85 })
    bochecha.scale.set(1.0, 1.15, 0.9)
    bochecha.position.set(sx * 0.13, -0.12, 0.27)
    cabeca.add(bochecha)
    const orelha = sphere(0.11, CARAMELO_ESC, { roughness: 0.85 })
    orelha.scale.set(1.2, 0.55, 0.9)
    orelha.position.set(sx * 0.4, 0.24, -0.02)
    orelha.rotation.z = sx * 0.5
    cabeca.add(orelha)
  }
  const stop = sphere(0.14, FOCINHO, { roughness: 0.85 })
  stop.scale.set(1.1, 0.8, 0.8)
  stop.position.set(0, 0.0, 0.29)
  cabeca.add(stop)
  const mandibula = sphere(0.17, FOCINHO, { roughness: 0.85 })
  mandibula.scale.set(1.45, 0.62, 1.0)
  mandibula.position.set(0, -0.25, 0.32)
  cabeca.add(mandibula)
  // detalhes nítidos: nariz, olhos, dentinhos
  const nariz = sphere(0.075, '#2a2224', { roughness: 0.3 })
  nariz.scale.set(1.45, 0.9, 0.8)
  nariz.position.set(0, 0.03, 0.42)
  cabeca.add(nariz)
  for (const sx of [-1, 1]) {
    const olho = sphere(0.065, '#ffffff', { roughness: 0.25 })
    olho.scale.z = 0.6
    olho.position.set(sx * 0.16, 0.09, 0.3)
    const pupila = sphere(0.042, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(sx * 0.16 + 0.018, 0.068, 0.335)
    const palpebra = sphere(0.068, sx < 0 ? CARAMELO : BRANCO, { roughness: 0.85 })
    palpebra.scale.set(1, 0.5, 0.65)
    palpebra.position.set(sx * 0.16, 0.13, 0.302)
    cabeca.add(olho, pupila, palpebra)
    const dente = cone(0.026, 0.07, '#fbf8ee', { roughness: 0.3 })
    dente.position.set(sx * 0.085, -0.16, 0.465)
    cabeca.add(dente)
  }
  const boca = new THREE.Object3D()
  boca.position.set(0.06, -0.2, 0.42)
  cabeca.add(boca)
  const topo = new THREE.Object3D()
  topo.position.set(0, 0.3, -0.02)
  cabeca.add(topo)
  root.add(cabeca)
  root.updateMatrixWorld(true)

  // ---- chapéu-coco (rígido, assentado no topo da cabeça) ---------------------
  const chapeu = new THREE.Group()
  topo.getWorldPosition(chapeu.position)
  topo.getWorldQuaternion(chapeu.quaternion)
  const copa = lathe(
    [[0, 0], [0.24, 0], [0.255, 0.08], [0.245, 0.17], [0.2, 0.24], [0.11, 0.275], [0, 0.28]],
    PRETO,
    { roughness: 0.55 },
  )
  chapeu.add(copa)
  const aba = lathe(
    [[0.2, 0.0], [0.33, -0.005], [0.37, 0.035], [0.355, 0.045], [0.31, 0.018], [0.2, 0.025]],
    PRETO,
    { roughness: 0.55 },
  )
  chapeu.add(aba)
  const fita = cylinder(0.252, 0.256, 0.05, '#3e3640', { roughness: 0.7 })
  fita.position.y = 0.04
  chapeu.add(fita)
  root.add(chapeu)

  // ---- xícara de porcelana com friso azul, pires e vapor ---------------------
  const xicara = new THREE.Group()
  xicara.position.copy(CUP)
  const pires = lathe(
    [[0, 0], [0.12, 0.004], [0.18, 0.025], [0.19, 0.035], [0.175, 0.035], [0.12, 0.016], [0, 0.014]],
    PORCELANA,
    { roughness: 0.2 },
  )
  xicara.add(pires)
  const friso2 = torus(0.182, 0.006, AZUL, { roughness: 0.3 })
  friso2.rotation.x = Math.PI / 2
  friso2.position.y = 0.034
  xicara.add(friso2)
  const copo = lathe(
    [[0, 0.016], [0.06, 0.016], [0.068, 0.03], [0.1, 0.08], [0.115, 0.15], [0.118, 0.17],
      [0.107, 0.17], [0.104, 0.15], [0.09, 0.085], [0, 0.05]],
    PORCELANA,
    { roughness: 0.2 },
  )
  xicara.add(copo)
  const cha = cylinder(0.103, 0.103, 0.006, '#9a5a24', { roughness: 0.15 })
  cha.position.y = 0.14
  xicara.add(cha)
  const frisoX = torus(0.116, 0.009, AZUL, { roughness: 0.3 })
  frisoX.rotation.x = Math.PI / 2
  frisoX.position.y = 0.152
  xicara.add(frisoX)
  const alca = torus(0.045, 0.013, PORCELANA, { roughness: 0.2 })
  alca.position.set(0.13, 0.1, -0.02)
  alca.rotation.y = 0.35
  xicara.add(alca)
  // três fiapos de vapor: tubos ondulados finos, cinza-azulado
  for (const [k, vx] of [-0.035, 0.015, 0.065].entries()) {
    const pts: THREE.Vector3[] = []
    for (let j = 0; j <= 6; j++) {
      pts.push(new THREE.Vector3(vx + Math.sin(j * 1.1 + k * 1.7) * 0.025, 0.19 + j * 0.05 + k * 0.015, -0.04))
    }
    const fio = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, 0.011, 8),
      mat('#e4ebf1', { roughness: 0.9 }),
    )
    xicara.add(fio)
  }
  root.add(xicara)

  // ---- língua rosa comprida, da boca até a xícara ----------------------------
  const lingua = new THREE.Group()
  const bocaW = new THREE.Vector3()
  boca.getWorldPosition(bocaW)
  const lenL = aim(lingua, bocaW, TONGUE_END)
  const linguaMesh = capsule(0.055, lenL - 0.05, LINGUA, { roughness: 0.35 })
  linguaMesh.scale.set(1.25, 1, 0.7)
  linguaMesh.position.y = lenL / 2
  lingua.add(linguaMesh)
  const ponta = sphere(0.07, LINGUA, { roughness: 0.35 })
  ponta.scale.set(1.2, 0.8, 0.7)
  ponta.position.y = lenL - 0.02
  lingua.add(ponta)
  const sulco = capsule(0.008, lenL * 0.6, '#c93e62', { roughness: 0.4 })
  sulco.position.set(0, lenL * 0.5, 0.037)
  lingua.add(sulco)
  root.add(lingua)

  // ---- fêmur branco de desenho mergulhado no chá ------------------------------
  const femur = new THREE.Group()
  const lenF = aim(femur, FEMUR_B, FEMUR_T)
  const haste2 = capsule(0.045, lenF - 0.1, OSSO, { roughness: 0.6 })
  haste2.position.y = lenF / 2
  femur.add(haste2)
  for (const ey of [0.02, lenF]) {
    for (const sx of [-1, 1]) {
      const no = sphere(0.068, OSSO, { roughness: 0.6 })
      no.position.set(sx * 0.055, ey, 0)
      femur.add(no)
    }
  }
  root.add(femur)

  // ---- caneta preta (voa da pata e cai no tapete) -----------------------------
  const caneta = new THREE.Group()
  caneta.position.copy(PEN_FINAL)
  caneta.rotation.set(0, 0.7, 0)
  const corpoC = capsule(0.02, 0.22, PRETO, { roughness: 0.25 })
  corpoC.rotation.z = Math.PI / 2
  caneta.add(corpoC)
  const pontaC = cone(0.02, 0.06, LATAO, { roughness: 0.3, metalness: 0.8 })
  pontaC.rotation.z = -Math.PI / 2
  pontaC.position.x = 0.15
  caneta.add(pontaC)
  const clipe = rbox(0.09, 0.01, 0.012, 0.004, LATAO, { roughness: 0.3, metalness: 0.8 })
  clipe.position.set(-0.07, 0.022, 0)
  caneta.add(clipe)
  root.add(caneta)

  // ---- peças -----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'sala', object: base },
    { name: 'janela', group: 'sala', object: janela },
    { name: 'bigben', group: 'bigben', object: bigben },
    { name: 'mesa', group: 'mesa', object: mesa },
    { name: 'cadeira', group: 'mesa', object: cadeira },
    { name: 'buldogue', group: 'buldogue', object: buldogue },
    { name: 'cabeca', group: 'buldogue', object: cabeca },
    { name: 'chapeu', group: 'buldogue', object: chapeu },
    { name: 'caneta', group: 'ia', object: caneta },
    { name: 'xicara', group: 'slurp', object: xicara },
    { name: 'lingua', group: 'slurp', object: lingua },
    { name: 'badaladas', group: 'klockan', object: badaladas },
    { name: 'femur', group: 'fem', object: femur },
  ]

  // ---- montagem --------------------------------------------------------------
  const HY = chapeu.position.y
  const S = (from: number, to = 1) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]
  const fDir = FEMUR_T.clone().sub(FEMUR_B).normalize().multiplyScalar(0.45)
  const pen0 = new THREE.Vector3(DOG.x - 0.48, 1.05, 0.25)

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um escritório em Londres sobe do chão: assoalho escuro, parede verde e uma janela de fim de tarde.',
    }),
    seq('janela-abre', 'janela', 0.6, 0.6, [ch('scale.y', 0.02, 1)], { ease: 'easeOut' }),

    seq('bigben-rise', 'bigben', 1.7, 1.0, [riseFrom(0, 2.0)], {
      ease: 'easeOut',
      caption: 'Lá fora sobe o Big Ben — os ponteiros marcam CINCO horas da tarde.',
    }),

    seq('mesa-rise', 'mesa', 3.3, 0.7, [riseFrom(0, 1.0)], {
      ease: 'easeOut',
      caption: 'Aqui dentro, uma escrivaninha de mogno, papéis e uma cadeira de couro.',
    }),
    seq('cadeira-rise', 'cadeira', 3.5, 0.7, [riseFrom(0, 1.2)], { ease: 'easeOut' }),

    seq('buldogue-rise', 'buldogue', 4.7, 0.8, [riseFrom(DOG.y, 1.4)], {
      ease: 'easeOut',
      caption: 'Na cadeira, o chefe: um buldogue inglês, atarracado, trabalhando…',
    }),
    seq('cabeca-cai', 'cabeca', 4.95, 0.6, [ch('position.y', cabeca.position.y - 0.9, cabeca.position.y)], { ease: 'easeOut' }),
    seq('chapeu-cai', 'chapeu', 5.5, 0.5, [ch('position.y', HY + 0.9, HY)], { ease: 'easeIn' }),

    seq('caneta-voa', 'caneta', 6.4, 0.4, [
      ch('position.x', pen0.x, -0.48),
      ch('position.y', pen0.y, 1.55),
      ch('position.z', pen0.z, 0.5),
      ch('rotation.z', 7.5, 4.0),
    ], {
      ease: 'easeOut',
      caption: '…até que, no meio da frase, joga a caneta longe: IÁ!',
    }),
    seq('caneta-cai', 'caneta', 6.8, 0.45, [
      ch('position.x', -0.48, PEN_FINAL.x),
      ch('position.y', 1.55, PEN_FINAL.y),
      ch('position.z', 0.5, PEN_FINAL.z),
      ch('rotation.z', 4.0, 0),
    ], { ease: 'easeIn' }),

    seq('xicara-surge', 'xicara', 7.8, 0.5, S(0.01), {
      ease: 'easeOut',
      caption: 'Pega a xícara do chá da TARDE…',
    }),
    seq('lingua-slurp', 'lingua', 8.7, 0.55, [ch('scale.y', 0.05, 1), ch('scale.x', 0.6, 1)], {
      ease: 'easeOut',
      caption: '…e dá um SLURP de língua inteira: SLU(rp)-TAR(de)!',
    }),

    seq('badalada-1', 'badaladas', 10.0, 0.5, S(0.3), {
      ease: 'easeOut',
      caption: 'Lá fora, o Big Ben responde: CLÓ-CAN… CLÓ-CAN… cinco badaladas.',
    }),
    seq('badalada-2', 'badaladas', 10.55, 0.5, S(0.4), { ease: 'easeOut' }),

    seq('femur-mergulha', 'femur', 11.4, 0.7, [
      ch('position.x', FEMUR_B.x + fDir.x, FEMUR_B.x),
      ch('position.y', FEMUR_B.y + fDir.y, FEMUR_B.y),
      ch('position.z', FEMUR_B.z + fDir.z, FEMUR_B.z),
    ], {
      ease: 'easeInOut',
      caption: 'E, em vez de biscoito, molha no chá um FÊMUR: FÉM(ur)!',
    }),

    seq('chapeu-tchau', 'chapeu', 12.8, 0.3, [ch('position.y', HY, HY + 0.12)], {
      ease: 'easeOut',
      caption: 'Jag slutar klockan fem. — Eu saio (do trabalho) às cinco.',
    }),
    seq('chapeu-volta', 'chapeu', 13.1, 0.3, [ch('position.y', HY + 0.12, HY)], { ease: 'easeIn' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 2.0, 4.05], target: [0.15, 1.42, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-slutar-klockan-fem',
    contexto:
      "Trabalho: avisando o colega ou o chefe a que horas você vai embora, marcando algo depois do expediente ('Jag slutar klockan fem, ska vi ta en öl efter?') ou explicando sua rotina pro pessoal da creche (förskola). 'Sluta' também é parar: 'Sluta!' = 'Para!'.",
    fraseFonte: 'Eu saio (do trabalho) às cinco.',
    fraseAlvo: 'Jag slutar klockan fem.',
    pronuncia: "iá SLÜÜ-tar KLÓ-kan FÉM ('jag' = iá; 'slutar' com o S colado no L, sem 'is' na frente, e a força no SLU — o U sueco: lábios em bico, língua de I, LONGO —, o -tar fraquinho mas com R brando no fim: sem ele sobra 'sluta', o infinitivo; 'klockan' com a força no KLÓ, Ó ABERTO, e o -kan fraco; 'fem' com É aberto e curto e M de lábios fechados, sem nasalar)",
    ponteSonora: "IÁ! SLU(rp)-TAR(de)! CLÓ-CAN... FÉM(ur)! (6 sílabas: iá-SLÜÜ-tar-KLÓ-kan-FÉM; força no SLÜÜ, no KLÓ e no FÉM; IÁ = o 'jag' de sempre, I de IOGA, nunca J chiado; SLU(rp) = o SLURP de gibi, a lambida barulhenta do buldogue no chá, cortado antes do -RP: S e L colados, sem 'is' na frente (o mesmo S grudado do SKA e do SVÉN-ska), e o U já vem com a boca certa — o SLURP se faz de LÁBIOS EM BICO; só leve a língua pra frente, pro I, e estique: SLÜÜ, o U sueco, o mesmo Ü do DÜ de 'kan du' e do CÜL de 'Vad kul att höra!'; é aqui a força; TAR(de) = a TARDE do chá da tarde, sem o -de, fraquinho e colado no SLU: SLÜÜ-tar — mas com o R final BRANDO e audível: sem ele sobra 'sluta', o infinitivo; CLÓ-CAN = o MESMO 'klockan' do caranguejo de 'Vad är klockan?' — o estalo seco CLÓ-CAN, aqui as badaladas do Big Ben: força no CLÓ, Ó BEM ABERTO, e o -CAN fraco, A aberto e N sem nasal; FÉM(ur) = o MESMO FÊMUR do pirata de 'Jag har två barn' e do lutador de sumô de 'Jag kommer om fem minuter', cortado no M: É ABERTO (não o Ê fechado de 'fêmur' — abra a boca, FÉM) e lábios fechados no fim, sem nasalar)",
    historia: "Escritório em Londres, cinco da tarde: o buldogue inglês de chapéu-coco joga a caneta longe no meio da frase — IÁ! —, pega a xícara e dá um SLURP de língua inteira no chá da TARDE. Lá fora, pela janela, o Big Ben responde CLÓ-CAN... CLÓ-CAN..., cinco badaladas. E, em vez de biscoito, ele molha no chá um FÊMUR de osso branco do tamanho do braço dele. Às cinco em ponto ele larga o trabalho e não tem quem segure.",
  },
  createScene,
  refine: { organic: ['buldogue', 'cabeca'] },
}

export default card
