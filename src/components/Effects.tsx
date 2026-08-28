import { useEffect, useMemo } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import {
  BloomEffect,
  BrightnessContrastEffect,
  EffectComposer,
  EffectPass,
  HueSaturationEffect,
  RenderPass,
  VignetteEffect,
} from 'postprocessing'
import { N8AOPostPass } from 'n8ao'

/**
 * Pós-processamento: AO → bloom → grade → vignette.
 *
 * O tone mapping (ACES) fica no renderer, não aqui. Tentar movê-lo para o fim
 * da cadeia (Canvas `flat` + ToneMappingEffect) parece mais correto — bloom
 * sobre HDR real — mas o passe de AO clampa em 1.0 no meio do caminho, então
 * todo valor acima do branco vira branco chapado e não há tone mapping depois
 * capaz de trazê-lo de volta. Faces inteiras estouravam.
 *
 * Montado à mão porque o wrapper @react-three/postprocessing dispara
 * "Invalid hook call" com React 19 + R3F v9.
 */
export function Effects() {
  const { gl, scene, camera, size } = useThree()

  const composer = useMemo(() => {
    const c = new EffectComposer(gl, { multisampling: 4 })
    c.addPass(new RenderPass(scene, camera))

    const n8ao = new N8AOPostPass(scene, camera, size.width, size.height)
    n8ao.configuration.aoRadius = 0.6
    n8ao.configuration.intensity = 2.2
    n8ao.configuration.distanceFalloff = 0.8
    n8ao.configuration.aoSamples = 16
    n8ao.configuration.denoiseSamples = 8
    n8ao.configuration.denoiseRadius = 12
    // oclusão azul-fria em vez de preta: sombra de contato com cor de ambiente
    n8ao.configuration.color = new THREE.Color('#101a26')
    c.addPass(n8ao)

    c.addPass(
      new EffectPass(
        camera,
        new BloomEffect({ intensity: 0.45, luminanceThreshold: 0.88, luminanceSmoothing: 0.3, mipmapBlur: true }),
        // contraste em espaço de tela aprofunda a sombra sem apagar os emissores
        new BrightnessContrastEffect({ contrast: 0.12 }),
        new HueSaturationEffect({ saturation: 0.06 }),
        new VignetteEffect({ eskil: false, offset: 0.2, darkness: 0.65 }),
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
