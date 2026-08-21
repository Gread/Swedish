import type * as THREE from 'three'

export type ChannelTarget =
  | 'position.x' | 'position.y' | 'position.z'
  | 'rotation.x' | 'rotation.y' | 'rotation.z'
  | 'scale.x' | 'scale.y' | 'scale.z'

export interface Channel {
  target: ChannelTarget
  from: number
  to: number
}

export type Ease = 'linear' | 'easeIn' | 'easeOut' | 'easeInOut'

export interface Sequence {
  name: string
  part: string
  at: number
  dur: number
  channels: Channel[]
  ease?: Ease
  /** Narração mnemônica exibida quando esta sequência começa. */
  caption?: string
}

export interface PartDef {
  name: string
  /** Peças do mesmo grupo montam juntas; "Próximo" avança um grupo por vez. */
  group: string
  object: THREE.Object3D
}

export interface CardScene {
  root: THREE.Group
  parts: PartDef[]
  build: Sequence[]
  cameraHint?: {
    position: [number, number, number]
    target?: [number, number, number]
  }
}

export interface CardMeta {
  id: string
  contexto: string
  fraseFonte: string
  fraseAlvo: string
  pronuncia: string
  ponteSonora: string
  historia: string
}

export interface Card {
  meta: CardMeta
  createScene: () => CardScene
}
