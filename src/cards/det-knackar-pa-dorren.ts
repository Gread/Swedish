import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, cylinder, sphere, capsule, torus, lathe,
} from '../rig/helpers'

/**
 * "Det knackar på dörren." — DÊ... C'NÁC-CAR(a)! PÔ, DOR EN(orme)...
 *
 * Meia-noite no corredor: o FANTASMA de lençol vem atravessar a porta como
 * sempre, mas a porta nova é de carvalho maciço — C'NÁC! Dá de CARA na
 * madeira, recua girando com a ponta do lençol na testa, um galo vermelho
 * brotando (o acento saturado da cena) e estrelinhas girando: PÔ, DOR EN...
 */

const PISO = '#4a4d52'
const PISO_LINHA = '#36383c'
const PAREDE = '#6f8094'
const BRANCO = '#eeeae2'
const CARVALHO = '#5a3a22'
const CARVALHO_CLARO = '#6e4a2c'
const OURO = '#d9a63a'
const PRATA = '#c9ced4'
const CAPACHO = '#8e3b36'
const LENCOL = '#f4f2ee'
const PRETO = '#1d1b1f'
const GALO = '#e2262b' // acento saturado RESERVADO: o galo (a DOR)
const ESTRELA = '#f5c542'
const LUZ = '#ffd98a'

const GY = 0.14
const WZ = -0.85 // frente da parede
const DX = 0.45 // centro da porta
const DW = 0.92
const DH = 1.95
const DOOR_Z = WZ + 0.055 // frente da folha
const HIT: [number, number] = [0.2, 1.5] // ponto da batida na porta (x, y)

// fantasma: pose final (recuado, tonto) e pose da batida
const GX = -0.55
const GZ = -0.12
const GHY = GY + 0.1
const XHIT = HIT[0]
const ZHIT = -0.2
const RY_FINAL = Math.PI * 2 - 0.25
const RZ_FINAL = 0.12
const RX_FINAL = -0.06
const BRACO_BAIXO = -2.8

function ghostBody() {
  const prof: [number, number][] = [
    [0.54, 0.0], [0.52, 0.06], [0.47, 0.25], [0.42, 0.5], [0.385, 0.75], [0.37, 0.95],
    [0.365, 1.1], [0.355, 1.25], [0.32, 1.42], [0.25, 1.55], [0.14, 1.63], [0.0, 1.66],
  ]
  const geo = new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 72)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i)
    let y = pos.getY(i)
    const z = pos.getZ(i)
    const phi = Math.atan2(z, x)
    const fold = 1 + 0.05 * Math.sin(7 * phi + 1) * Math.max(0, 1 - y / 1.0)
    if (y < 0.25) y += Math.sin(6 * phi) * 0.06 * (1 - y / 0.25)
    pos.setXYZ(i, x * fold, y, z * fold)
  }
  geo.computeVertexNormals()
  const m = mat(LENCOL, { roughness: 0.85, size: 1.6 })
  m.side = THREE.DoubleSide
  const mesh = new THREE.Mesh(geo, m)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function arc(r: number, tube: number, angle: number, color: string) {
  const mesh = new THREE.Mesh(new THREE.TorusGeometry(r, tube, 12, 32, angle), mat(color, { roughness: 0.5 }))
  mesh.castShadow = true
  return mesh
}

function starMesh(R: number) {
  const s = new THREE.Shape()
  for (let i = 0; i < 10; i++) {
    const a = Math.PI / 2 + (i * Math.PI) / 5
    const rr = i % 2 ? R * 0.45 : R
    if (i === 0) s.moveTo(Math.cos(a) * rr, Math.sin(a) * rr)
    else s.lineTo(Math.cos(a) * rr, Math.sin(a) * rr)
  }
  const geo = new THREE.ExtrudeGeometry(s, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2 })
  geo.center()
  const mesh = new THREE.Mesh(geo, mat(ESTRELA, { roughness: 0.35, emissive: '#7a5a00', emissiveIntensity: 0.3 }))
  mesh.castShadow = true
  return mesh
}

function stroke(w: number, h: number, x: number, y: number, rot = 0) {
  const s = rbox(w, h, 0.05, 0.012, BRANCO, { roughness: 0.5 })
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

function letter(which: 'K' | 'N' | 'A' | 'C') {
  const g = new THREE.Group()
  const t = 0.045
  if (which === 'K') {
    g.add(stroke(t, 0.22, -0.05, 0))
    g.add(stroke(t, 0.14, 0.015, 0.05, -0.75))
    g.add(stroke(t, 0.14, 0.015, -0.05, 0.75))
  } else if (which === 'N') {
    g.add(stroke(t, 0.22, -0.06, 0))
    g.add(stroke(t, 0.22, 0.06, 0))
    g.add(stroke(t, 0.24, 0, 0, 0.5))
  } else if (which === 'A') {
    g.add(stroke(t, 0.23, -0.035, 0, -0.33))
    g.add(stroke(t, 0.23, 0.035, 0, 0.33))
    g.add(stroke(0.08, 0.035, 0, -0.035))
  } else {
    const c = arc(0.085, 0.024, Math.PI * 1.5, BRANCO)
    c.rotation.z = Math.PI / 4
    c.scale.y = 1.25
    g.add(c)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- piso de tábuas cinza-escuras ----------------------------------------
  const piso = new THREE.Group()
  const disco = cylinder(2.5, 2.6, 0.14, PISO, { roughness: 0.8 })
  disco.position.y = 0.07
  piso.add(disco)
  for (let i = -3; i <= 3; i++) {
    const z = i * 0.62
    const len = 2 * Math.sqrt(Math.max(2.42 * 2.42 - z * z, 0.01))
    const linha = rbox(len, 0.012, 0.03, 0.005, PISO_LINHA, { roughness: 0.9 })
    linha.position.set(0, GY + 0.003, z + 0.31)
    piso.add(linha)
  }
  root.add(piso)

  // ---- parede azul-acinzentada com rodapé ----------------------------------
  const parede = new THREE.Group()
  const muro = rbox(3.9, 2.5, 0.14, 0.02, PAREDE, { roughness: 0.85 })
  muro.position.set(0, GY + 1.25, WZ - 0.07)
  parede.add(muro)
  const rodape = rbox(3.9, 0.13, 0.04, 0.01, BRANCO, { roughness: 0.6 })
  rodape.position.set(0, GY + 0.065, WZ + 0.015)
  parede.add(rodape)
  const sanca = rbox(3.95, 0.08, 0.08, 0.02, BRANCO, { roughness: 0.6 })
  sanca.position.set(0, GY + 2.48, WZ - 0.02)
  parede.add(sanca)
  for (const [x0, x1] of [[-1.95, DX - DW / 2 - 0.1], [DX + DW / 2 + 0.1, 1.95]]) {
    const friso = rbox(x1 - x0, 0.04, 0.03, 0.01, BRANCO, { roughness: 0.6 })
    friso.position.set((x0 + x1) / 2, GY + 0.95, WZ + 0.01)
    parede.add(friso)
  }
  root.add(parede)

  // ---- arandela de luz amarelada --------------------------------------------
  const arandela = new THREE.Group()
  arandela.position.set(-1.35, GY + 1.75, WZ)
  const espelho = cylinder(0.06, 0.06, 0.02, OURO, { roughness: 0.3, metalness: 0.8 })
  espelho.rotation.x = Math.PI / 2
  arandela.add(espelho)
  const haste = cylinder(0.015, 0.015, 0.12, OURO, { roughness: 0.3, metalness: 0.8 })
  haste.rotation.x = Math.PI / 2
  haste.position.z = 0.07
  arandela.add(haste)
  const cupula = lathe([[0.06, -0.08], [0.12, -0.06], [0.1, 0.08], [0.05, 0.1]], LUZ, {
    emissive: LUZ, emissiveIntensity: 0.9,
  })
  cupula.position.z = 0.15
  arandela.add(cupula)
  root.add(arandela)

  // ---- porta de carvalho com batente branco ---------------------------------
  const porta = new THREE.Group()
  const folha = rbox(DW, DH, 0.07, 0.015, CARVALHO, { roughness: 0.7 })
  folha.position.set(DX, GY + DH / 2, DOOR_Z - 0.035)
  porta.add(folha)
  const pw = (DW - 0.3) / 2
  for (const sx of [-1, 1]) {
    for (const [py, ph] of [[GY + 0.55, 0.78], [GY + 1.45, 0.72]]) {
      const painel = rbox(pw, ph, 0.03, 0.02, CARVALHO_CLARO, { roughness: 0.65 })
      painel.position.set(DX + sx * (pw / 2 + 0.05), py, DOOR_Z + 0.005)
      porta.add(painel)
      const campo = rbox(pw - 0.08, ph - 0.08, 0.03, 0.02, CARVALHO, { roughness: 0.7 })
      campo.position.set(DX + sx * (pw / 2 + 0.05), py, DOOR_Z + 0.02)
      porta.add(campo)
    }
  }
  const chapa = rbox(DW - 0.12, 0.12, 0.012, 0.005, OURO, { roughness: 0.3, metalness: 0.8 })
  chapa.position.set(DX, GY + 0.1, DOOR_Z + 0.006)
  porta.add(chapa)
  for (const sx of [-1, 1]) {
    const umbral = rbox(0.1, DH + 0.1, 0.1, 0.02, BRANCO, { roughness: 0.55 })
    umbral.position.set(DX + sx * (DW / 2 + 0.05), GY + (DH + 0.1) / 2, WZ + 0.03)
    porta.add(umbral)
  }
  const verga = rbox(DW + 0.3, 0.12, 0.11, 0.02, BRANCO, { roughness: 0.55 })
  verga.position.set(DX, GY + DH + 0.08, WZ + 0.035)
  porta.add(verga)
  root.add(porta)

  // ---- maçaneta dourada e olho mágico prateado ------------------------------
  const macaneta = new THREE.Group()
  const roseta = cylinder(0.045, 0.045, 0.02, OURO, { roughness: 0.25, metalness: 0.85 })
  roseta.rotation.x = Math.PI / 2
  roseta.position.set(DX + DW / 2 - 0.12, GY + 1.0, DOOR_Z + 0.01)
  macaneta.add(roseta)
  const pomo = sphere(0.055, OURO, { roughness: 0.2, metalness: 0.85 })
  pomo.position.set(DX + DW / 2 - 0.12, GY + 1.0, DOOR_Z + 0.08)
  macaneta.add(pomo)
  const olho = cylinder(0.028, 0.028, 0.025, PRATA, { roughness: 0.2, metalness: 0.9 })
  olho.rotation.x = Math.PI / 2
  olho.position.set(DX, GY + 1.72, DOOR_Z + 0.03)
  macaneta.add(olho)
  const lente = sphere(0.016, PRETO, { roughness: 0.1 })
  lente.position.set(DX, GY + 1.72, DOOR_Z + 0.042)
  macaneta.add(lente)
  root.add(macaneta)

  // ---- capacho vermelho -----------------------------------------------------
  const capacho = rbox(0.95, 0.03, 0.5, 0.012, CAPACHO, { roughness: 0.95 })
  capacho.position.set(DX, GY + 0.015, -0.5)
  root.add(capacho)

  // ---- FANTASMA de lençol ---------------------------------------------------
  const fantasma = new THREE.Group()
  fantasma.position.set(GX, GHY, GZ)
  fantasma.rotation.set(RX_FINAL, RY_FINAL, RZ_FINAL)
  fantasma.add(ghostBody())
  for (const side of [-1, 1]) {
    const olhoG = sphere(0.055, PRETO, { roughness: 0.25 })
    olhoG.scale.set(0.8, 1.35, 0.45)
    olhoG.position.set(side * 0.12, 1.32, 0.315)
    olhoG.rotation.y = side * 0.36
    fantasma.add(olhoG)
  }
  const boca = torus(0.06, 0.022, PRETO, { roughness: 0.4 })
  boca.position.set(0, 1.1, 0.36)
  boca.scale.y = 1.25
  fantasma.add(boca)
  const garganta = sphere(0.055, '#3a2a30', { roughness: 0.6 })
  garganta.scale.set(1, 1.25, 0.3)
  garganta.position.set(0, 1.1, 0.35)
  fantasma.add(garganta)
  root.add(fantasma)

  // braço de lençol: pivô no ombro, construído na pose final (ponta na testa)
  const braco = new THREE.Group()
  braco.position.set(0.36, 0.92, 0.1)
  const UP = new THREE.Vector3(0, 1, 0)
  const seg = (a: THREE.Vector3, b: THREE.Vector3, r: number) => {
    const dir = b.clone().sub(a)
    const c = capsule(r, dir.length(), LENCOL, { roughness: 0.85 })
    c.position.copy(a).add(b).multiplyScalar(0.5)
    c.quaternion.setFromUnitVectors(UP, dir.normalize())
    braco.add(c)
  }
  const ombro = new THREE.Vector3(0, 0, 0)
  const cotovelo = new THREE.Vector3(0.16, 0.26, 0.2)
  const ponta = new THREE.Vector3(-0.12, 0.54, 0.24)
  seg(ombro, cotovelo, 0.09)
  seg(cotovelo, ponta, 0.08)
  const pontaB = sphere(0.085, LENCOL, { roughness: 0.85 })
  pontaB.position.copy(ponta)
  braco.add(pontaB)
  fantasma.add(braco)

  // galo vermelho na testa
  const galo = sphere(0.085, GALO, { roughness: 0.35 })
  galo.position.set(-0.07, 1.47, 0.29)
  fantasma.add(galo)

  // anel de estrelinhas girando acima da cabeça
  const estrelas = new THREE.Group()
  estrelas.position.set(0, 1.86, 0)
  estrelas.rotation.x = 0.25
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2
    const st = starMesh(0.075)
    st.position.set(Math.cos(a) * 0.34, 0, Math.sin(a) * 0.34)
    estrelas.add(st)
  }
  fantasma.add(estrelas)

  // ---- três arcos de impacto na madeira -------------------------------------
  const arcos = new THREE.Group()
  arcos.position.set(HIT[0], HIT[1], DOOR_Z + 0.045)
  for (const [k, r] of [0.15, 0.25, 0.35].entries()) {
    const a = arc(r, 0.02 - k * 0.002, 1.55, BRANCO)
    a.rotation.z = -0.85
    arcos.add(a)
  }
  root.add(arcos)

  // ---- KNACK! acima da porta -----------------------------------------------
  const knack = new THREE.Group()
  knack.position.set(DX, GY + 2.27, WZ + 0.06)
  knack.rotation.z = 0.06
  const glyphs: ['K' | 'N' | 'A' | 'C', number][] = [['K', -0.42], ['N', -0.21], ['A', 0], ['C', 0.21], ['K', 0.42]]
  for (const [gch, lx] of glyphs) {
    const l = letter(gch)
    l.position.x = lx
    knack.add(l)
  }
  root.add(knack)

  const parts = [
    { name: 'piso', group: 'corredor', object: piso },
    { name: 'parede', group: 'corredor', object: parede },
    { name: 'arandela', group: 'corredor', object: arandela },
    { name: 'porta', group: 'porta', object: porta },
    { name: 'macaneta', group: 'porta', object: macaneta },
    { name: 'capacho', group: 'porta', object: capacho },
    { name: 'fantasma', group: 'fantasma', object: fantasma },
    { name: 'braco', group: 'fantasma', object: braco },
    { name: 'arcos', group: 'knack', object: arcos },
    { name: 'knack', group: 'knack', object: knack },
    { name: 'galo', group: 'dor', object: galo },
    { name: 'estrelas', group: 'dor', object: estrelas },
  ]

  const pop = (a = 0.01): ReturnType<typeof ch>[] => [ch('scale.x', a, 1), ch('scale.y', a, 1), ch('scale.z', a, 1)]

  const build = [
    seq('piso-rise', 'piso', 0, 0.8, [riseFrom(0, 0.7)], {
      ease: 'easeOut',
      caption: 'Meia-noite no corredor do prédio: sobe o piso de tábuas e a parede azul…',
    }),
    seq('parede-rise', 'parede', 0.25, 0.9, [riseFrom(0, 2.7)], { ease: 'easeOut' }),
    seq('arandela-acende', 'arandela', 0.9, 0.5, pop(), { ease: 'easeOut' }),

    seq('porta-rise', 'porta', 1.5, 0.8, [riseFrom(0, 2.2)], {
      ease: 'easeOut',
      caption: '…e a porta nova que o síndico instalou: CARVALHO maciço, à prova de fantasma.',
    }),
    seq('macaneta-pop', 'macaneta', 2.2, 0.4, pop(), { ease: 'easeOut' }),
    seq('capacho-pop', 'capacho', 2.3, 0.4, pop(), { ease: 'easeOut' }),

    seq('fantasma-entra', 'fantasma', 3.2, 1.2, [
      ch('position.x', -2.4, XHIT), ch('position.z', GZ, GZ),
      ch('rotation.y', Math.PI / 2, Math.PI / 2), ch('rotation.z', 0, 0), ch('rotation.x', 0, 0),
    ], {
      ease: 'easeOut',
      caption: 'DÊ… — o \'det\', o alguém sem nome: um FANTASMA desliza pra atravessar a porta, como sempre…',
    }),
    seq('braco-aparece', 'braco', 3.2, 0.3, [...pop(), ch('rotation.z', BRACO_BAIXO, BRACO_BAIXO)]),
    seq('fantasma-vira', 'fantasma', 4.4, 0.4, [ch('rotation.y', Math.PI / 2, Math.PI)], { ease: 'easeInOut' }),
    seq('fantasma-avanca', 'fantasma', 4.9, 0.3, [
      ch('position.z', GZ, ZHIT), ch('rotation.x', 0, -0.25),
    ], { ease: 'easeIn' }),

    seq('arcos-pop', 'arcos', 5.2, 0.35, pop(), {
      ease: 'easeOut',
      caption: 'C\'NÁC! Dá de CARA no carvalho — C\'NÁC-CAR(a)! É o \'knack\' da batida em sueco.',
    }),
    seq('knack-pop', 'knack', 5.25, 0.4, pop(), { ease: 'easeOut' }),

    seq('fantasma-recua', 'fantasma', 5.6, 0.9, [
      ch('position.x', XHIT, GX), ch('position.z', ZHIT, GZ),
      ch('rotation.y', Math.PI, RY_FINAL), ch('rotation.x', -0.25, RX_FINAL), ch('rotation.z', 0, RZ_FINAL),
    ], { ease: 'easeOut' }),
    seq('braco-testa', 'braco', 6.3, 0.6, [ch('rotation.z', BRACO_BAIXO, 0)], { ease: 'easeOut' }),
    seq('galo-brota', 'galo', 6.6, 0.6, pop(), {
      ease: 'easeOut',
      caption: 'Ele recua com a ponta do lençol na testa, um galo vermelho brotando: PÔ…',
    }),

    seq('estrelas-giram', 'estrelas', 7.8, 1.4, [...pop(), ch('rotation.y', 0, Math.PI * 2)], {
      caption: '…DOR EN… — geme \'dor enorme\' e desmaia antes do -ORME.',
    }),
    seq('fantasma-afunda', 'fantasma', 8.4, 0.8, [ch('position.y', GHY + 0.12, GHY)], { ease: 'easeInOut' }),
    seq('estrelas-continuam', 'estrelas', 9.4, 1.6, [ch('rotation.y', Math.PI * 2, Math.PI * 4)], {
      caption: 'Det knackar på dörren. — Estão batendo na porta.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.1, 1.85, 4.5], target: [0.05, 1.2, -0.4] },
  }
}

export const card: Card = {
  meta: {
    id: "det-knackar-pa-dorren",
    contexto: "Casa: Em casa, avisando quem está no banho, na cozinha ou de fone que tem alguém na porta: o vizinho, o entregador do PostNord ou do Instabox, alguém da bostadsrättsförening. Se for a campainha, o molde é o mesmo: 'Det ringer på dörren'. Quem estiver mais perto responde: 'Jag öppnar!' (eu abro).",
    fraseFonte: "Estão batendo na porta.",
    fraseAlvo: "Det knackar på dörren.",
    pronuncia: "dê KNÁK-kar pô DÖR-ren ('det' = dê, sem T; 'knackar' com o K E o N pronunciados e grudados — K-NÁK, sem vogal entre eles (nada de 'ki-nák', nem o K mudo do inglês 'knock') —, A curto e aberto, o CK segurado um instante e o -kar fraco com R brando: sem esse R vira 'knacka', o infinitivo; 'på' = pô, Ô fechado e sem força; 'dörren' com a força no DÖR — Ö CURTO e aberto antes de R, boca redonda de Ó com a língua pra frente, como pra dizer É — e o RR dobrado, um R de toque mais comprido (ou tremido na ponta da língua), nunca o RR carioca de garganta; com o Ö esticado e o R curto sai 'dör', morre; o -en fraco, N na língua e sem nasal: é o artigo, 'A porta')",
    ponteSonora: "DÊ... C'NÁC-CAR(a)! PÔ, DOR EN(orme)... (6 sílabas: dê-KNÁK-kar-pô-DÖR-ren; força no C'NÁC e no DOR; DÊ = o 'det' de sempre, o MESMO DÊ de 'Det regnar igen' e 'Det läcker vatten': Ê FECHADO e sem T — e aqui ninguém aparece: quem bate é o 'det', o 'alguém' sem nome do sueco; C'NÁC = o estalo da CARA do fantasma contra a porta de carvalho, e é exatamente como o sueco escreve batida na porta ('knack knack'): K e N GRUDADOS, sem vogal no meio — nada de 'ki-NÁC', e nada de 'CA-NÁC', que puxa a CANA de 'kan' —, o K só trava a garganta e já solta no N; A curto e aberto de 'já', e o K seco e segurado um instante (é o 'ck' dobrado); CAR(a) = a CARA que bateu, sem o -A: fraquinha e colada, C'NÁC-car, com o R brando de 'cara', um toque de língua, nunca RR — é o R do presente, OBRIGATÓRIO: sem ele sobra 'knacka', o infinitivo; PÔ = o 'pô!' brasileiro, Ô fechado, o MESMO 'på' de 'DÊ, PÔ!' ('Kan du skicka det på mejl?') e 'TÁ, PÔ!' ('Ta på dig jackan!'), aqui fraquinho; DOR EN(orme) = 'dor enorme' gemido de uma vez e cortado no N, porque o fantasma desmaia antes do -ORME: dô-REN... — a força no DOR, mas com a boca MAIS ABERTA que no 'dor' português: lábios redondos de Ó e a língua pra frente, como se fosse dizer É — é o ö aberto que o sueco usa antes de R —, e CURTO: com o Ö esticado sai 'dör', morre; o R, que em 'dor enorme' já cai entre vogais e sai de um toque só, aqui é DOBRADO: segure um pouco mais ou deixe tremer na ponta da língua, nunca o RR soprado de garganta; o EN é fraquinho, E curto e N batido na língua, sem o 'ẽ' nasal — é o artigo colado: 'dörr' é uma porta, 'dörren' é A porta, o mesmo -EN do PEN de 'Tack för hjälpen')",
    historia: "Meia-noite no corredor do prédio. O FANTASMA de lençol, que há duzentos anos atravessa qualquer parede, desliza até o apartamento pra entrar como sempre — mas o síndico trocou a porta por uma de carvalho maciço: C'NÁC! Ele dá de CARA na madeira, e o estalo é exatamente o 'knack' com que os suecos escrevem uma batida. Ele recua com a mão na testa, um galo vermelho brotando, geme 'PÔ... DOR EN...' e desmaia antes do -ORME, escorrendo pelo capacho. Lá dentro, do sofá, você ouve a pancada e avisa: tem alguém batendo na porta — e, quando abrir, não vai ter ninguém.",
  },
  createScene,
}

export default card
