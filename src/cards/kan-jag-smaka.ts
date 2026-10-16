import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Kan jag smaka?" — CA-NIÁ... SSS-MÁÁ-CA?
 *
 * Corredor de feira: uma MACA de hospital estacionada com uma chapa de ferro
 * em brasa em cima, e nela o queijo coalho chiando (SSS — os fios de vapor).
 * O gafanhoto-do-deserto chega pulando com a CANA mordiscada no ombro (CA-NIÁ!),
 * mas hoje está educado: uma pata na barra da maca, a cabeça debruçada e
 * as antenas esticadas farejando o chiado — SSS-MÁÁÁ-CA? Posso provar?
 *
 * Acento saturado reservado à crosta dourada do queijo (o que ele quer provar).
 */

type V = [number, number, number]
const UP = new THREE.Vector3(0, 1, 0)

// ---- paleta ----------------------------------------------------------------
const REJUNTE = '#9da1a5'
const LAJ = ['#c3c7cb', '#b9bdc2', '#cbced1']
const MADEIRA = '#a97c50'
const MADEIRA_ESC = '#86603e'
const LARANJA = '#d4813a'
const CROMO = '#c9ced4'
const PNEU = '#2a2a2e'
const LENCOL = '#f3f4f2'
const AZUL = '#b9d3e2'
const AZUL_CLARO = '#dce9f1'
const FERRO = '#2b2b2e'
const BRASA = '#ff5a1f'
const MIOLO = '#f2dc9a'
const CROSTA = '#e59a22' // acento saturado: a crosta dourada do coalho
const GRELHA = '#73401a'
const VAPOR = '#f5f7f9'
const PALHA = '#d6bf78'
const PALHA_ESC = '#c4a85e'
const MANCHA = '#86643a'
const OCRE = '#b5853f'
const LISTRA = '#33261b'
const TIBIA = '#c99a48'
const JOELHO = '#2b211a'
const OLHO = '#5a3417'
const ASA = '#b49a6c'
const ASA_MANCHA = '#6c4c2c'
const ANTENA = '#7a5a30'
const CANA = '#7ca045'
const CANA_NO = '#8c6b36'
const FOLHA = '#6f9a3c'
const FOLHA_CLARA = '#8db54c'
const FIBRA = '#ece2b0'

const GY = 0.17 // topo das lajotas

// maca: centro no chão, comprimento ao longo de x
const MX = 0.85
const MZ = 0.3
const COLCHAO = 0.82 // topo do colchão, relativo ao chão
const CX = MX - 0.32 // chapa sobre a metade esquerda do colchão
const CY = GY + COLCHAO

// gafanhoto
const GX = -0.68
const GZ = 0.0
const GROT = 1.3 // gira o +z local para a chapa
const GS = 1.15
const CABECA_FIM = 0.5 // cabeça debruçada (pose final)
const CABECA_ALTA = -0.25 // cabeça erguida no grito de guerra
const ANTENA_ALTA = -0.9 // antenas varridas para cima/trás

/** Cápsula entre os pontos a e b (as calotas passam das pontas: juntas fecham). */
function limb(r: number, a: V, b: V, color: string, opts?: MatOpts) {
  const va = new THREE.Vector3(...a)
  const vb = new THREE.Vector3(...b)
  const d = vb.clone().sub(va)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(va).add(vb).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(UP, d.normalize())
  return m
}

/** Posiciona em a e aponta o +y local para b. */
function aim<T extends THREE.Object3D>(o: T, a: V, b: V): T {
  const va = new THREE.Vector3(...a)
  o.position.copy(va)
  o.quaternion.setFromUnitVectors(UP, new THREE.Vector3(...b).sub(va).normalize())
  return o
}

/** Tubo afunilado ao longo de uma curva suave: vapor, antenas, folhas. */
function tube(points: V[], r0: number, r1: number, color: string, opts?: MatOpts) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)))
  const seg = 48
  const rad = 10
  const geo = new THREE.TubeGeometry(curve, seg, 1, rad, false)
  const pos = geo.attributes.position
  const v = new THREE.Vector3()
  const c = new THREE.Vector3()
  for (let i = 0; i <= seg; i++) {
    const t = i / seg
    curve.getPointAt(t, c)
    const r = r0 + (r1 - r0) * t
    for (let j = 0; j <= rad; j++) {
      const k = i * (rad + 1) + j
      v.fromBufferAttribute(pos, k).sub(c).multiplyScalar(r).add(c)
      pos.setXYZ(k, v.x, v.y, v.z)
    }
  }
  geo.computeVertexNormals()
  const m = new THREE.Mesh(geo, mat(color, { size: 0.3, ...opts }))
  m.castShadow = true
  m.receiveShadow = true
  return m
}

/** Raio de um perfil de lathe na altura y (interpolação linear). */
function radiusAt(profile: [number, number][], y: number) {
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1]
    const [r1, y1] = profile[i]
    if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / Math.max(1e-6, y1 - y0)
  }
  return 0
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(61)

  // ---- piso de lajotas da feira -------------------------------------------
  const piso = new THREE.Group()
  const disco = cylinder(2.55, 2.62, 0.14, REJUNTE, { roughness: 0.85 })
  disco.position.y = 0.07
  piso.add(disco)
  const T = 0.5
  for (let i = -5; i <= 5; i++) {
    for (let j = -5; j <= 5; j++) {
      const cx = i * T
      const cz = j * T
      if (Math.hypot(Math.abs(cx) + T / 2, Math.abs(cz) + T / 2) > 2.58) continue
      const laj = rbox(T - 0.035, 0.03, T - 0.035, 0.01, LAJ[Math.floor(rand() * 3)], { roughness: 0.7 })
      laj.position.set(cx, 0.155, cz)
      piso.add(laj)
    }
  }
  root.add(piso)

  // ---- caixote de laranjas ao fundo ---------------------------------------
  const caixote = new THREE.Group()
  caixote.position.set(-1.8, GY, -0.95)
  caixote.rotation.y = 0.5
  root.add(caixote)
  {
    const W = 0.66
    const D = 0.44
    const fundo = rbox(W - 0.04, 0.03, D - 0.04, 0.01, MADEIRA_ESC, { roughness: 0.8 })
    fundo.position.y = 0.02
    caixote.add(fundo)
    for (const y of [0.1, 0.27]) {
      for (const s of [-1, 1]) {
        const frente = rbox(W, 0.12, 0.03, 0.012, MADEIRA, { roughness: 0.8 })
        frente.position.set(0, y, s * (D / 2 - 0.015))
        caixote.add(frente)
        const lado = rbox(0.03, 0.12, D, 0.012, MADEIRA, { roughness: 0.8 })
        lado.position.set(s * (W / 2 - 0.015), y, 0)
        caixote.add(lado)
      }
    }
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const poste = rbox(0.05, 0.37, 0.05, 0.012, MADEIRA_ESC, { roughness: 0.8 })
        poste.position.set(sx * (W / 2 - 0.02), 0.185, sz * (D / 2 - 0.02))
        caixote.add(poste)
      }
    }
    const pos: V[] = []
    for (let a = 0; a < 4; a++) for (let b = 0; b < 3; b++) pos.push([-0.225 + a * 0.15, 0.3, -0.13 + b * 0.13])
    pos.push([-0.15, 0.41, -0.06], [0.0, 0.42, 0.04], [0.14, 0.41, -0.05], [0.06, 0.4, -0.12])
    for (const [x, y, z] of pos) {
      const lar = sphere(0.075, LARANJA, { roughness: 0.6 })
      lar.position.set(x + (rand() - 0.5) * 0.02, y, z + (rand() - 0.5) * 0.02)
      caixote.add(lar)
      const cabinho = sphere(0.014, '#4f6b2a', { roughness: 0.7 })
      cabinho.position.set(lar.position.x, y + 0.072, lar.position.z)
      caixote.add(cabinho)
    }
  }

  // ---- MACA de hospital ----------------------------------------------------
  const maca = new THREE.Group()
  maca.position.set(MX, GY, MZ)
  root.add(maca)
  {
    const L = 1.7
    const W = 0.62
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const x = sx * 0.72
        const z = sz * 0.24
        const roda = cylinder(0.065, 0.065, 0.045, PNEU, { roughness: 0.6 })
        roda.rotation.x = Math.PI / 2
        roda.position.set(x, 0.065, z)
        maca.add(roda)
        const cubo = cylinder(0.025, 0.025, 0.05, CROMO, { roughness: 0.25, metalness: 0.85 })
        cubo.rotation.x = Math.PI / 2
        cubo.position.set(x, 0.065, z)
        maca.add(cubo)
        const garfo = rbox(0.035, 0.1, 0.06, 0.01, CROMO, { roughness: 0.25, metalness: 0.85 })
        garfo.position.set(x, 0.14, z)
        maca.add(garfo)
        const perna = cylinder(0.022, 0.022, 0.5, CROMO, { roughness: 0.25, metalness: 0.85 })
        perna.position.set(x, 0.42, z)
        maca.add(perna)
      }
    }
    for (const sz of [-1, 1]) {
      const barra = cylinder(0.018, 0.018, 1.44, CROMO, { roughness: 0.25, metalness: 0.85 })
      barra.rotation.z = Math.PI / 2
      barra.position.set(0, 0.25, sz * 0.24)
      maca.add(barra)
    }
    const estrado = rbox(L, 0.05, W, 0.02, CROMO, { roughness: 0.3, metalness: 0.8 })
    estrado.position.y = 0.665
    maca.add(estrado)

    const colchao = rbox(L - 0.04, 0.13, W - 0.04, 0.05, LENCOL, { roughness: 0.85 })
    colchao.position.y = COLCHAO - 0.065
    maca.add(colchao)

    // lençol azul dobrado na metade direita + travesseiro
    const coberta = rbox(0.66, 0.05, W, 0.022, AZUL, { roughness: 0.9 })
    coberta.position.set(0.48, COLCHAO + 0.015, 0)
    maca.add(coberta)
    const dobra = capsule(0.035, W - 0.06, AZUL, { roughness: 0.9 })
    dobra.rotation.x = Math.PI / 2
    dobra.position.set(0.16, COLCHAO + 0.03, 0)
    maca.add(dobra)
    const travesseiro = rbox(0.3, 0.1, 0.46, 0.05, AZUL_CLARO, { roughness: 0.9 })
    travesseiro.position.set(0.66, COLCHAO + 0.085, 0)
    travesseiro.rotation.z = -0.08
    maca.add(travesseiro)

    // barra de empurrar na cabeceira esquerda (onde o gafanhoto se apoia)
    for (const sz of [-1, 1]) {
      const haste = cylinder(0.016, 0.016, 0.34, CROMO, { roughness: 0.25, metalness: 0.85 })
      haste.position.set(-L / 2 - 0.01, 0.84, sz * 0.24)
      maca.add(haste)
    }
    const barra = cylinder(0.02, 0.02, 0.52, CROMO, { roughness: 0.25, metalness: 0.85 })
    barra.rotation.x = Math.PI / 2
    barra.position.set(-L / 2 - 0.01, 1.0, 0)
    maca.add(barra)

    // grade lateral do fundo
    const grade = cylinder(0.016, 0.016, 1.1, CROMO, { roughness: 0.25, metalness: 0.85 })
    grade.rotation.z = Math.PI / 2
    grade.position.set(0.15, COLCHAO + 0.12, -0.335)
    maca.add(grade)
    for (const x of [-0.35, 0.65]) {
      const haste = cylinder(0.014, 0.014, 0.3, CROMO, { roughness: 0.25, metalness: 0.85 })
      haste.position.set(x, COLCHAO - 0.03, -0.335)
      maca.add(haste)
    }

    // suporte de soro: diz "hospital" de longe
    const poste = cylinder(0.014, 0.014, 1.2, CROMO, { roughness: 0.25, metalness: 0.85 })
    poste.position.set(0.8, 1.27, -0.36)
    maca.add(poste)
    const cruz = cylinder(0.01, 0.01, 0.28, CROMO, { roughness: 0.25, metalness: 0.85 })
    cruz.rotation.z = Math.PI / 2
    cruz.position.set(0.8, 1.86, -0.36)
    maca.add(cruz)
    const bolsa = rbox(0.13, 0.2, 0.05, 0.03, '#d8ecf4', { roughness: 0.3 })
    bolsa.position.set(0.9, 1.71, -0.36)
    maca.add(bolsa)
    const rotulo = rbox(0.07, 0.06, 0.006, 0.002, '#ffffff', { roughness: 0.5 })
    rotulo.position.set(0.9, 1.72, -0.333)
    maca.add(rotulo)
    const equipo = tube([[0.9, 1.6, -0.36], [0.92, 1.3, -0.33], [0.86, 1.05, -0.3], [0.78, 0.92, -0.26]], 0.006, 0.006, '#e6eef2', { roughness: 0.3 })
    maca.add(equipo)
  }

  // ---- chapa de ferro em brasa -------------------------------------------
  const chapa = new THREE.Group()
  chapa.position.set(CX, CY, MZ)
  root.add(chapa)
  {
    for (const sx of [-1, 1]) {
      for (const sz of [-1, 1]) {
        const pe = cylinder(0.022, 0.026, 0.045, FERRO, { roughness: 0.5, metalness: 0.5 })
        pe.position.set(sx * 0.34, 0.0225, sz * 0.19)
        chapa.add(pe)
      }
    }
    const brasa = rbox(0.74, 0.014, 0.42, 0.006, BRASA, { emissive: BRASA, emissiveIntensity: 1.3 })
    brasa.position.y = 0.04
    chapa.add(brasa)
    const placa = rbox(0.8, 0.045, 0.48, 0.015, FERRO, { roughness: 0.45, metalness: 0.55 })
    placa.position.y = 0.0675
    chapa.add(placa)
    for (let i = 0; i < 7; i++) {
      const friso = rbox(0.022, 0.012, 0.44, 0.005, '#3a3a3e', { roughness: 0.4, metalness: 0.55 })
      friso.position.set(-0.33 + i * 0.11, 0.094, 0)
      chapa.add(friso)
    }
    for (const sx of [-1, 1]) {
      const alca = rbox(0.07, 0.025, 0.2, 0.01, FERRO, { roughness: 0.45, metalness: 0.55 })
      alca.position.set(sx * 0.43, 0.075, 0)
      chapa.add(alca)
    }
  }

  // ---- fatias de queijo coalho --------------------------------------------
  const queijo = new THREE.Group()
  queijo.position.set(CX, CY, MZ)
  root.add(queijo)
  const FATIAS = [-0.28, -0.095, 0.095, 0.28]
  for (const x of FATIAS) {
    const fatia = new THREE.Group()
    fatia.position.set(x, 0.1, (rand() - 0.5) * 0.05)
    fatia.rotation.y = (rand() - 0.5) * 0.18
    const corpo = rbox(0.15, 0.05, 0.3, 0.018, MIOLO, { roughness: 0.6 })
    corpo.position.y = 0.025
    fatia.add(corpo)
    const crosta = rbox(0.154, 0.014, 0.304, 0.007, CROSTA, { roughness: 0.45 })
    crosta.position.y = 0.05
    fatia.add(crosta)
    for (const z of [-0.085, 0, 0.085]) {
      const marca = rbox(0.13, 0.008, 0.024, 0.003, GRELHA, { roughness: 0.6 })
      marca.position.set(0, 0.058, z)
      marca.rotation.y = 0.45
      fatia.add(marca)
    }
    queijo.add(fatia)
  }

  // ---- fios de vapor: o SSS do chiado -------------------------------------
  const vapor = new THREE.Group()
  vapor.position.set(CX, CY + 0.15, MZ)
  root.add(vapor)
  FATIAS.forEach((x, i) => {
    const h = 0.55 + (i % 2) * 0.15
    const w = 0.035 * (i % 2 ? 1 : -1)
    const fio = tube(
      [[x, 0, 0], [x + w, h * 0.25, 0.01], [x - w, h * 0.5, -0.01], [x + w, h * 0.75, 0.01], [x, h, 0]],
      0.03, 0.006, VAPOR, { roughness: 0.9 },
    )
    vapor.add(fio)
  })

  // ---- GAFANHOTO-DO-DESERTO ------------------------------------------------
  // tudo em coordenadas locais (+z = para onde olha); o grupo gira para a chapa
  const gafanhoto = new THREE.Group()
  gafanhoto.position.set(GX, GY, GZ)
  gafanhoto.rotation.y = GROT
  gafanhoto.scale.setScalar(GS)
  root.add(gafanhoto)

  const H: V = [0, 0.72, -0.05] // quadril
  const N: V = [0, 1.13, 0.3] // pescoço
  const PONTA: V = [0, 0.12, -0.52] // ponta do abdome

  // tórax inclinado para a frente
  gafanhoto.add(limb(0.16, H, N, PALHA, { roughness: 0.6 }))
  const colar = sphere(0.125, PALHA, { roughness: 0.6 })
  colar.position.set(...N)
  gafanhoto.add(colar)

  // pronoto: a "sela" sobre o tórax
  const pronoto = sphere(0.2, PALHA_ESC, { roughness: 0.6 })
  pronoto.scale.set(1.08, 1.3, 1.0)
  pronoto.rotation.x = 0.707
  pronoto.position.set(0, 1.01, 0.147)
  gafanhoto.add(pronoto)
  for (const [a, y] of [[2.0, 0.35], [2.5, -0.2], [-2.0, 0.3], [-2.6, -0.25], [3.14, 0.1]] as const) {
    const m = sphere(0.045, MANCHA, { roughness: 0.65 })
    m.position.set(Math.sin(a) * 0.185, y * 0.19, Math.cos(a) * 0.185)
    pronoto.add(m)
  }

  // abdome comprido, anelado e manchado
  const perfilAbd: [number, number][] = [
    [0, 0], [0.06, 0.01], [0.11, 0.07], [0.15, 0.2], [0.165, 0.38], [0.155, 0.55], [0.12, 0.66], [0, 0.72],
  ]
  const abdome = aim(lathe(perfilAbd, PALHA, { roughness: 0.6 }), PONTA, H)
  gafanhoto.add(abdome)
  for (const h of [0.14, 0.24, 0.34, 0.44, 0.54]) {
    const anel = torus(radiusAt(perfilAbd, h) + 0.002, 0.012, PALHA_ESC, { roughness: 0.6 })
    anel.rotation.x = Math.PI / 2
    anel.position.y = h
    abdome.add(anel)
  }
  for (const [h, a] of [[0.2, 2.6], [0.32, -2.4], [0.45, 2.9], [0.3, 1.9]] as const) {
    const r = radiusAt(perfilAbd, h)
    const m = sphere(0.04, MANCHA, { roughness: 0.65 })
    m.position.set(Math.sin(a) * (r - 0.015), h, Math.cos(a) * (r - 0.015))
    abdome.add(m)
  }

  // patas da frente: a de perto segura a cana, a de longe apoia na maca
  const MAO_CANA: V = [-0.26, 1.0, 0.5]
  gafanhoto.add(limb(0.045, [-0.12, 0.92, 0.22], [-0.25, 0.8, 0.36], PALHA, { roughness: 0.6 }))
  gafanhoto.add(limb(0.04, [-0.25, 0.8, 0.36], MAO_CANA, PALHA, { roughness: 0.6 }))
  const maoE = sphere(0.055, OCRE, { roughness: 0.6 })
  maoE.position.set(...MAO_CANA)
  gafanhoto.add(maoE)
  const MAO_MACA: V = [0.09, 0.85, 0.58]
  gafanhoto.add(limb(0.045, [0.12, 0.92, 0.22], [0.25, 0.94, 0.4], PALHA, { roughness: 0.6 }))
  gafanhoto.add(limb(0.04, [0.25, 0.94, 0.4], MAO_MACA, PALHA, { roughness: 0.6 }))
  const maoD = sphere(0.055, OCRE, { roughness: 0.6 })
  maoD.scale.set(1.1, 1, 1.1)
  maoD.position.set(...MAO_MACA)
  gafanhoto.add(maoD)

  // patas do meio, pequenas e dobradas
  for (const s of [-1, 1]) {
    gafanhoto.add(limb(0.038, [s * 0.13, 0.8, 0.06], [s * 0.3, 0.7, 0.14], PALHA, { roughness: 0.6 }))
    gafanhoto.add(limb(0.032, [s * 0.3, 0.7, 0.14], [s * 0.34, 0.46, 0.22], PALHA, { roughness: 0.6 }))
  }

  // ---- patas traseiras enormes em zigue-zague (pivô no quadril) ------------
  const QUADRIL: V = [0, 0.72, -0.08]
  const patas = new THREE.Group()
  patas.position.set(...QUADRIL)
  gafanhoto.add(patas)
  const rel = (p: V): V => [p[0] - QUADRIL[0], p[1] - QUADRIL[1], p[2] - QUADRIL[2]]
  for (const s of [-1, 1]) {
    const hip: V = [s * 0.17, 0.72, -0.08]
    const knee: V = [s * 0.29, 1.12, -0.62]
    const ankle: V = [s * 0.26, 0.07, 0.04]
    const toe: V = [s * 0.26, 0.045, 0.32]
    const len = new THREE.Vector3(...knee).sub(new THREE.Vector3(...hip)).length()
    const k = len / 0.56
    const perfilFemur: [number, number][] = (
      [[0, 0], [0.08, 0.01], [0.125, 0.07], [0.13, 0.18], [0.11, 0.34], [0.075, 0.47], [0.055, 0.53], [0, 0.56]] as [number, number][]
    ).map(([r, y]) => [r, y * k])
    const femur = aim(lathe(perfilFemur, OCRE, { roughness: 0.6 }), rel(hip), rel(knee))
    patas.add(femur)
    // espinha-de-peixe na face de fora da coxa
    for (const h of [0.14, 0.24, 0.34, 0.44]) {
      for (const lado of [-1, 1]) {
        const r = radiusAt(perfilFemur, h * k)
        const listra = capsule(0.011, 0.055, LISTRA, { roughness: 0.6 })
        listra.position.set(s * (r - 0.006), h * k, lado * r * 0.28)
        listra.rotation.x = lado * 0.75
        femur.add(listra)
      }
    }
    const joelho = sphere(0.06, JOELHO, { roughness: 0.5 })
    joelho.position.set(...rel(knee))
    patas.add(joelho)
    const tibia = limb(0.034, rel(knee), rel(ankle), TIBIA, { roughness: 0.6 })
    patas.add(tibia)
    for (let i = 0; i < 5; i++) {
      const espinho = cone(0.013, 0.055, JOELHO, { roughness: 0.5 })
      espinho.rotation.x = Math.PI / 2
      espinho.position.set(0, -0.35 + i * 0.15, 0.04)
      tibia.add(espinho)
    }
    patas.add(limb(0.032, rel(ankle), rel(toe), TIBIA, { roughness: 0.6 }))
    for (const dz of [0.1, 0.2]) {
      const almofada = sphere(0.04, OCRE, { roughness: 0.6 })
      almofada.scale.set(1, 0.7, 1)
      almofada.position.set(...rel([toe[0], 0.04, ankle[2] + dz]))
      patas.add(almofada)
    }
    const garra = cone(0.022, 0.07, JOELHO, { roughness: 0.5 })
    garra.rotation.x = Math.PI / 2
    garra.position.set(...rel([toe[0], 0.045, toe[2] + 0.05]))
    patas.add(garra)
  }

  // ---- asas dobradas nas costas -------------------------------------------
  const asas = new THREE.Group()
  gafanhoto.add(asas)
  for (const s of [-1, 1]) {
    const asa = sphere(1, ASA, { roughness: 0.55, size: 0.6 })
    asa.scale.set(0.12, 0.6, 0.03)
    asa.rotation.set(0.665, -s * 0.4, 0)
    asa.position.set(s * 0.075, 0.57, -0.36)
    for (const [mx, my] of [[0.2, 0.5], [-0.3, 0.25], [0.35, -0.05], [-0.15, -0.3], [0.25, -0.55], [-0.35, 0.65]] as const) {
      const pinta = sphere(0.16, ASA_MANCHA, { roughness: 0.6 })
      pinta.position.set(mx, my, -Math.sqrt(Math.max(0, 1 - mx * mx - my * my)) * 0.92)
      asa.add(pinta)
    }
    asas.add(asa)
  }

  // ---- cabeça: cara comprida, olhões castanhos ----------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.17, 0.34)
  cabeca.rotation.x = CABECA_FIM
  gafanhoto.add(cabeca)
  {
    const cranio = sphere(0.21, PALHA, { roughness: 0.6 })
    cranio.scale.set(0.86, 1.32, 1.0)
    cranio.position.set(0, 0.13, 0.1)
    cabeca.add(cranio)
    const cara = sphere(0.14, PALHA, { roughness: 0.6 })
    cara.scale.set(0.88, 1.4, 0.8)
    cara.position.set(0, -0.02, 0.2)
    cabeca.add(cara)
    const faixa = sphere(0.07, PALHA_ESC, { roughness: 0.6 })
    faixa.scale.set(0.8, 2.2, 0.8)
    faixa.position.set(0, 0.2, 0.25)
    cabeca.add(faixa)
    const labio = sphere(0.075, MANCHA, { roughness: 0.55 })
    labio.scale.set(1.2, 0.7, 0.9)
    labio.position.set(0, -0.19, 0.22)
    cabeca.add(labio)
    for (const s of [-1, 1]) {
      const mandibula = sphere(0.045, '#6b4d2c', { roughness: 0.5 })
      mandibula.position.set(s * 0.06, -0.21, 0.19)
      cabeca.add(mandibula)
      const olho = sphere(0.095, OLHO, { roughness: 0.18 })
      olho.scale.set(0.72, 1.15, 0.92)
      olho.position.set(s * 0.155, 0.22, 0.17)
      cabeca.add(olho)
      const brilho = sphere(0.022, '#ffffff', { roughness: 0.1 })
      brilho.position.set(s * 0.19, 0.29, 0.235)
      cabeca.add(brilho)
    }
  }

  // ---- antenas (filhas da cabeça) -----------------------------------------
  const antenas = new THREE.Group()
  antenas.position.set(0, 0.3, 0.26)
  cabeca.add(antenas)
  for (const s of [-1, 1]) {
    const base = sphere(0.025, ANTENA, { roughness: 0.6 })
    base.position.set(s * 0.05, 0, 0)
    antenas.add(base)
    antenas.add(
      tube(
        [[s * 0.05, 0, 0], [s * 0.09, 0.1, 0.15], [s * 0.13, 0.1, 0.35], [s * 0.16, 0.0, 0.52], [s * 0.18, -0.12, 0.62]],
        0.018, 0.01, ANTENA, { roughness: 0.6 },
      ),
    )
  }

  // ---- cana-de-açúcar mordiscada no ombro ---------------------------------
  const cana = new THREE.Group()
  cana.position.set(...MAO_CANA)
  cana.rotation.set(-1.088, 0, -0.125) // repousa no ombro, ponta para trás e para cima
  gafanhoto.add(cana)
  {
    const nos = [-0.05, 0.22, 0.49, 0.76, 1.03, 1.3]
    // pedaço de baixo, roído até a fibra
    const roido = cylinder(0.03, 0.036, 0.25, FIBRA, { roughness: 0.85 })
    roido.position.y = -0.18
    cana.add(roido)
    const casca = cylinder(0.043, 0.043, 0.06, CANA, { roughness: 0.55 })
    casca.position.y = -0.09
    cana.add(casca)
    for (let i = 0; i < nos.length - 1; i++) {
      const gomo = cylinder(0.042, 0.045, nos[i + 1] - nos[i], CANA, { roughness: 0.5 })
      gomo.position.y = (nos[i] + nos[i + 1]) / 2
      cana.add(gomo)
    }
    for (const y of nos) {
      const no = torus(0.045, 0.012, CANA_NO, { roughness: 0.6 })
      no.rotation.x = Math.PI / 2
      no.position.y = y
      cana.add(no)
    }
    for (const [y, a] of [[0.06, 0.8], [0.13, 2.4]] as const) {
      const mordida = sphere(0.03, FIBRA, { roughness: 0.85 })
      mordida.position.set(Math.sin(a) * 0.028, y, Math.cos(a) * 0.028)
      cana.add(mordida)
    }
    const topo = cylinder(0.03, 0.04, 0.12, FOLHA, { roughness: 0.6 })
    topo.position.y = 1.36
    cana.add(topo)
    for (let k = 0; k < 7; k++) {
      const a = (k / 7) * Math.PI * 2 + rand() * 0.4
      const dx = Math.cos(a)
      const dz = Math.sin(a)
      const r = 0.28 + rand() * 0.12
      cana.add(
        tube(
          [[0, 1.4, 0], [dx * 0.06, 1.6, dz * 0.06], [dx * r * 0.6, 1.72, dz * r * 0.6], [dx * r, 1.62, dz * r], [dx * r * 1.25, 1.45, dz * r * 1.25]],
          0.022, 0.004, k % 2 ? FOLHA : FOLHA_CLARA, { roughness: 0.6 },
        ),
      )
    }
  }

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'piso', group: 'feira', object: piso },
    { name: 'caixote', group: 'feira', object: caixote },
    { name: 'maca', group: 'maca', object: maca },
    { name: 'chapa', group: 'chapa', object: chapa },
    { name: 'queijo', group: 'chapa', object: queijo },
    { name: 'vapor', group: 'sss', object: vapor },
    { name: 'gafanhoto', group: 'gafanhoto', object: gafanhoto },
    { name: 'patas', group: 'gafanhoto', object: patas },
    { name: 'asas', group: 'gafanhoto', object: asas },
    { name: 'cabeca', group: 'gafanhoto', object: cabeca },
    { name: 'antenas', group: 'gafanhoto', object: antenas },
    { name: 'cana', group: 'cana', object: cana },
  ]

  // ---- montagem ------------------------------------------------------------
  const pop = (from: number) => [ch('scale.x', from, 1), ch('scale.y', from, 1), ch('scale.z', from, 1)]
  const build = [
    seq('piso-sobe', 'piso', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Um corredor de feira sobe do chão: lajotas cinza e um caixote de laranjas lá atrás.',
    }),
    seq('caixote-sobe', 'caixote', 0.35, 0.7, [riseFrom(GY, 0.9)], { ease: 'easeOut' }),

    seq('maca-chega', 'maca', 1.6, 1.1, [ch('position.x', 3.8, MX)], {
      ease: 'easeOut',
      caption: 'Alguém estacionou ali no meio uma MACA de hospital — MÁ-CA, com a força no MÁ.',
    }),

    seq('chapa-cai', 'chapa', 3.2, 0.5, [ch('position.y', CY + 0.9, CY)], {
      ease: 'easeIn',
      caption: 'Em cima do colchão, uma chapa de ferro em brasa, com fatias de queijo coalho dourando…',
    }),
    seq('queijo-cresce', 'queijo', 3.75, 0.5, pop(0.01), { ease: 'easeOut' }),

    seq('vapor-sobe', 'vapor', 4.7, 0.9, [ch('scale.y', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…e chiando sem parar: SSSSS!',
    }),

    seq('pula-x', 'gafanhoto', 6.0, 0.8, [ch('position.x', GX - 2.6, GX)], {
      ease: 'linear',
      caption: 'Chega pulando um gafanhoto-do-deserto enorme, a praga famosa dos canaviais…',
    }),
    seq('pula-y', 'gafanhoto', 6.0, 0.8, [ch('position.y', GY + 1.5, GY)], { ease: 'easeIn' }),
    seq('patas-pousam', 'patas', 6.0, 0.95, [ch('rotation.x', 0.6, 0)], { ease: 'easeOut' }),
    seq('asas-fecham', 'asas', 6.0, 0.95, [ch('scale.x', 2.2, 1)], { ease: 'easeOut' }),
    seq('cabeca-chega', 'cabeca', 6.0, 0.8, [ch('rotation.x', CABECA_ALTA, CABECA_ALTA)]),
    seq('antenas-chegam', 'antenas', 6.0, 0.8, [ch('rotation.x', ANTENA_ALTA, ANTENA_ALTA)]),

    seq('cana-baixa', 'cana', 7.6, 1.1, [ch('rotation.x', 0.25, -1.088), ...pop(0.3)], {
      ease: 'easeOut',
      caption: '…com uma CANA-de-açúcar mordiscada no ombro, feito lança. Grito de guerra: CA-NIÁ!',
    }),

    seq('cabeca-debruca', 'cabeca', 9.4, 1.1, [ch('rotation.x', CABECA_ALTA, CABECA_FIM)], {
      ease: 'easeInOut',
      caption: 'Mas hoje ele está educado: em vez de devorar tudo, se debruça na beirada da maca…',
    }),

    seq('antenas-esticam', 'antenas', 11.0, 0.8, [ch('rotation.x', ANTENA_ALTA, 0)], {
      ease: 'easeOut',
      caption: '…fareja o chiado com as antenas e pergunta, esticando o A de vontade: SSS-MÁÁÁ-CA?',
    }),

    seq('vapor-chia', 'vapor', 12.5, 0.6, [ch('scale.y', 1.25, 1)], {
      ease: 'easeOut',
      caption: 'Kan jag smaka? — Posso provar?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.2, 1.75, 4.1], target: [0.15, 1.1, 0.1] },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-smaka',
    contexto:
      "Comida: no balcão de queijos e frios do mercado (ostdisken, chark), na feira de Natal (julmarknad) cheia de amostras, ou quando alguém na mesa serve uma coisa que você nunca viu — sill, kalops, prinskorv. A resposta costuma vir com o garfinho: 'Ja, smaka på!' (prova aí!).",
    fraseFonte: 'Posso provar?',
    fraseAlvo: 'Kan jag smaka?',
    pronuncia:
      "kan iá SMÁÁ-ka? ('kan jag' = ka-niá, o -g não soa; 'smaka' com o S colado direto no M — nada de 'is' na frente —, A LONGO e toda a força no SMÁ, e o -ka fraquinho, K duro; com A curto vira 'smacka', estalar os beiços)",
    ponteSonora:
      "CA-NIÁ... SSS-MÁÁ-CA? (4 sílabas: ca-niá-SMÁÁ-ka; a força toda no SMÁ; CA-NIÁ é a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag betala med kort?', 'Kan jag byta den här?' e 'Kan jag få menyn?', emendado — I de IOGA, nunca o J chiado de 'canja'; SSS = o chiado do queijo coalho na chapa, S de cobra GRUDADO direto no M, sem vogal nenhuma no meio — o brasileiro tende a enfiar um 'is' antes de S + consoante ('is-maca'), e aqui o chiado já desemboca na MACA; MÁÁ-CA = a MACA de hospital, que o português já fala com a força no MÁ e o A aberto — só ESTIQUE o MÁ, A LONGO: com A curto vira 'smacka', que é estalar os beiços, outra palavra; CA fraquinho, K duro de 'casa'; termina em -A, o infinitivo que vem depois de 'kan jag' — nunca 'smakar'; e não é o SMÁÁC do beijo de chef da baleia de 'Smaklig måltid', que para seco no K: aqui o MÁÁ escorrega pro -CA)",
    historia:
      'No corredor da feira, alguém estacionou uma MACA de hospital com uma chapa de ferro em brasa em cima — e nela fatias de queijo coalho dourando e chiando: SSSS... O gafanhoto-do-deserto, praga famosa de canavial, chega pulando com uma CANA-de-açúcar já mordiscada no ombro, feito lança, e solta o grito de guerra: CA-NIÁ! Mas hoje ele está educado: antes de devorar a maca inteira, se debruça na beirada, fareja o chiado com as antenas tremendo e pergunta, esticando o A de tanta vontade: SSS-MÁÁÁ-CA? — Posso provar?',
  },
  createScene,
  refine: { organic: ['gafanhoto', 'patas', 'cabeca'] },
}

export default card
