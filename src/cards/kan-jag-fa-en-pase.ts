import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, sphere, torus, seq, ch, riseFrom } from '../rig/helpers'

/**
 * kan-jag-fa-en-pase — "Kan jag få en påse?"
 * A galinha FÔfa desce a CANA aos gritos de IÁ e congela EN PÔSE com a sacola.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ---------- cenário: piso do supermercado ----------
  const chao = box(5, 0.1, 3.6, '#f5f5f5')
  chao.position.set(0, 0.05, 0)
  root.add(chao)

  // ---------- cenário: balcão do caixa ----------
  const balcao = new THREE.Group()
  const balcaoCorpo = box(2.6, 0.9, 1.1, '#cfd8dc')
  balcaoCorpo.position.set(0, 0, 0)
  balcao.add(balcaoCorpo)
  const balcaoFaixa = box(2.6, 0.18, 0.04, '#26a69a')
  balcaoFaixa.position.set(0, 0.12, 0.56)
  balcao.add(balcaoFaixa)
  balcao.position.set(0.1, 0.55, 0) // topo do balcão em y = 1.0
  root.add(balcao)

  // ---------- cenário: caixa registradora ----------
  const registradora = new THREE.Group()
  const regCorpo = box(0.34, 0.22, 0.26, '#37474f')
  regCorpo.position.set(0, 0, 0)
  registradora.add(regCorpo)
  const regTela = box(0.26, 0.16, 0.05, '#80deea')
  regTela.position.set(0, 0.19, 0.1)
  regTela.rotation.x = -0.25
  registradora.add(regTela)
  registradora.position.set(0.95, 1.11, 0)
  root.add(registradora)

  // ---------- a CANA-de-açúcar gigante fincada no balcão ----------
  const cana = new THREE.Group()
  const canaTronco = cylinder(0.13, 0.15, 1.6, '#7cb342')
  canaTronco.position.set(0, 0, 0)
  cana.add(canaTronco)
  for (const ny of [-0.5, 0, 0.5]) {
    const no = cylinder(0.165, 0.165, 0.06, '#558b2f')
    no.position.set(0, ny, 0)
    cana.add(no)
  }
  cana.position.set(-0.6, 1.8, 0) // base em y=1.0 (topo do balcão), topo em y=2.6
  root.add(cana)

  // ---------- folhas no topo da cana ----------
  const folhas = new THREE.Group()
  const folhaEsq = cone(0.06, 0.55, '#43a047')
  folhaEsq.position.set(-0.13, 0.18, 0)
  folhaEsq.rotation.z = 0.6
  folhas.add(folhaEsq)
  const folhaDir = cone(0.06, 0.55, '#43a047')
  folhaDir.position.set(0.13, 0.18, 0)
  folhaDir.rotation.z = -0.6
  folhas.add(folhaDir)
  const folhaTras = cone(0.06, 0.55, '#66bb6a')
  folhaTras.position.set(0, 0.2, -0.1)
  folhaTras.rotation.x = -0.5
  folhas.add(folhaTras)
  folhas.position.set(-0.6, 2.6, 0)
  root.add(folhas)

  // ---------- a galinha FÔfa (corpo+cabeça+bico+crista+olhos+rabo) ----------
  const galinha = new THREE.Group()
  const corpo = sphere(0.38, '#ffd23f')
  corpo.position.set(0, 0, 0)
  galinha.add(corpo)
  const cabeca = sphere(0.22, '#ffd23f')
  cabeca.position.set(0.25, 0.42, 0)
  galinha.add(cabeca)
  const bico = cone(0.07, 0.2, '#ff8c00')
  bico.position.set(0.5, 0.42, 0)
  bico.rotation.z = -Math.PI / 2 // aponta para frente (+x), gritando "EN PÔSE!"
  galinha.add(bico)
  const crista = cone(0.08, 0.18, '#e63946')
  crista.position.set(0.25, 0.68, 0)
  galinha.add(crista)
  const olhoDir = sphere(0.035, '#263238', 12)
  olhoDir.position.set(0.4, 0.48, 0.1)
  galinha.add(olhoDir)
  const olhoEsq = sphere(0.035, '#263238', 12)
  olhoEsq.position.set(0.4, 0.48, -0.1)
  galinha.add(olhoEsq)
  const rabo = cone(0.09, 0.3, '#ff8c00')
  rabo.position.set(-0.36, 0.14, 0)
  rabo.rotation.z = 1.2 // penas apontando para trás e para cima
  galinha.add(rabo)
  // pose final: agarrada à cana a meia altura, inclinada, virada pra "câmera"
  galinha.position.set(-0.22, 1.75, 0.2)
  galinha.rotation.z = -0.15
  galinha.rotation.y = 0.35
  root.add(galinha)

  // ---------- a SACOLA azul (påse) erguida em pose ----------
  const sacola = new THREE.Group()
  const sacolaCorpo = box(0.44, 0.55, 0.14, '#1e88e5')
  sacolaCorpo.position.set(0, 0, 0)
  sacola.add(sacolaCorpo)
  const alca = torus(0.13, 0.035, '#1565c0')
  alca.position.set(0, 0.34, 0) // torus no plano XY: lê como alça vista de frente
  sacola.add(alca)
  sacola.position.set(0.35, 2.45, 0.2)
  sacola.rotation.z = -0.1
  root.add(sacola)

  const parts = [
    { name: 'chao', group: 'cenario', object: chao },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'registradora', group: 'cenario', object: registradora },
    { name: 'cana', group: 'cana', object: cana },
    { name: 'folhas', group: 'cana', object: folhas },
    { name: 'galinha', group: 'galinha', object: galinha },
    { name: 'sacola', group: 'sacola', object: sacola },
  ]

  const build = [
    // ---- cenário ----
    seq('chao-rise', 'chao', 0, 0.6, [riseFrom(0.05, 0.5)], {
      caption: 'No caixa do supermercado, tudo pronto pra pagar…',
    }),
    seq('balcao-rise', 'balcao', 0.15, 0.7, [riseFrom(0.55, 1.3)]),
    seq('registradora-rise', 'registradora', 0.35, 0.6, [riseFrom(1.11, 1.6)]),

    // ---- a cana ----
    seq('cana-rise', 'cana', 1.8, 0.8, [riseFrom(1.8, 2.9)], {
      caption: '…mas fincada no balcão há uma CANA-de-açúcar gigante… "CANA…"',
    }),
    seq('folhas-abrem', 'folhas', 2.5, 0.6, [
      ch('scale.x', 0.01, 1),
      ch('scale.y', 0.01, 1),
      ch('scale.z', 0.01, 1),
    ]),

    // ---- a galinha ----
    seq('galinha-sobe', 'galinha', 3.8, 0.8, [ch('position.y', -0.95, 2.25)], {
      caption: '…a galinha FÔfa aparece lá no topo da CANA…',
    }),
    seq('galinha-desliza', 'galinha', 4.7, 0.8, [
      ch('position.y', 2.25, 1.75),
      ch('rotation.z', 0, -0.15),
    ], {
      caption: '…e desce escorregando aos gritos de "IÁ!" — CANA… IÁ! (kan jag)',
    }),

    // ---- a sacola ----
    seq('sacola-brota', 'sacola', 6.2, 0.7, [ch('position.y', -0.8, 1.3)], {
      caption: '…no balcão brota a sacola azul — e a galinha FÔfa a agarra… (få)',
    }),
    seq('sacola-pose', 'sacola', 7.4, 0.8, [
      ch('position.x', 0.55, 0.35),
      ch('position.y', 1.3, 2.45),
      ch('rotation.z', 0, -0.1),
    ], {
      caption: '…ergue a sacola bem alto e congela EN PÔSE de modelo! (en påse)',
    }),

    // ---- pose final ----
    seq('galinha-pose-final', 'galinha', 8.8, 0.6, [ch('rotation.y', 0, 0.35)], {
      caption: 'CANA… IÁ! FÔ… EN PÔSE! — "Kan jag få en påse?" (Posso pegar uma sacola?)',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.4, 3.0, 5.0], target: [0, 1.1, 0] },
  }
}

export const card: Card = {
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
