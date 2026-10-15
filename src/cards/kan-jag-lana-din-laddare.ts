import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, puff,
} from '../rig/helpers'

/**
 * "Kan jag låna din laddare?" — CA-NIÁ, LÔ-NA... DIN! LÁDA-re?
 *
 * Garagem do prédio. A iguana do quarto andar (CANA + IÁ), de pé, com um toco
 * de CANA atravessado na boca, enrolou o rabo na ponta da LONA cinza e a
 * arrancou de cima de um LADA quadradão verde-musgo de placa LADDARE. Na pata,
 * o plugue gigante do carregador do carro encostado num celular minúsculo,
 * que acende num anel de luz verde: DIN!
 *
 * Diorama: piso de concreto com faixas amarelas de vaga; Lada à esquerda em
 * 3/4 (frente e placa viradas pra câmera, lado direito pra iguana); poste de
 * recarga atrás, à direita, com o cabo em curva até a pata; iguana grande no
 * centro-direita. O acento saturado (verde neon emissivo) é RESERVADO ao DIN:
 * anel, tela acesa e a luzinha do poste.
 */

const CONCRETO = '#9b9994'
const CONCRETO_ESC = '#85837e'
const JUNTA = '#6f6d69'
const FAIXA = '#d6b24a'
const LADA = '#5b6a40'
const LADA_ESC = '#414d2d'
const CROMO = '#d0d5d9'
const BORRACHA = '#26282b'
const VIDRO = '#2a3845'
const PNEU = '#232527'
const FAROL = '#eef0e4'
const LANTERNA = '#b33b2d'
const PLACA = '#f4f2ea'
const LETRA = '#1c2228'
const EU = '#2a56b0'
const LONA = '#50555b'
const LONA_ESC = '#3b3f44'
const POSTE = '#c5cacd'
const POSTE_ESC = '#3f454c'
const CABO = '#1d1f22'
const IGUANA = '#5aa63c'
const IGUANA_ESC = '#3e7d2c'
const BARRIGA = '#b3cd6a'
const CRISTA = '#a9c65a'
const LISTRA = '#6e5131'
const PAPADA = '#dc7a36'
const ESCUDO = '#d4dfb9'
const OURO = '#e3ab32'
const CANA = '#bcc862'
const CANA_NO = '#7d8f36'
const CANA_MIOLO = '#ece6bf'
const NEON = '#7dff5e' // acento RESERVADO: o DIN (anel, tela acesa, luz do poste)

const GY = 0.14 // topo do piso de concreto
const ROOF = 1.25 // teto da cabine do Lada
const BELT = 0.82 // linha de cintura (topo da carroceria)
const WR = 0.25 // raio da roda

// disposição no diorama (mundo)
const CAR = { x: -0.9, z: -0.12, r: -0.3, s: 0.88 }
// com o carro em escala s, sobe (1-s)·GY para que o chão do carro (GY local) caia no piso
const CAR_Y = GY * (1 - CAR.s)
const IGU = { x: 0.74, z: 0.75, r: 0.25, s: 1.1 }
const POST = { x: 1.85, z: -0.1, r: -0.55 }
const TIP_L = { x: 1.22, z: 0.3 } // ponta da lona no referencial do carro: o rabo enrola aqui

const Y = new THREE.Vector3(0, 1, 0)

const CAM: [number, number, number] = [0.12, 2.15, 4.7]
const CAM_TARGET: [number, number, number] = [0.12, 1.0, 0.2]
const CAM_AZ = Math.atan2(CAM[0] - IGU.x, CAM[2] - IGU.z) // de onde a iguana vê a câmera
const HEAD_YAW = 0.2 // cabeça em relação ao corpo: 3/4 mostra focinho e papada

/** Cápsula entre dois pontos — membros, sobrancelhas, dedos. */
function limb(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(Y, d.normalize())
  return m
}

const v3 = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Letras de traço grosso da placa: L A D R E. */
function glyph(which: string, h: number, color: string) {
  const g = new THREE.Group()
  const t = h * 0.21
  const w = h * 0.64
  const d = 0.014
  const s = (sw: number, sh: number, x: number, y: number, rot = 0) => {
    const b = rbox(sw, sh, d, Math.min(sw, sh) * 0.3, color, { roughness: 0.5 })
    b.position.set(x, y, 0)
    b.rotation.z = rot
    g.add(b)
  }
  const arc = (R: number, cx: number, cy: number) => {
    const m = new THREE.Mesh(
      new THREE.TorusGeometry(R, t / 2, 10, 24, Math.PI),
      mat(color, { roughness: 0.5, size: h }),
    )
    m.castShadow = true
    m.rotation.z = -Math.PI / 2 // meia-volta do lado direito
    m.position.set(cx, cy, 0)
    m.scale.z = d / t
    g.add(m)
  }
  const top = h / 2 - t / 2
  const left = -w / 2 + t / 2
  switch (which) {
    case 'L':
      s(t, h, left, 0)
      s(w, t, 0, -top)
      break
    case 'E':
      s(t, h, left, 0)
      s(w, t, 0, top)
      s(w * 0.78, t, -w * 0.11, 0)
      s(w, t, 0, -top)
      break
    case 'A': {
      const leg = Math.hypot(h, w / 2) * 1.02
      const ang = Math.atan2(w / 2 - t / 2, h)
      s(t, leg, -w / 4 + t / 4, 0, -ang)
      s(t, leg, w / 4 - t / 4, 0, ang)
      s(w * 0.5, t * 0.85, 0, -h * 0.14)
      break
    }
    case 'D': {
      const R = top
      const cx = left + t * 0.1
      s(t, h, left, 0)
      arc(R, cx, 0)
      break
    }
    case 'R': {
      const R = (h / 2 - t / 2) / 2 // raio da barriga (meia altura de cima)
      const bx = w / 2 - t / 2 - R
      s(t, h, left, 0)
      s(bx - left, t, (left + bx) / 2, 2 * R)
      s(bx - left, t, (left + bx) / 2, 0)
      arc(R, bx, R)
      const fx = w / 2 - t / 2
      const fy = -h / 2 + t / 2
      const sx0 = bx - t * 0.4
      s(t, Math.hypot(fx - sx0, fy) * 1.05, (sx0 + fx) / 2, fy / 2, Math.atan2(fx - sx0, -fy))
      break
    }
  }
  return g
}

/** Lona: folha drapeada (no espaço do carro) do teto, pela lateral, até a ponta no chão. */
function lonaSheet(tip: THREE.Vector3) {
  const cross = new THREE.CatmullRomCurve3(
    [
      v3(-0.36, ROOF + 0.02, 0),
      v3(0.1, ROOF + 0.035, 0),
      v3(0.47, ROOF + 0.02, 0),
      v3(0.61, ROOF - 0.07, 0),
      v3(0.635, ROOF - 0.28, 0),
      v3(0.72, BELT - 0.02, 0),
      v3(0.76, 0.56, 0),
      v3(0.81, 0.31, 0),
      v3(0.95, GY + 0.035, 0),
      v3(1.07, GY + 0.016, 0),
    ],
    false,
    'centripetal',
  )
  const NU = 34
  const NV = 52
  const SF = 0.8 // fração da folha que segue o carro; o resto converge à ponta
  const pos: number[] = []
  const uv: number[] = []
  const grid: THREE.Vector3[][] = []
  const end = cross.getPointAt(1)
  const smooth = (e: number) => e * e * (3 - 2 * e)
  for (let j = 0; j <= NV; j++) {
    const s = j / NV
    const row: THREE.Vector3[] = []
    for (let i = 0; i <= NU; i++) {
      const u = i / NU
      let p: THREE.Vector3
      if (s <= SF) {
        const q = s / SF
        const c = cross.getPointAt(q)
        const tg = cross.getTangentAt(q)
        const n = v3(-tg.y, tg.x, 0).normalize()
        const zA = THREE.MathUtils.lerp(-0.98, -1.14, q)
        const zB = THREE.MathUtils.lerp(0.0, 0.24, q)
        const amp = 0.008 + 0.06 * THREE.MathUtils.smoothstep(q, 0.18, 0.6)
        // dobras de pano pendurado: só estufam pra fora (nunca entram no carro)
        const wave = 0.65 * Math.sin(u * Math.PI * 2 * 4.2 + q * 1.4) + 0.35 * Math.sin(u * Math.PI * 2 * 7.3 + 0.8 + q * 3.1)
        const fold = amp * (0.5 + 0.5 * wave)
        // borda solta no teto: ondula um pouco
        const lip = 0.035 * Math.sin(u * 11) * Math.pow(1 - q, 6)
        p = v3(c.x + n.x * fold - lip, c.y + n.y * fold, THREE.MathUtils.lerp(zA, zB, u))
      } else {
        const w = (s - SF) / (1 - SF)
        const e = smooth(w)
        const z0 = THREE.MathUtils.lerp(-1.14, 0.24, u)
        const from = v3(end.x, end.y, z0)
        const to = v3(tip.x, tip.y, tip.z + (u - 0.5) * 0.16)
        p = from.lerp(to, e)
        // dobras de tensão irradiando da ponta puxada
        p.y += 0.05 * Math.abs(Math.sin(u * Math.PI * 2 * 4.2 + 1.4)) * Math.sin(Math.PI * w) + 0.02 * e
      }
      row.push(p)
      pos.push(p.x, p.y, p.z)
      uv.push(u, s)
    }
    grid.push(row)
  }
  const idx: number[] = []
  for (let j = 0; j < NV; j++) {
    for (let i = 0; i < NU; i++) {
      const a = j * (NU + 1) + i
      const b = a + 1
      const c = a + NU + 1
      const d = c + 1
      idx.push(a, c, b, b, c, d)
    }
  }
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3))
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
  geo.setIndex(idx)
  geo.computeVertexNormals()
  const m = mat(LONA, { roughness: 0.88, size: 1.5 })
  m.side = THREE.DoubleSide
  const sheet = new THREE.Mesh(geo, m)
  sheet.castShadow = true
  sheet.receiveShadow = true
  return { sheet, grid }
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- base: piso de concreto da garagem -----------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.62, 2.7, 0.1, '#6d6b67', { roughness: 0.9 })
  slab.position.y = 0.05
  base.add(slab)
  const floor = cylinder(2.56, 2.6, 0.05, CONCRETO, { roughness: 0.85 })
  floor.position.y = 0.115
  base.add(floor)

  // juntas de dilatação do concreto: cordas do disco
  for (const [zc, rot] of [[1.45, 0.04], [-1.6, -0.03]] as const) {
    const len = 2 * Math.sqrt(Math.max(2.5 * 2.5 - zc * zc, 0.01))
    const junta = rbox(len, 0.008, 0.025, 0.004, JUNTA, { roughness: 0.9 })
    junta.position.set(0, GY + 0.002, zc)
    junta.rotation.y = rot
    base.add(junta)
  }

  // faixas amarelas das vagas, no referencial do carro
  const vagas = new THREE.Group()
  vagas.position.set(CAR.x, 0, CAR.z)
  vagas.rotation.y = CAR.r
  for (const fx of [-0.9, 0.9]) {
    const faixa = rbox(0.075, 0.008, 2.75, 0.003, FAIXA, { roughness: 0.7 })
    faixa.position.set(fx, GY + 0.004, -0.15)
    vagas.add(faixa)
  }
  const fundo = rbox(1.875, 0.008, 0.075, 0.003, FAIXA, { roughness: 0.7 })
  fundo.position.set(0, GY + 0.004, -1.49)
  vagas.add(fundo)
  // vaga vizinha (onde a iguana está)
  const fundo2 = rbox(1.2, 0.008, 0.075, 0.003, FAIXA, { roughness: 0.7 })
  fundo2.position.set(1.5, GY + 0.004, -1.49)
  vagas.add(fundo2)
  // batente de concreto no fundo da vaga
  const batente = rbox(0.9, 0.08, 0.14, 0.03, CONCRETO_ESC, { roughness: 0.85 })
  batente.position.set(0, GY + 0.04, -1.38)
  vagas.add(batente)
  base.add(vagas)

  // ralo de grelha na frente
  const ralo = new THREE.Group()
  ralo.position.set(-0.05, GY, 1.3)
  ralo.rotation.y = -0.3
  const raloMoldura = rbox(0.5, 0.014, 0.24, 0.006, '#5e605f', { roughness: 0.4, metalness: 0.6 })
  raloMoldura.position.y = 0.007
  ralo.add(raloMoldura)
  for (let k = -3; k <= 3; k++) {
    const fenda = rbox(0.03, 0.006, 0.18, 0.003, '#232527', { roughness: 0.9 })
    fenda.position.set(k * 0.06, 0.012, 0)
    ralo.add(fenda)
  }
  base.add(ralo)

  root.add(base)

  // ---- poste de recarga ----------------------------------------------------
  const poste = new THREE.Group()
  poste.position.set(POST.x, 0, POST.z)
  poste.rotation.y = POST.r

  const plinto = rbox(0.44, 0.06, 0.36, 0.02, CONCRETO_ESC, { roughness: 0.85 })
  plinto.position.y = GY + 0.03
  poste.add(plinto)
  const coluna = rbox(0.32, 1.14, 0.24, 0.07, POSTE, { roughness: 0.4 })
  coluna.position.y = GY + 0.06 + 0.57
  poste.add(coluna)
  const tampa = rbox(0.36, 0.07, 0.28, 0.03, POSTE_ESC, { roughness: 0.45 })
  tampa.position.y = GY + 1.22
  poste.add(tampa)
  const painel = rbox(0.24, 0.42, 0.02, 0.03, POSTE_ESC, { roughness: 0.35 })
  painel.position.set(0, GY + 0.92, 0.121)
  poste.add(painel)
  const visor = rbox(0.16, 0.1, 0.012, 0.012, '#1b2530', { roughness: 0.15 })
  visor.position.set(0, GY + 0.98, 0.132)
  poste.add(visor)
  const luz = sphere(0.032, NEON, { emissive: NEON, emissiveIntensity: 1.4 })
  luz.position.set(0, GY + 1.1, 0.13)
  poste.add(luz)
  // suporte vazio do plugue (ele está na pata da iguana)
  const coldre = rbox(0.12, 0.16, 0.08, 0.03, POSTE_ESC, { roughness: 0.4 })
  coldre.position.set(0, GY + 0.66, 0.15)
  poste.add(coldre)
  const furo = cylinder(0.04, 0.04, 0.02, '#111316', { roughness: 0.6 })
  furo.position.set(0, GY + 0.66, 0.192)
  furo.rotation.x = Math.PI / 2
  poste.add(furo)
  // saída do cabo
  const OUTLET = v3(0.0, GY + 0.32, 0.15)
  const bucha = cylinder(0.055, 0.06, 0.06, POSTE_ESC, { roughness: 0.5 })
  bucha.rotation.x = Math.PI / 2
  bucha.position.copy(OUTLET).add(v3(0, 0, -0.02))
  poste.add(bucha)
  root.add(poste)

  // ---- o Lada --------------------------------------------------------------
  const lada = new THREE.Group()
  lada.position.set(CAR.x, CAR_Y, CAR.z)
  lada.rotation.y = CAR.r
  lada.scale.setScalar(CAR.s)

  const carroceria = rbox(1.3, 0.5, 2.4, 0.09, LADA, { roughness: 0.38 })
  carroceria.position.y = 0.57
  lada.add(carroceria)

  const cabine = rbox(1.14, 0.45, 1.22, 0.1, LADA, { roughness: 0.38 })
  cabine.position.set(0, BELT + 0.2, -0.18)
  lada.add(cabine)

  // vidros
  for (const sx of [-1, 1]) {
    for (const wz of [0.12, -0.47]) {
      const janela = rbox(0.02, 0.27, 0.5, 0.04, VIDRO, { roughness: 0.12 })
      janela.position.set(sx * 0.567, BELT + 0.22, wz - 0.01)
      lada.add(janela)
    }
    // friso cromado da cintura e borracha lateral
    const friso = rbox(0.02, 0.025, 2.3, 0.01, CROMO, { roughness: 0.25, metalness: 0.8 })
    friso.position.set(sx * 0.655, BELT - 0.02, 0)
    lada.add(friso)
    const borracha = rbox(0.022, 0.045, 0.96, 0.012, BORRACHA, { roughness: 0.7 })
    borracha.position.set(sx * 0.657, 0.58, 0)
    lada.add(borracha)
    // vãos das portas e maçanetas
    for (const [gz, gh] of [[0.43, 0.44], [-0.16, 0.44], [-0.68, 0.13]] as const) {
      const vao = rbox(0.012, gh, 0.012, 0.004, LADA_ESC, { roughness: 0.6 })
      vao.position.set(sx * 0.652, 0.82 - gh / 2, gz)
      lada.add(vao)
    }
    for (const hz of [0.3, -0.29]) {
      const macaneta = rbox(0.02, 0.03, 0.1, 0.01, CROMO, { roughness: 0.25, metalness: 0.8 })
      macaneta.position.set(sx * 0.662, 0.73, hz)
      lada.add(macaneta)
    }
    // retrovisor
    const pe = rbox(0.06, 0.04, 0.08, 0.015, BORRACHA, { roughness: 0.6 })
    pe.position.set(sx * 0.6, BELT + 0.02, 0.38)
    lada.add(pe)
    const haste = cylinder(0.014, 0.014, 0.14, BORRACHA, { roughness: 0.6 })
    haste.rotation.z = Math.PI / 2 - sx * 0.35
    haste.position.set(sx * 0.67, BELT + 0.05, 0.38)
    lada.add(haste)
    const espelho = rbox(0.05, 0.08, 0.12, 0.02, BORRACHA, { roughness: 0.5 })
    espelho.position.set(sx * 0.74, BELT + 0.08, 0.37)
    lada.add(espelho)
  }
  const parabrisa = rbox(0.98, 0.3, 0.02, 0.05, VIDRO, { roughness: 0.12 })
  parabrisa.position.set(0, BELT + 0.21, 0.43)
  lada.add(parabrisa)
  const vigia = rbox(0.98, 0.28, 0.02, 0.05, VIDRO, { roughness: 0.12 })
  vigia.position.set(0, BELT + 0.21, -0.795)
  lada.add(vigia)

  // rodas: caixa escura + pneu + calota cromada
  for (const sx of [-1, 1]) {
    for (const wz of [0.8, -0.8]) {
      const caixa = cylinder(0.3, 0.3, 0.03, '#17181a', { roughness: 0.9 })
      caixa.rotation.z = Math.PI / 2
      caixa.position.set(sx * 0.646, GY + WR, wz)
      lada.add(caixa)
      const pneu = lathe(
        [[0, -0.1], [0.21, -0.1], [WR, -0.07], [WR, 0.07], [0.21, 0.1], [0, 0.1]],
        PNEU,
        { roughness: 0.85 },
        32,
      )
      pneu.rotation.z = Math.PI / 2
      pneu.position.set(sx * 0.57, GY + WR, wz)
      lada.add(pneu)
      const calota = cylinder(0.14, 0.15, 0.03, CROMO, { roughness: 0.22, metalness: 0.85 })
      calota.rotation.z = Math.PI / 2
      calota.position.set(sx * 0.675, GY + WR, wz)
      lada.add(calota)
      const miolo = cylinder(0.045, 0.045, 0.02, '#4a4f55', { roughness: 0.4, metalness: 0.6 })
      miolo.rotation.z = Math.PI / 2
      miolo.position.set(sx * 0.69, GY + WR, wz)
      lada.add(miolo)
    }
  }

  // frente: grade preta com moldura cromada e quatro faróis redondos
  const moldura = rbox(1.22, 0.24, 0.03, 0.04, CROMO, { roughness: 0.22, metalness: 0.85 })
  moldura.position.set(0, 0.67, 1.2)
  lada.add(moldura)
  const grade = rbox(1.16, 0.19, 0.03, 0.03, '#1d2023', { roughness: 0.5 })
  grade.position.set(0, 0.67, 1.212)
  lada.add(grade)
  for (const gy of [0.63, 0.67, 0.71]) {
    const ripa = rbox(0.34, 0.012, 0.012, 0.004, CROMO, { roughness: 0.25, metalness: 0.8 })
    ripa.position.set(0, gy, 1.228)
    lada.add(ripa)
  }
  const emblema = rbox(0.07, 0.05, 0.015, 0.012, CROMO, { roughness: 0.2, metalness: 0.85 })
  emblema.position.set(0, 0.67, 1.238)
  lada.add(emblema)
  for (const fx of [-0.5, -0.31, 0.31, 0.5]) {
    const aro = torus(0.07, 0.014, CROMO, { roughness: 0.22, metalness: 0.85 })
    aro.position.set(fx, 0.67, 1.232)
    lada.add(aro)
    const lente = cylinder(0.066, 0.066, 0.03, FAROL, { roughness: 0.08 })
    lente.rotation.x = Math.PI / 2
    lente.position.set(fx, 0.67, 1.222)
    lada.add(lente)
  }
  // para-choques cromados com garras de borracha
  for (const bz of [1, -1]) {
    const pc = rbox(1.42, 0.1, 0.14, 0.04, CROMO, { roughness: 0.22, metalness: 0.85 })
    pc.position.set(0, 0.42, bz * 1.22)
    lada.add(pc)
    for (const gx of [-0.6, 0.6]) {
      const garra = rbox(0.07, 0.14, 0.08, 0.03, BORRACHA, { roughness: 0.7 })
      garra.position.set(gx, 0.42, bz * 1.28)
      lada.add(garra)
    }
  }
  // lanternas traseiras
  for (const sx of [-1, 1]) {
    const lanterna = rbox(0.3, 0.14, 0.03, 0.03, LANTERNA, { roughness: 0.25 })
    lanterna.position.set(sx * 0.46, 0.66, -1.205)
    lada.add(lanterna)
    const pisca = rbox(0.1, 0.14, 0.032, 0.03, '#d98a2b', { roughness: 0.25 })
    pisca.position.set(sx * 0.56, 0.66, -1.206)
    lada.add(pisca)
  }
  // conversão elétrica: tomada aberta no para-lama dianteiro direito
  const tomada = cylinder(0.046, 0.046, 0.02, '#15171a', { roughness: 0.5 })
  tomada.rotation.z = Math.PI / 2
  tomada.position.set(0.655, 0.745, 0.8)
  lada.add(tomada)
  const tomadaAro = torus(0.048, 0.01, CROMO, { roughness: 0.25, metalness: 0.8 })
  tomadaAro.rotation.y = Math.PI / 2
  tomadaAro.position.set(0.662, 0.745, 0.8)
  lada.add(tomadaAro)
  const portinhola = rbox(0.014, 0.11, 0.11, 0.025, LADA, { roughness: 0.38 })
  portinhola.position.set(0.7, 0.745, 0.89)
  portinhola.rotation.y = -0.9
  lada.add(portinhola)
  // antena
  const antena = cylinder(0.006, 0.008, 0.5, '#2b2e31', { roughness: 0.4, metalness: 0.6 })
  antena.position.set(-0.55, BELT + 0.25, 0.95)
  antena.rotation.x = -0.25
  lada.add(antena)

  root.add(lada)

  // ---- placa LADDARE (filha do carro) --------------------------------------
  const placa = new THREE.Group()
  placa.position.set(0, 0.44, 1.31)
  const chapa = rbox(1.0, 0.22, 0.025, 0.025, PLACA, { roughness: 0.45 })
  placa.add(chapa)
  const borda = rbox(1.03, 0.25, 0.015, 0.03, LETRA, { roughness: 0.5 })
  borda.position.z = -0.008
  placa.add(borda)
  const faixaEU = rbox(0.075, 0.2, 0.012, 0.012, EU, { roughness: 0.45 })
  faixaEU.position.set(-0.45, 0, 0.014)
  placa.add(faixaEU)
  const LH = 0.15
  'LADDARE'.split('').forEach((c, i) => {
    const l = glyph(c, LH, LETRA)
    l.position.set(-0.32 + i * 0.118, 0, 0.02)
    placa.add(l)
  })
  lada.add(placa)
  lada.updateMatrixWorld(true)
  // a ponta fica erguida no laço do rabo: a lona sai do chão, esticada
  const TIP_W = lada.localToWorld(v3(TIP_L.x, GY, TIP_L.z)).setY(GY + 0.2)

  // ---- iguana (feita antes da lona: a ponta da lona depende do rabo) -------
  const iguana = new THREE.Group()
  iguana.position.set(IGU.x, GY, IGU.z)
  iguana.rotation.y = IGU.r
  iguana.scale.setScalar(IGU.s)
  root.add(iguana)
  const fur = { roughness: 0.62 }

  const pelve = sphere(0.25, IGUANA, fur)
  pelve.scale.set(1.08, 0.85, 1)
  pelve.position.set(0, 0.6, -0.05)
  iguana.add(pelve)
  iguana.add(limb(v3(0, 0.66, -0.02), v3(0, 1.28, -0.07), 0.25, IGUANA, fur))
  const barriga = limb(v3(0, 0.66, 0.17), v3(0, 1.18, 0.13), 0.2, BARRIGA, fur)
  barriga.scale.z = 0.62
  iguana.add(barriga)
  iguana.add(limb(v3(0, 1.3, -0.05), v3(0, 1.5, 0.04), 0.16, IGUANA, fur))

  // listras escuras nos flancos
  for (const sx of [-1, 1]) {
    for (const [ly, lz] of [[0.82, -0.12], [1.05, -0.14]] as const) {
      const listra = sphere(0.09, IGUANA_ESC, fur)
      listra.scale.set(0.35, 1.3, 0.6)
      listra.position.set(sx * 0.235, ly, lz)
      iguana.add(listra)
    }
  }

  // pernas de trás, abertas, e pés de dedos compridos
  for (const sx of [-1, 1]) {
    const hip = v3(sx * 0.18, 0.56, 0)
    const knee = v3(sx * 0.38, 0.36, 0.12)
    const ankle = v3(sx * 0.35, 0.1, 0.1)
    iguana.add(limb(hip, knee, 0.115, IGUANA, fur))
    iguana.add(limb(knee, ankle, 0.08, IGUANA, fur))
    const pe = sphere(0.1, IGUANA, fur)
    pe.scale.set(0.95, 0.45, 1.5)
    pe.position.set(sx * 0.36, 0.045, 0.2)
    iguana.add(pe)
    for (let k = 0; k < 5; k++) {
      const a = (k - 2) * 0.32 + sx * 0.2
      const from = v3(sx * 0.36 + Math.sin(a) * 0.08, 0.035, 0.27 + Math.cos(a) * 0.04)
      const to = from.clone().add(v3(Math.sin(a) * 0.13, 0, Math.cos(a) * 0.13))
      iguana.add(limb(from, to, 0.02, IGUANA_ESC, fur))
      const garra = cone(0.016, 0.045, '#3a3328', { roughness: 0.4 })
      garra.position.copy(to).add(v3(Math.sin(a) * 0.03, 0, Math.cos(a) * 0.03))
      garra.quaternion.setFromUnitVectors(Y, v3(Math.sin(a), -0.2, Math.cos(a)).normalize())
      iguana.add(garra)
    }
  }

  // braços: direito (-x) segura o celular, esquerdo (+x) segura o plugue
  const P_PH = v3(-0.05, 1.12, 0.47) // centro do celular (local da iguana)
  const PLUG_F = v3(-0.035, 0.99, 0.47) // boca do plugue encostada no celular
  const PLUG_D = v3(-0.5, 0.8, 0.02).normalize() // eixo do plugue (de trás pra frente)
  const PLUG_LEN = 0.43
  const PLUG_B = PLUG_F.clone().addScaledVector(PLUG_D, -PLUG_LEN) // traseira do plugue
  const gripL = PLUG_B.clone().addScaledVector(PLUG_D, 0.2)
  const arms: [number, THREE.Vector3, THREE.Vector3][] = [
    [-1, v3(-0.36, 1.0, 0.22), v3(-0.15, 1.1, 0.46)],
    [1, v3(0.36, 0.92, 0.18), gripL.clone().add(v3(0.0, -0.01, -0.02))],
  ]
  for (const [sx, elbow, hand] of arms) {
    const shoulder = v3(sx * 0.23, 1.24, -0.02)
    const ombro = sphere(0.11, IGUANA, fur)
    ombro.position.copy(shoulder)
    iguana.add(ombro)
    iguana.add(limb(shoulder, elbow, 0.068, IGUANA, fur))
    iguana.add(limb(elbow, hand, 0.058, IGUANA, fur))
    const mao = sphere(0.058, IGUANA, fur)
    mao.position.copy(hand)
    iguana.add(mao)
    // dedos envolvendo o que a mão segura
    for (let k = 0; k < 3; k++) {
      const f0 = hand.clone().add(v3(-sx * 0.02, 0.03 - k * 0.03, 0.035))
      const f1 = f0.clone().add(v3(-sx * 0.04, -0.005, -0.01))
      iguana.add(limb(f0, f1, 0.018, IGUANA_ESC, fur))
    }
  }

  // crista de espinhos no dorso
  const crestPath = new THREE.CatmullRomCurve3([
    v3(0, 1.56, -0.1), v3(0, 1.36, -0.27), v3(0, 1.0, -0.3), v3(0, 0.7, -0.3),
  ])
  for (let k = 0; k < 11; k++) {
    const t = k / 10
    const p = crestPath.getPointAt(t)
    const h = 0.19 - t * 0.12
    const espinho = cone(0.036 - t * 0.014, h, CRISTA, { roughness: 0.5 })
    const dir = v3(0, 0.45, -1).normalize()
    espinho.quaternion.setFromUnitVectors(Y, dir)
    espinho.position.copy(p).addScaledVector(dir, h * 0.3)
    iguana.add(espinho)
  }

  iguana.updateMatrixWorld(true)

  // ---- cabeça --------------------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.5, 0.06)
  cabeca.rotation.set(0, HEAD_YAW, 0.15) // 3/4 pra câmera, inclinada de pidona
  cabeca.scale.setScalar(1.12)
  iguana.add(cabeca)

  const cranio = sphere(0.17, IGUANA, fur)
  cranio.scale.set(1, 0.92, 1.2)
  cranio.position.set(0, 0.12, 0)
  cabeca.add(cranio)
  const focinho = limb(v3(0, 0.1, 0.08), v3(0, 0.075, 0.33), 0.11, IGUANA, fur)
  focinho.scale.set(0.92, 1, 0.82)
  cabeca.add(focinho)
  const mandibula = limb(v3(0, -0.02, 0.04), v3(0, 0.0, 0.27), 0.09, IGUANA, fur)
  cabeca.add(mandibula)
  for (const sx of [-1, 1]) {
    const bochecha = sphere(0.12, IGUANA, fur)
    bochecha.scale.set(0.85, 1, 1.15)
    bochecha.position.set(sx * 0.1, 0.0, 0.03)
    cabeca.add(bochecha)
    const escudo = sphere(0.05, ESCUDO, { roughness: 0.45 })
    escudo.scale.set(0.35, 1, 1)
    escudo.position.set(sx * 0.195, -0.01, 0.0)
    cabeca.add(escudo)
    // boca: risco escuro do focinho até o canto
    cabeca.add(limb(v3(sx * 0.082, 0.03, 0.39), v3(sx * 0.148, 0.0, 0.12), 0.011, '#2c3a20', { roughness: 0.6 }))
    const narina = sphere(0.016, '#25301b', { roughness: 0.5 })
    narina.position.set(sx * 0.045, 0.135, 0.41)
    cabeca.add(narina)
  }
  // papada laranja
  const papada = sphere(0.17, PAPADA, fur)
  papada.scale.set(0.36, 1, 1.1)
  papada.position.set(0, -0.17, 0.12)
  cabeca.add(papada)
  // crista da cabeça
  // moicano de espinhos do alto da cabeça até a nuca (lê no contorno)
  for (let k = 0; k < 5; k++) {
    const h = 0.15 - k * 0.012
    const espinho = cone(0.032 - k * 0.002, h, CRISTA, { roughness: 0.5 })
    const ang = 0.15 + k * 0.32
    const dir = v3(0, Math.cos(ang), -Math.sin(ang))
    espinho.quaternion.setFromUnitVectors(Y, dir)
    // pé do espinho na superfície do crânio (elipsoide 0.17 × 0.156 × 0.204)
    const surf = v3(0, 0.12 + 0.156 * Math.cos(ang), -0.204 * Math.sin(ang))
    espinho.position.copy(surf).addScaledVector(dir, h * 0.3)
    cabeca.add(espinho)
  }
  // olhos dourados arregalados + sobrancelhas de pidona
  for (const sx of [-1, 1]) {
    const olho = new THREE.Group()
    olho.position.set(sx * 0.112, 0.17, 0.15)
    olho.rotation.y = sx * 0.35
    cabeca.add(olho)
    const globo = sphere(0.068, OURO, { roughness: 0.25 })
    olho.add(globo)
    // pupila mira a câmera (o dono), um pouco pra cima: olhar pidão
    const look = CAM_AZ - IGU.r - HEAD_YAW - sx * 0.35
    const mira = new THREE.Group()
    mira.rotation.set(-0.28, look, 0)
    olho.add(mira)
    const pupila = sphere(0.042, '#141414', { roughness: 0.2 })
    pupila.scale.z = 0.5
    pupila.position.z = 0.056
    mira.add(pupila)
    const brilho = sphere(0.015, '#ffffff', { roughness: 0.1 })
    brilho.position.set(0.016, 0.022, 0.07)
    mira.add(brilho)
    const palpebra = torus(0.066, 0.016, IGUANA_ESC, fur)
    palpebra.position.z = 0.028
    olho.add(palpebra)
    cabeca.add(limb(v3(sx * 0.05, 0.275, 0.18), v3(sx * 0.17, 0.235, 0.12), 0.02, IGUANA_ESC, fur))
  }

  // ---- toco de cana atravessado na boca (filho da cabeça) ------------------
  const cana = new THREE.Group()
  cana.position.set(0, 0.035, 0.27)
  cana.rotation.set(0, 0.12, Math.PI / 2 + 0.08)
  cabeca.add(cana)
  const colmo = cylinder(0.04, 0.04, 0.62, CANA, { roughness: 0.45 })
  cana.add(colmo)
  for (const ny of [-0.2, 0.02, 0.22]) {
    const no = torus(0.041, 0.01, CANA_NO, { roughness: 0.5 })
    no.rotation.x = Math.PI / 2
    no.position.y = ny
    cana.add(no)
  }
  for (const ey of [-0.311, 0.311]) {
    const miolo = cylinder(0.034, 0.034, 0.006, CANA_MIOLO, { roughness: 0.8 })
    miolo.position.y = ey
    cana.add(miolo)
  }

  // ---- celular (filho da iguana, na mão direita) ---------------------------
  const celular = new THREE.Group()
  celular.position.copy(P_PH)
  celular.rotation.set(-0.22, -0.38, 0)
  iguana.add(celular)
  const aparelho = rbox(0.115, 0.21, 0.02, 0.018, '#1e2227', { roughness: 0.3 })
  celular.add(aparelho)
  const telaApagada = rbox(0.098, 0.185, 0.006, 0.012, '#0f1418', { roughness: 0.1 })
  telaApagada.position.z = 0.009
  celular.add(telaApagada)
  const bateria1 = rbox(0.01, 0.02, 0.004, 0.003, '#e0412f', { roughness: 0.4 })
  bateria1.position.set(-0.03, -0.06, 0.013)
  celular.add(bateria1)

  // ---- DIN: tela acesa + anel de luz verde (filho do celular) --------------
  const din = new THREE.Group()
  din.position.z = 0.012
  celular.add(din)
  const telaAcesa = rbox(0.098, 0.185, 0.006, 0.012, NEON, { emissive: NEON, emissiveIntensity: 0.9 })
  din.add(telaAcesa)
  const anel = torus(0.2, 0.014, NEON, { emissive: NEON, emissiveIntensity: 1.5 })
  din.add(anel)
  for (let k = 0; k < 8; k++) {
    const a = (k / 8) * Math.PI * 2 + Math.PI / 8
    const raio = limb(
      v3(Math.cos(a) * 0.245, Math.sin(a) * 0.245, 0),
      v3(Math.cos(a) * 0.3, Math.sin(a) * 0.3, 0),
      0.01,
      NEON,
      { emissive: NEON, emissiveIntensity: 1.5 },
    )
    din.add(raio)
  }

  // ---- rabo listrado, da base da coluna até a ponta da lona ----------------
  const RABO_ROOT = v3(0, 0.5, -0.22)
  const rabo = new THREE.Group()
  rabo.position.copy(RABO_ROOT)
  iguana.add(rabo)
  iguana.updateMatrixWorld(true)

  const rootW = iguana.localToWorld(RABO_ROOT.clone())
  const back = v3(-Math.sin(IGU.r), 0, -Math.cos(IGU.r))
  const toTip = TIP_W.clone().sub(rootW).setY(0).normalize()
  const LOOP_R = 0.14
  const tailW: THREE.Vector3[] = [
    rootW.clone(),
    rootW.clone().addScaledVector(back, 0.22).setY(GY + 0.3),
    rootW.clone().addScaledVector(back, 0.3).addScaledVector(toTip, 0.25).setY(GY + 0.1),
  ]
  // entra no laço por fora e dá uma volta e pouco em torno da ponta
  const a0 = Math.atan2(-toTip.z, -toTip.x)
  for (let k = 0; k <= 10; k++) {
    const a = a0 + (k / 10) * Math.PI * 2.15
    const r = LOOP_R * (1 - k * 0.025)
    tailW.push(v3(TIP_W.x + Math.cos(a) * r, TIP_W.y - 0.05 + k * 0.01, TIP_W.z + Math.sin(a) * r))
  }
  const tailCurve = new THREE.CatmullRomCurve3(
    tailW.map((p) => iguana.worldToLocal(p.clone()).sub(RABO_ROOT)),
    false,
    'centripetal',
  )
  const tailLen = tailCurve.getLength()
  const SEG = 34
  const pts = tailCurve.getSpacedPoints(SEG)
  for (let k = 0; k < SEG; k++) {
    const s = k / SEG
    const r = 0.13 * Math.pow(1 - s, 1.05) + 0.022
    const band = (s * tailLen) % 0.17 > 0.105 // anéis marrons estreitos
    // listras um tiquinho mais grossas: na pele fundida viram anéis limpos
    rabo.add(limb(pts[k], pts[k + 1], band ? r * 1.07 : r, band ? LISTRA : IGUANA, fur))
    // espinhos na primeira metade
    if (k % 2 === 0 && s < 0.45) {
      const h = 0.07 - s * 0.08
      const espinho = cone(0.02, h, CRISTA, { roughness: 0.5 })
      espinho.position.copy(pts[k]).add(v3(0, r + h * 0.2, 0))
      rabo.add(espinho)
    }
  }
  const pontaRabo = sphere(0.024, IGUANA, fur)
  pontaRabo.position.copy(pts[SEG])
  rabo.add(pontaRabo)

  // ---- lona: no referencial do carro --------------------------------------
  const lona = new THREE.Group()
  lona.position.set(CAR.x, CAR_Y, CAR.z)
  lona.rotation.y = CAR.r
  lona.scale.setScalar(CAR.s)
  root.add(lona)
  lona.updateMatrixWorld(true)
  const tipL = lona.worldToLocal(TIP_W.clone())
  const { sheet, grid } = lonaSheet(tipL.clone().add(v3(0, -0.03, 0)))
  lona.add(sheet)
  // bainha: tubo escuro nas bordas livres (dá espessura ao pano)
  const hemPaths = [
    grid[0],
    grid.map((row) => row[0]),
    grid.map((row) => row[row.length - 1]),
  ]
  for (const path of hemPaths) {
    const pick = path.filter((_, i) => i % 2 === 0 || i === path.length - 1)
    const hem = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pick), pick.length * 3, 0.016, 8, false),
      mat(LONA_ESC, { roughness: 0.85, size: 1 }),
    )
    hem.castShadow = true
    lona.add(hem)
  }
  // ilhoses na borda do teto
  for (const i of [5, 17, 29]) {
    const p = grid[0][i]
    const ilhos = torus(0.024, 0.008, CROMO, { roughness: 0.3, metalness: 0.8 })
    ilhos.rotation.x = Math.PI / 2
    ilhos.position.copy(p).add(v3(0.05, 0.006, 0))
    lona.add(ilhos)
  }
  // ponta franzida (o rabo enrola aqui)
  const franzido = puff(0.085, LONA, 5, 13, { roughness: 0.88 })
  franzido.position.copy(tipL)
  franzido.scale.set(1.1, 0.8, 1.1)
  lona.add(franzido)

  // ---- cabo do poste até a pata + plugue gigante --------------------------
  poste.updateMatrixWorld(true)
  const A = poste.localToWorld(OUTLET.clone())
  const B = iguana.localToWorld(PLUG_B.clone())
  const plugDirW = PLUG_D.clone().applyQuaternion(iguana.quaternion)
  const cableW = [
    A,
    A.clone().add(v3(-0.05, -0.12, 0.14)),
    v3(A.x - 0.14, GY + 0.04, A.z + 0.62),
    v3(B.x + 0.3, GY + 0.04, B.z + 0.3),
    B.clone().addScaledVector(plugDirW, -0.32).setY(GY + 0.18),
    B.clone().addScaledVector(plugDirW, -0.1),
    B,
  ]
  const cabo = new THREE.Group()
  cabo.position.copy(A)
  root.add(cabo)
  const caboMesh = new THREE.Mesh(
    new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(cableW.map((p) => p.clone().sub(A)), false, 'centripetal'),
      90,
      0.034,
      12,
      false,
    ),
    mat(CABO, { roughness: 0.55, size: 0.5 }),
  )
  caboMesh.castShadow = true
  caboMesh.receiveShadow = true
  cabo.add(caboMesh)

  const plugue = new THREE.Group()
  plugue.position.copy(B)
  plugue.quaternion.setFromUnitVectors(Y, plugDirW)
  root.add(plugue)
  const alivio = lathe([[0, 0], [0.036, 0], [0.04, 0.05], [0.055, 0.1], [0, 0.1]], CABO, { roughness: 0.6 })
  plugue.add(alivio)
  const empunhadura = lathe(
    [[0, 0.09], [0.058, 0.09], [0.066, 0.13], [0.062, 0.22], [0.07, 0.27], [0.088, 0.3], [0, 0.3]],
    '#26292d',
    { roughness: 0.45 },
  )
  plugue.add(empunhadura)
  for (const ry of [0.14, 0.17, 0.2]) {
    const anelGrip = torus(0.064, 0.008, '#3d4248', { roughness: 0.5 })
    anelGrip.rotation.x = Math.PI / 2
    anelGrip.position.y = ry
    plugue.add(anelGrip)
  }
  const cabecote = cylinder(0.09, 0.09, 0.12, '#30353b', { roughness: 0.4 })
  cabecote.position.y = 0.36
  plugue.add(cabecote)
  const face = cylinder(0.078, 0.078, 0.012, '#121417', { roughness: 0.5 })
  face.position.y = 0.425
  plugue.add(face)
  for (const [px, pz] of [[0, 0], [0.04, 0.02], [-0.04, 0.02], [0.025, -0.035], [-0.025, -0.035]] as const) {
    const pino = cylinder(0.011, 0.011, 0.016, CROMO, { roughness: 0.25, metalness: 0.85 })
    pino.position.set(px, 0.432, pz)
    plugue.add(pino)
  }
  const trava = rbox(0.04, 0.09, 0.03, 0.012, '#5a6068', { roughness: 0.4 })
  trava.position.set(0, 0.26, 0.07)
  plugue.add(trava)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'garagem', object: base },
    { name: 'poste', group: 'garagem', object: poste },
    { name: 'lada', group: 'lada', object: lada },
    { name: 'lona', group: 'lada', object: lona },
    { name: 'iguana', group: 'iguana', object: iguana },
    { name: 'cabeca', group: 'iguana', object: cabeca },
    { name: 'rabo', group: 'iguana', object: rabo },
    { name: 'celular', group: 'iguana', object: celular },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'placa', group: 'placa', object: placa },
    { name: 'cabo', group: 'plugue', object: cabo },
    { name: 'plugue', group: 'plugue', object: plugue },
    { name: 'din', group: 'din', object: din },
  ]

  // ---- montagem ------------------------------------------------------------
  const RABO_PRE = -0.8
  const outward = v3(Math.cos(CAR.r), 0, -Math.sin(CAR.r)) // +x do carro, no mundo
  const LONA_PRE = v3(CAR.x, CAR_Y + 0.1, CAR.z).addScaledVector(outward, -0.06)
  const plugFrom = A.clone().lerp(B, 0.01)
  const sc = (from: number, to: number) => [ch('scale.x', from, to), ch('scale.y', from, to), ch('scale.z', from, to)]

  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.8)], {
      ease: 'easeOut',
      caption: 'Na garagem do prédio, brota o piso de concreto com as vagas pintadas de amarelo…',
    }),
    seq('poste-rise', 'poste', 0.35, 0.8, [riseFrom(0, 1.5)], { ease: 'easeOut' }),

    seq('lada-rise', 'lada', 1.6, 0.9, [riseFrom(CAR_Y, 1.5)], {
      ease: 'easeOut',
      caption: '…e na vaga, o carro do vizinho, escondido debaixo de uma LONA cinza.',
    }),
    seq('lona-cai', 'lona', 2.0, 0.7, [
      ch('position.y', 1.6, LONA_PRE.y), ch('position.x', LONA_PRE.x, LONA_PRE.x), ch('position.z', LONA_PRE.z, LONA_PRE.z),
    ], { ease: 'easeIn' }),

    seq('iguana-rise', 'iguana', 3.4, 0.9, [riseFrom(GY, 2.1)], {
      ease: 'easeOut',
      caption: 'Chega a iguana do quarto andar, com o celular em 1%…',
    }),
    seq('cabeca-ergue', 'cabeca', 3.5, 0.8, [ch('rotation.x', 0.45, 0)], { ease: 'easeOut' }),
    seq('rabo-surge', 'rabo', 3.5, 0.8, [ch('rotation.y', RABO_PRE - 0.5, RABO_PRE)], { ease: 'easeOut' }),
    seq('celular-surge', 'celular', 3.8, 0.5, sc(0.01, 1), { ease: 'easeOut' }),

    seq('cana-surge', 'cana', 4.9, 0.45, sc(0.01, 1), {
      ease: 'easeOut',
      caption: '…mastigando um toco de CANA, e solta o grito de guerra: CANA, IÁ!',
    }),
    seq('cabeca-grita', 'cabeca', 5.1, 0.3, [ch('rotation.x', 0, -0.3)], { ease: 'easeOut' }),
    seq('cabeca-volta', 'cabeca', 5.4, 0.5, [ch('rotation.x', -0.3, 0)]),

    seq('rabo-chicote', 'rabo', 6.6, 0.4, [ch('rotation.y', RABO_PRE, 0)], {
      ease: 'easeIn',
      caption: 'Com o rabo, ela arranca a LONA de cima do carro: LÔ-NA, de boca redonda.',
    }),
    seq('lona-puxa', 'lona', 6.95, 0.35, [
      ch('position.y', LONA_PRE.y, CAR_Y), ch('position.x', LONA_PRE.x, CAR.x), ch('position.z', LONA_PRE.z, CAR.z),
    ], { ease: 'easeOut' }),

    seq('placa-surge', 'placa', 8.0, 0.45, sc(0.01, 1.3), {
      ease: 'easeOut',
      caption: 'Debaixo dela, um LADA quadradão elétrico de placa LADDARE: o Lada que virou carregaDOR.',
    }),
    seq('placa-assenta', 'placa', 8.45, 0.3, sc(1.3, 1)),

    seq('cabo-sai', 'cabo', 9.5, 0.9, sc(0.01, 1), {
      caption: 'Ela desengata o cabo grosso do poste e encosta o plugue gigante no celular minúsculo…',
    }),
    seq('plugue-voa', 'plugue', 9.5, 0.9, [
      ch('position.x', plugFrom.x, B.x), ch('position.y', plugFrom.y, B.y), ch('position.z', plugFrom.z, B.z),
    ]),

    seq('din-acende', 'din', 10.6, 0.3, sc(0.01, 1.25), {
      ease: 'easeOut',
      caption: '…DIN! — e a tela acende verde.',
    }),
    seq('din-assenta', 'din', 10.9, 0.3, sc(1.25, 1)),

    seq('cabeca-pede', 'cabeca', 11.8, 0.7, [ch('rotation.z', 0, 0.15)], {
      ease: 'easeOut',
      caption: 'De olhar pidão, ela pergunta ao dono: CA-NIÁ, LÔNA DIN LÁDA-re?',
    }),

    seq('din-pulsa', 'din', 13.0, 0.25, sc(1, 1.12), {
      ease: 'easeOut',
      caption: 'Kan jag låna din laddare? — Posso pegar seu carregador emprestado?',
    }),
    seq('din-volta', 'din', 13.25, 0.3, sc(1.12, 1)),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: CAM, target: CAM_TARGET },
  }
}

export const card: Card = {
  meta: {
    id: 'kan-jag-lana-din-laddare',
    contexto:
      "Pedindo emprestado: na casa de amigos, no escritório, na escola dos filhos ou no trem, quando o celular está morrendo. E na vaga do prédio: 'laddare' é carregador de qualquer coisa, celular, notebook ou carro elétrico.",
    fraseFonte: 'Posso pegar seu carregador emprestado?',
    fraseAlvo: 'Kan jag låna din laddare?',
    pronuncia:
      "kan iá LÔÔ-na din LÁD-da-re? ('jag' = iá; 'låna' com a força no LÔ, Ô fechado e longo, sem nasalar; 'din' curtinho, N na língua; 'laddare' com a força no LÁ, A curto, D dobrado e um -re fraquinho com R brando, mas que não cai: sem ele é 'ladda', o verbo)",
    ponteSonora:
      "CA-NIÁ, LÔ-NA... DIN! LÁDA-re? (7 sílabas: ca-niá-LÔÔ-na-din-LÁD-da-re; tônicas em LÔ e LÁ; CA-NIÁ é a CANA + IÁ de 'Kan jag få en påse?', 'Kan jag betala med kort?' e 'Kan jag swisha?', emendado, com I de IOGA, nunca o J chiado de 'canja'; LÔ-NA = a LONA que cobria o carro: Ô FECHADO e LONGO de 'avô' (é o å) e ORAL — o português nasaliza 'lõna' por causa do N; aqui a boca fica redonda e o N só encosta a língua; DIN = o 'plim' do plugue encaixando: I curto, N na língua e sem força, nunca o 'dĩ' nasal; LÁDA-re = o LADA, o carro russo quadradão, que na cena tem a placa personalizada LADDARE: a força no LÁ, A curto e o D segurado um instante (é dobrado); o -re do fim é fraquinho mas OBRIGATÓRIO, R BRANDO de 'cara' (um toque só — nunca o RR soprado, que nas cartas é o h) e E apagado, o mesmo -re de SÊNA-re ('senare') e de LÉ-ca-re ('läkare'): LÁ-da-re, proparoxítona como LÂMPADA — nunca 'la-DÁ-re' nem 'la-da-RÉ'; sem o -re sobra 'ladda', o verbo carregar; é o -are que faz o '-dor' do sueco: ladda = carregar, laddare = carregaDOR, como läka = curar, läkare = médico)",
    historia:
      'Na garagem do prédio, a iguana do quarto andar chega com o celular em 1%, mastigando um toco de CANA, e solta o grito de guerra: CANA, IÁ! Com o rabo, arranca a LONA cinza de cima do carro do vizinho, desengata o cabo grosso que carregava o carro e encosta o plugue gigante no celular minúsculo — DIN! — a tela acende. Debaixo da lona apareceu um LADA quadradão verde-musgo, convertido em elétrico, com placa personalizada LADDARE: é o Lada que virou carregaDOR, com um -re fraquinho no fim. De plugue na pata e olhar pidão, ela pergunta ao dono: CA-NIÁ, LÔNA DIN LÁDA-re? Posso pegar emprestado o teu carregador?',
  },
  createScene,
  refine: { organic: ['iguana', 'cabeca', 'rabo'] },
}

export default card
