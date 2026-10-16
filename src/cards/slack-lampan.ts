import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Släck lampan!" — SLÉK! LÂMPA(da)-NNN!
 *
 * Hora de dormir. O LEÃO-MARINHO aposentado do circo que divide o quarto com
 * você dorme sentado na cauda, equilibrando no focinho uma LÂMPADA do tamanho
 * de uma melancia. Você berra "Apaga isso!", e a nadadeira encharcada estala no
 * interruptor — SLÉK! — respingando água na parede (o acento ciano da cena). A
 * LÂMPA... apaga antes de terminar o nome, solta um fiozinho de fumaça, e ele
 * já ronca NNN no escuro.
 *
 * Diorama: assoalho claro, tapete azul empoeirado, parede azul-noite com
 * janela de lua, cama baixa encostada à esquerda, balde vermelho de circo com
 * dois peixes; leão-marinho marrom-chocolate no centro, interruptor à direita.
 */

const BASE = '#7a5a3c'
const PISO = '#c9a375'
const PISO_LINHA = '#a8845a'
const TAPETE = '#6c83a6'
const TAPETE_ESC = '#5a7193'
const PAREDE = '#2e3d63' // azul-noite
const BRANCO = '#f1eee8'
const NOITE = '#141d3d'
const LUA = '#f3e4ad'
const MADEIRA = '#a8774a'
const MADEIRA_ESC = '#86603b'
const LENCOL = '#f4f3ef'
const COLCHAO = '#e4e8ed'
const AZUL_CLARO = '#a7bddb'
const LEAO = '#5c3923' // marrom-chocolate brilhante
const LEAO_CLARO = '#7b5034'
const LEAO_ESC = '#3b2416'
const FOCINHO = '#694329'
const NARIZ = '#1f140e'
const BIGODE = '#f4f0e6'
const VIDRO = '#b4bcc7' // vidro apagado, cinza
const PRATA = '#c3c8cf'
const ISOLANTE = '#2b2b30'
const LUZ = '#ffdf7e'
const FUMACA = '#c3c8cf'
const VERMELHO = '#c0392e'
const PEIXE = '#b8c5d1'
const PEIXE_ESC = '#8d9cab'
const AGUA = '#2fb9f5' // acento saturado RESERVADO: a água do SLÉK

const GY = 0.14 // topo do assoalho
const WZ = -0.9 // frente da parede
const WALL_H = 3.4

// leão-marinho: origem entre as nadadeiras traseiras
const LEAO_POS = new THREE.Vector3(0.0, GY, -0.28)
const HEAD_LOCAL = new THREE.Vector3(0, 1.66, 0.08)
const HEAD_UP = -0.42 // cabeça inclinada pra trás: focinho apontando pro alto
const SHOULDER_LOCAL = new THREE.Vector3(0.29, 1.02, 0.08)

// interruptor na parede, à direita do leão
const SW = new THREE.Vector3(0.82, GY + 1.0, WZ)
const TECLA_ON = 0.24
const TECLA_OFF = -0.24

// nadadeira: pose final (no interruptor) e erguida
const BRACO_ALTO = 0.95

const UP = new THREE.Vector3(0, 1, 0)

function seg(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, roughness = 0.3) {
  const dir = b.clone().sub(a)
  const c = capsule(r, dir.length(), color, { roughness })
  c.position.copy(a).add(b).multiplyScalar(0.5)
  c.quaternion.setFromUnitVectors(UP, dir.normalize())
  return c
}

function arc(r: number, tube: number, angle: number, color: string) {
  const mesh = new THREE.Mesh(
    new THREE.TorusGeometry(r, tube, 10, 24, angle),
    mat(color, { roughness: 0.4, size: r * 2 }),
  )
  mesh.castShadow = true
  return mesh
}

/** Perfil da lâmpada (vidro), de baixo pra cima, a partir do colarinho. */
const VIDRO_PERFIL: [number, number][] = [
  [0.08, 0.22], [0.095, 0.28], [0.13, 0.36], [0.19, 0.46], [0.232, 0.56],
  [0.243, 0.65], [0.233, 0.74], [0.19, 0.83], [0.115, 0.895], [0, 0.915],
]
const GLOBO_Y = 0.65
const TOPO_Y = 0.915

function peixe() {
  const g = new THREE.Group()
  const corpo = sphere(0.07, PEIXE, { roughness: 0.28, metalness: 0.55 })
  corpo.scale.set(0.62, 2.2, 1.0)
  g.add(corpo)
  const barriga = sphere(0.06, '#dfe6ec', { roughness: 0.3, metalness: 0.4 })
  barriga.scale.set(0.55, 1.8, 0.8)
  barriga.position.z = 0.02
  g.add(barriga)
  const rabo = cone(0.075, 0.1, PEIXE_ESC, { roughness: 0.3, metalness: 0.5 })
  rabo.scale.set(0.22, 1, 1)
  rabo.position.y = -0.2
  g.add(rabo)
  const dorsal = cone(0.035, 0.08, PEIXE_ESC, { roughness: 0.3, metalness: 0.5 })
  dorsal.scale.set(0.25, 1, 1)
  dorsal.rotation.x = -Math.PI / 2
  dorsal.position.set(0, 0.0, -0.08)
  g.add(dorsal)
  for (const side of [-1, 1]) {
    const olho = sphere(0.017, '#ffffff', { roughness: 0.2 })
    olho.position.set(side * 0.04, 0.095, 0.025)
    const pupila = sphere(0.009, '#141414', { roughness: 0.2 })
    pupila.position.set(side * 0.052, 0.097, 0.03)
    g.add(olho, pupila)
  }
  const boca = sphere(0.014, '#55606b', { roughness: 0.4 })
  boca.position.set(0, 0.152, 0.01)
  g.add(boca)
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- quarto: assoalho claro, tapete, parede azul-noite com janela ---------
  const quarto = new THREE.Group()

  const disco = cylinder(2.5, 2.58, 0.13, BASE, { roughness: 0.8 })
  disco.position.y = 0.065
  quarto.add(disco)
  const piso = cylinder(2.47, 2.47, 0.02, PISO, { roughness: 0.6 })
  piso.position.y = GY - 0.01
  quarto.add(piso)
  for (let i = -3; i <= 4; i++) {
    const z = i * 0.52 - 0.1
    if (z < WZ + 0.05) continue
    const half = Math.sqrt(Math.max(2.42 * 2.42 - z * z, 0.01))
    const linha = rbox(half * 2, 0.006, 0.018, 0.003, PISO_LINHA, { roughness: 0.8 })
    linha.position.set(0, GY + 0.002, z)
    quarto.add(linha)
  }

  const tapete = cylinder(1.05, 1.07, 0.025, TAPETE, { roughness: 0.95 })
  tapete.scale.set(1.25, 1, 0.85)
  tapete.position.set(0.05, GY + 0.0125, -0.05)
  quarto.add(tapete)
  const barra = torus(1.0, 0.022, TAPETE_ESC, { roughness: 0.95 })
  barra.rotation.x = Math.PI / 2
  barra.scale.set(1.25, 0.85, 1)
  barra.position.set(0.05, GY + 0.026, -0.05)
  quarto.add(barra)

  const muro = rbox(4.5, WALL_H, 0.16, 0.03, PAREDE, { roughness: 0.85 })
  muro.position.set(0, GY + WALL_H / 2, WZ - 0.08)
  quarto.add(muro)
  const rodape = rbox(4.5, 0.14, 0.04, 0.012, BRANCO, { roughness: 0.6 })
  rodape.position.set(0, GY + 0.07, WZ + 0.02)
  quarto.add(rodape)
  const sanca = rbox(4.56, 0.09, 0.1, 0.025, BRANCO, { roughness: 0.6 })
  sanca.position.set(0, GY + WALL_H - 0.03, WZ - 0.03)
  quarto.add(sanca)

  // janela de noite com lua, acima da cama
  const janela = new THREE.Group()
  janela.position.set(-1.38, GY + 2.08, WZ)
  const moldura = rbox(0.82, 0.72, 0.06, 0.02, BRANCO, { roughness: 0.55 })
  moldura.position.z = 0.03
  janela.add(moldura)
  const vidro = rbox(0.68, 0.58, 0.02, 0.008, NOITE, { roughness: 0.2 })
  vidro.position.z = 0.055
  janela.add(vidro)
  const montanteV = rbox(0.04, 0.58, 0.03, 0.01, BRANCO, { roughness: 0.55 })
  montanteV.position.z = 0.07
  janela.add(montanteV)
  const montanteH = rbox(0.68, 0.04, 0.03, 0.01, BRANCO, { roughness: 0.55 })
  montanteH.position.z = 0.07
  janela.add(montanteH)
  const peitoril = rbox(0.94, 0.05, 0.14, 0.015, BRANCO, { roughness: 0.55 })
  peitoril.position.set(0, -0.385, 0.06)
  janela.add(peitoril)
  const lua = cylinder(0.085, 0.085, 0.01, LUA, { emissive: LUA, emissiveIntensity: 0.55 })
  lua.rotation.x = Math.PI / 2
  lua.position.set(0.17, 0.15, 0.068)
  janela.add(lua)
  const sombraLua = cylinder(0.078, 0.078, 0.01, NOITE, { roughness: 0.2 })
  sombraLua.rotation.x = Math.PI / 2
  sombraLua.position.set(0.21, 0.18, 0.074)
  janela.add(sombraLua)
  for (const [sx, sy] of [[-0.2, 0.18], [-0.12, -0.15], [0.2, -0.12], [-0.25, -0.05]] as const) {
    const estrela = sphere(0.013, '#fff4cf', { emissive: '#fff4cf', emissiveIntensity: 0.9 })
    estrela.position.set(sx, sy, 0.068)
    janela.add(estrela)
  }
  quarto.add(janela)
  root.add(quarto)

  // ---- interruptor branco quadrado na parede -------------------------------
  const interruptor = new THREE.Group()
  interruptor.position.copy(SW)
  const placa = rbox(0.21, 0.23, 0.03, 0.014, BRANCO, { roughness: 0.4 })
  placa.position.z = 0.015
  interruptor.add(placa)
  const nicho = rbox(0.125, 0.155, 0.01, 0.006, '#d9d5cc', { roughness: 0.5 })
  nicho.position.z = 0.031
  interruptor.add(nicho)
  for (const sy of [-1, 1]) {
    const parafuso = cylinder(0.009, 0.009, 0.006, '#bdb8ae', { roughness: 0.4, metalness: 0.5 })
    parafuso.rotation.x = Math.PI / 2
    parafuso.position.set(0, sy * 0.096, 0.032)
    interruptor.add(parafuso)
  }
  root.add(interruptor)

  const tecla = new THREE.Group()
  tecla.position.set(SW.x, SW.y, SW.z + 0.04)
  tecla.rotation.x = TECLA_OFF // pose final: apertada em cima (desligada)
  const teclaMesh = rbox(0.1, 0.135, 0.03, 0.01, '#fbfaf6', { roughness: 0.35 })
  tecla.add(teclaMesh)
  const risco = rbox(0.05, 0.008, 0.004, 0.002, '#c9c4ba', { roughness: 0.5 })
  risco.position.set(0, -0.04, 0.016)
  tecla.add(risco)
  root.add(tecla)

  // ---- cama baixa encostada na parede --------------------------------------
  const cama = new THREE.Group()
  cama.position.set(-1.42, GY, WZ + 0.38)
  for (const px of [-1, 1]) {
    for (const pz of [-1, 1]) {
      const pe = cylinder(0.028, 0.032, 0.08, MADEIRA_ESC, { roughness: 0.6 })
      pe.position.set(px * 0.58, 0.04, pz * 0.3)
      cama.add(pe)
    }
  }
  const estrado = rbox(1.3, 0.13, 0.72, 0.03, MADEIRA, { roughness: 0.6 })
  estrado.position.y = 0.145
  cama.add(estrado)
  const colchao = rbox(1.24, 0.14, 0.68, 0.05, COLCHAO, { roughness: 0.85 })
  colchao.position.y = 0.28
  cama.add(colchao)
  const edredom = rbox(0.9, 0.1, 0.73, 0.045, LENCOL, { roughness: 0.9 })
  edredom.position.set(0.18, 0.395, 0)
  cama.add(edredom)
  const dobra = rbox(0.15, 0.11, 0.74, 0.045, AZUL_CLARO, { roughness: 0.9 })
  dobra.position.set(-0.27, 0.4, 0)
  cama.add(dobra)
  const travesseiro = rbox(0.3, 0.11, 0.5, 0.05, LENCOL, { roughness: 0.9 })
  travesseiro.position.set(-0.45, 0.42, 0)
  travesseiro.rotation.z = 0.14
  cama.add(travesseiro)
  const cabeceira = rbox(0.07, 0.64, 0.76, 0.03, MADEIRA, { roughness: 0.6 })
  cabeceira.position.set(-0.67, 0.36, 0)
  cama.add(cabeceira)
  const peseira = rbox(0.06, 0.3, 0.76, 0.025, MADEIRA, { roughness: 0.6 })
  peseira.position.set(0.665, 0.2, 0)
  cama.add(peseira)
  root.add(cama)

  // ---- balde vermelho de circo com dois peixes -----------------------------
  const balde = new THREE.Group()
  balde.position.set(-1.12, GY, 0.32)
  const corpoBalde = lathe(
    [[0, 0], [0.15, 0], [0.158, 0.015], [0.19, 0.3], [0.2, 0.31], [0.192, 0.322], [0.18, 0.31], [0.15, 0.03], [0, 0.03]],
    VERMELHO,
    { roughness: 0.4 },
  )
  balde.add(corpoBalde)
  const borda = torus(0.196, 0.013, BRANCO, { roughness: 0.4 })
  borda.rotation.x = Math.PI / 2
  borda.position.y = 0.315
  balde.add(borda)
  for (const [by, br] of [[0.09, 0.161], [0.22, 0.179]] as const) {
    const faixa = torus(br, 0.011, BRANCO, { roughness: 0.4 })
    faixa.rotation.x = Math.PI / 2
    faixa.position.y = by
    balde.add(faixa)
  }
  const aguaBalde = cylinder(0.172, 0.172, 0.01, '#2c5f86', { roughness: 0.15 })
  aguaBalde.position.y = 0.25
  balde.add(aguaBalde)
  const alca = arc(0.19, 0.008, Math.PI, '#8e959c')
  alca.position.y = 0.29
  alca.rotation.x = -1.0
  balde.add(alca)
  const peixe1 = peixe()
  peixe1.scale.setScalar(1.2)
  peixe1.position.set(0.05, 0.42, 0.05)
  peixe1.rotation.set(0.15, 0.5, -0.3)
  balde.add(peixe1)
  const peixe2 = peixe()
  peixe2.scale.setScalar(1.2)
  peixe2.position.set(-0.07, 0.38, -0.04)
  peixe2.rotation.set(0.1, -0.4, Math.PI - 0.35) // de cabeça pra baixo: rabo pra fora
  balde.add(peixe2)
  root.add(balde)

  // ---- LEÃO-MARINHO sentado na cauda ---------------------------------------
  const leao = new THREE.Group()
  leao.position.copy(LEAO_POS)
  root.add(leao)
  const pele = { roughness: 0.28 }

  // corpo torneado: base larga, peito erguido, pescoço afinando
  const corpo = lathe(
    [
      [0, 0], [0.38, 0], [0.48, 0.08], [0.53, 0.24], [0.52, 0.42], [0.47, 0.62],
      [0.4, 0.84], [0.33, 1.04], [0.27, 1.24], [0.235, 1.42], [0.22, 1.52], [0, 1.62],
    ],
    LEAO,
    pele,
  )
  corpo.scale.z = 0.92
  corpo.rotation.x = 0.05
  leao.add(corpo)

  // barriga e garganta mais claras: peça própria, para a borda sair limpa
  const barriga = new THREE.Group()
  leao.add(barriga)
  const pancinha = sphere(0.4, LEAO_CLARO, pele)
  pancinha.scale.set(0.85, 1.3, 0.55)
  pancinha.position.set(0, 0.72, 0.25)
  barriga.add(pancinha)
  const garganta = sphere(0.2, LEAO_CLARO, pele)
  garganta.scale.set(0.9, 1.25, 0.7)
  garganta.position.set(0, 1.3, 0.14)
  barriga.add(garganta)

  // nadadeira esquerda apoiada no tapete
  {
    const s = new THREE.Vector3(-0.3, 0.98, 0.14)
    const e = new THREE.Vector3(-0.44, 0.56, 0.32)
    const w = new THREE.Vector3(-0.48, 0.14, 0.44)
    leao.add(seg(s, e, 0.14, LEAO), seg(e, w, 0.115, LEAO))
    const pulso = sphere(0.1, LEAO_ESC, pele)
    pulso.position.copy(w)
    leao.add(pulso)
    const pa = sphere(1, LEAO_ESC, pele)
    pa.scale.set(0.16, 0.045, 0.28)
    pa.position.set(-0.53, 0.05, 0.6)
    pa.rotation.y = -0.3
    leao.add(pa)
  }

  // nadadeiras traseiras abertas no chão
  for (const side of [-1, 1]) {
    leao.add(seg(
      new THREE.Vector3(side * 0.3, 0.12, -0.25),
      new THREE.Vector3(side * 0.5, 0.05, -0.36),
      0.1, LEAO,
    ))
    const pa = sphere(1, LEAO_ESC, pele)
    pa.scale.set(0.26, 0.04, 0.14)
    pa.position.set(side * 0.62, 0.04, -0.4)
    pa.rotation.y = side * 0.55
    leao.add(pa)
  }

  // ---- cabeça: focinho pro alto, olhos fechados de sono ---------------------
  const cabeca = new THREE.Group()
  cabeca.position.copy(HEAD_LOCAL)
  cabeca.rotation.x = HEAD_UP
  leao.add(cabeca)
  const rosto = new THREE.Group() // cabeça grande de cartum
  rosto.scale.setScalar(1.25)
  cabeca.add(rosto)

  const cranio = sphere(0.25, LEAO, pele)
  cranio.scale.set(0.95, 0.9, 1.05)
  rosto.add(cranio)

  const focinho = capsule(0.135, 0.16, LEAO, pele)
  focinho.rotation.x = Math.PI / 2
  focinho.position.set(0, -0.06, 0.27)
  rosto.add(focinho)

  for (const side of [-1, 1]) {
    const almofada = sphere(0.085, FOCINHO, pele)
    almofada.position.set(side * 0.065, -0.095, 0.39)
    rosto.add(almofada)
  }
  const queixo = sphere(0.065, FOCINHO, pele)
  queixo.position.set(0, -0.155, 0.33)
  rosto.add(queixo)

  const nariz = sphere(0.052, NARIZ, { roughness: 0.25 })
  nariz.scale.set(1.25, 0.8, 0.9)
  nariz.position.set(0, -0.04, 0.49)
  rosto.add(nariz)

  for (const side of [-1, 1]) {
    // olho fechado: pálpebra clara em relevo + risco em ∪ com cílios
    const dir = new THREE.Vector3(side * 0.48, 0.33, 0.81).normalize()
    const olho = new THREE.Group()
    olho.position.copy(dir.clone().multiplyScalar(0.232))
    olho.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir)
    const palpebra = sphere(0.068, LEAO_CLARO, pele)
    palpebra.scale.set(1, 0.8, 0.42)
    olho.add(palpebra)
    const risco = arc(0.045, 0.013, Math.PI, NARIZ)
    risco.rotation.z = Math.PI
    risco.position.set(0, 0.016, 0.026)
    olho.add(risco)
    for (let k = -1; k <= 1; k++) {
      const cilio = capsule(0.007, 0.024, NARIZ, { roughness: 0.4 })
      const a = -Math.PI / 2 + k * 0.6
      cilio.position.set(Math.cos(a) * 0.06, 0.016 + Math.sin(a) * 0.06, 0.024)
      cilio.rotation.z = a + Math.PI / 2
      olho.add(cilio)
    }
    rosto.add(olho)

    const orelha = cone(0.026, 0.07, LEAO_ESC, pele)
    orelha.position.set(side * 0.23, 0.08, -0.03)
    orelha.rotation.z = -side * 1.2
    rosto.add(orelha)

    // bigodes brancos caídos de sono, em leque
    for (let k = -1; k <= 1; k++) {
      const base = new THREE.Vector3(side * 0.12, -0.1 + k * 0.02, 0.41)
      const d = new THREE.Vector3(side, -0.3 + k * 0.2, 0.3).normalize()
      const fio = cylinder(0.006, 0.0035, 0.17, BIGODE, { roughness: 0.4 })
      fio.quaternion.setFromUnitVectors(UP, d)
      fio.position.copy(base).add(d.clone().multiplyScalar(0.085))
      rosto.add(fio)
    }
  }

  // marcador do ponto mais alto do nariz (onde a lâmpada se apoia)
  const pontaNariz = new THREE.Object3D()
  pontaNariz.position.set(0, 0.0, 0.515)
  rosto.add(pontaNariz)

  // ---- nadadeira direita: estala no interruptor ----------------------------
  const nadadeira = new THREE.Group()
  nadadeira.position.copy(SHOULDER_LOCAL)
  leao.add(nadadeira)
  {
    const shoulderW = SHOULDER_LOCAL.clone().add(LEAO_POS)
    const toLocal = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z).sub(shoulderW)
    const s = new THREE.Vector3(0, 0, 0)
    const p = toLocal(0.63, SW.y + 0.17, WZ + 0.065) // centro da palma, colada na parede
    const w = toLocal(0.47, SW.y + 0.23, WZ + 0.12)
    const e = s.clone().lerp(w, 0.5).add(new THREE.Vector3(0.05, -0.06, 0.03))
    nadadeira.add(seg(s, e, 0.12, LEAO), seg(e, w, 0.1, LEAO))
    const pulso = sphere(0.09, LEAO_ESC, pele)
    pulso.position.copy(w)
    nadadeira.add(pulso)
    const palma = sphere(1, LEAO_ESC, pele)
    palma.scale.set(0.2, 0.13, 0.032)
    palma.position.copy(p)
    palma.rotation.z = -0.4
    nadadeira.add(palma)
  }

  // ---- gotas d'água espirrando do tapa --------------------------------------
  const impacto = new THREE.Vector3(SW.x - 0.02, SW.y + 0.07, WZ + 0.07)
  const gotas = new THREE.Group()
  gotas.position.copy(impacto)
  {
    const aguaMat = { roughness: 0.08 }
    const angulos = [-0.3, 0.25, 0.75, 1.25, 1.75, 2.25, 3.2, 3.75, 4.3, 4.8, 5.35, 5.85]
    for (const a of angulos) {
      const r = 0.022 + rand() * 0.018
      const dist = 0.2 + rand() * 0.2
      const u = new THREE.Vector3(Math.cos(a), Math.sin(a), 0.35 + rand() * 0.45).normalize()
      const gota = new THREE.Group()
      gota.position.copy(u.clone().multiplyScalar(dist))
      const cabecaGota = sphere(r, AGUA, aguaMat)
      gota.add(cabecaGota)
      const cauda = cone(r * 0.85, r * 2.4, AGUA, aguaMat)
      cauda.quaternion.setFromUnitVectors(UP, u.clone().negate())
      cauda.position.copy(u.clone().multiplyScalar(-r * 1.1))
      gota.add(cauda)
      gotas.add(gota)
    }
    // respingos achatados na parede
    for (let i = 0; i < 9; i++) {
      const a = (i / 9) * Math.PI * 2 + rand() * 0.5
      const dist = 0.26 + rand() * 0.3
      const r = 0.018 + rand() * 0.022
      const respingo = sphere(r, AGUA, aguaMat)
      respingo.scale.set(1.3, 1, 0.25)
      respingo.rotation.z = rand() * Math.PI
      respingo.position.set(Math.cos(a) * dist, Math.sin(a) * dist, WZ + 0.004 - impacto.z)
      gotas.add(respingo)
    }
  }
  root.add(gotas)

  // ---- LÂMPADA gigante equilibrada na ponta do focinho ----------------------
  root.updateMatrixWorld(true)
  const apoio = pontaNariz.getWorldPosition(new THREE.Vector3())

  const lampada = new THREE.Group()
  lampada.position.copy(apoio)
  root.add(lampada)

  const contato = sphere(0.028, '#6d7077', { roughness: 0.3, metalness: 0.7 })
  contato.position.y = 0.018
  lampada.add(contato)
  const isolante = cylinder(0.062, 0.036, 0.045, ISOLANTE, { roughness: 0.3 })
  isolante.position.y = 0.048
  lampada.add(isolante)
  const rosca = cylinder(0.085, 0.08, 0.15, PRATA, { roughness: 0.3, metalness: 0.85 })
  rosca.position.y = 0.145
  lampada.add(rosca)
  for (const ty of [0.09, 0.125, 0.16, 0.195]) {
    const fio = torus(0.084, 0.012, PRATA, { roughness: 0.3, metalness: 0.85 })
    fio.rotation.x = Math.PI / 2
    fio.position.y = ty
    lampada.add(fio)
  }
  const colar = cylinder(0.092, 0.092, 0.02, PRATA, { roughness: 0.3, metalness: 0.85 })
  colar.position.y = 0.225
  lampada.add(colar)
  const globo = lathe(VIDRO_PERFIL, VIDRO, { roughness: 0.1 })
  lampada.add(globo)

  // ---- brilho: a lâmpada ACESA (some no "apaga") ----------------------------
  const brilho = new THREE.Group()
  brilho.position.set(0, GLOBO_Y, 0)
  brilho.scale.setScalar(0.001) // pose final: apagada
  lampada.add(brilho)
  const casca = lathe(
    VIDRO_PERFIL.map(([r, y]) => [r * 1.04 + 0.006, y - GLOBO_Y + (y === TOPO_Y ? 0.008 : 0)] as [number, number]),
    LUZ,
    { emissive: LUZ, emissiveIntensity: 1.1 },
  )
  brilho.add(casca)
  for (let i = 0; i < 9; i++) {
    const a = -Math.PI * 0.2 + (i / 8) * Math.PI * 1.4
    const raio = capsule(0.022, 0.13, LUZ, { emissive: LUZ, emissiveIntensity: 1.2 })
    raio.position.set(Math.cos(a) * 0.43, Math.sin(a) * 0.43 + 0.02, 0.05)
    raio.rotation.z = a - Math.PI / 2
    brilho.add(raio)
  }

  // ---- fiozinho de fumaça saindo do topo -----------------------------------
  const fumaca = new THREE.Group()
  fumaca.position.set(0, TOPO_Y - 0.01, 0)
  lampada.add(fumaca)
  {
    const curva = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.05, 0.1, 0), new THREE.Vector3(0.02, 0.21, 0),
      new THREE.Vector3(-0.05, 0.31, 0), new THREE.Vector3(-0.02, 0.41, 0), new THREE.Vector3(0.05, 0.48, 0),
    ])
    const N = 48
    const R = 12
    const geo = new THREE.TubeGeometry(curva, N, 1, R, false)
    const pos = geo.attributes.position
    const v = new THREE.Vector3()
    for (let i = 0; i <= N; i++) {
      const c = curva.getPointAt(i / N)
      const raio = 0.012 + 0.03 * Math.pow(i / N, 1.3)
      for (let j = 0; j <= R; j++) {
        const k = i * (R + 1) + j
        v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(raio).add(c)
        pos.setXYZ(k, v.x, v.y, v.z)
      }
    }
    geo.computeVertexNormals()
    const fio = new THREE.Mesh(geo, mat(FUMACA, { roughness: 0.95, size: 0.5 }))
    fio.castShadow = true
    fumaca.add(fio)
    const ponta = sphere(0.042, FUMACA, { roughness: 0.95 })
    ponta.position.copy(curva.getPointAt(1))
    fumaca.add(ponta)
    const base = sphere(0.014, FUMACA, { roughness: 0.95 })
    fumaca.add(base)
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'quarto', group: 'quarto', object: quarto },
    { name: 'interruptor', group: 'quarto', object: interruptor },
    { name: 'tecla', group: 'quarto', object: tecla },
    { name: 'cama', group: 'cama', object: cama },
    { name: 'balde', group: 'cama', object: balde },
    { name: 'leao', group: 'leao', object: leao },
    { name: 'barriga', group: 'leao', object: barriga },
    { name: 'cabeca', group: 'leao', object: cabeca },
    { name: 'nadadeira', group: 'leao', object: nadadeira },
    { name: 'lampada', group: 'lampada', object: lampada },
    { name: 'brilho', group: 'lampada', object: brilho },
    { name: 'gotas', group: 'slek', object: gotas },
    { name: 'fumaca', group: 'apaga', object: fumaca },
  ]

  const s3 = (from: number, to: number) => [
    ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to),
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('quarto-rise', 'quarto', 0, 0.9, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Hora de dormir: sobe do chão um quarto de parede azul-noite, com um interruptor branco.',
    }),
    seq('interruptor-surge', 'interruptor', 0.8, 0.4, s3(0.01, 1), { ease: 'easeOut' }),
    seq('tecla-surge', 'tecla', 0.9, 0.4, s3(0.01, 1), { ease: 'easeOut' }),

    seq('cama-rise', 'cama', 1.7, 0.7, [riseFrom(GY, 0.8)], {
      ease: 'easeOut',
      caption: 'Ao fundo, a cama baixa — e, do lado dela, um balde vermelho de circo com dois peixes.',
    }),
    seq('balde-rise', 'balde', 1.95, 0.6, [riseFrom(GY, 0.7)], { ease: 'easeOut' }),

    seq('leao-rise', 'leao', 3.3, 0.9, [riseFrom(GY, 2.2)], {
      ease: 'easeOut',
      caption: 'Quem divide o quarto com você: um LEÃO-MARINHO aposentado do circo, sentado na cauda, de olhos fechados.',
    }),
    seq('barriga-surge', 'barriga', 3.45, 0.5, s3(0.6, 1), { ease: 'easeOut' }),
    seq('cabeca-surge', 'cabeca', 3.55, 0.5, s3(0.3, 1), { ease: 'easeOut' }),
    seq('nadadeira-surge', 'nadadeira', 3.7, 0.6, s3(0.05, 1), { ease: 'easeOut' }),
    seq('cabeca-ergue', 'cabeca', 4.5, 0.6, [ch('rotation.x', 0, HEAD_UP)]),

    seq('lampada-cai', 'lampada', 5.4, 0.55, [ch('position.y', apoio.y + 1.6, apoio.y)], {
      ease: 'easeIn',
      caption: 'Na ponta do focinho, ele equilibra uma LÂMPADA acesa do tamanho de uma melancia.',
    }),
    seq('lampada-balanca', 'lampada', 5.95, 0.6, [ch('rotation.z', 0.22, 0)], { ease: 'easeOut' }),
    seq('brilho-acende', 'brilho', 5.4, 0.3, s3(0.01, 1), { ease: 'easeOut' }),

    seq('nadadeira-ergue', 'nadadeira', 7.2, 0.6, [ch('rotation.z', 0, BRACO_ALTO)], {
      ease: 'easeOut',
      caption: 'Você berra da cama: "Apaga isso!" — e ele ergue a nadadeira encharcada…',
    }),
    seq('nadadeira-bate', 'nadadeira', 8.4, 0.2, [ch('rotation.z', BRACO_ALTO, 0)], {
      ease: 'easeIn',
      caption: '…que estala no interruptor: SLÉK! — e respinga água na parede inteira.',
    }),
    seq('tecla-desliga', 'tecla', 8.58, 0.08, [ch('rotation.x', TECLA_ON, TECLA_OFF)], { ease: 'linear' }),
    seq('gotas-espirram', 'gotas', 8.58, 0.45, s3(0.01, 1), { ease: 'easeOut' }),

    seq('brilho-apaga', 'brilho', 9.7, 0.35, s3(1, 0.001), {
      ease: 'easeIn',
      caption: 'A LÂMPA… apaga antes de terminar o nome — e ele já ronca NNN no escuro.',
    }),
    seq('fumaca-sobe', 'fumaca', 9.95, 1.0, [
      ...s3(0.01, 1),
      ch('position.y', TOPO_Y - 0.15, TOPO_Y - 0.01),
    ], { ease: 'easeOut' }),
    seq('fumaca-enrola', 'fumaca', 11.3, 0.9, [ch('position.x', 0.05, 0)], {
      caption: 'Släck lampan! — Apaga a luz!',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.85, 3.0, 5.95], target: [-0.22, 1.72, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'slack-lampan',
    contexto:
      "Casa: na hora de dormir, saindo de um cômodo, com as crianças ('Släck lampan nu!') ou com o parceiro que lê até tarde. Na Suécia, apagar a luz ao sair do cômodo é quase regra moral — e 'släcka' também é apagar vela, fogo e cigarro. O oposto: 'Tänd lampan!' (acende a luz).",
    fraseFonte: 'Apaga a luz!',
    fraseAlvo: 'Släck lampan!',
    pronuncia:
      "SLÉK LÁM-pan! ('släck' numa sílaba só: S colado no L, sem 'is' na frente, É ABERTO e curto de 'pé' e K seco — sem NG, que viraria 'slänger', jogar fora; 'lampan' com a força no LAM — A aberto de 'lá', sem o 'ã' fanhoso de 'lâmpada', M de lábios fechados — e o -pan fraco, N na língua e sem nasal: é o artigo, 'A lâmpada'; a ordem sai seca e curta, as duas sílabas fortes batendo: SLÉK! LÁM-pan!)",
    ponteSonora:
      "SLÉK! LÂMPA(da)-NNN! (3 sílabas: SLÉK-LÁM-pan; força no SLÉK e no LÁM — é ordem, sai seco; SLÉK = o tapa ENCHARCADO da nadadeira do leão-marinho no interruptor — o barulho é esse, SLÉK: S colado no L, sem o 'is' que o brasileiro põe antes de S (nada de 'is-LÉK'), É ABERTO e CURTO de 'pé' e K seco no fim, que já trava a língua antes do L seguinte; não confunda com o SLÉNGUER do guaxinim de 'Var slänger man kartong?': lá tem NG e é jogar fora; aqui é K seco e é apagar; LÂMPA(da) = a própria LÂMPADA — o sueco é quase igual —, mas ela apaga antes de terminar o nome e o DA não vem; o A do LAM é ABERTO de 'lá', SEM o 'ã' fanhoso de 'lâmpada' — os lábios fecham no M logo depois do A —, e o -PA fraquinho; NNN = o ronco do leão-marinho, que dorme na hora: no lugar do DA entra um N batido na língua, sem nasal — LÁM-pan; esse N é o artigo colado: 'lampa' é uma lâmpada, 'lampan' é A lâmpada, o mesmo N de IÁK-KAN ('Ta på dig jackan!') e MOÇA-N ('Ta på dig mössan!'))",
    historia:
      "Hora de dormir, e o LEÃO-MARINHO aposentado do circo que divide o apartamento com você não larga a mania: deita equilibrando no focinho uma LÂMPADA acesa do tamanho de uma melancia. Você não aguenta mais a claridade e berra da cama: 'Apaga isso!' Ele estica a nadadeira encharcada e dá um tapa no interruptor — SLÉK! —, tão molhado que respinga água na parede inteira. A LÂMPA... apaga antes de terminar o nome, e ele já ronca NNNN no escuro com ela ainda equilibrada no nariz: apaga a luz!",
  },
  createScene,
  refine: { organic: ['leao', 'barriga', 'cabeca', 'nadadeira'] },
}

export default card
