import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, sphere, torus, seq, ch, riseFrom } from '../rig/helpers'

/**
 * jag-ska-hamta-ut-ett-paket — "Jag ska hämta ut ett paket."
 * IÁ, ESCARRA EM TATU — ETE PACOTE! O tatu atendente do postombud recebe
 * o escarro na carapaça e libera o pacote com um ET dentro.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  // ---------- cenário: piso do mercado ----------
  const chao = box(5, 0.12, 4.2, '#dcdcd2')
  chao.position.set(0, -0.06, 0.2)
  root.add(chao)

  // ---------- cenário: balcão vermelho ICA do postombud ----------
  const balcao = box(2.3, 0.85, 0.75, '#e3000a')
  balcao.position.set(0, 0.425, -0.4)
  root.add(balcao)

  // ---------- cenário: tampo branco do balcão (topo em y = 0.97) ----------
  const tampo = box(2.5, 0.12, 0.95, '#f5f5f5')
  tampo.position.set(0, 0.91, -0.4)
  root.add(tampo)

  // ---------- o TATU atendente: carapaça + bandas + crachá ----------
  const tatuCorpo = new THREE.Group()
  const carapaca = sphere(0.5, '#9b9ba6')
  carapaca.scale.set(1.0, 0.78, 1.25) // meia-extensão: 0.5 / 0.39 / 0.625
  tatuCorpo.add(carapaca)
  for (const nz of [0.15, -0.12]) {
    const banda = torus(0.5, 0.03, '#7d7d8a')
    banda.scale.set(1.0, 0.78, 1.0)
    banda.position.set(0, 0, nz)
    tatuCorpo.add(banda)
  }
  const cracha = box(0.16, 0.2, 0.03, '#ffffff')
  cracha.position.set(0.25, 0.05, 0.55)
  tatuCorpo.add(cracha)
  const crachaFaixa = box(0.16, 0.05, 0.012, '#005aa0')
  crachaFaixa.position.set(0.25, 0.12, 0.565)
  tatuCorpo.add(crachaFaixa)
  tatuCorpo.position.set(-0.35, 1.05, -1.0) // atrás do balcão, casco acima do tampo
  root.add(tatuCorpo)

  // ---------- a cabeça do tatu: focinho-cone esperando a senha ----------
  const tatuCabeca = new THREE.Group()
  const focinho = cone(0.18, 0.5, '#7a7a85')
  focinho.rotation.x = Math.PI / 2 // aponta para a frente (+z), por cima do balcão
  tatuCabeca.add(focinho)
  const nariz = sphere(0.05, '#4a4a52')
  nariz.position.set(0, 0, 0.26)
  tatuCabeca.add(nariz)
  const olhoTatuE = sphere(0.05, '#222222')
  olhoTatuE.position.set(-0.11, 0.13, -0.05)
  tatuCabeca.add(olhoTatuE)
  const olhoTatuD = sphere(0.05, '#222222')
  olhoTatuD.position.set(0.11, 0.13, -0.05)
  tatuCabeca.add(olhoTatuD)
  const orelhaE = cone(0.06, 0.16, '#6e6e78')
  orelhaE.position.set(-0.11, 0.24, -0.2)
  tatuCabeca.add(orelhaE)
  const orelhaD = cone(0.06, 0.16, '#6e6e78')
  orelhaD.position.set(0.11, 0.24, -0.2)
  tatuCabeca.add(orelhaD)
  tatuCabeca.position.set(-0.35, 1.32, -0.42)
  root.add(tatuCabeca)

  // ---------- o ESCARRO voador (pose final: espatifado na carapaça) ----------
  const escarro = sphere(0.15, '#6fe3c1')
  escarro.position.set(-0.08, 1.3, -0.58)
  escarro.rotation.x = -0.45
  escarro.scale.set(1.35, 1.35, 0.45) // achatado contra o casco
  root.add(escarro)

  // ---------- o PACOTE de papelão sobre o tampo ----------
  const pacote = new THREE.Group()
  const caixa = box(0.7, 0.56, 0.55, '#b5875a')
  pacote.add(caixa)
  const fita = box(0.14, 0.6, 0.57, '#e6d3a3')
  pacote.add(fita)
  const etiquetaQr = box(0.18, 0.18, 0.02, '#ffffff')
  etiquetaQr.position.set(0.14, 0.02, 0.28)
  pacote.add(etiquetaQr)
  const qrPreto = box(0.1, 0.1, 0.012, '#111111')
  qrPreto.position.set(0.14, 0.02, 0.295)
  pacote.add(qrPreto)
  pacote.position.set(0.75, 1.25, -0.35) // apoiado no tampo (base em y = 0.97)
  root.add(pacote)

  // ---------- a cabeça do ET espiando de dentro do pacote ----------
  const etCabeca = new THREE.Group()
  const cabecaEt = sphere(0.24, '#77c74f')
  cabecaEt.scale.set(1.0, 1.15, 1.0)
  etCabeca.add(cabecaEt)
  const olhoEtE = sphere(0.065, '#111111')
  olhoEtE.position.set(-0.1, 0.03, 0.19)
  etCabeca.add(olhoEtE)
  const olhoEtD = sphere(0.065, '#111111')
  olhoEtD.position.set(0.1, 0.03, 0.19)
  etCabeca.add(olhoEtD)
  etCabeca.position.set(0.75, 1.72, -0.35) // saindo pelo topo da caixa
  root.add(etCabeca)

  // ---------- a mãozinha do ET acenando na borda do pacote ----------
  const etMaozinha = new THREE.Group()
  const braco = cylinder(0.045, 0.045, 0.3, '#77c74f')
  braco.position.set(0, 0.15, 0)
  etMaozinha.add(braco)
  const mao = sphere(0.075, '#8fd76a')
  mao.position.set(0, 0.32, 0)
  etMaozinha.add(mao)
  etMaozinha.position.set(1.0, 1.5, -0.35) // pivô na borda direita da caixa
  etMaozinha.rotation.z = -0.35 // inclinada para fora, em pleno aceno
  root.add(etMaozinha)

  const parts = [
    { name: 'chao', group: 'cenario', object: chao },
    { name: 'balcao', group: 'cenario', object: balcao },
    { name: 'tampo', group: 'cenario', object: tampo },
    { name: 'tatu-corpo', group: 'tatu', object: tatuCorpo },
    { name: 'tatu-cabeca', group: 'tatu', object: tatuCabeca },
    { name: 'escarro', group: 'escarro', object: escarro },
    { name: 'pacote', group: 'pacote', object: pacote },
    { name: 'et-cabeca', group: 'et', object: etCabeca },
    { name: 'et-maozinha', group: 'et', object: etMaozinha },
  ]

  const build = [
    // ---- cenário ----
    seq('chao-rise', 'chao', 0, 0.6, [riseFrom(-0.06, 0.5)], {
      caption: 'Você chega ao postombud do ICA: o balcão vermelho de retirar pacotes…',
    }),
    seq('balcao-rise', 'balcao', 0.15, 0.7, [riseFrom(0.425, 1.1)]),
    seq('tampo-rise', 'tampo', 0.35, 0.6, [riseFrom(0.91, 1.15)]),

    // ---- o tatu atendente ----
    seq('tatu-corpo-rise', 'tatu-corpo', 1.7, 0.8, [riseFrom(1.05, 1.7)], {
      caption: '…mas o atendente é um TATU gigante de crachá!',
    }),
    seq('tatu-cabeca-rise', 'tatu-cabeca', 1.9, 0.7, [riseFrom(1.32, 1.9)]),

    // ---- o escarro (a "senha" do balcão) ----
    seq('escarro-rise', 'escarro', 3.5, 0.5, [ch('position.y', -0.3, 1.5)], {
      caption: "A senha do balcão é nojenta: você grita 'IÁ!' e ESCARRA…",
    }),
    seq('escarro-voa', 'escarro', 4.1, 0.55, [
      ch('position.z', 1.5, -0.58),
      ch('position.y', 1.5, 1.3),
    ], {
      caption: '…IÁ, ESCARRA EM TATU: o escarro gruda na carapaça! (jag ska hämta ut)',
    }),
    seq('escarro-splat', 'escarro', 4.65, 0.25, [
      ch('scale.x', 1, 1.35),
      ch('scale.y', 1, 1.35),
      ch('scale.z', 1, 0.45),
    ]),
    seq('tatu-susto', 'tatu-cabeca', 4.65, 0.3, [ch('rotation.x', 0, -0.3)]),
    seq('tatu-volta', 'tatu-cabeca', 4.95, 0.4, [ch('rotation.x', -0.3, 0)]),

    // ---- o pacote destravado ----
    seq('pacote-rise', 'pacote', 5.9, 0.8, [riseFrom(1.25, 1.8)], {
      caption: 'O TATU confere o QR code, destrava como um cofre e solta o PACOTE…',
    }),

    // ---- o ET lá de dentro ----
    seq('et-rise', 'et-cabeca', 7.5, 0.7, [ch('position.y', 1.22, 1.72)], {
      caption: "…e de dentro espia um ET acenando: 'ETE PACOTE!' (ett paket)",
    }),
    seq('maozinha-rise', 'et-maozinha', 7.8, 0.5, [ch('position.y', 1.05, 1.5)]),
    seq('acena-1', 'et-maozinha', 8.4, 0.35, [ch('rotation.z', 0, 0.45)]),
    seq('acena-2', 'et-maozinha', 8.75, 0.45, [ch('rotation.z', 0.45, -0.35)], {
      caption: 'IÁ, ESCARRA EM TATU — ETE PACOTE! "Jag ska hämta ut ett paket." (Vim retirar um pacote.)',
    }),
  ]

  return {
    root,
    parts,
    build,
    cameraHint: { position: [3.2, 3.0, 4.8], target: [0, 1.0, -0.2] },
  }
}

export const card: Card = {
  meta: {
    id: 'jag-ska-hamta-ut-ett-paket',
    contexto:
      'Balcão de pacotes (postombud) dentro do ICA, Coop, Pressbyrån — e, trocando a palavra final, o balcão da farmácia.',
    fraseFonte: 'Vim retirar um pacote.',
    fraseAlvo: 'Jag ska hämta ut ett paket.',
    pronuncia:
      "iá ska RRÉM-ta üt et pa-KÊT ('hämta' com h aspirado tipo 'rr' carioca; 'ut' com u de bico, entre 'u' e 'i')",
    ponteSonora:
      '"IÁ, ESCARRA EM TATU — ETE PACOTE!" — fale corrido: "iá-scarrêm-tatú... ete-pakêt" e sai quase "Jag ska hämta ut ett paket" (o RR de "escaRRa" é o h aspirado de "hämta"; "tatu" cobre o "ta ut" com u de bico; "paket" já soa "pakêt").',
    historia:
      'Você chega ao balcão vermelho do ICA para retirar um pacote, mas o atendente é um TATU gigante de crachá. A senha do balcão é nojenta: você grita "IÁ!" e ESCARRA na carapaça do TATU. O tatu confere o QR code, destrava como um cofre e empurra o pacote — que se abre sozinho e revela um ET acenando lá de dentro: "ETE PACOTE!" (ett paket).',
  },
  createScene,
}

export default card
