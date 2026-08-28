import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, lathe, puff, person,
} from '../rig/helpers'

/**
 * "Jag måste vabba idag, mitt barn är sjukt."
 * IÁ MÔSTE VÁBA IDÁG — MIT BÁR, NÉ? RRÜÜKT!
 *
 * Diorama: chão do quarto com tapete creme e fortaleza de almofadões.
 * O filhote de lontra febril está de barriga pra cima, virou fábrica de VÁBA
 * (o fio de baba chega ao tapete), montou um BÁR de xaropes num caixote
 * virado, e arranca o dardo de ventosa da testa — RRÜÜKT! — bem na hora em
 * que o papai lontra de gravata ergue o celular pra MÔSTRAR a prova ao chefe.
 */

const RUG = '#e0d2b4'
const RUG_EDGE = '#c9b58f'
const FLOOR = '#8a6642'
const WOOD = '#8a6134'
const WOOD_DARK = '#5f4222'
const BLUE = '#3f6ea3'
const MUSTARD = '#c99a35'
const PUP = '#b98f63'
const PUP_LIGHT = '#e0c9a3'
const DAD = '#63432e'
const DAD_LIGHT = '#c39a6c'
const TIE = '#7d2b34'
const RED = '#d1402c' // acento reservado: o DARDO DE VENTOSA (RRÜÜKT)
const GY = 0.16 // topo do tapete/base do diorama

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(19)

  // ---- base do diorama: assoalho + tapete + tralha de quarto ---------------
  const base = new THREE.Group()

  const floor = cylinder(2.5, 2.6, 0.12, FLOOR, { roughness: 0.75 })
  floor.position.y = 0.06
  base.add(floor)

  const rugPad = rbox(2.66, 0.05, 2.26, 0.02, RUG_EDGE, { roughness: 0.92 })
  rugPad.position.y = 0.145
  base.add(rugPad)

  const rug = rbox(2.5, 0.05, 2.1, 0.02, RUG, { roughness: 0.92 })
  rug.position.y = 0.175
  base.add(rug)

  // bola de pelúcia esquecida
  const plush = puff(0.17, '#c96f6a', 5, 21, { roughness: 0.92 })
  plush.position.set(-1.85, GY + 0.14, 0.95)
  plush.rotation.y = rand() * Math.PI
  base.add(plush)

  // bloquinho de montar
  const bloco = rbox(0.24, 0.24, 0.24, 0.04, BLUE, { roughness: 0.45 })
  bloco.position.set(1.72, GY + 0.12, 0.9)
  bloco.rotation.y = rand() * Math.PI
  base.add(bloco)

  // meia largada
  const meia = capsule(0.07, 0.2, '#dfe3e8', { roughness: 0.92 })
  meia.position.set(-1.15, GY + 0.07, 1.35)
  meia.rotation.set(Math.PI / 2, rand() * Math.PI, 0.3)
  base.add(meia)

  // livro de figuras aberto de cabeça pra baixo
  const livro = rbox(0.42, 0.06, 0.3, 0.02, '#4e8a6d', { roughness: 0.7 })
  livro.position.set(1.55, GY + 0.03, -1.35)
  livro.rotation.set(0, -0.5 + rand() * 0.3, 0.06)
  base.add(livro)

  root.add(base)

  // ---- fortaleza de almofadões (V atrás do filhote) ------------------------
  const almofadas = new THREE.Group()

  const almofadaA = rbox(1.05, 0.92, 0.28, 0.13, BLUE, { roughness: 0.92 })
  almofadaA.position.set(-1.3, GY + 0.44, -0.85)
  almofadaA.rotation.set(0.32, 0.62, 0.05)
  almofadas.add(almofadaA)

  const almofadaB = rbox(0.98, 0.86, 0.26, 0.12, MUSTARD, { roughness: 0.92 })
  almofadaB.position.set(-0.2, GY + 0.41, -1.2)
  almofadaB.rotation.set(0.28, -0.48, -0.05)
  almofadas.add(almofadaB)

  // almofadinha caída na base do V
  const almofadaC = rbox(0.6, 0.2, 0.5, 0.09, '#d9cdb6', { roughness: 0.92 })
  almofadaC.position.set(-0.82, GY + 0.1, -0.62)
  almofadaC.rotation.set(0, 0.35, 0.04)
  almofadas.add(almofadaC)

  root.add(almofadas)

  // ---- filhote de lontra, de barriga pra cima ------------------------------
  const filhote = new THREE.Group()
  filhote.position.set(-0.55, GY, 0.35)
  filhote.rotation.y = 0.25

  const pupBody = capsule(0.24, 0.5, PUP, { roughness: 0.8 })
  pupBody.rotation.z = Math.PI / 2
  pupBody.position.set(0, 0.25, 0)
  filhote.add(pupBody)

  const pupBelly = sphere(0.2, PUP_LIGHT, { roughness: 0.85 })
  pupBelly.position.set(0.02, 0.42, 0.02)
  pupBelly.scale.set(1.9, 0.5, 0.85)
  filhote.add(pupBelly)

  const pupTail = capsule(0.085, 0.44, PUP, { roughness: 0.8 })
  pupTail.position.set(-0.74, 0.13, -0.04)
  pupTail.rotation.set(0, 0.25, Math.PI / 2 + 0.12)
  filhote.add(pupTail)

  const pupHead = sphere(0.21, PUP, { roughness: 0.8 })
  pupHead.position.set(0.6, 0.29, 0)
  pupHead.scale.set(0.95, 1, 1)
  filhote.add(pupHead)

  // focinho chato virado pra cima (ele está de costas no chão)
  const pupMuzzle = sphere(0.14, PUP_LIGHT, { roughness: 0.8 })
  pupMuzzle.position.set(0.7, 0.4, 0.03)
  pupMuzzle.scale.set(0.95, 0.68, 1.05)
  filhote.add(pupMuzzle)

  const pupNose = sphere(0.045, '#3a2a20', { roughness: 0.35 })
  pupNose.position.set(0.75, 0.5, 0.04)
  filhote.add(pupNose)

  // boca entreaberta de onde escorre a baba
  const pupMouth = sphere(0.06, '#7a4b46', { roughness: 0.5 })
  pupMouth.position.set(0.71, 0.4, 0.14)
  pupMouth.scale.set(0.9, 0.6, 0.7)
  filhote.add(pupMouth)

  for (const side of [-1, 1]) {
    // olhos apontando pro teto, achatados
    const eye = sphere(0.058, '#ffffff', { roughness: 0.25 })
    eye.position.set(0.55, 0.46, side * 0.1)
    eye.scale.y = 0.6
    const pupil = sphere(0.028, '#1a1a1a', { roughness: 0.2 })
    pupil.position.set(0.545, 0.5, side * 0.1)
    filhote.add(eye, pupil)

    const ear = sphere(0.06, PUP, { roughness: 0.8 })
    ear.position.set(0.44, 0.4, side * 0.175)
    ear.scale.set(0.7, 0.9, 1)
    filhote.add(ear)

    // bochecha corada de febre
    const blush = sphere(0.062, '#c98079', { roughness: 0.85 })
    blush.position.set(0.63, 0.44, side * 0.145)
    blush.scale.set(1, 0.45, 0.9)
    filhote.add(blush)

    // bigodes
    for (const k of [-1, 0, 1]) {
      const whisker = cylinder(0.006, 0.006, 0.2, '#efe6d8', { roughness: 0.6 }, 8)
      whisker.position.set(0.76, 0.42 + k * 0.03, side * 0.1)
      whisker.rotation.set(side * 1.35, 0, 0.5 + k * 0.18)
      filhote.add(whisker)
    }

    // patinhas pra cima
    const paw = capsule(0.055, 0.15, PUP, { roughness: 0.8 })
    paw.position.set(0.26, 0.48, side * 0.19)
    paw.rotation.set(side * 0.25, 0, -0.3)
    const pawPad = sphere(0.05, PUP_LIGHT, { roughness: 0.85 })
    pawPad.position.y = 0.11
    paw.add(pawPad)
    filhote.add(paw)

    const foot = capsule(0.065, 0.18, PUP, { roughness: 0.8 })
    foot.position.set(-0.32, 0.46, side * 0.2)
    foot.rotation.set(side * 0.3, 0, 0.35)
    const footPad = sphere(0.058, PUP_LIGHT, { roughness: 0.85 })
    footPad.position.y = 0.12
    foot.add(footPad)
    filhote.add(foot)
  }

  root.add(filhote)

  // ---- o fio de VÁBA: cresce da boca até o tapete --------------------------
  const baba = new THREE.Group()
  baba.position.set(0.72, 0.36, 0.17)

  const fio = cylinder(0.018, 0.032, 0.3, '#e4efe6', { roughness: 0.12 })
  fio.position.y = -0.16
  baba.add(fio)

  const gota = sphere(0.045, '#e4efe6', { roughness: 0.12 })
  gota.position.set(0.004, -0.24, 0.004)
  gota.scale.set(0.9, 1.25, 0.9)
  baba.add(gota)

  const poca = sphere(0.13, '#e4efe6', { roughness: 0.12 })
  poca.position.y = -0.335
  poca.scale.set(1, 0.16, 0.85)
  baba.add(poca)

  const respingo = sphere(0.055, '#e4efe6', { roughness: 0.12 })
  respingo.position.set(0.16, -0.335, 0.07)
  respingo.scale.set(1, 0.18, 0.9)
  baba.add(respingo)

  filhote.add(baba)

  // ---- dardo de ventosa grudado na testa (RRÜÜKT) --------------------------
  const dardo = new THREE.Group()
  dardo.position.set(0.5, 0.46, 0.0)
  dardo.rotation.z = 0.12

  const ventosa = cone(0.078, 0.11, RED, { roughness: 0.55 })
  ventosa.position.y = 0.055
  dardo.add(ventosa)

  const anel = cylinder(0.05, 0.05, 0.03, '#8f2a1c', { roughness: 0.55 })
  anel.position.y = 0.12
  dardo.add(anel)

  const haste = cylinder(0.022, 0.024, 0.2, '#efe7d8', { roughness: 0.45 })
  haste.position.y = 0.23
  dardo.add(haste)

  for (let i = 0; i < 3; i++) {
    const aleta = rbox(0.015, 0.09, 0.075, 0.006, RED, { roughness: 0.55 })
    const a = (i / 3) * Math.PI * 2
    aleta.position.set(Math.cos(a) * 0.045, 0.32, Math.sin(a) * 0.045)
    aleta.rotation.y = -a
    dardo.add(aleta)
  }

  filhote.add(dardo)

  // ---- o BÁR: caixote virado ----------------------------------------------
  const caixote = new THREE.Group()
  caixote.position.set(0.45, GY, -0.52)
  caixote.rotation.y = 0.35

  const corpo = rbox(0.74, 0.5, 0.52, 0.035, WOOD, { roughness: 0.75 })
  corpo.position.y = 0.25
  caixote.add(corpo)

  const tampo = rbox(0.8, 0.06, 0.58, 0.02, WOOD_DARK, { roughness: 0.7 })
  tampo.position.y = 0.53
  caixote.add(tampo)

  for (const k of [-1, 1]) {
    const ripa = rbox(0.76, 0.07, 0.03, 0.015, WOOD_DARK, { roughness: 0.75 })
    ripa.position.set(0, 0.25 + k * 0.15, 0.265)
    caixote.add(ripa)
  }
  for (const side of [-1, 1]) {
    const pe = rbox(0.1, 0.08, 0.1, 0.02, WOOD_DARK, { roughness: 0.8 })
    pe.position.set(side * 0.3, 0.04, 0.2)
    caixote.add(pe)
  }

  root.add(caixote)

  // ---- garrafinhas de xarope: telescopam de dentro do caixote --------------
  const garrafas = new THREE.Group()
  garrafas.position.set(0.45, GY + 0.56, -0.52)
  garrafas.rotation.y = 0.35

  const xaropes = ['#6d4d9b', '#c9722b', '#4f8a58']
  xaropes.forEach((cor, i) => {
    const g = new THREE.Group()
    g.position.set(-0.22 + i * 0.22, 0, (rand() - 0.5) * 0.12)
    g.rotation.y = rand() * Math.PI

    const vidro = lathe(
      [
        [0, 0], [0.06, 0], [0.075, 0.03], [0.075, 0.16],
        [0.05, 0.21], [0.032, 0.24], [0.032, 0.3], [0.042, 0.31], [0, 0.31],
      ],
      cor,
      { roughness: 0.15 },
    )
    g.add(vidro)

    const rolha = cylinder(0.036, 0.036, 0.05, '#d8b98a', { roughness: 0.7 })
    rolha.position.y = 0.335
    g.add(rolha)

    const rotulo = rbox(0.09, 0.07, 0.03, 0.01, '#efe6d4', { roughness: 0.85 })
    rotulo.position.set(0, 0.1, 0.062)
    g.add(rotulo)

    garrafas.add(g)
  })

  // copinho dosador do BÁR
  const dosador = lathe(
    [[0, 0], [0.045, 0], [0.05, 0.02], [0.055, 0.09], [0.048, 0.09], [0.042, 0.02], [0, 0.02]],
    '#dfe5ea',
    { roughness: 0.15 },
  )
  dosador.position.set(0.26, 0, 0.12)
  garrafas.add(dosador)

  root.add(garrafas)

  // ---- papai lontra de gravata --------------------------------------------
  const papai = person({ body: DAD, skin: DAD_LIGHT, height: 1.5, armAngle: 0.4 })
  papai.position.set(1.35, GY, -0.05)
  papai.rotation.y = -1.3

  const peito = capsule(0.16, 0.24, DAD_LIGHT, { roughness: 0.8 })
  peito.position.set(0, 0.5, 0.16)
  peito.scale.z = 0.5
  papai.add(peito)

  const gravata = rbox(0.11, 0.42, 0.04, 0.02, TIE, { roughness: 0.5 })
  gravata.position.set(0.03, 0.44, 0.26)
  gravata.rotation.set(0.06, 0, 0.22) // torta, como quem vestiu correndo
  papai.add(gravata)

  const no = rbox(0.09, 0.08, 0.05, 0.02, TIE, { roughness: 0.5 })
  no.position.set(0.08, 0.68, 0.24)
  no.rotation.z = 0.22
  papai.add(no)

  const rabo = capsule(0.1, 0.55, DAD, { roughness: 0.8 })
  rabo.position.set(0, 0.3, -0.3)
  rabo.rotation.x = -1.1
  papai.add(rabo)

  const cabecaPapai = papai.getObjectByName('head')!
  const focinho = sphere(0.15, DAD_LIGHT, { roughness: 0.8 })
  focinho.position.set(0, -0.07, 0.22)
  focinho.scale.set(1.05, 0.7, 1.05)
  cabecaPapai.add(focinho)

  const narizPapai = sphere(0.05, '#3a2a20', { roughness: 0.35 })
  narizPapai.position.set(0, -0.03, 0.35)
  cabecaPapai.add(narizPapai)

  for (const side of [-1, 1]) {
    const orelha = sphere(0.07, DAD, { roughness: 0.8 })
    orelha.position.set(side * 0.24, 0.14, -0.02)
    orelha.scale.set(0.6, 0.95, 1)
    cabecaPapai.add(orelha)

    for (const k of [-1, 1]) {
      const bigode = cylinder(0.006, 0.006, 0.22, '#efe6d8', { roughness: 0.6 }, 8)
      bigode.position.set(side * 0.09, -0.05 + k * 0.035, 0.3)
      bigode.rotation.set(0.2, -side * 0.9, side * (0.35 + k * 0.2))
      cabecaPapai.add(bigode)
    }
  }

  // braços erguidos: as duas patas seguram o celular na altura do rosto
  for (const [name, sign] of [['armL', -1], ['armR', 1]] as const) {
    const arm = papai.getObjectByName(name)!
    arm.rotation.set(-0.5, 0, sign * 3.0)
  }

  root.add(papai)

  // ---- celular gigante erguido (a prova pro chefe) -------------------------
  const celular = new THREE.Group()
  celular.position.set(0, 1.12, 0.42)
  celular.rotation.set(-0.08, 0.18, 0.05)

  const carcaca = rbox(0.52, 0.92, 0.07, 0.05, '#39434f', { roughness: 0.35 })
  celular.add(carcaca)

  const tela = rbox(0.44, 0.8, 0.02, 0.02, '#dfeaf5', {
    emissive: '#bcd8f0',
    emissiveIntensity: 1.0,
  })
  tela.position.z = 0.04
  celular.add(tela)

  // moldura da chamada na tela + "cabeça" do chefe
  const janela = rbox(0.34, 0.36, 0.012, 0.015, '#8fb0cc', { roughness: 0.4 })
  janela.position.set(0, 0.16, 0.055)
  celular.add(janela)
  const chefe = sphere(0.09, DAD_LIGHT, { roughness: 0.6 })
  chefe.position.set(0, 0.16, 0.07)
  chefe.scale.z = 0.5
  celular.add(chefe)

  // costas: lente + ponto de gravação vermelho (é o que a câmera vê)
  const lente = cylinder(0.07, 0.07, 0.03, '#222a33', { roughness: 0.2, metalness: 0.7 })
  lente.position.set(-0.14, 0.3, -0.05)
  lente.rotation.x = Math.PI / 2
  celular.add(lente)

  const rec = sphere(0.032, RED, { emissive: RED, emissiveIntensity: 1.2 })
  rec.position.set(0.14, 0.3, -0.05)
  celular.add(rec)

  papai.add(celular)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'almofadas', group: 'cenario', object: almofadas },
    { name: 'filhote', group: 'filhote', object: filhote },
    { name: 'dardo', group: 'filhote', object: dardo },
    { name: 'baba', group: 'baba', object: baba },
    { name: 'caixote', group: 'bar', object: caixote },
    { name: 'garrafas', group: 'bar', object: garrafas },
    { name: 'papai', group: 'papai', object: papai },
    { name: 'celular', group: 'papai', object: celular },
  ]

  // ---- montagem ------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.9)], {
      ease: 'easeOut',
      caption: 'No chão do quarto brota o tapete: hoje ninguém sai de casa — IDÁG (hoje).',
    }),
    seq('almofadas-rise', 'almofadas', 0.65, 0.8, [riseFrom(0, 1.3)], { ease: 'easeOut' }),

    seq('filhote-rise', 'filhote', 2.2, 0.8, [riseFrom(GY, 1.1)], {
      ease: 'easeOut',
      caption: 'Sobe o filhote de lontra febril, caído de barriga pra cima na fortaleza de almofadões…',
    }),
    seq(
      'dardo-pop',
      'dardo',
      2.5,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),

    seq('baba-drip', 'baba', 4.2, 0.9, [ch('scale.y', 0.01, 1)], {
      ease: 'easeIn',
      caption: '…e ele virou fábrica de VÁBA: o fio de baba já chega ao tapete (vabba = ficar com o filho doente).',
    }),

    seq('caixote-rise', 'caixote', 6.0, 0.8, [riseFrom(GY, 1.0)], {
      ease: 'easeOut',
      caption: 'Do caixote virado ele montou o próprio BÁR de xaropes — MIT BÁR, NÉ? (mitt barn = meu filho).',
    }),
    seq('garrafas-out', 'garrafas', 6.25, 0.8, [ch('position.y', GY + 0.06, GY + 0.56)], {
      ease: 'easeOut',
    }),

    seq('papai-rise', 'papai', 8.0, 0.9, [riseFrom(GY, 1.9)], {
      ease: 'easeOut',
      caption: 'Papai lontra de gravata torta sobe pra MÔSTE-ar a prova ao chefe (måste = preciso).',
    }),
    seq(
      'celular-pop',
      'celular',
      8.45,
      0.6,
      [ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1)],
      { ease: 'easeOut' },
    ),
    seq('celular-mira', 'celular', 9.2, 0.6, [ch('rotation.x', -0.45, -0.08)]),

    seq(
      'dardo-arranca',
      'dardo',
      10.2,
      0.5,
      [ch('position.y', 0.46, 1.02), ch('rotation.z', 0.12, -1.25)],
      {
        ease: 'easeOut',
        caption: 'Bem na hora da câmera, o filhote arranca o dardo de ventosa da testa: RRÜÜKT!',
      },
    ),
    seq(
      'dardo-cai',
      'dardo',
      10.7,
      0.6,
      [ch('position.y', 1.02, 0.09), ch('position.x', 0.5, 1.18), ch('rotation.z', -1.25, -1.62)],
      { ease: 'easeIn' },
    ),
    seq('celular-nod', 'celular', 10.85, 0.5, [ch('rotation.z', -0.12, 0.05)]),

    seq('filhote-tremor', 'filhote', 11.7, 0.45, [ch('rotation.z', 0, 0.05)], {
      caption: 'Jag måste vabba idag, mitt barn är sjukt. — "Preciso ficar em casa com meu filho hoje, ele está doente."',
    }),
    seq('filhote-calma', 'filhote', 12.15, 0.55, [ch('rotation.z', 0.05, 0)], { ease: 'easeOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [1.05, 3.0, 6.05], target: [-0.05, 0.85, 0.05] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-maste-vabba-idag',
    contexto: 'Aviso ao chefe ou ao chat da equipe quando o filho está doente (VAB = vård av barn).',
    fraseFonte: 'Preciso ficar em casa com meu filho hoje, ele está doente.',
    fraseAlvo: 'Jag måste vabba idag, mitt barn är sjukt.',
    pronuncia:
      "iá MÓS-te VÁB-ba i-DÁG, mit BÁRN é RHÚUKT ('måste' com ó fechado; 'vabba' com A aberto)",
    ponteSonora:
      "IÁ MÔSTE VÁBA IDÁG — MIT BÁR, NÉ? RRÜÜKT! (11 sílabas; MÔSTE = 'mostre' sem R, Ô FECHADO; VÁBA = 'baba' com V, força na 1ª; o N de 'barn' emenda: BÁR, NÉ?; RRÜÜKT fecha em KT seco)",
    historia:
      'Papai lontra precisa MOSTRAR pro chefe por que não vai aparecer: vira o celular pro filhote, que virou fábrica de VÁBA — o fio de baba já chega ao chão. O filhotinho febril, deitado de barriga pra cima como toda lontra, montou um BAR de xaropes num caixote virado e, bem na hora da câmera, arranca o dardo de ventosa da própria testa: RRÜÜKT!',
  },
  createScene,
}

export default card
