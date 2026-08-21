import type * as THREE from 'three'
import type { CardScene, ChannelTarget, Sequence } from './types'
import { easings } from './easing'

export function sceneDuration(scene: CardScene): number {
  return scene.build.reduce((max, s) => Math.max(max, s.at + s.dur), 0)
}

/** Instante em que cada grupo começa a montar, em ordem crescente. */
export function groupStarts(scene: CardScene): { group: string; at: number }[] {
  const partGroup = new Map(scene.parts.map((p) => [p.name, p.group]))
  const starts = new Map<string, number>()
  for (const s of scene.build) {
    const group = partGroup.get(s.part)
    if (!group) continue
    const prev = starts.get(group)
    if (prev === undefined || s.at < prev) starts.set(group, s.at)
  }
  return [...starts.entries()]
    .map(([group, at]) => ({ group, at }))
    .sort((a, b) => a.at - b.at)
}

/**
 * Pontos de pausa do modo passo a passo: fins dos blocos contínuos de
 * animação (nenhuma peça fica congelada no meio de um movimento).
 */
export function stepTargets(scene: CardScene): number[] {
  const intervals = scene.build
    .map((s) => [s.at, s.at + s.dur] as const)
    .sort((a, b) => a[0] - b[0])
  const targets: number[] = []
  let end = -1
  for (const [a, b] of intervals) {
    if (a > end + 1e-6) {
      if (end >= 0) targets.push(end)
      end = b
    } else {
      end = Math.max(end, b)
    }
  }
  if (end >= 0) targets.push(end)
  return targets
}

/** Legenda ativa: a última caption cuja sequência já começou. */
export function captionAt(scene: CardScene, t: number): string | null {
  let best: Sequence | null = null
  for (const s of scene.build) {
    if (s.caption && s.at <= t && (!best || s.at > best.at)) best = s
  }
  return best?.caption ?? null
}

function applyChannel(object: THREE.Object3D, target: ChannelTarget, value: number) {
  const [prop, axis] = target.split('.') as ['position' | 'rotation' | 'scale', 'x' | 'y' | 'z']
  object[prop][axis] = value
}

/**
 * Posiciona todas as peças no instante t do clip de montagem.
 * Antes da primeira sequência de um canal, a peça fica no `from` dela;
 * entre sequências do mesmo canal, segura o `to` da anterior.
 * Peças sem sequência ficam sempre visíveis na pose de construção.
 */
export function poseAt(scene: CardScene, t: number) {
  const byPart = new Map<string, Sequence[]>()
  for (const s of scene.build) {
    const list = byPart.get(s.part)
    if (list) list.push(s)
    else byPart.set(s.part, [s])
  }

  for (const part of scene.parts) {
    const seqs = byPart.get(part.name)
    if (!seqs || seqs.length === 0) {
      part.object.visible = true
      continue
    }
    seqs.sort((a, b) => a.at - b.at)
    part.object.visible = t >= seqs[0].at

    for (const s of seqs) {
      const ease = easings[s.ease ?? 'easeInOut']
      for (const c of s.channels) {
        if (t <= s.at) {
          // só define o from se nenhuma sequência anterior já posicionou este canal
          const earlier = seqs.some(
            (other) => other !== s && other.at < s.at &&
              other.channels.some((oc) => oc.target === c.target),
          )
          if (!earlier) applyChannel(part.object, c.target, c.from)
        } else if (t >= s.at + s.dur) {
          applyChannel(part.object, c.target, c.to)
        } else {
          const k = ease((t - s.at) / s.dur)
          applyChannel(part.object, c.target, c.from + (c.to - c.from) * k)
        }
      }
    }
  }
}

/** Aplica opacidade global (0..1) a todos os materiais da cena. */
export function setSceneOpacity(scene: CardScene, opacity: number) {
  scene.root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) {
      mat.transparent = opacity < 1
      mat.opacity = opacity
      mat.depthWrite = opacity >= 0.5
    }
  })
}

export function disposeScene(scene: CardScene) {
  scene.root.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    if (!mesh.isMesh) return
    mesh.geometry?.dispose()
    const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material]
    for (const mat of materials) mat.dispose()
  })
}
