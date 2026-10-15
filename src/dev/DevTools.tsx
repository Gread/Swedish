import { useEffect, useState } from 'react'
import * as THREE from 'three'
import { GLTFExporter, RoomEnvironment } from 'three-stdlib'
import type { Card, CardScene } from '../rig/types'
import { disposeScene, poseAt, sceneDuration } from '../rig/pose'
import { applyRefined } from '../rig/refined'

/*
 * Ferramentas de desenvolvimento, acessíveis só por query string:
 *   ?contact        folha de contato com a pose final de todas as cartas
 *   ?export=<id>    exporta a geometria das peças de uma carta para blockout/
 *   ?export=all     exporta todas
 */

const W = 420
const H = 280

/** Pose final de cada carta renderizada num único WebGLRenderer, em grade. */
export function ContactSheet({ cards }: { cards: Card[] }) {
  const [tiles, setTiles] = useState<{ id: string; pt: string; src: string }[]>([])

  useEffect(() => {
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
    renderer.setSize(W, H)
    renderer.setPixelRatio(1)
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.shadowMap.enabled = true
    const pmrem = new THREE.PMREMGenerator(renderer)
    const env = pmrem.fromScene(RoomEnvironment(), 0.04).texture

    const out: { id: string; pt: string; src: string }[] = []
    for (const card of cards) {
      const scene = new THREE.Scene()
      scene.background = new THREE.Color('#1d2533')
      scene.environment = env
      scene.environmentIntensity = 0.72
      scene.add(new THREE.HemisphereLight('#fff4e2', '#3b3226', 0.5))
      const key = new THREE.DirectionalLight('#fff4e0', 1.9)
      key.position.set(5, 9, 4)
      key.castShadow = true
      key.shadow.mapSize.set(1024, 1024)
      Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 })
      scene.add(key)
      const fill = new THREE.DirectionalLight('#cfe0ff', 0.85)
      fill.position.set(0, 5, -7)
      scene.add(fill)
      const ground = new THREE.Mesh(
        new THREE.CircleGeometry(30, 48),
        new THREE.MeshStandardMaterial({ color: '#222c3a', roughness: 0.95 }),
      )
      ground.rotation.x = -Math.PI / 2
      ground.position.y = -0.02
      ground.receiveShadow = true
      scene.add(ground)

      let cs: CardScene | null = null
      try {
        cs = card.createScene()
        poseAt(cs, sceneDuration(cs))
        scene.add(cs.root)
        const cam = new THREE.PerspectiveCamera(38, W / H, 0.1, 200)
        const p = cs.cameraHint?.position ?? [4, 3.2, 5.5]
        const t = cs.cameraHint?.target ?? [0, 1, 0]
        cam.position.set(p[0], p[1], p[2])
        cam.lookAt(t[0], t[1], t[2])
        renderer.render(scene, cam)
        out.push({ id: card.meta.id, pt: card.meta.fraseFonte, src: renderer.domElement.toDataURL('image/jpeg', 0.88) })
      } catch (e) {
        out.push({ id: card.meta.id, pt: `ERRO: ${(e as Error).message}`, src: '' })
      } finally {
        if (cs) disposeScene(cs)
      }
    }
    renderer.dispose()
    setTiles(out)
  }, [cards])

  return (
    <div style={{ padding: 12, display: 'grid', gridTemplateColumns: `repeat(auto-fill, ${W / 2}px)`, gap: 8 }}>
      {tiles.length === 0 && <p>renderizando {cards.length} cartas…</p>}
      {tiles.map((t, i) => (
        <figure key={t.id} style={{ margin: 0, width: W / 2 }}>
          {t.src ? <img src={t.src} width={W / 2} height={H / 2} alt={t.id} /> : <div style={{ height: H / 2, background: '#600' }} />}
          <figcaption style={{ fontSize: 10, lineHeight: 1.2, color: '#9fb0c2' }}>
            {i + 1}. {t.id}
          </figcaption>
        </figure>
      ))}
    </div>
  )
}

/**
 * Monta, para cada peça da carta, um grupo com seus meshes no espaço LOCAL da
 * peça — descendo pela árvore mas parando em sub-peças, que viram grupos
 * próprios. O resultado é o "blockout" que o Blender refina: como a geometria
 * está no espaço da peça, o refinado volta para o mesmo lugar e as animações
 * (que só mexem no transform da peça) continuam valendo.
 */
export function buildBlockout(cs: CardScene): THREE.Group {
  cs.root.updateMatrixWorld(true)
  const partObjects = new Set(cs.parts.map((p) => p.object))
  const out = new THREE.Group()
  out.name = 'blockout'

  for (const part of cs.parts) {
    const group = new THREE.Group()
    group.name = part.name
    group.userData.group = part.group
    // o nó da peça fica na posição final da cena (para o Blender calcular
    // oclusão entre peças vizinhas), e os meshes ficam no espaço local dele
    part.object.matrixWorld.decompose(group.position, group.quaternion, group.scale)
    const inv = part.object.matrixWorld.clone().invert()
    let n = 0
    const visit = (o: THREE.Object3D) => {
      if (o !== part.object && partObjects.has(o)) return // sub-peça: é exportada à parte
      const mesh = o as THREE.Mesh
      if (mesh.isMesh && mesh.geometry) {
        const rel = new THREE.Matrix4().multiplyMatrices(inv, mesh.matrixWorld)
        const geo = mesh.geometry.clone().applyMatrix4(rel)
        const src = (Array.isArray(mesh.material) ? mesh.material[0] : mesh.material) as THREE.MeshStandardMaterial
        const m = new THREE.MeshStandardMaterial({
          color: src.color ?? new THREE.Color('#ffffff'),
          roughness: src.roughness ?? 0.55,
          metalness: src.metalness ?? 0,
          emissive: src.emissive ?? new THREE.Color(0),
          emissiveIntensity: src.emissiveIntensity ?? 0,
          transparent: src.transparent && src.opacity < 1,
          opacity: src.opacity ?? 1,
        })
        const clone = new THREE.Mesh(geo, m)
        clone.name = `${part.name}__${n++}`
        group.add(clone)
      }
      for (const c of o.children) visit(c)
    }
    visit(part.object)
    out.add(group)
  }
  return out
}

/** Palco simplificado do app (luz-chave, preenchimento, ambiente, chão). */
function makeStage(env: THREE.Texture) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#1d2533')
  scene.environment = env
  scene.environmentIntensity = 0.72
  scene.add(new THREE.HemisphereLight('#fff4e2', '#3b3226', 0.5))
  const key = new THREE.DirectionalLight('#fff4e0', 1.9)
  key.position.set(5, 9, 4)
  key.castShadow = true
  key.shadow.mapSize.set(2048, 2048)
  key.shadow.bias = -0.0002
  Object.assign(key.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6 })
  scene.add(key)
  const fill = new THREE.DirectionalLight('#cfe0ff', 0.85)
  fill.position.set(0, 5, -7)
  scene.add(fill)
  const rim = new THREE.DirectionalLight('#7fa8d9', 0.45)
  rim.position.set(-6, 4, -2)
  scene.add(rim)
  const ground = new THREE.Mesh(
    new THREE.CircleGeometry(30, 48),
    new THREE.MeshStandardMaterial({ color: '#222c3a', roughness: 0.95 }),
  )
  ground.rotation.x = -Math.PI / 2
  ground.position.y = -0.02
  ground.receiveShadow = true
  scene.add(ground)
  return scene
}

/**
 * Folha de revisão de uma carta, gravada em blockout/review/<id>.jpg:
 * pose final grande + tira com 4 instantes da montagem (para pegar peça
 * flutuando, atravessando outra ou surgindo do nada). Com &raw, ignora os
 * modelos refinados do Blender.
 */
export function RenderReview({ cards, raw }: { cards: Card[]; raw: boolean }) {
  const [log, setLog] = useState<string[]>([])
  useEffect(() => {
    let alive = true
    ;(async () => {
      const FW = 960
      const FH = 600
      const SW = 240
      const SH = 150
      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true })
      renderer.setPixelRatio(1)
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      renderer.shadowMap.enabled = true
      renderer.shadowMap.type = THREE.PCFSoftShadowMap
      const pmrem = new THREE.PMREMGenerator(renderer)
      const env = pmrem.fromScene(RoomEnvironment(), 0.04).texture
      const sheet = document.createElement('canvas')
      sheet.width = FW
      sheet.height = FH + SH
      const ctx = sheet.getContext('2d')!

      for (const card of cards) {
        if (!alive) break
        let cs: CardScene | null = null
        try {
          cs = card.createScene()
          if (!raw) await applyRefined(card.meta.id, cs)
          const scene = makeStage(env)
          scene.add(cs.root)
          const p = cs.cameraHint?.position ?? [4, 3.2, 5.5]
          const t = cs.cameraHint?.target ?? [0, 1, 0]
          const shoot = (w: number, h: number) => {
            const cam = new THREE.PerspectiveCamera(38, w / h, 0.1, 200)
            cam.position.set(p[0], p[1], p[2])
            cam.lookAt(t[0], t[1], t[2])
            renderer.setSize(w, h)
            renderer.render(scene, cam)
            return renderer.domElement
          }
          const dur = sceneDuration(cs)
          ctx.fillStyle = '#10151d'
          ctx.fillRect(0, 0, sheet.width, sheet.height)
          ;[0.2, 0.4, 0.6, 0.8].forEach((f, i) => {
            poseAt(cs!, dur * f)
            ctx.drawImage(shoot(SW, SH), i * SW, FH)
            ctx.fillStyle = '#ffffffcc'
            ctx.font = '11px sans-serif'
            ctx.fillText(`${Math.round(f * 100)}%`, i * SW + 6, FH + 14)
          })
          poseAt(cs, dur)
          ctx.drawImage(shoot(FW, FH), 0, 0)
          ctx.fillStyle = '#ffffffdd'
          ctx.font = 'bold 15px sans-serif'
          ctx.fillText(`${card.meta.id}  ·  ${card.meta.fraseAlvo}`, 10, 22)
          const blob = await new Promise<Blob>((r) => sheet.toBlob((b) => r(b!), 'image/jpeg', 0.9))
          const suffix = raw ? '-raw' : ''
          const res = await fetch(`/__dev/save?path=review/${card.meta.id}${suffix}.jpg`, { method: 'POST', body: blob })
          if (!res.ok) throw new Error(await res.text())
          if (alive) setLog((l) => [...l, `OK  ${card.meta.id}`])
        } catch (e) {
          if (alive) setLog((l) => [...l, `ERRO ${card.meta.id}: ${(e as Error).message}`])
        } finally {
          if (cs) disposeScene(cs)
        }
      }
      renderer.dispose()
      if (alive) setLog((l) => [...l, 'FIM'])
    })()
    return () => {
      alive = false
    }
  }, [cards, raw])
  return <pre style={{ padding: 16, fontSize: 12 }}>{log.join('\n')}</pre>
}

async function exportCard(card: Card): Promise<string> {
  const cs = card.createScene()
  const blockout = buildBlockout(cs)
  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    new GLTFExporter().parse(
      blockout,
      (r) => resolve(r as ArrayBuffer),
      (e) => reject(e),
      { binary: true },
    )
  })
  disposeScene(cs)
  const res = await fetch(`/__dev/save?path=${card.meta.id}.glb`, { method: 'POST', body: buffer })
  if (!res.ok) throw new Error(await res.text())
  // manifesto por último: tools/headless.sh espera por ele, então quando ele
  // existe o .glb já foi gravado por inteiro
  const manifest = { id: card.meta.id, organic: card.refine?.organic ?? [], parts: cs.parts.map((p) => p.name) }
  const mres = await fetch(`/__dev/save?path=${card.meta.id}.json`, { method: 'POST', body: JSON.stringify(manifest) })
  if (!mres.ok) throw new Error(await mres.text())
  return `${card.meta.id}: ${(buffer.byteLength / 1024).toFixed(0)} KB, ${blockout.children.length} peças`
}

export function ExportBlockout({ cards }: { cards: Card[] }) {
  const [log, setLog] = useState<string[]>([])
  useEffect(() => {
    let alive = true
    ;(async () => {
      for (const card of cards) {
        try {
          const line = await exportCard(card)
          if (alive) setLog((l) => [...l, 'OK  ' + line])
        } catch (e) {
          if (alive) setLog((l) => [...l, `ERRO ${card.meta.id}: ${(e as Error).message}`])
        }
      }
      if (alive) setLog((l) => [...l, 'FIM'])
    })()
    return () => {
      alive = false
    }
  }, [cards])
  return <pre style={{ padding: 16, fontSize: 12 }}>{log.join('\n')}</pre>
}
