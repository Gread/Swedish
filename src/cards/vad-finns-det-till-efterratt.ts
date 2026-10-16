import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe,
} from '../rig/helpers'

/**
 * "Vad finns det till efterrätt?" — VÁ! FINS... DÊ TIL... ÉFTER-RÉT(a)?
 *
 * Salão de gala escuro: a cortina vermelha desceu com um FIM em cada metade
 * (dois FINS), o rouxinol grita VÁ! FINS?! DÊ..., no fundo um TIL de néon azul
 * pisca sobre a porta do ÉFTER (néon rosa, o acento), e da porta sai uma mesa
 * RETA coberta de cúpulas prateadas. O rouxinol pousa na ponta e abre a asa.
 */

const PISO = '#3a2618'
const PISO_B = '#45301f'
const NOITE = '#1c2646'
const NOITE_ESC = '#141b33'
const PRETO = '#0b0b0f'
const MOLDURA = '#2c2f3c'
const VELUDO = '#8e1b2a'
const VELUDO_ESC = '#6e1420'
const OURO = '#e0b040'
const TOALHA = '#f2efe8'
const PRATA = '#c9d0d8'
const ROSA = '#ff4fa8' // acento reservado: o néon ÉFTER
const AZUL = '#47b8ff'
const PENA = '#8a5a3a'
const PENA_ESC = '#6e452b'
const PEITO = '#efe0c4'
const BICO = '#c9a27a'
const CINZA = '#a9adb5'

const FY = 0.2
const WALL_Z = -2.1
const DOOR_X = 0.2
const TABLE_TOP = FY + 0.78
const TABLE_Z0 = -1.95
const TABLE_Z1 = 1.25
const BIRD_Y = TABLE_TOP + 0.02
const BIRD_Z = 1.0

/** Traço de letra em pé no plano xy. */
function stroke(w: number, h: number, x: number, y: number, color: string, opts: object, rot = 0) {
  const s = rbox(w, h, 0.035, 0.008, color, opts)
  s.position.set(x, y, 0)
  s.rotation.z = rot
  return s
}

type Glyph = 'F' | 'I' | 'M' | 'E' | 'T' | 'R' | 'É'

/** Letras de traço grosso, altura ~h, centradas na origem. */
function letter(which: Glyph, h: number, t: number, color: string, opts: object) {
  const g = new THREE.Group()
  const w = h * 0.55
  const add = (sw: number, sh: number, x: number, y: number, rot = 0) => g.add(stroke(sw, sh, x, y, color, opts, rot))
  if (which === 'F') {
    add(t, h, -w / 2 + t / 2, 0)
    add(w, t, 0, h / 2 - t / 2)
    add(w * 0.75, t, -w * 0.125, 0)
  } else if (which === 'I') {
    add(t, h, 0, 0)
  } else if (which === 'M') {
    add(t, h, -w / 2, 0)
    add(t, h, w / 2, 0)
    add(t, h * 0.62, -w * 0.22, h * 0.17, 0.5)
    add(t, h * 0.62, w * 0.22, h * 0.17, -0.5)
  } else if (which === 'E' || which === 'É') {
    add(t, h, -w / 2 + t / 2, 0)
    add(w, t, 0, h / 2 - t / 2)
    add(w * 0.8, t, -w * 0.1, 0)
    add(w, t, 0, -h / 2 + t / 2)
    if (which === 'É') add(t * 0.9, h * 0.25, w * 0.08, h / 2 + h * 0.22, -0.8)
  } else if (which === 'T') {
    add(w, t, 0, h / 2 - t / 2)
    add(t, h, 0, 0)
  } else {
    add(t, h, -w / 2 + t / 2, 0)
    add(w * 0.85, t, -w * 0.075, h / 2 - t / 2)
    add(w * 0.85, t, -w * 0.075, t * 0.2)
    add(t, h * 0.42, w / 2 - t / 2, h * 0.25)
    add(t, h * 0.55, w * 0.18, -h * 0.27, 0.55)
  }
  return g
}

function word(glyphs: Glyph[], h: number, t: number, gap: number, color: string, opts: object) {
  const g = new THREE.Group()
  const step = h * 0.55 + gap
  glyphs.forEach((c, i) => {
    const l = letter(c, h, t, color, opts)
    l.position.x = (i - (glyphs.length - 1) / 2) * step
    g.add(l)
  })
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()

  // ---- piso de tábuas enceradas -------------------------------------------
  const piso = new THREE.Group()
  const tablado = rbox(5.6, 0.2, 4.6, 0.06, PISO, { roughness: 0.35 })
  tablado.position.y = 0.1
  piso.add(tablado)
  for (let i = 0; i < 9; i++) {
    const ripa = rbox(5.5, 0.012, 0.48, 0.005, i % 2 ? PISO : PISO_B, { roughness: 0.3 })
    ripa.position.set(0, FY + 0.006, -2.0 + i * 0.5)
    piso.add(ripa)
  }
  root.add(piso)

  // ---- parede azul-noite com porta preta ----------------------------------
  const parede = new THREE.Group()
  const muro = rbox(5.6, 3.4, 0.2, 0.04, NOITE, { roughness: 0.8 })
  muro.position.set(0, FY + 1.7, WALL_Z)
  parede.add(muro)
  const rodape = rbox(5.6, 0.5, 0.06, 0.02, NOITE_ESC, { roughness: 0.8 })
  rodape.position.set(0, FY + 0.25, WALL_Z + 0.12)
  parede.add(rodape)
  const friso = rbox(5.6, 0.04, 0.06, 0.015, OURO, { roughness: 0.35, metalness: 0.7 })
  friso.position.set(0, FY + 0.52, WALL_Z + 0.13)
  parede.add(friso)
  const moldura = rbox(1.3, 1.95, 0.1, 0.03, MOLDURA, { roughness: 0.5 })
  moldura.position.set(DOOR_X, FY + 0.975, WALL_Z + 0.12)
  parede.add(moldura)
  const vao = rbox(1.08, 1.82, 0.04, 0.01, PRETO, { roughness: 0.95, detail: 0 })
  vao.position.set(DOOR_X, FY + 0.91, WALL_Z + 0.18)
  parede.add(vao)
  root.add(parede)

  // ---- cortina de veludo com FIM em cada metade ---------------------------
  const cortina = new THREE.Group()
  cortina.position.set(-1.85, FY, -1.55)
  cortina.rotation.y = 0.32
  for (let i = 0; i < 14; i++) {
    const x = -0.82 + i * 0.126 + (i >= 7 ? 0.02 : 0)
    const prega = cylinder(0.075, 0.08, 2.55, i % 2 ? VELUDO : VELUDO_ESC, { roughness: 0.92 }, 16)
    prega.position.set(x, 1.275, 0)
    cortina.add(prega)
  }
  const bando = rbox(1.85, 0.3, 0.22, 0.08, VELUDO_ESC, { roughness: 0.92 })
  bando.position.set(0, 2.6, 0.02)
  cortina.add(bando)
  const franja = rbox(1.85, 0.05, 0.24, 0.02, OURO, { roughness: 0.4, metalness: 0.6 })
  franja.position.set(0, 2.44, 0.02)
  cortina.add(franja)
  for (const side of [-1, 1]) {
    const fim = word(['F', 'I', 'M'], 0.32, 0.06, 0.07, OURO, { roughness: 0.35, metalness: 0.7 })
    fim.position.set(side * 0.44, 1.45, 0.1)
    cortina.add(fim)
  }
  root.add(cortina)

  // ---- letreiro ÉFTER em néon rosa ---------------------------------------
  const letreiro = new THREE.Group()
  letreiro.position.set(DOOR_X, FY + 2.32, WALL_Z + 0.14)
  const placa = rbox(1.85, 0.6, 0.06, 0.03, '#15131c', { roughness: 0.6 })
  letreiro.add(placa)
  const efter = word(['É', 'F', 'T', 'E', 'R'], 0.34, 0.06, 0.08, ROSA, { emissive: ROSA, emissiveIntensity: 1.6 })
  efter.position.set(0, -0.03, 0.05)
  letreiro.add(efter)
  root.add(letreiro)

  // ---- til gigante de néon azul ------------------------------------------
  const til = new THREE.Group()
  til.position.set(DOOR_X, FY + 3.0, WALL_Z + 0.2)
  {
    const pts: THREE.Vector3[] = []
    for (let i = 0; i <= 40; i++) {
      const k = i / 40
      const th = -0.15 * Math.PI + k * 2.3 * Math.PI
      pts.push(new THREE.Vector3(-0.75 + 1.5 * k, 0.17 * Math.sin(th), 0))
    }
    const curva = new THREE.CatmullRomCurve3(pts)
    const tubo = new THREE.Mesh(
      new THREE.TubeGeometry(curva, 80, 0.055, 12, false),
      mat(AZUL, { emissive: AZUL, emissiveIntensity: 1.6 }),
    )
    til.add(tubo)
    for (const p of [pts[0], pts[pts.length - 1]]) {
      const ponta = sphere(0.055, AZUL, { emissive: AZUL, emissiveIntensity: 1.6 }, 16)
      ponta.position.copy(p)
      til.add(ponta)
    }
  }
  root.add(til)

  // ---- mesa comprida e reta ----------------------------------------------
  const mesa = new THREE.Group()
  const len = TABLE_Z1 - TABLE_Z0
  const midZ = (TABLE_Z0 + TABLE_Z1) / 2
  const tampo = rbox(0.7, 0.05, len, 0.02, TOALHA, { roughness: 0.85 })
  tampo.position.set(DOOR_X, TABLE_TOP - 0.025, midZ)
  mesa.add(tampo)
  for (const side of [-1, 1]) {
    const aba = rbox(0.03, 0.3, len, 0.012, TOALHA, { roughness: 0.85 })
    aba.position.set(DOOR_X + side * 0.36, TABLE_TOP - 0.17, midZ)
    mesa.add(aba)
  }
  const abaFrente = rbox(0.72, 0.3, 0.03, 0.012, TOALHA, { roughness: 0.85 })
  abaFrente.position.set(DOOR_X, TABLE_TOP - 0.17, TABLE_Z1 + 0.01)
  mesa.add(abaFrente)
  for (const z of [TABLE_Z0 + 0.2, midZ, TABLE_Z1 - 0.15]) {
    for (const side of [-1, 1]) {
      const perna = cylinder(0.035, 0.03, TABLE_TOP - FY - 0.05, '#4a3020', { roughness: 0.5 })
      perna.position.set(DOOR_X + side * 0.28, FY + (TABLE_TOP - FY - 0.05) / 2, z)
      mesa.add(perna)
    }
  }
  root.add(mesa)

  // ---- cinco cúpulas prateadas fechadas ----------------------------------
  const cupulas = new THREE.Group()
  for (let i = 0; i < 5; i++) {
    const z = TABLE_Z1 - 0.75 - i * 0.55
    const c = new THREE.Group()
    c.position.set(DOOR_X, TABLE_TOP, z)
    const prato = cylinder(0.24, 0.22, 0.02, PRATA, { roughness: 0.2, metalness: 0.85 })
    prato.position.y = 0.01
    c.add(prato)
    const domo = lathe(
      [[0.2, 0], [0.2, 0.02], [0.19, 0.08], [0.16, 0.15], [0.1, 0.2], [0.04, 0.22], [0, 0.222]],
      PRATA,
      { roughness: 0.15, metalness: 0.9 },
    )
    domo.position.y = 0.02
    c.add(domo)
    const pega = sphere(0.03, PRATA, { roughness: 0.15, metalness: 0.9 }, 16)
    pega.position.y = 0.26
    c.add(pega)
    cupulas.add(c)
  }
  root.add(cupulas)

  // ---- rouxinol: corpo ----------------------------------------------------
  const corpo = new THREE.Group()
  corpo.position.set(DOOR_X, BIRD_Y, BIRD_Z)
  corpo.rotation.y = 0.55
  {
    const tronco = sphere(0.36, PENA, { roughness: 0.85 })
    tronco.scale.set(0.95, 0.95, 1.15)
    tronco.position.set(0, 0.45, 0)
    tronco.rotation.x = -0.35
    corpo.add(tronco)
    const peito = sphere(0.3, PEITO, { roughness: 0.85 })
    peito.scale.set(0.95, 1.05, 0.8)
    peito.position.set(0, 0.47, 0.17)
    corpo.add(peito)
    const cauda = capsule(0.1, 0.42, PENA_ESC, { roughness: 0.85 })
    cauda.scale.set(1.5, 1, 0.45)
    cauda.position.set(0, 0.3, -0.48)
    cauda.rotation.x = -1.0
    corpo.add(cauda)
    const asaE = sphere(0.24, PENA_ESC, { roughness: 0.85 })
    asaE.scale.set(0.35, 0.75, 1.15)
    asaE.position.set(0.3, 0.45, -0.06)
    asaE.rotation.x = -0.4
    corpo.add(asaE)
    for (const side of [-1, 1]) {
      const perna = capsule(0.025, 0.12, BICO, { roughness: 0.5 })
      perna.position.set(side * 0.1, 0.1, 0.02)
      corpo.add(perna)
      const pe = capsule(0.022, 0.1, BICO, { roughness: 0.5 })
      pe.rotation.x = Math.PI / 2
      pe.position.set(side * 0.1, 0.03, 0.07)
      corpo.add(pe)
    }
  }
  root.add(corpo)

  // ---- cabeça erguida -----------------------------------------------------
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 0.92, 0.12)
  cabeca.rotation.x = -0.35
  {
    const cranio = sphere(0.22, PENA, { roughness: 0.85 })
    cranio.scale.set(0.95, 0.95, 1.05)
    cabeca.add(cranio)
    const garganta = sphere(0.15, PEITO, { roughness: 0.85 })
    garganta.position.set(0, -0.08, 0.1)
    cabeca.add(garganta)
    for (const side of [-1, 1]) {
      const anel = sphere(0.065, PEITO, { roughness: 0.6 })
      anel.position.set(side * 0.14, 0.04, 0.12)
      anel.scale.z = 0.6
      const olho = sphere(0.05, '#121212', { roughness: 0.15 })
      olho.position.set(side * 0.155, 0.045, 0.15)
      const brilho = sphere(0.014, '#ffffff', { roughness: 0.1 })
      brilho.position.set(side * 0.17, 0.07, 0.185)
      cabeca.add(anel, olho, brilho)
    }
  }
  corpo.add(cabeca)

  // ---- bico fino escancarado ---------------------------------------------
  const bico = new THREE.Group()
  bico.position.set(0, -0.01, 0.2)
  {
    const sup = cone(0.05, 0.22, BICO, { roughness: 0.45 }, 16)
    sup.rotation.x = Math.PI / 2 - 0.35
    sup.position.set(0, 0.04, 0.1)
    bico.add(sup)
    const inf = cone(0.042, 0.18, '#b08660', { roughness: 0.45 }, 16)
    inf.rotation.x = Math.PI / 2 + 0.35
    inf.position.set(0, -0.04, 0.08)
    bico.add(inf)
    const boca = sphere(0.045, '#c4505e', { roughness: 0.5 }, 16)
    boca.position.set(0, 0, 0.03)
    bico.add(boca)
  }
  cabeca.add(bico)

  // ---- asa direita aberta apontando as cúpulas ---------------------------
  const asa = new THREE.Group()
  asa.position.set(-0.28, 0.6, 0)
  asa.rotation.set(0.9, 0, 0.5)
  {
    const braco = sphere(0.22, PENA_ESC, { roughness: 0.85 })
    braco.scale.set(0.3, 0.55, 1.4)
    braco.position.set(0, 0, -0.22)
    asa.add(braco)
    for (let i = 0; i < 4; i++) {
      const pena = capsule(0.05, 0.32, i % 2 ? PENA : PENA_ESC, { roughness: 0.85 })
      pena.scale.set(0.5, 1, 1.4)
      pena.rotation.x = Math.PI / 2
      pena.position.set(0, 0.06 - i * 0.07, -0.55 - i * 0.04)
      asa.add(pena)
    }
  }
  corpo.add(asa)

  // ---- três anéis do grito ------------------------------------------------
  const aneis = new THREE.Group()
  aneis.position.set(0, 0.25, 0.3)
  aneis.rotation.x = -1.1 // o grito sobe pro alto, sem tapar a cara
  for (let i = 0; i < 3; i++) {
    const a = torus(0.09 + i * 0.07, 0.016, CINZA, { roughness: 0.5 })
    a.position.z = i * 0.14
    aneis.add(a)
  }
  cabeca.add(aneis)

  const parts = [
    { name: 'piso', group: 'salao', object: piso },
    { name: 'parede', group: 'salao', object: parede },
    { name: 'cortina', group: 'fins', object: cortina },
    { name: 'corpo', group: 'rouxinol', object: corpo },
    { name: 'cabeca', group: 'rouxinol', object: cabeca },
    { name: 'bico', group: 'grito', object: bico },
    { name: 'aneis', group: 'grito', object: aneis },
    { name: 'til', group: 'til', object: til },
    { name: 'letreiro', group: 'efter', object: letreiro },
    { name: 'mesa', group: 'reta', object: mesa },
    { name: 'cupulas', group: 'reta', object: cupulas },
    { name: 'asa', group: 'sobremesa', object: asa },
  ]

  const s3 = (a: number, b: number) => [ch('scale.x', a, b), ch('scale.y', a, b), ch('scale.z', a, b)]

  const build = [
    seq('piso', 'piso', 0, 0.7, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Fim do jantar de gala em Estocolmo: um salão escuro, tábuas enceradas, parede azul-noite.',
    }),
    seq('parede', 'parede', 0.2, 0.7, [riseFrom(0, 3.6)], { ease: 'easeOut' }),
    seq('cortina', 'cortina', 1.4, 0.9, [ch('position.y', FY + 2.8, FY)], {
      ease: 'easeOut',
      caption: 'A cortina de veludo DESCE com um FIM bordado em cada metade — dois FINS.',
    }),
    seq('corpo-voa', 'corpo', 3.0, 0.8, [ch('position.y', BIRD_Y + 2.4, BIRD_Y + 0.7), ch('position.z', BIRD_Z + 1.5, BIRD_Z)], {
      ease: 'easeOut',
      caption: 'Mas o rouxinol não aceita acabar assim: estufa o peito…',
    }),
    seq('cabeca', 'cabeca', 3.2, 0.5, s3(0.3, 1), { ease: 'easeOut' }),
    seq('bico', 'bico', 4.2, 0.4, [ch('scale.y', 0.2, 1)], {
      ease: 'easeOut',
      caption: '…e grita VÁ! FINS?! DÊ…',
    }),
    seq('aneis', 'aneis', 4.4, 0.6, s3(0.1, 1), { ease: 'easeOut' }),
    seq('til', 'til', 5.8, 0.6, s3(0.01, 1), {
      ease: 'easeOut',
      caption: 'No fundo do salão acende um TIL gigante de néon…',
    }),
    seq('letreiro', 'letreiro', 6.9, 0.6, [ch('scale.x', 0.01, 1)], {
      ease: 'easeOut',
      caption: '…sobre a porta do AFTER — que o letreirista sueco escreveu ÉFTER.',
    }),
    seq('mesa', 'mesa', 8.2, 1.0, [ch('position.z', -3.3, 0)], {
      ease: 'easeOut',
      caption: 'Da porta sai uma mesa comprida e RETA, coberta de cúpulas prateadas fechadas.',
    }),
    seq('cupulas', 'cupulas', 8.4, 1.0, [ch('position.z', -3.3, 0)], { ease: 'easeOut' }),
    seq('corpo-pousa', 'corpo', 9.6, 0.5, [ch('position.y', BIRD_Y + 0.7, BIRD_Y)], { ease: 'easeIn' }),
    seq('asa', 'asa', 10.4, 0.8, [ch('rotation.x', -0.3, 0.9), ch('scale.z', 0.4, 1)], {
      ease: 'easeOut',
      caption: 'Ele pousa na ponta, abre a asa pras cúpulas: Vad finns det till efterrätt? — O que tem de sobremesa?',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [2.4, 2.6, 5.4], target: [-0.15, 1.45, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'vad-finns-det-till-efterratt',
    contexto:
      "Restaurante: depois do prato principal, quando o garçom recolhe os pratos e pergunta 'Var det gott?'; na casa dos sogros; no almoço de domingo. As respostas clássicas: kladdkaka, äppelpaj med vaniljsås, glass ou, no verão, jordgubbar med grädde.",
    fraseFonte: 'O que tem de sobremesa?',
    fraseAlvo: 'Vad finns det till efterrätt?',
    pronuncia:
      "va FÍNS dê til ÉF-te-rét? ('vad' perde o D: VA, sem R; 'finns' com I curto, o N batido na ponta da língua — sem o 'fĩ' nasal de 'fim' — e um S seco, obrigatório; 'det' = dê; 'till' com L de verdade, nunca 'tiu'; 'efterrätt' com a força no ÉF — É ABERTO e curto, F e T colados sem vogal no meio —, o -ter fraquinho, e o R de 'efter' e o de 'rätt' viram um R só, de um toque, emendado: ÉF-te-RÉT, com um acento menor no RÄTT, É aberto e curto e T seco)",
    ponteSonora:
      "VÁ! FINS... DÊ TIL... ÉFTER-RÉT(a)? (7 sílabas: va-FÍNS-dê-til-ÉF-te-RÉT; força no FINS, a pancada principal no ÉF e um acento menor no RÉT; VÁ é o MESMO 'vad' de 'Vad synd!', 'Vad ska vi göra?' e 'Vad är klockan?' — um grito SEM R (com R vira 'var', onde) e sem D; FINS = o plural de FIM — as DUAS faixas FIM da cortina —, mas sem o nariz: o português diz 'fĩs', fanhoso, e o sueco fecha o N com a ponta da língua atrás dos dentes, FIN-S, I curto; o S é obrigatório: sem ele sobra 'fin', que em sueco é 'bonito'; DÊ = o 'det' de sempre, Ê fechado e sem T; TIL = o til (~) de 'Lycka till', 'Hur kommer jag till Storgatan?' e 'Vad är lösenordet till wifit?': I curto e L DE VERDADE, nunca 'tiu', e sem força; ÉFTER = o AFTER da balada, a festa de DEPOIS — que é exatamente o que 'efter' quer dizer —, só que o néon foi encomendado de um letreirista sueco e veio escrito ÉFTER: É ABERTO de 'pé', nunca o A de 'after': ÉF-ter, a força toda no ÉF, F e T colados sem vogal no meio (nunca 'éfi-ter'), e o -TER fraquinho; RÉT(a) = a RETA sem o -A, emendada no ÉFTER num fôlego só: o R do ÉFTER e o da RETA viram um R SÓ, de um toque, de 'caro' — nunca o RR soprado de 'rua', que é como a RETA começa sozinha —, É ABERTO e curto, e o T fecha seco, sem 'tchi': ÉF-te-RÉT; ao pé da letra, 'efterrätt' é o 'prato de depois')",
    historia:
      'No jantar de gala em Estocolmo, o rouxinol cantou a ária final e a cortina de veludo desce com um FIM bordado em cada metade — dois FINS. Os convidados já vão pegando os casacos. Mas o rouxinol, ave da madrugada, não aceita acabar assim: estufa o peito e grita VÁ! FINS?! DÊ... e voa até o fundo do salão, onde um TIL gigante de néon pisca em cima da porta do AFTER — que o letreirista sueco escreveu ÉFTER. De lá sai uma mesa comprida e RETA, até perder de vista, coberta de cúpulas prateadas fechadas. Ele pousa na ponta, abre a asa pra fileira de cúpulas e pergunta: e de sobremesa, o que tem?',
  },
  createScene,
}

export default card
