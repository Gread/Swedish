import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  seq, ch, riseFrom, rng,
  rbox, capsule, cylinder, sphere, cone, torus,
} from '../rig/helpers'

/**
 * "Var slänger man kartong?" — no återvinningsrum você aponta (VÁR?) e do meio
 * das caixas sai SLÉNGUER, o guaxinim que MANCA de muleta, monta o papelão num
 * estilingue gigante e dispara: TÓNG! na fenda do container azul.
 *
 * Diorama: piso de concreto com faixa amarela, container azul-sueco com rodízios
 * e fenda à direita, pilha de caixas achatadas ao fundo, placa branca com seta
 * azul, e na frente o guaxinim manco com muleta e estilingue de elástico vermelho.
 */

const CONCRETE = '#8e9490'
const CONCRETE_DARK = '#848a86' // mancha sutil: escura demais lia como buraco
const YELLOW = '#c9a53f'
const BLUE = '#2f5d92'
const BLUE_LIGHT = '#3f74ad'
const BLUE_DARK = '#1d3d63'
const CARD_BROWN = '#c69a63'
const CARD_DARK = '#a97e4c'
const FUR = '#5d626c'
const FUR_LIGHT = '#9aa0a9'
const MASK = '#2c2f36'
const WOOD = '#8a6a42'
const WOOD_DARK = '#6b4f2e'
const STEEL = '#9aa0a9'
const RED = '#c94f3d' // acento saturado reservado: o ELÁSTICO do estilingue
const GLOW = '#ffd66b'

const GY = 0.14 // topo do piso do diorama

const UP = new THREE.Vector3(0, 1, 0)

/** Cápsula esticada de A até B — membros, elásticos, braços de forquilha. */
function link(
  a: THREE.Vector3,
  b: THREE.Vector3,
  r: number,
  color: string,
  opts?: Parameters<typeof capsule>[3],
) {
  const dir = new THREE.Vector3().subVectors(b, a)
  const len = dir.length()
  const m = capsule(r, Math.max(len - r * 2, 0.01), color, opts)
  m.position.copy(a).addScaledVector(dir, 0.5)
  m.quaternion.setFromUnitVectors(UP, dir.normalize())
  return m
}

// ---- geometria de cena resolvida uma vez (a mão e a caixa precisam bater) ----
// O tiro corre na diagonal (frente-esquerda → fundo-direita): assim a forquilha
// em Y fica de 3/4 para a câmera em vez de de perfil, e a fenda do container
// olha para o estilingue E para quem assiste.
const SLING_POS = new THREE.Vector3(-0.65, GY, 0.6)
const SLING_RY = 0.62 // forquilha mirando o container
const SHOT = new THREE.Vector3(Math.cos(SLING_RY), 0, -Math.sin(SLING_RY)) // direção do tiro
const POUCH_LOCAL = new THREE.Vector3(-0.42, 1.18, 0)
const POUCH = POUCH_LOCAL.clone().applyAxisAngle(UP, SLING_RY).add(SLING_POS)

const CONTAINER_RY = Math.atan2(-SHOT.x, -SHOT.z) // fenda (+z local) virada para o tiro
const MOUTH_N = SHOT.clone().negate() // normal da fenda, para fora
const MOUTH = SLING_POS.clone().addScaledVector(SHOT, 2.2).setY(GY + 1.05)
const CONTAINER_POS = MOUTH.clone().addScaledVector(SHOT, 0.52).setY(GY)

const BOX_IN_POUCH = POUCH.clone().addScaledVector(SHOT, 0.06)
const BOX_APEX = BOX_IN_POUCH.clone().lerp(MOUTH, 0.5).setY(GY + 2.0)
const BOX_END = MOUTH.clone()

// guaxinim quase de perfil (cara para a direita), a pata de trás segurando a bolsa
const COON_RY = 1.78
const COON_PAW_LOCAL = new THREE.Vector3(0.135, 1.18, 0.551)
const COON_POS = POUCH.clone()
  .sub(COON_PAW_LOCAL.clone().applyAxisAngle(UP, COON_RY))
  .setY(GY)

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(23)

  // ---- base do diorama: piso de concreto ------------------------------------
  const base = new THREE.Group()

  const slab = cylinder(2.6, 2.68, 0.14, CONCRETE, { roughness: 0.92 })
  slab.position.y = 0.07
  base.add(slab)

  // faixa amarela pintada no piso
  const stripe = rbox(4.6, 0.022, 0.26, 0.008, YELLOW, { roughness: 0.85 })
  stripe.position.set(0, GY + 0.004, 0.98)
  base.add(stripe)

  const stripeShort = rbox(0.24, 0.022, 1.1, 0.008, YELLOW, { roughness: 0.85 })
  stripeShort.position.set(2.0, GY + 0.004, 0.05)
  base.add(stripeShort)

  // ralo de piso
  const drain = cylinder(0.24, 0.26, 0.035, '#4b4f4d', { roughness: 0.85 })
  drain.position.set(-0.45, GY - 0.008, 1.62)
  base.add(drain)
  for (let i = 0; i < 3; i++) {
    const bar = rbox(0.4, 0.02, 0.045, 0.008, '#3a3e3c', { roughness: 0.8 })
    bar.position.set(-0.45, GY + 0.012, 1.62 + (i - 1) * 0.1)
    base.add(bar)
  }

  // manchas escuras de uso no concreto
  for (const [mx, mz, mr] of [[1.15, 1.5, 0.34], [-1.9, 0.95, 0.26]] as const) {
    const stain = cylinder(mr, mr * 1.08, 0.012, CONCRETE_DARK, { roughness: 0.95 })
    stain.position.set(mx, GY - 0.002, mz)
    stain.rotation.y = rand() * Math.PI
    base.add(stain)
  }

  // latinha amassada esquecida
  const can = cylinder(0.06, 0.055, 0.15, '#b9bcc0', { roughness: 0.28, metalness: 0.75 })
  can.position.set(0.75, GY + 0.06, 1.45)
  can.rotation.set(Math.PI / 2, 0, 0.4 + rand() * 0.4)
  base.add(can)

  // rolo de fita adesiva no chão
  const tape = torus(0.11, 0.045, CARD_DARK, { roughness: 0.7 })
  tape.position.set(-2.1, GY + 0.045, 0.25)
  tape.rotation.set(Math.PI / 2, 0, rand() * Math.PI)
  base.add(tape)

  root.add(base)

  // ---- placa branca com seta azul -------------------------------------------
  const placa = new THREE.Group()
  placa.position.set(-0.25, GY, -1.9)

  const post = cylinder(0.05, 0.058, 1.35, STEEL, { roughness: 0.32, metalness: 0.7 })
  post.position.y = 0.675
  placa.add(post)

  const panel = rbox(0.82, 0.58, 0.06, 0.04, '#eceae4', { roughness: 0.35 })
  panel.position.y = 1.55
  panel.rotation.y = -0.28
  placa.add(panel)

  const iconBox = rbox(0.3, 0.2, 0.03, 0.02, CARD_BROWN, { roughness: 0.85 })
  iconBox.position.set(-0.02, 0.15, 0.045)
  panel.add(iconBox)
  const iconTape = rbox(0.32, 0.035, 0.02, 0.01, CARD_DARK, { roughness: 0.85 })
  iconTape.position.set(-0.02, 0.15, 0.062)
  panel.add(iconTape)

  const arrowStem = rbox(0.24, 0.09, 0.03, 0.015, BLUE, { roughness: 0.4 })
  arrowStem.position.set(-0.06, -0.12, 0.045)
  panel.add(arrowStem)
  const arrowHead = cone(0.13, 0.22, BLUE, { roughness: 0.4 })
  arrowHead.rotation.z = -Math.PI / 2
  arrowHead.position.set(0.17, -0.12, 0.045)
  panel.add(arrowHead)

  root.add(placa)

  // ---- container azul do papelão --------------------------------------------
  const container = new THREE.Group()
  container.position.copy(CONTAINER_POS)
  container.rotation.y = CONTAINER_RY

  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const caster = cylinder(0.1, 0.1, 0.08, '#2b2e33', { roughness: 0.5 })
      caster.rotation.z = Math.PI / 2
      caster.position.set(sx * 0.62, 0.1, sz * 0.34)
      container.add(caster)
      const fork = rbox(0.07, 0.16, 0.13, 0.03, STEEL, { roughness: 0.35, metalness: 0.6 })
      fork.position.set(sx * 0.62, 0.16, sz * 0.34)
      container.add(fork)
    }
  }

  const shell = rbox(1.62, 1.15, 0.98, 0.1, BLUE, { roughness: 0.45 })
  shell.position.y = 0.775
  container.add(shell)

  const lid = rbox(1.7, 0.16, 1.06, 0.06, BLUE_LIGHT, { roughness: 0.45 })
  lid.position.y = 1.43
  container.add(lid)

  const lidLip = rbox(1.74, 0.06, 1.1, 0.025, BLUE_DARK, { roughness: 0.55 })
  lidLip.position.y = 1.33
  container.add(lidLip)

  // fenda: rebaixo claro + vão escuro
  const slotFrame = rbox(1.0, 0.44, 0.06, 0.03, BLUE_DARK, { roughness: 0.6 })
  slotFrame.position.set(0, 1.05, 0.48)
  container.add(slotFrame)
  const slotVoid = rbox(0.88, 0.34, 0.03, 0.012, '#0f1721', { roughness: 0.95 })
  slotVoid.position.set(0, 1.05, 0.505)
  container.add(slotVoid)

  const label = rbox(0.52, 0.32, 0.03, 0.02, '#eceae4', { roughness: 0.4 })
  label.position.set(0, 0.5, 0.5)
  container.add(label)
  const labelIcon = rbox(0.24, 0.16, 0.025, 0.015, CARD_BROWN, { roughness: 0.85 })
  labelIcon.position.set(0, 0.52, 0.52)
  container.add(labelIcon)

  const handle = capsule(0.035, 0.46, STEEL, { roughness: 0.3, metalness: 0.7 })
  handle.rotation.z = Math.PI / 2
  handle.position.set(0, 1.24, 0.5)
  container.add(handle)

  root.add(container)

  // ---- pilha de caixas achatadas encostadas ---------------------------------
  const pilha = new THREE.Group()
  pilha.position.set(-1.95, GY, -1.0)
  pilha.rotation.y = 0.55

  for (let i = 0; i < 4; i++) {
    const flat = rbox(0.92, 0.96, 0.05, 0.03, i % 2 ? CARD_BROWN : CARD_DARK, { roughness: 0.85 })
    flat.position.set(i * 0.05 - 0.08, 0.46 - i * 0.012, -i * 0.1)
    flat.rotation.set(0.26 + i * 0.02, 0, (rand() - 0.5) * 0.12)
    pilha.add(flat)
    const seam = rbox(0.94, 0.035, 0.02, 0.008, CARD_DARK, { roughness: 0.9 })
    seam.position.set(0, 0.04, 0.035)
    flat.add(seam)
  }

  root.add(pilha)

  // ---- SLÉNGUER, o guaxinim manco (perfil, olhando para o container) --------
  const guaxinim = new THREE.Group()
  guaxinim.position.copy(COON_POS)
  guaxinim.rotation.y = COON_RY

  const torso = capsule(0.28, 0.34, FUR, { roughness: 0.88 })
  torso.position.y = 0.78
  guaxinim.add(torso)

  const belly = capsule(0.17, 0.2, FUR_LIGHT, { roughness: 0.88 })
  belly.position.set(0, 0.72, 0.155)
  belly.scale.z = 0.6
  guaxinim.add(belly)

  // cauda listrada
  const tail = capsule(0.11, 0.44, FUR, { roughness: 0.88 })
  tail.position.set(0, 0.56, -0.34)
  tail.rotation.x = -0.95
  for (const ty of [-0.14, 0.02, 0.18]) {
    const ring = cylinder(0.125, 0.125, 0.085, MASK, { roughness: 0.88 })
    ring.position.y = ty
    tail.add(ring)
  }
  const tailTip = sphere(0.1, MASK, { roughness: 0.88 })
  tailTip.position.y = 0.29
  tail.add(tailTip)
  guaxinim.add(tail)

  // perna boa (lado -z de mundo, longe da câmera)
  const legGood = capsule(0.09, 0.28, FUR, { roughness: 0.88 })
  legGood.position.set(0.15, 0.26, 0)
  guaxinim.add(legGood)
  const footGood = capsule(0.07, 0.12, MASK, { roughness: 0.85 })
  footGood.rotation.x = Math.PI / 2
  footGood.position.set(0.15, 0.06, 0.07)
  guaxinim.add(footGood)

  // perna manca: mais curta, enfaixada, sem tocar o chão
  const legHurt = capsule(0.09, 0.14, FUR, { roughness: 0.88 })
  legHurt.position.set(-0.15, 0.38, 0.02)
  guaxinim.add(legHurt)
  const cast = cylinder(0.108, 0.104, 0.16, '#e6e2d8', { roughness: 0.92 })
  cast.position.set(-0.15, 0.3, 0.02)
  guaxinim.add(cast)
  const footHurt = capsule(0.065, 0.1, MASK, { roughness: 0.85 })
  footHurt.rotation.x = 1.2
  footHurt.position.set(-0.15, 0.19, 0.08)
  guaxinim.add(footHurt)

  // cabeça
  const cabeca = new THREE.Group()
  cabeca.position.set(0, 1.28, 0.06)
  cabeca.rotation.y = -0.6 // vira a cara para quem pergunta VÁR?

  const skull = sphere(0.24, FUR, { roughness: 0.88 })
  skull.scale.set(0.95, 0.92, 1.0)
  cabeca.add(skull)

  const muzzle = sphere(0.115, FUR_LIGHT, { roughness: 0.88 })
  muzzle.position.set(0, -0.05, 0.215)
  muzzle.scale.set(0.82, 0.72, 1.3)
  cabeca.add(muzzle)

  const nose = sphere(0.045, '#26221f', { roughness: 0.3 })
  nose.position.set(0, -0.028, 0.35)
  cabeca.add(nose)

  for (const side of [-1, 1]) {
    // máscara escura de guaxinim
    const patch = sphere(0.105, MASK, { roughness: 0.88 })
    patch.position.set(side * 0.115, 0.045, 0.185)
    patch.scale.set(1.05, 0.82, 0.5)
    cabeca.add(patch)

    // sobrancelha clara acima da máscara
    const brow = sphere(0.095, '#ded9cd', { roughness: 0.9 })
    brow.position.set(side * 0.115, 0.16, 0.165)
    brow.scale.set(1.0, 0.42, 0.4)
    cabeca.add(brow)

    const eye = sphere(0.055, '#ffffff', { roughness: 0.25 })
    eye.position.set(side * 0.105, 0.052, 0.245)
    eye.scale.z = 0.6
    const pupil = sphere(0.028, '#141414', { roughness: 0.2 })
    pupil.position.set(side * 0.105, 0.052, 0.288)
    cabeca.add(eye, pupil)

    const ear = capsule(0.058, 0.06, FUR, { roughness: 0.88 })
    ear.position.set(side * 0.185, 0.215, -0.02)
    ear.scale.z = 0.55
    ear.rotation.z = -side * 0.28
    const earIn = capsule(0.03, 0.03, '#8d7f7a', { roughness: 0.9 })
    earIn.position.set(0, 0.01, 0.045)
    ear.add(earIn)
    cabeca.add(ear)
  }
  guaxinim.add(cabeca)

  // braço que puxa a bolsa do estilingue (local, calculado a partir de POUCH)
  const pouchLocal = COON_PAW_LOCAL
  const shoulderPull = new THREE.Vector3(0.29, 1.0, 0.02)
  guaxinim.add(link(shoulderPull, pouchLocal, 0.06, FUR, { roughness: 0.88 }))
  const pawPull = sphere(0.078, MASK, { roughness: 0.85 })
  pawPull.position.copy(pouchLocal)
  guaxinim.add(pawPull)

  // braço apoiado na muleta
  const shoulderCrutch = new THREE.Vector3(-0.3, 1.02, 0.0)
  const handCrutch = new THREE.Vector3(-0.31, 0.57, -0.01)
  guaxinim.add(link(shoulderCrutch, handCrutch, 0.06, FUR, { roughness: 0.88 }))
  const pawCrutch = sphere(0.075, MASK, { roughness: 0.85 })
  pawCrutch.position.copy(handCrutch)
  guaxinim.add(pawCrutch)

  root.add(guaxinim)

  // ---- muleta de madeira ----------------------------------------------------
  const muleta = new THREE.Group()
  muleta.position.copy(COON_POS).add(new THREE.Vector3(0, 0, 0.41))
  muleta.rotation.set(-0.14, 0, 0.05)

  const shaft = cylinder(0.042, 0.048, 0.76, WOOD, { roughness: 0.72 })
  shaft.position.y = 0.42
  muleta.add(shaft)

  const rubberTip = cylinder(0.055, 0.05, 0.08, '#2b2e33', { roughness: 0.85 })
  rubberTip.position.y = 0.04
  muleta.add(rubberTip)

  for (const side of [-1, 1]) {
    const strut = cylinder(0.026, 0.026, 0.34, WOOD, { roughness: 0.72 })
    strut.position.set(side * 0.075, 0.65, 0)
    strut.rotation.z = -side * 0.13
    muleta.add(strut)
  }

  const grip = capsule(0.038, 0.15, WOOD_DARK, { roughness: 0.8 })
  grip.rotation.z = Math.PI / 2
  grip.position.y = 0.57
  muleta.add(grip)

  const armPad = capsule(0.058, 0.2, WOOD_DARK, { roughness: 0.9 })
  armPad.rotation.z = Math.PI / 2
  armPad.position.y = 0.83
  muleta.add(armPad)

  root.add(muleta)

  // ---- estilingue gigante em Y com elástico vermelho ------------------------
  const estilingue = new THREE.Group()
  estilingue.position.copy(SLING_POS)
  estilingue.rotation.y = SLING_RY

  const stock = cylinder(0.07, 0.088, 0.92, WOOD, { roughness: 0.72 })
  stock.position.y = 0.46
  estilingue.add(stock)

  const wrap = cylinder(0.088, 0.088, 0.24, WOOD_DARK, { roughness: 0.85 })
  wrap.position.y = 0.34
  estilingue.add(wrap)

  const crotch = sphere(0.1, WOOD, { roughness: 0.72 })
  crotch.position.y = 0.93
  estilingue.add(crotch)

  const forkBase = new THREE.Vector3(0, 0.9, 0)
  const tipA = new THREE.Vector3(0, 1.42, 0.44)
  const tipB = new THREE.Vector3(0, 1.42, -0.44)
  for (const tip of [tipA, tipB]) {
    estilingue.add(link(forkBase, tip, 0.055, WOOD, { roughness: 0.72 }))
    const knob = sphere(0.072, WOOD_DARK, { roughness: 0.75 })
    knob.position.copy(tip)
    estilingue.add(knob)
    // amarração do elástico na ponta
    const lash = cylinder(0.078, 0.078, 0.06, RED, { roughness: 0.5 })
    lash.position.copy(tip).addScaledVector(new THREE.Vector3(0, -1, 0), 0.09)
    estilingue.add(lash)
  }

  // elástico vermelho — o acento saturado da cena
  estilingue.add(link(tipA, POUCH_LOCAL, 0.042, RED, { roughness: 0.5 }))
  estilingue.add(link(tipB, POUCH_LOCAL, 0.042, RED, { roughness: 0.5 }))

  const pouchPad = rbox(0.1, 0.26, 0.22, 0.045, '#7a3f33', { roughness: 0.9 })
  pouchPad.position.copy(POUCH_LOCAL)
  estilingue.add(pouchPad)

  root.add(estilingue)

  // ---- caixa de papelão (pose final: cravada na fenda) ----------------------
  const caixa = new THREE.Group()
  caixa.position.copy(BOX_END)
  caixa.rotation.set(0, CONTAINER_RY, -Math.PI * 2)

  const boxBody = rbox(0.52, 0.42, 0.36, 0.03, CARD_BROWN, { roughness: 0.85 })
  caixa.add(boxBody)
  const boxTape = rbox(0.54, 0.06, 0.04, 0.015, CARD_DARK, { roughness: 0.85 })
  boxTape.position.y = 0.2
  caixa.add(boxTape)
  const boxSeam = rbox(0.06, 0.44, 0.03, 0.012, CARD_DARK, { roughness: 0.85 })
  boxSeam.position.z = 0.185
  caixa.add(boxSeam)

  root.add(caixa)

  // ---- anel de impacto TÓNG na boca do container ----------------------------
  const anel = new THREE.Group()
  anel.position.copy(MOUTH).addScaledVector(MOUTH_N, 0.07)
  anel.rotation.y = CONTAINER_RY

  const ring = torus(0.4, 0.05, GLOW, { emissive: '#ffb020', emissiveIntensity: 1.2 })
  anel.add(ring)
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.4
    const shard = capsule(0.028, 0.14, GLOW, { emissive: '#ffb020', emissiveIntensity: 1.1 })
    shard.position.set(Math.cos(a) * 0.58, Math.sin(a) * 0.58, 0)
    shard.rotation.z = a - Math.PI / 2
    anel.add(shard)
  }

  root.add(anel)

  // ---- peças ----------------------------------------------------------------
  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'placa', group: 'cenario', object: placa },
    { name: 'container', group: 'container', object: container },
    { name: 'pilha', group: 'container', object: pilha },
    { name: 'guaxinim', group: 'guaxinim', object: guaxinim },
    { name: 'muleta', group: 'guaxinim', object: muleta },
    { name: 'estilingue', group: 'estilingue', object: estilingue },
    { name: 'caixa', group: 'disparo', object: caixa },
    { name: 'anel', group: 'disparo', object: anel },
  ]

  // ---- montagem -------------------------------------------------------------
  const build = [
    seq('base-rise', 'base', 0, 0.8, [riseFrom(0, 0.95)], {
      caption: 'Sala de reciclagem: concreto e faixa amarela. Caixa na mão, você só aponta: VÁR?!',
    }),
    seq('placa-rise', 'placa', 0.25, 0.8, [riseFrom(GY, 2.25)]),

    seq('container-rise', 'container', 1.9, 0.85, [riseFrom(GY, 1.95)], {
      caption: 'Ao fundo sobe o container AZUL do papelão, de fenda escancarada.',
    }),
    seq('pilha-rise', 'pilha', 2.1, 0.8, [riseFrom(GY, 1.4)]),

    seq('guaxinim-rise', 'guaxinim', 3.7, 0.85, [riseFrom(GY, 2.0)], {
      caption: 'Do meio das caixas sai SLÉNGUER, o guaxinim que MANCA de uma perna.',
    }),
    seq('muleta-rise', 'muleta', 3.9, 0.8, [riseFrom(GY, 1.35)]),

    seq('estilingue-rise', 'estilingue', 5.5, 0.85, [riseFrom(GY, 1.95)], {
      caption: 'Ele monta um ESTILINGUE gigante de elástico vermelho na sua frente…',
    }),

    seq('caixa-load', 'caixa', 6.9, 0.7, [
      ch('position.x', BOX_IN_POUCH.x, BOX_IN_POUCH.x),
      ch('position.z', BOX_IN_POUCH.z, BOX_IN_POUCH.z),
      ch('position.y', BOX_IN_POUCH.y - 1.85, BOX_IN_POUCH.y),
    ]),

    seq('estilingue-tensao', 'estilingue', 8.2, 0.7, [ch('rotation.z', 0, 0.18)], {
      caption: '…arranca o papelão da sua mão, estica o elástico e — MANCA-TÓNG!',
    }),
    seq('guaxinim-tensao', 'guaxinim', 8.25, 0.7, [ch('rotation.z', 0, 0.09)]),

    seq('estilingue-disparo', 'estilingue', 8.95, 0.3, [ch('rotation.z', 0.18, -0.14)]),
    seq('caixa-voo-sobe', 'caixa', 8.95, 0.55, [
      ch('position.x', BOX_IN_POUCH.x, BOX_APEX.x),
      ch('position.y', BOX_IN_POUCH.y, BOX_APEX.y),
      ch('position.z', BOX_IN_POUCH.z, BOX_APEX.z),
      ch('rotation.z', 0, -3.6),
    ]),
    seq('guaxinim-recuo', 'guaxinim', 9.0, 0.5, [ch('rotation.z', 0.09, -0.05)]),

    seq('caixa-voo-desce', 'caixa', 9.5, 0.55, [
      ch('position.x', BOX_APEX.x, BOX_END.x),
      ch('position.y', BOX_APEX.y, BOX_END.y),
      ch('position.z', BOX_APEX.z, BOX_END.z),
      ch('rotation.z', -3.6, -Math.PI * 2),
    ]),
    seq('estilingue-volta', 'estilingue', 9.55, 0.6, [ch('rotation.z', -0.14, 0)]),
    seq('guaxinim-volta', 'guaxinim', 9.6, 0.6, [ch('rotation.z', -0.05, 0)]),

    seq('anel-tong', 'anel', 10.05, 0.4, [
      ch('scale.x', 0.01, 1.3),
      ch('scale.y', 0.01, 1.3),
      ch('scale.z', 0.01, 1.3),
    ], {
      caption: 'TÓNG! — Var slänger man kartong? "Onde se joga papelão?"',
    }),
    seq('container-solavanco', 'container', 10.05, 0.22, [ch('position.y', GY, GY + 0.07)]),
    seq('container-assenta', 'container', 10.27, 0.45, [ch('position.y', GY + 0.07, GY)]),
    seq('anel-assenta', 'anel', 10.45, 0.7, [
      ch('scale.x', 1.3, 1),
      ch('scale.y', 1.3, 1),
      ch('scale.z', 1.3, 1),
    ]),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [-0.7, 2.8, 5.45], target: [0.15, 1.0, -0.15] },
  }
}

export const card: Card = {
  meta: {
    id: 'var-slanger-man-kartong',
    contexto:
      'No återvinningsrum do prédio, com a caixa na mão, sem saber em qual container vai.',
    fraseFonte: 'Onde se joga papelão?',
    fraseAlvo: 'Var slänger man kartong?',
    pronuncia: "var SLÉNG-er man kar-TÓNG? ('kartong' com NG nasal, sem G duro)",
    ponteSonora:
      "VÁR! SLÉNGUER MANCA-TÓNG! (6 sílabas, picos em SLÉN e TÓNG; VÁR é 'var' = onde, com R BRANDO de 'vara' — nunca o R raspado de fim de sílaba, e nunca VÁ pelado, que já vira 'vad' = o quê; SLÉNGUER com É bem aberto e NG só nasal, sem estalar o G; MANCA cobre 'man kar' numa tacada, porque o R de 'kar' derrete dentro do T seguinte; TÓNG com Ó aberto nasalado, sem G no fim)",
    historia:
      'Você está no återvinningsrum com a caixa na mão, sem ideia de qual container é o certo, e só consegue apontar e perguntar: VÁR?. Do meio das caixas sai SLÉNGUER, o guaxinim que MANCA de uma perna e mora ali há anos. Ele arranca o papelão da sua mão, monta num estilingue gigante e dispara: TÓNG! — a caixa bate no fundo do container azul.',
  },
  createScene,
  refine: { organic: ['guaxinim'] },
}

export default card
