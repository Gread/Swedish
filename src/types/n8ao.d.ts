declare module 'n8ao' {
  import type { Camera, Scene } from 'three'
  import { Pass } from 'postprocessing'

  export class N8AOPostPass extends Pass {
    constructor(scene: Scene, camera: Camera, width?: number, height?: number)
    configuration: {
      aoRadius: number
      distanceFalloff: number
      intensity: number
      color: import('three').Color
      aoSamples: number
      denoiseSamples: number
      denoiseRadius: number
      denoiseIterations: number
      gammaCorrection: boolean
      screenSpaceRadius: boolean
      halfRes: boolean
    }
    setSize(width: number, height: number): void
  }
}
