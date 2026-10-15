import * as THREE from 'three'

/** As cenas são enquadradas (cameraHint + tools/render.sh) num quadro 960×600. */
export const BASE_FOV = 38
export const REF_ASPECT = 960 / 600
/** Acima disso a grande-angular distorce; o resto do ajuste vira recuo da câmera. */
const MAX_FOV = 58
/**
 * Fração da largura do quadro de referência mantida em telas estreitas: as
 * bordas do 960×600 costumam ser só chão/fundo, e manter 100% deixaria a cena
 * pequena com faixas vazias em cima e embaixo.
 */
const KEEP_WIDTH = 0.85

const deg = THREE.MathUtils.radToDeg
const rad = THREE.MathUtils.degToRad

/**
 * Posiciona a câmera para que a cena caiba como no quadro de referência em
 * qualquer proporção. Em telas mais largas nada muda (o FOV vertical manda).
 * Em telas mais estreitas — celular em pé — preserva o FOV HORIZONTAL de
 * referência (quase todo — ver KEEP_WIDTH): primeiro abre a lente até MAX_FOV,
 * depois recua a câmera na mesma linha de visão, para as laterais da cena não
 * ficarem de fora.
 */
export function fitCamera(
  cam: THREE.PerspectiveCamera,
  position: readonly [number, number, number],
  target: readonly [number, number, number],
  aspect: number,
) {
  const tRef = Math.tan(rad(BASE_FOV / 2))
  let t = Math.max(tRef, (tRef * REF_ASPECT * KEEP_WIDTH) / aspect)
  const tMax = Math.tan(rad(MAX_FOV / 2))
  let distance = 1
  if (t > tMax) {
    distance = t / tMax
    t = tMax
  }
  const tgt = new THREE.Vector3(...target)
  cam.position.set(...position).sub(tgt).multiplyScalar(distance).add(tgt)
  cam.fov = deg(2 * Math.atan(t))
  cam.aspect = aspect
  cam.lookAt(tgt)
  cam.updateProjectionMatrix()
}
