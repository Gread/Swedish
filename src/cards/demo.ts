import * as THREE from 'three'
import type { Card, CardScene } from '../rig/types'
import { box, cone, cylinder, seq, sphere, riseFrom, ch } from '../rig/helpers'

/**
 * Carta descartável para validar o motor de montagem.
 * Será substituída pelas cartas reais do piloto.
 */
function createScene(): CardScene {
  const root = new THREE.Group()

  const base = cylinder(1.1, 1.3, 0.3, '#3d5a80')
  base.position.set(0, 0.15, 0)
  root.add(base)

  const tower = box(0.8, 1.4, 0.8, '#98c1d9')
  tower.position.set(0, 1.0, 0)
  root.add(tower)

  const roof = cone(0.75, 0.8, '#ee6c4d')
  roof.position.set(0, 2.1, 0)
  root.add(roof)

  const orb = sphere(0.28, '#ffd75e')
  orb.position.set(0, 2.85, 0)
  root.add(orb)

  const parts = [
    { name: 'base', group: 'fundacao', object: base },
    { name: 'tower', group: 'corpo', object: tower },
    { name: 'roof', group: 'telhado', object: roof },
    { name: 'orb', group: 'telhado', object: orb },
  ]

  const build = [
    seq('base-rise', 'base', 0, 0.7, [riseFrom(0.15)], {
      caption: 'A base sobe do chão…',
    }),
    seq('tower-rise', 'tower', 0.9, 0.8, [riseFrom(1.0, 1.6)], {
      caption: '…a torre telescopa de dentro da base…',
    }),
    seq('roof-rise', 'roof', 1.9, 0.6, [riseFrom(2.1, 1.0)], {
      caption: '…o telhado desliza para o topo…',
    }),
    seq('orb-rise', 'orb', 2.2, 0.5, [riseFrom(2.85, 0.9)]),
    seq('orb-spin', 'orb', 2.7, 0.6, [ch('rotation.y', 0, Math.PI * 2)], {
      caption: '…e a esfera dourada corona a torre. ✔',
    }),
  ]

  return { root, parts, build, cameraHint: { position: [3.5, 2.8, 4.5], target: [0, 1.3, 0] } }
}

export const demoCard: Card = {
  meta: {
    id: 'demo-torre',
    contexto: 'demo',
    fraseFonte: '(demo) A torre dourada',
    fraseAlvo: 'Det gyllene tornet',
    pronuncia: 'dê ÍLE-ne TÓR-net',
    ponteSonora: 'demo de teste do motor',
    historia: 'Carta de demonstração para validar a montagem passo a passo.',
  },
  createScene,
}
