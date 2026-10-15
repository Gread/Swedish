import * as THREE from 'three'
import { GLTFLoader } from 'three-stdlib'
import type { CardScene } from './types'
import { mat } from './helpers'

/*
 * Aplica a uma cena procedural os modelos refinados no Blender
 * (tools/blender/refine.py → public/refined/<id>.glb).
 *
 * A cena procedural continua sendo a fonte da verdade: posições, peças e
 * animação de montagem vêm dela. O refinado só troca a GEOMETRIA das peças
 * orgânicas por uma pele contínua — como foi exportada no espaço local de cada
 * peça, encaixa no mesmo lugar e as sequências (que só mexem no transform da
 * peça) seguem valendo sem nenhuma alteração.
 */

const loader = new GLTFLoader()
const cache = new Map<string, Promise<THREE.Group | null>>()

function load(id: string): Promise<THREE.Group | null> {
  let p = cache.get(id)
  if (!p) {
    p = fetch(`/refined/${id}.glb`, { method: 'HEAD' })
      .then((r) => (r.ok && r.headers.get('content-type')?.includes('model') !== false ? r : null))
      .then((r) =>
        r
          ? loader.loadAsync(`/refined/${id}.glb`).then((g) => g.scene as unknown as THREE.Group)
          : null,
      )
      .catch(() => null)
    cache.set(id, p)
  }
  return p
}

/** Material do glTF → material do app (microrrelevo + resposta física). */
function upgrade(src: THREE.Material, size: number, vertexColors: boolean): THREE.Material {
  const s = src as THREE.MeshStandardMaterial
  const m = mat(s.color ? s.color.getHex() : 0xffffff, {
    roughness: s.roughness,
    metalness: s.metalness,
    emissive: s.emissiveIntensity > 0 && s.emissive?.getHex() ? s.emissive.getHex() : undefined,
    emissiveIntensity: s.emissiveIntensity,
    size,
  })
  m.vertexColors = vertexColors
  if (s.transparent) {
    m.transparent = true
    m.opacity = s.opacity
  }
  return m
}

/** Meshes que pertencem à peça (descendo a árvore, parando em sub-peças). */
function ownMeshes(object: THREE.Object3D, parts: Set<THREE.Object3D>): THREE.Mesh[] {
  const out: THREE.Mesh[] = []
  const visit = (o: THREE.Object3D) => {
    if (o !== object && parts.has(o)) return
    if ((o as THREE.Mesh).isMesh) out.push(o as THREE.Mesh)
    for (const c of o.children) visit(c)
  }
  visit(object)
  return out
}

/**
 * Troca a geometria das peças refinadas. Resolve `true` se havia modelo
 * refinado para a carta, `false` se a cena segue 100% procedural.
 */
export function applyRefined(id: string, cs: CardScene): Promise<boolean> {
  // idempotente: StrictMode roda efeitos duas vezes, e aplicar de novo
  // duplicaria a pele refinada na mesma cena
  const key = '__refined'
  const prev = cs.root.userData[key] as Promise<boolean> | undefined
  if (prev) return prev
  const p = swap(id, cs)
  cs.root.userData[key] = p
  return p
}

async function swap(id: string, cs: CardScene): Promise<boolean> {
  const gltf = await load(id)
  if (!gltf) return false

  const partObjects = new Set(cs.parts.map((p) => p.object))
  gltf.updateMatrixWorld(true)
  let swapped = 0

  for (const part of cs.parts) {
    const node = gltf.getObjectByName(part.name)
    if (!node) continue
    // Só peças que o Blender de fato refinou trazem filhos "<peça>__r<i>".
    // Um filho com várias cores chega como Group de sub-malhas, e essas
    // sub-malhas levam o nome da MALHA, não do nó — por isso o filtro é pelo
    // nó e depois pegamos todos os meshes debaixo dele.
    const refinedNodes = node.children.filter((c) => /__r\d+$/.test(c.name))
    if (refinedNodes.length === 0) continue
    const inv = node.matrixWorld.clone().invert()
    const refined: { mesh: THREE.Mesh; rel: THREE.Matrix4 }[] = []
    for (const rn of refinedNodes) {
      rn.traverse((o) => {
        if ((o as THREE.Mesh).isMesh) {
          refined.push({
            mesh: o as THREE.Mesh,
            rel: new THREE.Matrix4().multiplyMatrices(inv, o.matrixWorld),
          })
        }
      })
    }

    // esconde a geometria procedural da peça (sem tocar em sub-peças)
    for (const mesh of ownMeshes(part.object, partObjects)) {
      if (mesh === part.object) {
        // a própria peça é um mesh: o player controla o visible dela,
        // então zeramos a geometria em vez de escondê-la
        mesh.geometry = new THREE.BufferGeometry()
      } else {
        mesh.visible = false
      }
    }

    for (const { mesh, rel } of refined) {
      const clone = mesh.clone()
      // transform relativo ao nó da peça no glTF = transform relativo à peça
      // na cena, porque o blockout foi exportado no espaço local de cada peça
      clone.matrixAutoUpdate = true
      rel.decompose(clone.position, clone.quaternion, clone.scale)
      clone.geometry.computeBoundingSphere()
      const size = (clone.geometry.boundingSphere?.radius ?? 0.5) * 2
      const hasColors = !!clone.geometry.getAttribute('color')
      clone.material = Array.isArray(clone.material)
        ? clone.material.map((m) => upgrade(m, size, hasColors))
        : upgrade(clone.material, size, hasColors)
      clone.castShadow = true
      clone.receiveShadow = true
      part.object.add(clone)
    }
    swapped++
  }
  return swapped > 0
}
