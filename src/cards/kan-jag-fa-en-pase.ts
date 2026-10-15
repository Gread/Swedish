import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import {
  person, rbox, capsule, cylinder, sphere, cone, torus, lathe, puff, mat,
  rng, seq, ch, riseFrom,
} from '../rig/helpers'

/**
 * kan-jag-fa-en-pase — "Kan jag få en påse?"
 * A galinha FÔfa desce a CANA aos gritos de IÁ e congela EN PÔSE com a sacola.
 *
 * Paleta: creme/madeira quente (piso+balcão) · verde-teal (uniforme/detalhes)
 * · verde-cana. Acento saturado RESERVADO: azul #2e86de da sacola (påse).
 */
function createScene(): CardScene {
  const root = new THREE.Group()
  const rand = rng(7)

  // ---------- BASE do diorama: piso quadriculado de supermercado ----------
  const base = new THREE.Group()
  const disco = cylinder(2.5, 2.6, 0.16, '#ddd6c6', { roughness: 0.9 })
  disco.position.y = 0.08
  base.add(disco)

  // ladrilhos alternados sobre o disco
  for (let ix = -3; ix <= 3; ix++) {
    for (let iz = -3; iz <= 3; iz++) {
      const x = ix * 0.62
      const z = iz * 0.62
      if (Math.hypot(x, z) > 2.0) continue
      if (rand() < 0.1) continue
      const cor = (ix + iz) % 2 === 0 ? '#e9e2d2' : '#cdc5b2'
      const tile = rbox(0.54, 0.03, 0.54, 0.012, cor, { roughness: 0.85 })
      tile.position.set(x, 0.175, z)
      base.add(tile)
    }
  }

  // adereço 1: cesta de compras com frutas
  const cesta = new THREE.Group()
  const cestaCorpo = rbox(0.46, 0.26, 0.34, 0.05, '#a8593f', { roughness: 0.8 })
  cestaCorpo.position.y = 0.3
  cesta.add(cestaCorpo)
  const alcaCesta = torus(0.15, 0.02, '#8c4632', { roughness: 0.75 })
  alcaCesta.position.y = 0.42
  cesta.add(alcaCesta)
  const frutaCores = ['#7cba5f', '#e0913f', '#b8503e']
  for (let i = 0; i < 3; i++) {
    const fruta = sphere(0.075, frutaCores[i], { roughness: 0.5 })
    fruta.position.set(-0.11 + i * 0.11, 0.44, (rand() - 0.5) * 0.12)
    cesta.add(fruta)
  }
  cesta.position.set(0.95, 0, 0.6) // ao pé do balcão, dentro do quadro
  cesta.rotation.y = 0.5
  base.add(cesta)

  // adereço 2: caixote de laranjas
  const caixote = new THREE.Group()
  const caixoteCorpo = rbox(0.5, 0.24, 0.38, 0.03, '#8a6d4e', { roughness: 0.85 })
  caixoteCorpo.position.y = 0.29
  caixote.add(caixoteCorpo)
  for (let i = 0; i < 5; i++) {
    const laranja = sphere(0.072, '#e59a3c', { roughness: 0.55 })
    laranja.position.set((rand() - 0.5) * 0.34, 0.43, (rand() - 0.5) * 0.24)
    caixote.add(laranja)
  }
  caixote.position.set(-1.65, 0, 0.75)
  caixote.rotation.y = -0.35
  base.add(caixote)

  // adereço 3: vaso de planta (lathe + puff)
  const planta = new THREE.Group()
  const vaso = lathe(
    [[0, 0], [0.14, 0], [0.16, 0.05], [0.18, 0.22], [0.14, 0.24], [0, 0.24]],
    '#b06a4a', { roughness: 0.8 },
  )
  vaso.position.y = 0.17
  planta.add(vaso)
  const folhagem = puff(0.24, '#4a8f3c', 6, 31, { roughness: 0.85 })
  folhagem.position.y = 0.56
  planta.add(folhagem)
  planta.position.set(-1.15, 0, -1.6)
  base.add(planta)

  base.position.y = 0
  root.add(base)

  // ---------- BALCÃO do caixa (corpo + tampo de madeira + registradora) ----------
  const balcao = new THREE.Group()
  const balcaoCorpo = rbox(2.4, 0.78, 1.0, 0.06, '#e6dac5', { roughness: 0.7 })
  balcaoCorpo.position.y = 0.39
  balcao.add(balcaoCorpo)
  const tampo = rbox(2.55, 0.08, 1.15, 0.03, '#c79c66', { roughness: 0.5 })
  tampo.position.y = 0.81
  balcao.add(tampo)
  const faixa = rbox(2.42, 0.14, 0.04, 0.015, '#6f8b84', { roughness: 0.6 })
  faixa.position.set(0, 0.2, 0.5)
  balcao.add(faixa)

  const registradora = new THREE.Group()
  const regCorpo = rbox(0.36, 0.26, 0.3, 0.04, '#3d4852', { roughness: 0.45 })
  regCorpo.position.y = 0.13
  registradora.add(regCorpo)
  const regTela = rbox(0.3, 0.22, 0.05, 0.015, '#9fe8df', {
    roughness: 0.25, emissive: '#7fd8cf', emissiveIntensity: 1.0,
  })
  regTela.position.set(0, 0.34, 0)
  regTela.rotation.x = -0.3
  registradora.add(regTela)
  for (let i = 0; i < 6; i++) {
    const tecla = rbox(0.06, 0.025, 0.05, 0.008, '#8b97a1', { roughness: 0.4 })
    tecla.position.set(-0.09 + (i % 3) * 0.09, 0.27, i < 3 ? 0.09 : 0.02)
    registradora.add(tecla)
  }
  registradora.position.set(0.9, 0.85, -0.1)
  registradora.rotation.y = -0.15
  balcao.add(registradora)

  balcao.position.set(0.35, 0.17, -0.3)
  root.add(balcao)

  // ---------- CAIXA (atendente) atrás do balcão, de boné, braço erguido ----------
  const caixa = person({ body: '#4f7d74', skin: '#e8c39e', height: 1.45, armAngle: 0.35 })
  const cabecaCaixa = caixa.getObjectByName('head')!
  const bone = cylinder(0.285, 0.295, 0.1, '#3c5f58', { roughness: 0.8 })
  bone.position.y = 0.18
  cabecaCaixa.add(bone)
  const aba = rbox(0.3, 0.025, 0.16, 0.01, '#3c5f58', { roughness: 0.8 })
  aba.position.set(0, 0.14, 0.3)
  cabecaCaixa.add(aba)
  cabecaCaixa.rotation.x = -0.18 // olhando para cima, para a galinha
  const bracoDir = caixa.getObjectByName('armR')!
  bracoDir.rotation.z = -2.45 // braço erguido de espanto
  caixa.position.set(0.5, 0.17, -1.2) // atrás do balcão, livre da registradora
  caixa.rotation.y = -0.5 // virada para a cana e a galinha
  root.add(caixa)

  // ---------- a CANA-de-açúcar gigante fincada no balcão ----------
  const cana = new THREE.Group()
  const canaTronco = cylinder(0.11, 0.14, 1.7, '#9fb054', { roughness: 0.6 })
  canaTronco.position.y = 0.85
  cana.add(canaTronco)
  const canaTopo = sphere(0.11, '#9fb054', { roughness: 0.6 })
  canaTopo.position.y = 1.7
  cana.add(canaTopo)
  for (const ny of [0.4, 0.9, 1.4]) {
    const no = cylinder(0.145, 0.145, 0.055, '#6b7c3c', { roughness: 0.65 })
    no.position.y = ny
    cana.add(no)
  }
  cana.position.set(-0.7, 1.02, -0.05) // base no tampo do balcão (y=1.02)
  root.add(cana)

  // ---------- folhas no topo da cana (expandem ao abrir) ----------
  const folhas = new THREE.Group()
  const leafSpecs: [number, number, number, number, number, string][] = [
    // [rotX, rotZ, posX, posY, posZ, cor]
    [0, 0.8, -0.16, 0.14, 0, '#5f9e4a'],
    [0, -0.8, 0.16, 0.14, 0, '#7cba5f'],
    [0.8, 0, 0, 0.15, 0.15, '#7cba5f'],
    [-0.8, 0, 0, 0.15, -0.15, '#5f9e4a'],
    [0, 0.15, 0, 0.2, 0, '#7cba5f'],
  ]
  for (const [rx, rz, px, py, pz, cor] of leafSpecs) {
    const folha = capsule(0.045, 0.42, cor, { roughness: 0.7 })
    folha.rotation.set(rx, 0, rz)
    folha.position.set(px, py, pz)
    if (rx !== 0) folha.scale.x = 0.45
    else folha.scale.z = 0.45
    folhas.add(folha)
  }
  folhas.position.set(-0.7, 2.72, -0.05)
  root.add(folhas)

  // ---------- a galinha FÔfa (corpo-puff, olhos de verdade, asa erguida) ----------
  const galinha = new THREE.Group()
  const corpo = puff(0.28, '#f4d06f', 6, 21, { roughness: 0.7 })
  corpo.scale.set(1.05, 0.95, 1.1)
  galinha.add(corpo)

  const cabeca = new THREE.Group()
  const cranio = sphere(0.2, '#f4d06f', { roughness: 0.7 })
  cabeca.add(cranio)
  for (const lado of [-1, 1]) {
    const olho = sphere(0.055, '#ffffff', { roughness: 0.25 })
    olho.position.set(lado * 0.08, 0.03, 0.165)
    olho.scale.z = 0.55
    const pupila = sphere(0.026, '#1a1a1a', { roughness: 0.2 })
    pupila.position.set(lado * 0.08, 0.03, 0.2)
    cabeca.add(olho, pupila)
  }
  const bico = cone(0.05, 0.14, '#e0913f', { roughness: 0.5 })
  bico.rotation.x = Math.PI / 2
  bico.position.set(0, -0.02, 0.26)
  cabeca.add(bico)
  const barbela = sphere(0.035, '#c94f3d', { roughness: 0.6 })
  barbela.position.set(0, -0.11, 0.19)
  cabeca.add(barbela)
  for (let i = 0; i < 3; i++) {
    const crista = sphere(0.05 - i * 0.006, '#c94f3d', { roughness: 0.6 })
    crista.position.set(0, 0.19 + i * 0.02, 0.06 - i * 0.07)
    cabeca.add(crista)
  }
  cabeca.position.set(0, 0.42, 0.12)
  galinha.add(cabeca)

  const asaEsq = capsule(0.08, 0.2, '#e9bd55', { roughness: 0.7 })
  asaEsq.position.set(-0.28, 0.05, 0.02)
  asaEsq.rotation.z = 0.55
  asaEsq.scale.z = 0.55
  galinha.add(asaEsq)
  const asaDir = capsule(0.08, 0.32, '#e9bd55', { roughness: 0.7 })
  asaDir.position.set(0.41, 0.32, 0.06)
  asaDir.rotation.z = -0.78 // erguida para o lado: a ponta enfia na alça da sacola
  asaDir.scale.z = 0.55
  galinha.add(asaDir)

  const rabo = puff(0.12, '#e9bd55', 4, 22, { roughness: 0.7 })
  rabo.position.set(0, 0.12, -0.34)
  rabo.scale.set(0.75, 0.75, 1)
  galinha.add(rabo)
  for (const lado of [-1, 1]) {
    const pata = capsule(0.028, 0.1, '#e0913f', { roughness: 0.5 })
    pata.position.set(lado * 0.09, -0.36, 0.05)
    galinha.add(pata)
  }
  // pose final: agarrada à cana a meia altura, inclinada, virada pra plateia
  galinha.position.set(-0.48, 1.92, 0.38)
  galinha.rotation.y = 0.45
  galinha.rotation.z = -0.12
  root.add(galinha)

  // ---------- a SACOLA azul (påse) — o acento saturado da cena ----------
  const sacola = new THREE.Group()
  const AZUL = '#2e86de'
  const AZUL_ESC = '#1f66b8'
  const sacolaCorpo = rbox(0.44, 0.5, 0.2, 0.035, AZUL, { roughness: 0.45 })
  sacola.add(sacolaCorpo)
  // sanfonas laterais (fole) — o que faz ler sacola, não caixa
  for (const lado of [-1, 1]) {
    const fole = rbox(0.03, 0.46, 0.13, 0.012, AZUL_ESC, { roughness: 0.5 })
    fole.position.set(lado * 0.212, -0.01, 0)
    sacola.add(fole)
  }
  // bainha dobrada na boca da sacola
  const dobra = rbox(0.45, 0.05, 0.21, 0.018, AZUL_ESC, { roughness: 0.45 })
  dobra.position.y = 0.235
  sacola.add(dobra)
  // alças em arco (meio toro), uma de cada face
  for (const lado of [-1, 1]) {
    const alca = new THREE.Mesh(
      new THREE.TorusGeometry(0.11, 0.018, 12, 32, Math.PI),
      mat(AZUL_ESC, { roughness: 0.45 }),
    )
    alca.castShadow = true
    alca.position.set(0, 0.25, lado * 0.07)
    sacola.add(alca)
  }
  // logo da loja: disco branco com anel azul
  const selo = cylinder(0.11, 0.11, 0.02, '#f5f2ea', { roughness: 0.35 })
  selo.rotation.x = Math.PI / 2
  selo.position.set(0, 0.0, 0.105)
  sacola.add(selo)
  const seloAnel = torus(0.065, 0.016, AZUL, { roughness: 0.4 })
  seloAnel.position.set(0, 0.0, 0.118)
  sacola.add(seloAnel)
  sacola.position.set(0.12, 1.97, 0.18) // pendurada na ponta da asa erguida
  sacola.rotation.z = -0.06
  root.add(sacola)

  const parts = [
    { name: 'base', group: 'cenario', object: base },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'caixa', group: 'cenario', object: caixa },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'folhas', group: 'cana', object: folhas },
    { name: 'galinha', group: 'galinha', object: galinha },
    { name: 'sacola', group: 'sacola', object: sacola },
  ]

  const build = [
    // ---- cenário ----
    seq('base-rise', 'base', 0, 0.7, [riseFrom(0, 1.15)], {
      caption: 'No caixa do supermercado, tudo pronto pra pagar…',
    }),
    seq('balcao-rise', 'balcao', 0.15, 0.75, [riseFrom(0.17, 1.6)]),
    seq('caixa-rise', 'caixa', 0.35, 0.75, [riseFrom(0.17, 1.85)]),

    // ---- a cana telescopa de dentro do balcão ----
    seq('cana-cresce', 'cana', 1.5, 0.8, [ch('position.y', -0.88, 1.02)], {
      ease: 'easeOut',
      caption: '…mas fincada no balcão há uma CANA-de-açúcar gigante… "CANA…"',
    }),
    seq('folhas-abrem', 'folhas', 2.4, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ], { ease: 'easeOut' }),

    // ---- a galinha ----
    seq('galinha-sobe', 'galinha', 3.5, 0.9, [ch('position.y', -1.05, 2.32)], {
      ease: 'easeOut',
      caption: '…a galinha FÔfa aparece lá no topo da CANA…',
    }),
    seq('galinha-desliza', 'galinha', 4.7, 0.8, [
      ch('position.y', 2.32, 1.85),
      ch('rotation.z', 0, -0.12),
    ], {
      ease: 'easeIn',
      caption: '…e desce escorregando aos gritos de "IÁ!" — CANA… IÁ! (kan jag)',
    }),

    // ---- a sacola ----
    seq('sacola-brota', 'sacola', 5.5, 0.7, [ch('position.y', -0.65, 1.3)], {
      ease: 'easeOut',
      caption: '…no balcão brota a sacola azul — e a galinha FÔfa a agarra… (få)',
    }),
    seq('sacola-ergue', 'sacola', 6.8, 0.8, [
      ch('position.x', 0.55, 0.12),
      ch('position.y', 1.3, 1.97),
      ch('rotation.z', 0, -0.06),
    ], {
      caption: '…ergue a sacola bem alto e congela EN PÔSE de modelo! (en påse)',
    }),

    // ---- pose final ----
    seq('galinha-pose-final', 'galinha', 8.2, 0.7, [
      ch('rotation.y', 0, 0.45),
      ch('position.y', 1.85, 1.92),
    ], {
      caption: 'CANA… IÁ! FÔ… EN PÔSE! — "Kan jag få en påse?" (Posso pegar uma sacola?)',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [2.25, 2.95, 4.7], target: [-0.1, 1.5, 0.0] },
  }
}

export const card: Card = {
  refine: { organic: ['galinha'] },
  meta: {
    id: 'kan-jag-fa-en-pase',
    contexto: 'Caixa do supermercado — e a mesma estrutura em café, restaurante e balcão.',
    fraseFonte: 'Posso pegar uma sacola?',
    fraseAlvo: 'Kan jag få en påse?',
    pronuncia: "kan iá FÔ en PÔ-se ('å' soa como 'ô' fechado, duas vezes: 'fô', 'pô-se')",
    ponteSonora:
      "kan iá FÔ en PÔ-se ~ \"CANA... IÁ! FÔ... EN PÔSE!\" — a CANA + o grito IÁ dão 'kan jag' com i puro, sem o j chiado de 'canja'; a galinha FÔfa dá o ô fechado de 'få'; e ela congela EN PÔSE = 'en påse'.",
    historia:
      "No caixa do supermercado há uma CANA-de-açúcar gigante fincada no balcão. A galinha FÔfa desce escorregando pela cana aos gritos de 'IÁ!', agarra a sacola azul e congela EM PÔSE de modelo fotográfico: 'CANA... IÁ! FÔ... EN PÔSE!'. Ela só entrega a sacola pra quem fizer pose junto — pedir sacola na Suécia é posar com a galinha da cana.",
  },
  createScene,
}

export default card
