import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Det är jag som hämtar på förskolan idag."
 *
 * Portão da förskola visto de fora: você DÊ o botão do interfone e É IÁ SOM
 * (três anéis saem antes do dedo sair). Atende XU, a elefanta-monitora da
 * FÖ-XKU-LAN, de boné. Ela dá um PÔ! de pata e estica a tromba por cima do
 * portão — RRÉM-TAR! — enrolada na mochila laranja que voa até você. E a folha
 * do calendário de hoje despenca no chão: i-DÁG!
 */

const RUBBER = '#7fbfa3'        // piso de borracha verde-menta
const SOIL = '#57604f'
const MUSTARD = '#d9a327'       // muro amarelo-mostarda
const MUSTARD_DARK = '#b88620'
const STEEL = '#9aa3ab'         // poste / grade cinza-aço
const STEEL_DARK = '#6f7880'
const HIDE = '#b39a9a'          // corpo cinza-rosado da elefanta
const HIDE_DARK = '#9c8484'
const INNER_EAR = '#c9a9a9'
const PETROL = '#1f6470'        // boné azul-petróleo
const PETROL_DARK = '#17505a'
const BUTTON = '#c94f3d'
const WAVE = '#dceefc'          // anéis branco-azulados
const ORANGE = '#ee6b1f'        // ACENTO reservado: a mochila
const ORANGE_DARK = '#c1500f'
const PAPER = '#f7f2e6'

const GY = 0.16 // topo do piso do diorama

/** Cápsulas encadeadas ao longo do arco da tromba, afinando até a ponta. */
function trunkArc(): THREE.Group {
  const g = new THREE.Group()
  const N = 14
  const pts: THREE.Vector3[] = []
  for (let i = 0; i <= N; i++) {
    const t = i / N
    pts.push(new THREE.Vector3(0, 0.75 * Math.sin(Math.PI * 0.95 * t) - 0.55 * t, 2.4 * t))
  }
  const up = new THREE.Vector3(0, 1, 0)
  const dir = new THREE.Vector3()
  for (let i = 0; i < N; i++) {
    const a = pts[i]
    const t = i / (N - 1)
    dir.subVectors(pts[i + 1], a)
    const len = dir.length()
    const r = 0.17 * (1 - t) + 0.055 * t
    const segMesh = capsule(r, Math.max(len - r * 0.5, 0.02), t < 0.5 ? HIDE : HIDE_DARK, {
      roughness: 0.85,
    })
    segMesh.position.copy(a).addScaledVector(dir, 0.5)
    segMesh.quaternion.setFromUnitVectors(up, dir.clone().normalize())
    g.add(segMesh)

    // anéis da tromba, mais marcados na metade grossa
    if (i % 3 === 1 && t < 0.7) {
      const ring = torus(r * 0.98, r * 0.14, HIDE_DARK, { roughness: 0.9 })
      ring.position.copy(segMesh.position)
      ring.quaternion.copy(segMesh.quaternion)
      ring.rotateX(Math.PI / 2)
      g.add(ring)
    }
  }
  // ponta enrolada: dois aros que agarram a alça da mochila
  for (const dz of [-0.1, 0.02]) {
    const grip = torus(0.155, 0.05, HIDE_DARK, { roughness: 0.85 })
    grip.position.set(0, -0.4 + dz * 0.5, 2.36 + dz)
    grip.rotation.x = 0.35
    g.add(grip)
  }
  return g
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: pátio de borracha verde-menta ----------------------
  const base = new THREE.Group()

  const soil = cylinder(2.6, 2.72, 0.1, SOIL, { roughness: 0.95 })
  soil.position.y = 0.05
  base.add(soil)

  const floor = cylinder(2.54, 2.6, 0.06, RUBBER, { roughness: 0.9 })
  floor.position.y = 0.13
  base.add(floor)


  // adereços do pátio, espalhados com rng fixo
  const bushA = puff(0.22, '#4f8f5a', 6, 31, { roughness: 0.9 })
  bushA.position.set(-2.05, GY + 0.15, -0.15)
  bushA.rotation.y = rand() * Math.PI
  base.add(bushA)

  const bushB = puff(0.16, '#468050', 5, 32, { roughness: 0.9 })
  bushB.position.set(2.15, GY + 0.11, 1.05)
  bushB.rotation.y = rand() * Math.PI
  base.add(bushB)

  const pebble = rock(0.13, '#8d9296', 33, { roughness: 0.9 })
  pebble.position.set(-2.2, GY + 0.05, 1.4)
  pebble.rotation.y = rand() * Math.PI
  base.add(pebble)

  const ball = sphere(0.17, MUSTARD, { roughness: 0.45 })
  ball.position.set(-1.7, GY + 0.17, 0.95)
  base.add(ball)

  for (const [cx, cz] of [[2.0, 1.25], [-2.05, 0.55]] as const) {
    const marker = cone(0.13, 0.3, PETROL, { roughness: 0.5 })
    marker.position.set(cx, GY + 0.15, cz)
    marker.rotation.y = rand() * Math.PI
    base.add(marker)
  }
  root.add(base)

  // ---- muro amarelo-mostarda com a grade de cilindros ----------------------
  const muro = new THREE.Group()

  const mureta = rbox(4.85, 0.6, 0.24, 0.07, MUSTARD, { roughness: 0.85 })
  mureta.position.set(0, GY + 0.3, -0.6)
  muro.add(mureta)

  const coping = rbox(4.95, 0.09, 0.32, 0.035, '#efe6d0', { roughness: 0.7 })
  coping.position.set(0, GY + 0.63, -0.6)
  muro.add(coping)

  // grade: cilindros de aço da mureta até a travessa
  for (let x = -2.05; x <= 2.06; x += 0.2346) {
    const bar = cylinder(0.032, 0.032, 0.86, STEEL, { roughness: 0.32, metalness: 0.75 })
    bar.position.set(x, GY + 1.11, -0.6)
    muro.add(bar)
  }
  const rail = cylinder(0.05, 0.05, 4.3, STEEL, { roughness: 0.32, metalness: 0.75 })
  rail.rotation.z = Math.PI / 2
  rail.position.set(0, GY + 1.55, -0.6)
  muro.add(rail)

  // pilares das pontas + batentes do portão
  for (const side of [-1, 1]) {
    const pillar = rbox(0.36, 1.7, 0.38, 0.06, MUSTARD_DARK, { roughness: 0.85 })
    pillar.position.set(side * 2.3, GY + 0.85, -0.6)
    muro.add(pillar)

    const pillarCap = lathe(
      [[0, 0], [0.2, 0], [0.22, 0.04], [0.17, 0.1], [0.08, 0.14], [0, 0.15]],
      '#efe6d0',
      { roughness: 0.7 },
    )
    pillarCap.position.set(side * 2.3, GY + 1.7, -0.6)
    muro.add(pillarCap)

    const jamb = rbox(0.12, 1.5, 0.26, 0.04, STEEL_DARK, { roughness: 0.35, metalness: 0.6 })
    jamb.position.set(side * 1.02, GY + 0.75, -0.6)
    muro.add(jamb)
  }

  // ---- calendário pendurado na grade (a folha é peça própria) --------------
  const calendario = new THREE.Group()
  calendario.position.set(0.95, 1.15, -0.45)
  const boardBack = rbox(0.38, 0.5, 0.05, 0.02, '#3a4a44', { roughness: 0.6 })
  calendario.add(boardBack)
  const boardTop = rbox(0.38, 0.1, 0.06, 0.02, PETROL, { roughness: 0.5 })
  boardTop.position.y = 0.2
  calendario.add(boardTop)
  for (const side of [-1, 1]) {
    const wire = cylinder(0.012, 0.012, 0.34, STEEL, { roughness: 0.3, metalness: 0.7 })
    wire.position.set(side * 0.13, 0.42, -0.09)
    wire.rotation.x = -0.28
    calendario.add(wire)
  }
  muro.add(calendario)
  root.add(muro)

  // folha de hoje (i-DÁG!) — despenca da prancheta
  const folha = new THREE.Group()
  folha.position.set(0.02, -0.9, 0.52)
  folha.rotation.set(-1.25, 0, 0.55)
  const sheet = rbox(0.29, 0.37, 0.016, 0.012, PAPER, { roughness: 0.75 })
  folha.add(sheet)
  const headline = rbox(0.24, 0.06, 0.012, 0.006, BUTTON, { roughness: 0.6 })
  headline.position.set(0, 0.13, 0.014)
  folha.add(headline)
  for (const row of [0, 1, 2]) {
    const line = rbox(0.19 - row * 0.03, 0.028, 0.01, 0.005, '#8d9296', { roughness: 0.7 })
    line.position.set(-0.02, 0.02 - row * 0.06, 0.013)
    folha.add(line)
  }
  calendario.add(folha)

  // ---- poste do interfone --------------------------------------------------
  const poste = new THREE.Group()
  poste.position.set(1.7, 0, 0.6)
  poste.rotation.y = -0.45

  const flange = cylinder(0.17, 0.21, 0.07, STEEL_DARK, { roughness: 0.3, metalness: 0.7 })
  flange.position.y = GY + 0.035
  poste.add(flange)

  const mast = cylinder(0.075, 0.095, 1.25, STEEL, { roughness: 0.3, metalness: 0.8 })
  mast.position.y = GY + 0.66
  poste.add(mast)

  const boxBody = rbox(0.36, 0.46, 0.2, 0.05, STEEL_DARK, { roughness: 0.4 })
  boxBody.position.set(0, 1.3, 0.03)
  poste.add(boxBody)

  const visor = rbox(0.38, 0.06, 0.26, 0.02, STEEL, { roughness: 0.3, metalness: 0.7 })
  visor.position.set(0, 1.52, 0.06)
  poste.add(visor)

  // grelha do alto-falante
  for (let i = 0; i < 4; i++) {
    const slot = rbox(0.22, 0.022, 0.02, 0.008, '#2f363c', { roughness: 0.55 })
    slot.position.set(0, 1.42 - i * 0.045, 0.13)
    poste.add(slot)
  }

  const bezel = cylinder(0.105, 0.115, 0.06, '#3d454b', { roughness: 0.5 })
  bezel.rotation.x = Math.PI / 2
  bezel.position.set(0, 1.14, 0.115)
  poste.add(bezel)
  root.add(poste)

  // botão vermelho, na pose final AFUNDADO
  const botao = new THREE.Group()
  botao.position.set(0, 1.14, 0.135)
  const cap = cylinder(0.075, 0.078, 0.08, BUTTON, { roughness: 0.35 })
  cap.rotation.x = Math.PI / 2
  botao.add(cap)
  const gloss = cylinder(0.04, 0.04, 0.015, '#e07a68', { roughness: 0.2 })
  gloss.rotation.x = Math.PI / 2
  gloss.position.z = 0.045
  botao.add(gloss)
  poste.add(botao)

  // três anéis de som saindo do interfone
  const aneis = new THREE.Group()
  aneis.position.set(0, 1.3, 0.17)
  for (const [r, tube] of [[0.23, 0.032], [0.36, 0.028], [0.5, 0.024]] as const) {
    const ring = torus(r, tube, WAVE, { emissive: '#8fc4ee', emissiveIntensity: 1.2, roughness: 0.3 })
    ring.scale.z = 0.45
    aneis.add(ring)
  }
  poste.add(aneis)

  // ---- XU, a elefanta-monitora, atrás do muro ------------------------------
  const elefanta = new THREE.Group()
  elefanta.position.set(-0.45, GY, -1.7)

  const torso = capsule(0.52, 0.46, HIDE, { roughness: 0.88 })
  torso.position.y = 0.95
  torso.scale.z = 1.12
  elefanta.add(torso)

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const leg = capsule(0.155, 0.24, HIDE_DARK, { roughness: 0.88 })
      leg.position.set(sx * 0.33, 0.3, sz * 0.34)
      elefanta.add(leg)
      const nail = cylinder(0.16, 0.16, 0.05, '#e4dccd', { roughness: 0.7 })
      nail.position.set(sx * 0.33, 0.045, sz * 0.34)
      elefanta.add(nail)
    }
  }

  const tail = capsule(0.05, 0.36, HIDE_DARK, { roughness: 0.88 })
  tail.position.set(0, 0.85, -0.68)
  tail.rotation.x = -0.35
  elefanta.add(tail)

  const skull = sphere(0.42, HIDE, { roughness: 0.88 })
  skull.scale.set(1, 0.96, 1.06)
  skull.position.set(0, 1.72, 0.3)
  elefanta.add(skull)

  const brow = capsule(0.11, 0.34, HIDE, { roughness: 0.88 })
  brow.rotation.z = Math.PI / 2
  brow.position.set(0, 1.92, 0.55)
  elefanta.add(brow)

  for (const side of [-1, 1]) {
    // orelhas grandes em leque
    const ear = sphere(0.38, HIDE, { roughness: 0.88 })
    ear.scale.set(0.92, 1.2, 0.14)
    ear.position.set(side * 0.47, 1.76, 0.16)
    ear.rotation.set(0.08, side * 0.5, -side * 0.18)
    elefanta.add(ear)

    const earInner = sphere(0.29, INNER_EAR, { roughness: 0.9 })
    earInner.scale.set(0.9, 1.18, 0.1)
    earInner.position.set(side * 0.53, 1.75, 0.24)
    earInner.rotation.set(0.08, side * 0.5, -side * 0.18)
    elefanta.add(earInner)

    // olhinhos miúdos
    const sclera = sphere(0.075, '#ffffff', { roughness: 0.25 })
    sclera.position.set(side * 0.18, 1.79, 0.66)
    sclera.scale.z = 0.55
    const pupil = sphere(0.036, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(side * 0.18, 1.79, 0.71)
    elefanta.add(sclera, pupil)
  }
  root.add(elefanta)

  // boné azul-petróleo de monitora
  const bone = new THREE.Group()
  bone.position.set(0, 2.0, 0.14)
  const crown = lathe(
    [[0, 0], [0.19, 0.005], [0.31, 0.05], [0.38, 0.13], [0.39, 0.22], [0.32, 0.31], [0.18, 0.37], [0, 0.385]],
    PETROL,
    { roughness: 0.62 },
  )
  bone.add(crown)
  const brim = rbox(0.52, 0.05, 0.36, 0.022, PETROL_DARK, { roughness: 0.62 })
  brim.position.set(0, 0.06, 0.36)
  brim.rotation.x = -0.14
  bone.add(brim)
  const knob = sphere(0.05, PETROL_DARK, { roughness: 0.5 })
  knob.position.y = 0.4
  bone.add(knob)
  const badge = rbox(0.13, 0.09, 0.03, 0.012, MUSTARD, { roughness: 0.45 })
  badge.position.set(0, 0.18, 0.35)
  badge.rotation.x = -0.2
  bone.add(badge)
  elefanta.add(bone)

  // ---- tromba esticada em arco por cima do portão --------------------------
  const tromba = trunkArc()
  tromba.position.set(-0.45, 1.76, -0.98)
  root.add(tromba)

  // ---- mochila laranja, enrolada na ponta da tromba ------------------------
  const mochila = new THREE.Group()
  mochila.position.set(-0.45, 1.05, 1.38)
  mochila.rotation.z = 0.1

  const pack = rbox(0.42, 0.48, 0.28, 0.1, ORANGE, { roughness: 0.55 })
  mochila.add(pack)
  const flap = rbox(0.44, 0.24, 0.3, 0.09, ORANGE_DARK, { roughness: 0.55 })
  flap.position.y = 0.15
  mochila.add(flap)
  const pocket = rbox(0.28, 0.18, 0.08, 0.04, ORANGE_DARK, { roughness: 0.55 })
  pocket.position.set(0, -0.12, 0.17)
  mochila.add(pocket)
  const buckle = rbox(0.09, 0.06, 0.04, 0.015, '#f2e2c6', { roughness: 0.35 })
  buckle.position.set(0, 0.02, 0.17)
  mochila.add(buckle)
  const handle = torus(0.11, 0.028, ORANGE_DARK, { roughness: 0.6 })
  handle.position.y = 0.3
  handle.rotation.y = Math.PI / 2
  mochila.add(handle)
  for (const side of [-1, 1]) {
    const strap = capsule(0.035, 0.34, ORANGE_DARK, { roughness: 0.7 })
    strap.position.set(side * 0.12, -0.02, -0.16)
    strap.rotation.x = 0.12
    mochila.add(strap)
  }
  root.add(mochila)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'patio', object: base },
    { name: 'muro', group: 'patio', object: muro },
    { name: 'poste', group: 'interfone', object: poste },
    { name: 'botao', group: 'interfone', object: botao },
    { name: 'aneis', group: 'interfone', object: aneis },
    { name: 'elefanta', group: 'elefanta', object: elefanta },
    { name: 'bone', group: 'elefanta', object: bone },
    { name: 'tromba', group: 'tromba', object: tromba },
    { name: 'mochila', group: 'tromba', object: mochila },
    { name: 'folha', group: 'idag', object: folha },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.85)], {
      ease: 'easeOut',
      caption: 'O pátio de borracha verde-menta da creche brota do chão…',
    }),
    seq('muro-rise', 'muro', 0.2, 0.85, [riseFrom(0, 2.15)], { ease: 'easeOut' }),

    seq('poste-rise', 'poste', 1.8, 0.75, [riseFrom(0, 1.75)], {
      ease: 'easeOut',
      caption: 'Do lado de fora sobe o poste do interfone, cinza-aço.',
    }),
    seq('botao-out', 'botao', 2.0, 0.5, [ch('position.z', 0.02, 0.185)], { ease: 'easeOut' }),
    seq('botao-press', 'botao', 2.7, 0.4, [ch('position.z', 0.185, 0.135)], {
      caption: 'Você DÊ (aperta) o botão — e É IÁ SOM! A onda sai antes do dedo sair.',
    }),
    seq('aneis-pop', 'aneis', 3.0, 0.7, [ch('scale.x', 0.05, 1), ch('scale.y', 0.05, 1)], {
      ease: 'easeOut',
    }),

    seq('elefanta-rise', 'elefanta', 3.6, 0.85, [riseFrom(GY, 2.75)], {
      ease: 'easeOut',
      caption: 'Do outro lado atende XU, a elefanta-monitora da FÖ-XKU-LAN — o X vem com o K grudado.',
    }),
    seq('bone-pop', 'bone', 3.85, 0.6, [
      ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1),
    ], { ease: 'easeOut' }),

    // PÔ! de pata no chão
    seq('elefanta-po-down', 'elefanta', 5.4, 0.22, [ch('position.y', GY, GY - 0.09)], { ease: 'easeIn' }),
    seq('elefanta-po-up', 'elefanta', 5.62, 0.3, [ch('position.y', GY - 0.09, GY)], { ease: 'easeOut' }),

    seq('tromba-stretch', 'tromba', 5.4, 0.85, [ch('scale.y', 0.3, 1), ch('scale.z', 0.05, 1)], {
      ease: 'easeOut',
      caption: 'Ela dá um PÔ! de pata no chão e estica a tromba por cima do portão: RRÉM-TAR!',
    }),
    seq('mochila-rise', 'mochila', 5.6, 0.7, [
      ch('position.x', -1.3, -1.3), ch('position.z', -1.0, -1.0), riseFrom(0.62, 1.25),
    ], { ease: 'easeOut' }),
    seq('mochila-lift', 'mochila', 6.4, 0.6, [ch('position.y', 0.62, 1.9)], { ease: 'easeOut' }),
    seq('mochila-carry', 'mochila', 7.0, 0.75, [
      ch('position.x', -1.3, -0.45),
      ch('position.y', 1.9, 1.05),
      ch('position.z', -1.0, 1.38),
      ch('rotation.z', -0.5, 0.1),
    ], {
      caption: 'A tromba enrola a mochila e traz a criança inteira pelo ar até você.',
    }),

    seq('folha-print', 'folha', 8.0, 0.5, [
      ch('scale.x', 0.02, 1), ch('scale.y', 0.02, 1), ch('scale.z', 0.02, 1),
      ch('position.y', 0.02, 0.02), ch('position.z', 0.055, 0.055),
      ch('rotation.x', 0, 0), ch('rotation.z', 0, 0),
    ], { ease: 'easeOut' }),
    seq('folha-fall', 'folha', 8.7, 0.9, [
      ch('position.x', 0, 0.02),
      ch('position.y', 0.02, -0.9),
      ch('position.z', 0.055, 0.52),
      ch('rotation.x', 0, -1.25),
      ch('rotation.z', 0, 0.55),
    ], {
      ease: 'easeIn',
      caption: 'E a folha de hoje despenca no chão: i-DÁG! — Det är jag som hämtar på förskolan idag.',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.45, 2.35, 5.15], target: [0.1, 1.2, -0.1] },
  }
}

export const card: Card = {
  refine: { organic: ['elefanta', 'tromba'] },
  meta: {
    id: 'jag-hamtar-pa-forskolan',
    contexto: 'Avisando a professora da förskola quem vai pegar a criança.',
    fraseFonte: 'Sou eu que busco na creche hoje.',
    fraseAlvo: 'Det är jag som hämtar på förskolan idag.',
    pronuncia:
      "de é iá som HÉM-tar pô FÖSH-ku-lan i-DÁG ('rs' de förskolan vira som de 'sh')",
    ponteSonora:
      "DÊ — É IÁ SOM! RRÉM-TAR PÔ FÖ-XKU-LAN, i-DÁG! (12 sílabas, tônicas em RRÉM, FÖ e DÁG; 'som' com Ó aberto e M de lábios FECHADOS, nunca o 'sõ' nasal do português; o RR de 'hämtar' é só o h soprado e o R do fim é BRANDO; 'på' = PÔ com Ô FECHADO, nunca 'pó'; FÖ é o Ô com bico de beijo; o 'rs' de förskolan vira X chiado MAS O K CONTINUA LÁ: FÖ-XKU-LAN, nunca 'FÖ-XU-LAN')",
    historia:
      'No portão da creche o interfone funciona assim: você DÊ (aperta) o botão e É IÁ SOM — a onda sai antes do dedo sair. Do outro lado atende XU, a elefanta-monitora da FÖ-XKU-LAN (o X vem com um K grudado, é o estalo da tromba engatilhando). Ela dá um PÔ! de pata no chão e estica a tromba por cima do portão: RRÉM-TAR! A tromba enrola a mochila da criança e traz ela inteira pelo ar até você — e a folha do calendário de hoje despenca no chão: i-DÁG!',
  },
  createScene,
}

export default card
