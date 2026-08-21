import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  BloomEffect,
  EffectComposer,
  EffectPass,
  RenderPass,
  VignetteEffect,
} from 'postprocessing'
import { N8AOPostPass } from 'n8ao'

/**
 * Pós-processamento (AO + bloom + vignette) via `postprocessing` puro —
 * o wrapper @react-three/postprocessing dispara "Invalid hook call" com
 * React 19 + R3F v9, então montamos o composer à mão.
 */
export function Effects() {
  const { gl, scene, camera, size } = useThree()

  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4 })
    c.addPass(new RenderPass(scene, camera))
    const n8ao = new N8AOPostPass(scene, camera, size.width, size.height)
    n8ao.configuration.aoRadius = 0.6
    n8ao.configuration.intensity = 2.5
    n8ao.configuration.distanceFalloff = 0.8
    c.addPass(n8ao)
    c.addPass(
      new EffectPass(
        camera,
        new BloomEffect({ intensity: 0.35, luminanceThreshold: 0.85, mipmapBlur: true }),
        new VignetteEffect({ eskil: false, offset: 0.18, darkness: 0.72 }),
      ),
    )
    return c
    // size é tratado no efeito de resize abaixo
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl, scene, camera])

  useEffect(() => {
    composer.setSize(size.width, size.height)
  }, [composer, size.width, size.height])

  useEffect(() => () => composer.dispose(), [composer])

  useFrame((_, dt) => {
    composer.render(dt)
  }, 1)

  return null
}
