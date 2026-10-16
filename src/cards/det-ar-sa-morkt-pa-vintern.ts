import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import type { MatOpts } from '../rig/helpers'
import {
  seq, ch, riseFrom, rng, mat,
  rbox, capsule, cylinder, sphere, cone, torus, lathe, rock, puff,
} from '../rig/helpers'

/**
 * "Det är så mörkt på vintern." — DÊ É, SÔ… (u)M'ÓRC—T! PÔ, VÍN-TERN!
 *
 * Duas da tarde de dezembro no norte: uma ORCA salta do mar escuro com o sol
 * laranja preso entre os dentes (a bocarra fecha num estalo seco: T!). Na neve,
 * o vaga-lume mineiro de chapéu de palha acende o traseiro no máximo — único
 * poste aceso da cidade — e aponta o painel de rua que marca −20 (VINTE).
 *
 * Paleta noturna fria (neve azulada, mar azul-petróleo, orca preta e branca);
 * o acento saturado é o SOL laranja na boca da orca. O resto que brilha é luz:
 * o traseiro verde-amarelado e os dígitos vermelhos do painel.
 */

const SNOW = '#6b809e'
const SNOW_LIGHT = '#95a8c2'
const SEA = '#12303a'
const SEA_DEEP = '#0a1d24'
const SEA_CREST = '#2c5563'
const ROCK = '#4f5864'
const PINE = '#24402f'
const ORCA = '#1b1f26'
const ORCA_WHITE = '#eef1f4'
const SADDLE = '#7f8893'
const GUM = '#7a2a30'
const BUG = '#3e2a1f'
const BUG_DARK = '#2b1d15'
const BUG_TAN = '#8f6a44'
const COLLAR = '#c4974e'
const MUZZLE = '#6b4a33'
const STRAW = '#d4b26a'
const STRAW_DARK = '#a8853f'
const POLE = '#3b4149'
const PANEL = '#17191e'
const LED = '#ff2418'
const GLOW = '#c6ee3a'
const SUN = '#ff8a1c' // acento saturado RESERVADO: o sol na boca da orca

const GY = 0.18 // topo da neve
const SEA_Y = 0.1 // nível do mar
const SHORE_Z = -0.62 // linha da praia (z médio)

const BUG_POS = new THREE.Vector3(0.47, GY, 0.48)
const BUG_ROT = 0.82 // olha para a direita-frente: o painel
const POST_POS = new THREE.Vector3(1.92, GY, -0.6)
const PANEL_Y = 1.62

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z)

/** Cápsula de a até b — patas, braços, antenas. */
function seg(a: THREE.Vector3, b: THREE.Vector3, r: number, color: string, opts?: MatOpts) {
  const d = b.clone().sub(a)
  const m = capsule(r, Math.max(0.001, d.length()), color, opts)
  m.position.copy(a).add(b).multiplyScalar(0.5)
  m.quaternion.setFromUnitVectors(V(0, 1, 0), d.normalize())
  return m
}

/** Material vira vidro/luz: transparente, sem escrever profundidade. */
function seeThrough(mesh: THREE.Mesh, opacity: number) {
  const m = mesh.material as THREE.MeshStandardMaterial
  m.transparent = true
  m.opacity = opacity
  m.depthWrite = false
  mesh.castShadow = false
  return mesh
}

/** Dígito de sete segmentos em LED (plano xy, virado para +z). */
function digit(which: '-' | '2' | '0', h = 0.3, w = 0.17, t = 0.048) {
  const g = new THREE.Group()
  const on: Record<string, string[]> = {
    '-': ['g'],
    '2': ['a', 'b', 'g', 'e', 'd'],
    '0': ['a', 'b', 'c', 'd', 'e', 'f'],
  }
  const led = { roughness: 0.4, emissive: LED, emissiveIntensity: 1.15 }
  const vlen = h / 2 - t * 0.6
  const segs: Record<string, [number, number, boolean]> = {
    a: [0, h / 2 - t / 2, true],
    g: [0, 0, true],
    d: [0, -h / 2 + t / 2, true],
    b: [w / 2 - t / 2, h / 4, false],
    c: [w / 2 - t / 2, -h / 4, false],
    e: [-w / 2 + t / 2, -h / 4, false],
    f: [-w / 2 + t / 2, h / 4, false],
  }
  for (const s of on[which]) {
    const [x, y, horiz] = segs[s]
    const bar = horiz ? rbox(w - t * 0.5, t, 0.025, 0.012, LED, led) : rbox(t, vlen, 0.025, 0.012, LED, led)
    bar.position.set(x, y, 0)
    g.add(bar)
  }
  return g
}

/** Neve da frente: disco recortado pela linha da praia, com borda boleada. */
function snowShelf() {
  const R = 2.56
  const shore = (x: number) => SHORE_Z + 0.1 * Math.sin(2.3 * x + 0.4) + 0.05 * Math.sin(5.1 * x + 1.3)
  const a0 = Math.asin(SHORE_Z / R)
  const a1 = Math.PI - a0
  const shape = new THREE.Shape()
  const N = 48
  for (let i = 0; i <= N; i++) {
    const a = a0 + ((a1 - a0) * i) / N
    const x = R * Math.cos(a)
    const z = R * Math.sin(a)
    if (i === 0) shape.moveTo(x, -z)
    else shape.lineTo(x, -z)
  }
  const xL = R * Math.cos(a1)
  const xR = R * Math.cos(a0)
  for (let i = 1; i < N; i++) {
    const x = xL + ((xR - xL) * i) / N
    const env = Math.sin((Math.PI * i) / N) // ondulação some nas pontas
    const z = SHORE_Z + (shore(x) - SHORE_Z) * env
    shape.lineTo(x, -z)
  }
  shape.closePath()
  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.1,
    bevelEnabled: true,
    bevelThickness: 0.04,
    bevelSize: 0.04,
    bevelSegments: 4,
    curveSegments: 8,
  })
  geo.rotateX(-Math.PI / 2)
  const mesh = new THREE.Mesh(geo, mat(SNOW, { roughness: 0.9, size: 5 }))
  mesh.position.y = 0.04
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(41)

  // ---- mar azul-petróleo (disco inteiro, abaixo da neve) -------------------
  const mar = new THREE.Group()
  const plinth = cylinder(2.66, 2.72, 0.06, SEA_DEEP, { roughness: 0.8 })
  plinth.position.y = 0.03
  mar.add(plinth)
  const agua = cylinder(2.62, 2.64, 0.06, SEA, { roughness: 0.12, detail: 0.4 })
  agua.position.y = SEA_Y - 0.03
  mar.add(agua)
  // cristas de onda: traços claros deitados na água
  for (const [wx, wz, wl] of [[0.4, -1.35, 0.7], [1.2, -1.9, 0.5], [-0.6, -2.05, 0.6], [0.9, -1.05, 0.45], [-1.3, -1.75, 0.4]] as const) {
    const crest = capsule(0.022, wl, SEA_CREST, { roughness: 0.2 })
    crest.rotation.set(Math.PI / 2, 0, Math.PI / 2 + (rand() - 0.5) * 0.3)
    crest.position.set(wx, SEA_Y + 0.005, wz)
    crest.scale.z = 0.4
    mar.add(crest)
  }
  // blocos de gelo boiando
  for (const [ix, iz, ir, s] of [[0.55, -1.75, 0.2, 3], [1.35, -1.35, 0.15, 7], [-0.35, -2.2, 0.17, 11], [0.05, -1.15, 0.11, 5]] as const) {
    const ice = rock(ir, SNOW_LIGHT, s, { roughness: 0.5 })
    ice.scale.set(1.3, 0.38, 1.0)
    ice.position.set(ix, SEA_Y + 0.02, iz)
    ice.rotation.y = rand() * Math.PI
    mar.add(ice)
  }
  root.add(mar)

  // ---- neve branco-azulada na beira do mar --------------------------------
  const neve = new THREE.Group()
  neve.add(snowShelf())
  // montinhos de neve e pedras nevadas na praia
  for (const [mx, mz, mr, s] of [[-1.75, 1.35, 0.3, 3], [1.55, 1.55, 0.26, 8], [2.15, 0.35, 0.22, 13], [-2.1, 0.55, 0.2, 21]] as const) {
    const monte = puff(mr, SNOW_LIGHT, 5, s, { roughness: 0.92 })
    monte.scale.y = 0.42
    monte.position.set(mx, GY, mz)
    neve.add(monte)
  }
  for (const [rx, rz, rr, s] of [[-1.05, -0.62, 0.17, 4], [0.75, -0.72, 0.14, 9], [-2.0, -0.4, 0.13, 17]] as const) {
    const pedra = rock(rr, ROCK, s, { roughness: 0.85 })
    pedra.position.set(rx, GY + rr * 0.35, rz)
    neve.add(pedra)
    const capa = puff(rr * 0.8, SNOW_LIGHT, 4, s + 1, { roughness: 0.92 })
    capa.scale.y = 0.4
    capa.position.set(rx, GY + rr * 0.95, rz)
    neve.add(capa)
  }
  // pinheirinho nevado à esquerda
  const pinho = new THREE.Group()
  pinho.position.set(-1.95, GY, 0.95)
  const tronco = cylinder(0.05, 0.07, 0.25, '#4a3628', { roughness: 0.85 })
  tronco.position.y = 0.12
  pinho.add(tronco)
  for (const [ty, tr, th] of [[0.38, 0.38, 0.5], [0.66, 0.3, 0.44], [0.9, 0.21, 0.38]] as const) {
    const copa = cone(tr, th, PINE, { roughness: 0.85 })
    copa.position.y = ty
    pinho.add(copa)
    const neveCopa = cone(tr * 0.72, th * 0.42, SNOW_LIGHT, { roughness: 0.9 })
    neveCopa.position.y = ty + th * 0.32
    pinho.add(neveCopa)
  }
  neve.add(pinho)
  root.add(neve)

  // ---- poste de rua com a lâmpada APAGADA ----------------------------------
  const poste = new THREE.Group()
  poste.position.copy(POST_POS)
  const flange = lathe([[0, 0], [0.16, 0], [0.16, 0.05], [0.09, 0.12], [0.07, 0.2], [0, 0.2]], POLE, { roughness: 0.4, metalness: 0.6 })
  poste.add(flange)
  const haste = cylinder(0.045, 0.06, 2.45, POLE, { roughness: 0.4, metalness: 0.6 })
  haste.position.y = 1.25
  poste.add(haste)
  const braco = cylinder(0.035, 0.035, 0.5, POLE, { roughness: 0.4, metalness: 0.6 })
  braco.rotation.z = Math.PI / 2
  braco.position.set(-0.22, 2.42, 0)
  poste.add(braco)
  const cupula = lathe([[0, 0.1], [0.07, 0.1], [0.2, 0.0], [0.22, -0.04], [0.16, -0.03], [0, -0.02]], POLE, { roughness: 0.4, metalness: 0.6 })
  cupula.position.set(-0.46, 2.42, 0)
  poste.add(cupula)
  const lampada = sphere(0.1, '#5d6670', { roughness: 0.15 }) // vidro apagado
  lampada.scale.y = 0.6
  lampada.position.set(-0.46, 2.36, 0)
  poste.add(lampada)
  const neveTopo = puff(0.13, SNOW_LIGHT, 4, 29, { roughness: 0.92 })
  neveTopo.scale.set(1.3, 0.45, 1.3)
  neveTopo.position.set(-0.46, 2.53, 0)
  poste.add(neveTopo)
  root.add(poste)

  // ---- painel digital de rua: −20° ----------------------------------------
  const painel = new THREE.Group()
  painel.position.set(POST_POS.x, PANEL_Y, POST_POS.z + 0.1)
  painel.rotation.y = -0.32
  const caixa = rbox(1.02, 0.54, 0.12, 0.05, PANEL, { roughness: 0.45 })
  painel.add(caixa)
  const moldura = rbox(1.08, 0.6, 0.06, 0.05, '#454b54', { roughness: 0.35, metalness: 0.6 })
  moldura.position.z = -0.04
  painel.add(moldura)
  const tela = rbox(0.9, 0.42, 0.02, 0.02, '#08090b', { roughness: 0.2 })
  tela.position.z = 0.06
  painel.add(tela)
  const glyphs: ['-' | '2' | '0', number][] = [['-', -0.31], ['2', -0.1], ['0', 0.12]]
  for (const [gch, gx] of glyphs) {
    const d = digit(gch)
    d.position.set(gx, -0.01, 0.075)
    painel.add(d)
  }
  const grau = torus(0.036, 0.015, LED, { roughness: 0.4, emissive: LED, emissiveIntensity: 1.15 })
  grau.position.set(0.29, 0.1, 0.075)
  painel.add(grau)
  for (const by of [-0.16, 0.16]) {
    const abraco = rbox(0.14, 0.06, 0.16, 0.02, POLE, { roughness: 0.4, metalness: 0.6 })
    abraco.position.set(0, by, -0.1)
    painel.add(abraco)
  }
  const neveCaixa = rbox(0.98, 0.05, 0.14, 0.025, SNOW_LIGHT, { roughness: 0.9 })
  neveCaixa.position.set(0, 0.29, 0)
  painel.add(neveCaixa)
  root.add(painel)

  // ---- ORCA saltando em arco (cabeça +x, dorso +y no espaço dela) ----------
  const orca = new THREE.Group()
  const body: [number, number, number][] = [
    [0.55, 0.46, -0.04], [0.1, 0.47, 0], [-0.35, 0.4, -0.02], [-0.75, 0.29, -0.07], [-1.05, 0.19, -0.13], [-1.3, 0.12, -0.2],
  ]
  for (const [bx, br, by] of body) {
    const s = sphere(br, ORCA, { roughness: 0.3 })
    s.scale.set(1.35, 1, 0.88)
    s.position.set(bx, by, 0)
    orca.add(s)
  }
  // cabeça (maxilar de cima) e mandíbula branca escancarada
  const cabeca = sphere(0.34, ORCA, { roughness: 0.3 })
  cabeca.scale.set(1.35, 0.88, 0.85)
  cabeca.position.set(1.0, 0.0, 0)
  orca.add(cabeca)
  const mandibula = sphere(0.3, ORCA_WHITE, { roughness: 0.35 })
  mandibula.scale.set(1.25, 0.36, 0.78)
  mandibula.position.set(1.08, -0.4, 0)
  mandibula.rotation.z = -0.5
  orca.add(mandibula)
  const goela = sphere(0.17, GUM, { roughness: 0.5 })
  goela.position.set(1.12, -0.24, 0)
  goela.scale.set(1.3, 0.9, 0.85)
  orca.add(goela)
  // barriga branca, mancha do flanco e sela cinza
  const barriga = sphere(0.4, ORCA_WHITE, { roughness: 0.35 })
  barriga.scale.set(2.0, 0.55, 0.8)
  barriga.position.set(0.3, -0.3, 0)
  barriga.rotation.z = 0.06
  orca.add(barriga)
  for (const side of [-1, 1]) {
    const flanco = sphere(0.2, ORCA_WHITE, { roughness: 0.35 })
    flanco.scale.set(1.7, 0.6, 0.6)
    flanco.position.set(-0.45, -0.18, side * 0.25)
    flanco.rotation.z = 0.45
    orca.add(flanco)
    // mancha branca do olho, atrás e acima do olho
    const mancha = sphere(0.15, ORCA_WHITE, { roughness: 0.35 })
    mancha.scale.set(1.5, 0.55, 0.5)
    mancha.position.set(0.72, 0.13, side * 0.3)
    mancha.rotation.z = 0.2
    orca.add(mancha)
    const olho = sphere(0.055, '#ffffff', { roughness: 0.25 })
    olho.position.set(1.04, 0.06, side * 0.27)
    olho.scale.z = 0.5
    const pupila = sphere(0.03, '#0c0c0c', { roughness: 0.2 })
    pupila.position.set(1.07, 0.06, side * 0.295)
    orca.add(olho, pupila)
    // nadadeira peitoral
    const peitoral = sphere(0.2, ORCA, { roughness: 0.3 })
    peitoral.scale.set(1.35, 0.25, 0.7)
    peitoral.position.set(0.5, -0.38, side * 0.4)
    peitoral.rotation.set(side * 0.5, 0, 0.55)
    orca.add(peitoral)
    // dentes: fileira de cima e de baixo, segurando o sol
    for (let k = 0; k < 4; k++) {
      const up = cone(0.028, 0.08, '#f6f3ea', { roughness: 0.3 })
      up.position.set(1.08 + k * 0.1, -0.2 + k * 0.02, side * 0.15)
      up.rotation.z = Math.PI
      orca.add(up)
      const dn = cone(0.028, 0.08, '#f6f3ea', { roughness: 0.3 })
      const t = k * 0.1
      dn.position.set(0.98 + t * 0.88, -0.36 - t * 0.48, side * 0.13)
      dn.rotation.z = -0.5
      orca.add(dn)
    }
    // cauda: dois lobos achatados
    const lobo = sphere(0.22, ORCA, { roughness: 0.3 })
    lobo.scale.set(0.75, 0.13, 1.5)
    lobo.position.set(-1.48, -0.24, side * 0.22)
    lobo.rotation.y = side * 0.55
    orca.add(lobo)
  }
  const sela = sphere(0.28, SADDLE, { roughness: 0.4 })
  sela.scale.set(1.3, 0.35, 0.85)
  sela.position.set(-0.22, 0.34, 0)
  orca.add(sela)
  const dorsal = cone(0.17, 0.8, ORCA, { roughness: 0.3 })
  dorsal.scale.z = 0.32
  dorsal.position.set(0.0, 0.76, 0)
  dorsal.rotation.z = 0.32
  orca.add(dorsal)

  // pose: rabo no respingo, boca no alto mirando o centro da cena
  const ORCA_SCALE = 0.98
  orca.scale.setScalar(ORCA_SCALE)
  orca.rotation.set(0, -0.25, 1.05)
  const tailLocal = V(-1.4, -0.22, 0)
  const tailWorld = V(-2.1, SEA_Y + 0.05, -1.3)
  orca.updateMatrix()
  const tailNow = tailLocal.clone().applyMatrix4(orca.matrix)
  orca.position.copy(tailWorld.clone().sub(tailNow))
  orca.updateMatrix()
  const ORCA_POS = orca.position.clone()
  const SUN_POS = V(1.5, -0.28, 0).applyMatrix4(orca.matrix)
  root.add(orca)

  // ---- respingo na saída da orca -------------------------------------------
  const respingo = new THREE.Group()
  respingo.position.set(tailWorld.x + 0.05, SEA_Y, tailWorld.z)
  const espuma = torus(0.32, 0.07, SNOW_LIGHT, { roughness: 0.5 })
  espuma.rotation.x = Math.PI / 2
  espuma.scale.z = 0.6
  respingo.add(espuma)
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + rand() * 0.3
    const gota = sphere(0.04 + rand() * 0.03, SNOW_LIGHT, { roughness: 0.3 })
    gota.position.set(Math.cos(a) * 0.42, 0.12 + rand() * 0.22, Math.sin(a) * 0.42)
    respingo.add(gota)
  }
  root.add(respingo)

  // ---- SOL laranja preso nos dentes ----------------------------------------
  const sol = new THREE.Group()
  sol.position.copy(SUN_POS)
  sol.rotation.y = 0.1
  const disco = sphere(0.27, SUN, { roughness: 0.4, emissive: '#ff6a00', emissiveIntensity: 0.75 })
  sol.add(disco)
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.2
    const raio = cone(0.05, 0.16, SUN, { roughness: 0.4, emissive: '#ff6a00', emissiveIntensity: 0.75 })
    raio.position.set(Math.cos(a) * 0.36, Math.sin(a) * 0.36, 0)
    raio.rotation.z = a - Math.PI / 2
    sol.add(raio)
  }
  const calor = new THREE.PointLight('#ffa040', 2.5, 2.4, 1.6)
  sol.add(calor)
  root.add(sol)

  // ---- estalo: dois arcos cinza saindo da bocarra --------------------------
  const estalo = new THREE.Group()
  estalo.position.copy(SUN_POS)
  estalo.rotation.y = 0.12
  for (const [er, et] of [[0.44, 0.032], [0.6, 0.028]] as const) {
    const arco = new THREE.Mesh(
      new THREE.TorusGeometry(er, et, 12, 40, 1.5),
      mat('#b9c1cb', { roughness: 0.4, size: er * 2 }),
    )
    arco.rotation.z = -0.25
    arco.castShadow = true
    estalo.add(arco)
  }
  root.add(estalo)

  // ---- círculo de luz amarelada no chão ------------------------------------
  const luz = new THREE.Group()
  luz.position.set(BUG_POS.x - 0.25, GY + 0.004, BUG_POS.z - 0.05)
  for (let i = 0; i < 6; i++) {
    const r = 1.15 * (1 - i * 0.15)
    const disc = new THREE.Mesh(
      new THREE.CircleGeometry(r, 56),
      new THREE.MeshBasicMaterial({ color: '#ffe57a', transparent: true, opacity: 0.13, depthWrite: false }),
    )
    disc.rotation.x = -Math.PI / 2
    disc.position.y = i * 0.002
    disc.renderOrder = 2
    luz.add(disc)
  }
  root.add(luz)

  // ---- VAGA-LUME mineiro (olha +z no espaço dele) --------------------------
  const vagalume = new THREE.Group()
  vagalume.position.copy(BUG_POS)
  vagalume.rotation.y = BUG_ROT
  root.add(vagalume)

  for (const s of [-1, 1]) {
    // patas de trás: em pé
    vagalume.add(seg(V(s * 0.17, 0.64, -0.02), V(s * 0.23, 0.33, 0.1), 0.078, BUG, { roughness: 0.55 }))
    vagalume.add(seg(V(s * 0.23, 0.33, 0.1), V(s * 0.2, 0.08, 0.0), 0.06, BUG, { roughness: 0.55 }))
    const pe = sphere(0.1, BUG_DARK, { roughness: 0.55 })
    pe.scale.set(1, 0.45, 1.5)
    pe.position.set(s * 0.2, 0.045, 0.07)
    vagalume.add(pe)
    // patinhas do meio, dobradas na barriga
    vagalume.add(seg(V(s * 0.34, 0.86, 0.12), V(s * 0.46, 0.7, 0.26), 0.045, BUG, { roughness: 0.55 }))
  }

  const tronco2 = sphere(0.42, BUG, { roughness: 0.5 })
  tronco2.scale.set(1, 1.2, 0.95)
  tronco2.position.set(0, 0.98, 0)
  vagalume.add(tronco2)
  // barriga clara com os sulcos dos segmentos
  const barrigaV = sphere(0.34, BUG_TAN, { roughness: 0.6 })
  barrigaV.scale.set(0.82, 1.08, 0.55)
  barrigaV.position.set(0, 0.95, 0.2)
  vagalume.add(barrigaV)
  for (const [py, pl] of [[0.8, 0.26], [0.95, 0.32], [1.1, 0.28]] as const) {
    const sulco = capsule(0.016, pl, BUG, { roughness: 0.6 })
    sulco.rotation.z = Math.PI / 2
    sulco.position.set(0, py, 0.375 - Math.abs(py - 0.95) * 0.35)
    vagalume.add(sulco)
  }
  const abdomen = sphere(0.3, BUG, { roughness: 0.5 })
  abdomen.scale.set(1, 0.9, 1.15)
  abdomen.position.set(0, 0.68, -0.38)
  vagalume.add(abdomen)
  for (const s of [-1, 1]) {
    const elitro = sphere(0.3, BUG_DARK, { roughness: 0.35 })
    elitro.scale.set(0.62, 1.25, 0.42)
    elitro.position.set(s * 0.15, 1.05, -0.33)
    elitro.rotation.z = s * 0.12
    vagalume.add(elitro)
  }
  // escudo do pescoço (pronoto) cor de ocre: lê como cachecol
  const pronoto = sphere(0.33, COLLAR, { roughness: 0.6 })
  pronoto.scale.set(1.05, 0.42, 1.0)
  pronoto.position.set(0, 1.42, -0.02)
  vagalume.add(pronoto)

  const cabecaV = sphere(0.3, BUG, { roughness: 0.5 })
  cabecaV.position.set(0, 1.65, 0.06)
  vagalume.add(cabecaV)
  const focinho = sphere(0.15, MUZZLE, { roughness: 0.55 })
  focinho.scale.set(1.3, 0.85, 0.8)
  focinho.position.set(0, 1.53, 0.3)
  vagalume.add(focinho)
  const boca = sphere(0.055, '#2a1410', { roughness: 0.6 })
  boca.scale.set(1.15, 0.95, 0.6)
  boca.position.set(0, 1.49, 0.41)
  vagalume.add(boca)
  for (const s of [-1, 1]) {
    const esclera = sphere(0.12, '#ffffff', { roughness: 0.25 })
    esclera.scale.z = 0.55
    esclera.position.set(s * 0.13, 1.72, 0.3)
    vagalume.add(esclera)
    const pupila = sphere(0.055, '#151010', { roughness: 0.2 })
    pupila.scale.z = 0.5
    pupila.position.set(s * 0.13 + 0.035, 1.74, 0.355)
    vagalume.add(pupila)
    const brilho = sphere(0.018, '#ffffff', { roughness: 0.1 })
    brilho.position.set(s * 0.13 + 0.05, 1.77, 0.385)
    vagalume.add(brilho)
    // sobrancelha preocupada
    const sob = capsule(0.022, 0.1, BUG_DARK, { roughness: 0.6 })
    sob.rotation.z = Math.PI / 2 - s * 0.35
    sob.position.set(s * 0.13, 1.87, 0.3)
    vagalume.add(sob)
    // antenas compridas, saindo por baixo da aba do chapéu
    vagalume.add(seg(V(s * 0.1, 1.8, 0.27), V(s * 0.22, 1.86, 0.5), 0.022, BUG_DARK, { roughness: 0.5 }))
    vagalume.add(seg(V(s * 0.22, 1.86, 0.5), V(s * 0.38, 2.1, 0.62), 0.02, BUG_DARK, { roughness: 0.5 }))
    const ponta = sphere(0.045, BUG_DARK, { roughness: 0.5 })
    ponta.position.set(s * 0.38, 2.1, 0.62)
    vagalume.add(ponta)
  }
  // braço -x: mão na barriga; braço +x: aponta o painel
  vagalume.add(seg(V(-0.36, 1.2, 0.06), V(-0.5, 0.96, 0.18), 0.062, BUG, { roughness: 0.55 }))
  vagalume.add(seg(V(-0.5, 0.96, 0.18), V(-0.34, 0.82, 0.36), 0.056, BUG, { roughness: 0.55 }))
  const maoE = sphere(0.085, BUG_DARK, { roughness: 0.55 })
  maoE.position.set(-0.32, 0.81, 0.38)
  vagalume.add(maoE)
  vagalume.add(seg(V(0.36, 1.2, 0.04), V(0.62, 1.38, 0.16), 0.062, BUG, { roughness: 0.55 }))
  vagalume.add(seg(V(0.62, 1.38, 0.16), V(0.86, 1.58, 0.28), 0.056, BUG, { roughness: 0.55 }))
  const maoD = sphere(0.085, BUG_DARK, { roughness: 0.55 })
  maoD.position.set(0.88, 1.6, 0.3)
  vagalume.add(maoD)
  vagalume.add(seg(V(0.9, 1.62, 0.31), V(1.04, 1.74, 0.37), 0.028, BUG_DARK, { roughness: 0.55 }))

  // ---- traseiro aceso (sub-peça: luz) --------------------------------------
  const traseiro = new THREE.Group()
  traseiro.position.set(0, 0.62, -0.8)
  traseiro.rotation.x = -0.3
  vagalume.add(traseiro)
  const lanterna = sphere(0.43, GLOW, { roughness: 0.35, emissive: '#a8e612', emissiveIntensity: 0.85 })
  lanterna.scale.set(0.9, 0.82, 1.12)
  traseiro.add(lanterna)
  const anel = torus(0.365, 0.024, BUG, { roughness: 0.5 })
  anel.scale.set(1, 0.92, 1)
  anel.position.z = 0.1
  traseiro.add(anel)
  const lampadaViva = new THREE.PointLight('#f0ff9a', 9, 4.5, 1.4)
  traseiro.add(lampadaViva)

  // ---- asas transparentes abertas (sub-peça) -------------------------------
  const asas = new THREE.Group()
  asas.position.set(0, 1.22, -0.36)
  vagalume.add(asas)
  for (const s of [-1, 1]) {
    const asa = new THREE.Group()
    asa.rotation.set(-0.45, s * 0.35, -s * 0.6)
    const membrana = seeThrough(sphere(0.42, '#dff2ff', { roughness: 0.1, detail: 0 }), 0.32)
    membrana.scale.set(0.42, 1, 0.04)
    membrana.position.y = 0.4
    asa.add(membrana)
    for (const [vx, vr] of [[0, 0], [-0.07, 0.12], [0.07, -0.12]] as const) {
      const veia = rbox(0.012, 0.62, 0.012, 0.005, '#9fb7c8', { roughness: 0.4 })
      veia.position.set(vx, 0.36, 0)
      veia.rotation.z = vr
      asa.add(veia)
    }
    asas.add(asa)
  }

  // ---- chapéu de palha de mineiro (sub-peça) -------------------------------
  const chapeu = new THREE.Group()
  chapeu.position.set(0, 1.87, 0.03)
  chapeu.rotation.set(-0.2, 0, 0.14)
  vagalume.add(chapeu)
  const aba = lathe([[0.18, 0.02], [0.3, 0.0], [0.4, 0.02], [0.43, 0.06], [0.4, 0.045], [0.3, 0.03], [0.18, 0.05]], STRAW, { roughness: 0.85 })
  chapeu.add(aba)
  const copa = lathe([[0, 0.24], [0.13, 0.23], [0.2, 0.16], [0.21, 0.03], [0.19, 0.0], [0, 0.0]], STRAW, { roughness: 0.85 })
  chapeu.add(copa)
  const fita = torus(0.205, 0.028, '#5a3a26', { roughness: 0.7 })
  fita.rotation.x = Math.PI / 2
  fita.position.y = 0.06
  chapeu.add(fita)
  const amassado = capsule(0.02, 0.18, STRAW_DARK, { roughness: 0.85 })
  amassado.rotation.x = Math.PI / 2
  amassado.position.y = 0.235
  chapeu.add(amassado)

  // ---- peças ---------------------------------------------------------------
  const parts = [
    { name: 'mar', group: 'cenario', object: mar },
    { name: 'neve', group: 'cenario', object: neve },
    { name: 'poste', group: 'cenario', object: poste },
    { name: 'sol', group: 'orca', object: sol },
    { name: 'orca', group: 'orca', object: orca },
    { name: 'respingo', group: 'orca', object: respingo },
    { name: 'vagalume', group: 'vagalume', object: vagalume },
    { name: 'chapeu', group: 'vagalume', object: chapeu },
    { name: 'asas', group: 'vagalume', object: asas },
    { name: 'traseiro', group: 'luz', object: traseiro },
    { name: 'luz', group: 'luz', object: luz },
    { name: 'estalo', group: 'estalo', object: estalo },
    { name: 'painel', group: 'painel', object: painel },
  ]

  // ---- montagem ------------------------------------------------------------
  const SKY = SUN_POS.clone().add(V(0.55, 0.75, 0))
  const build = [
    seq('mar-rise', 'mar', 0, 0.8, [riseFrom(0, 0.6)], {
      ease: 'easeOut',
      caption: 'Dezembro no norte da Suécia, duas da tarde: neve na beira de um mar escuro…',
    }),
    seq('neve-rise', 'neve', 0.2, 0.8, [riseFrom(0, 0.7)], { ease: 'easeOut' }),
    seq('poste-rise', 'poste', 0.6, 0.8, [riseFrom(POST_POS.y, 2.8)], { ease: 'easeOut' }),

    seq('sol-surge', 'sol', 1.4, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
      ch('position.x', SKY.x, SKY.x), ch('position.y', SKY.y, SKY.y),
    ], { ease: 'easeOut', caption: '…e o último solzinho do dia, baixo no céu.' }),
    seq('orca-salta', 'orca', 2.3, 0.9, [
      riseFrom(ORCA_POS.y, 2.6),
      ch('rotation.z', 1.5, 1.05),
    ], {
      ease: 'easeOut',
      caption: 'Uma ORCA salta do mar e abocanha o sol inteiro, feito bola de praia!',
    }),
    seq('respingo', 'respingo', 2.3, 0.5, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),
    seq('sol-na-boca', 'sol', 2.95, 0.4, [
      ch('position.x', SKY.x, SUN_POS.x), ch('position.y', SKY.y, SUN_POS.y),
    ], { ease: 'easeIn' }),

    seq('vagalume-rise', 'vagalume', 4.2, 0.9, [riseFrom(BUG_POS.y, 2.4)], {
      ease: 'easeOut',
      caption: 'A cidade apaga. Brota da neve o vaga-lume MINEIRO que veio passar o inverno…',
    }),
    seq('chapeu-cai', 'chapeu', 4.7, 0.6, [ch('position.y', 2.6, 1.87)], { ease: 'easeIn' }),
    seq('asas-abrem', 'asas', 4.9, 0.6, [
      ch('scale.x', 0.01, 1), ch('scale.y', 0.01, 1), ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    seq('traseiro-acende', 'traseiro', 6.0, 0.7, [
      ch('scale.x', 0.15, 1), ch('scale.y', 0.15, 1), ch('scale.z', 0.15, 1),
    ], {
      ease: 'easeOut',
      caption: '…acende o traseiro no máximo e tenta acalmar a vizinhança: "DÊ É, SÔ…"',
    }),
    seq('luz-abre', 'luz', 6.15, 0.8, [
      ch('scale.x', 0.05, 1), ch('scale.z', 0.05, 1),
    ], { ease: 'easeOut' }),

    seq('estalo', 'estalo', 7.8, 0.5, [
      ch('scale.x', 0.3, 1), ch('scale.y', 0.3, 1), ch('scale.z', 0.3, 1),
    ], {
      ease: 'easeOut',
      caption: '"…(u)M\'ÓRC—" e a bocarra da orca fecha num estalo seco: T!',
    }),
    seq('sol-aperta', 'sol', 7.8, 0.4, [ch('scale.y', 0.8, 1)], { ease: 'easeOut' }),
    seq('orca-tranco', 'orca', 7.8, 0.4, [ch('rotation.z', 1.13, 1.05)], { ease: 'easeOut' }),

    seq('painel-sobe', 'painel', 9.2, 0.8, [riseFrom(PANEL_Y, 1.3)], {
      ease: 'easeOut',
      caption: 'O painel da farmácia marca VINTE abaixo de zero. "PÔ, VÍN-TERN…"',
    }),
    seq('traseiro-pulsa', 'traseiro', 10.6, 0.35, [
      ch('scale.x', 1, 1.12), ch('scale.y', 1, 1.12), ch('scale.z', 1, 1.12),
    ], {
      ease: 'easeOut',
      caption: 'Det är så mörkt på vintern. — É tão escuro no inverno.',
    }),
    seq('traseiro-assenta', 'traseiro', 10.95, 0.45, [
      ch('scale.x', 1.12, 1), ch('scale.y', 1.12, 1), ch('scale.z', 1.12, 1),
    ], { ease: 'easeInOut' }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [0.3, 2.25, 5.85], target: [0.05, 1.5, -0.3] },
  }
}

export const card: Card = {
  meta: {
    id: 'det-ar-sa-morkt-pa-vintern',
    contexto:
      "Conversa: de novembro a fevereiro — no trabalho, com vizinhos, com quem acabou de chegar ao país. Em Estocolmo, no fim de dezembro, o sol se põe antes das três da tarde; no extremo norte ele nem nasce. Costuma vir junto: 'Man blir så trött' (a gente fica tão cansado).",
    fraseFonte: 'É tão escuro no inverno.',
    fraseAlvo: 'Det är så mörkt på vintern.',
    pronuncia: "dê é SÔ MÖRKT pô VÍN-tern ('det är' na fala vira 'dê é'; 'så' com Ô FECHADO e longo, e com força, porque é o 'tão'; 'mörkt' numa sílaba só: Ö ABERTO e curto — boca redonda de Ó com a língua empurrada pra frente —, R de um toque só e K e T secos colados no fim; 'på' = pô, fraquinho; 'vintern' com a força no VIN, I curto, T duro (nunca 'tchi') e o -ern fraco: o R se funde no N, que sai de língua enrolada pra trás, como um R caipira encostando no N)",
    ponteSonora: "DÊ É, SÔ... (u)M'ÓRC—T! PÔ, VÍN-TERN! (7 sílabas: dê-é-SÔ-MÖRKT-pô-VÍN-tern; força no SÔ, no MÖRKT e no VIN; DÊ É = o 'det är' de sempre, de 'Det är kallt i lägenheten' e 'Det är fel pris': Ê fechado e sem T, É aberto e curto; SÔ = o 'sô' mineiro de 'Tack så mycket' e do pica-pau de 'Jag är så glad' (É, SÔ... GLÁÁD): Ô FECHADO, esticado e com força, porque é o 'tão' — nunca o 'só' aberto; (u)M'ÓRC = UMA ORCA dita de uma vez, do jeito que o português já emenda ('umórca'), e cortada pelo estalo da bocarra: o U de 'uma' NÃO soa — só o M fica, e gruda direto no ÓR como se fosse o fim do SÔ: sô-M'ÓRC, UMA sílaba só, nunca 'sô-u-mórc' (uma sílaba a mais) nem 'u-ma-ór-ca'; e o M não cai junto com o U: é a primeira letra de 'mörkt'; o Ó aberto e forte de ORCA já está quase certo: mantenha a boca redonda de Ó e empurre a língua pra frente, como pra dizer É — esse é o ö sueco aberto (de boca esticada, sem o bico, vira 'märkt', 'notado'); R de um toque só e K seco; não confunda com o SÔ MÜQUE de 'Tack så mycket': lá é Ü de bico e não tem R, aqui é ÖR aberto + K + T; T = o estalo seco da bocarra fechando, que engole o -A da orca: é o T do neutro, obrigatório depois de 'det är' (o mesmo T do CÁLT de 'Det är kallt i lägenheten'), colado no K: MÖRKT; sem o T sobra 'mörk', e sem o K sobra 'mört', que é um peixe; PÔ = o 'pô!' brasileiro, Ô FECHADO, o mesmo 'på' de 'Grattis på födelsedagen' e 'Det beror på', aqui fraquinho; VÍN-TERN = VINTE, com a força no VIN, N de língua e T DURO de 'tatu' — nunca o 'vin-tchi' do português —, trocando o -te por -TERN: E curto e um R caipira, de língua enrolada pra trás, que já encosta no N; é o rn sueco, que soa como um N de língua enrolada — o mesmo rn do BÁR'N de 'Jag har två barn': VÍN-tern)",
    historia: "Dezembro no norte da Suécia: às duas da tarde, uma ORCA salta do mar escuro e abocanha o sol inteiro, feito bola de praia. A cidade apaga, e o vaga-lume mineiro que veio passar o inverno acende o traseiro no máximo e tenta acalmar a vizinhança: 'DÊ É, SÔ... (u)M'ÓRC—' — na pressa ele engole o U do 'uma', e a bocarra da orca fecha com um estalo seco, T!, que engole o fim da palavra. Ele olha o painel da farmácia, que marca VINTE abaixo de zero, e suspira com o R enrolado de mineiro: 'PÔ, VÍN-TERN...' Até março vai ser assim: no inverno é tão escuro que o único poste aceso da cidade é o traseiro dele.",
  },
  createScene,
  refine: { organic: ['orca', 'vagalume'] },
}

export default card
