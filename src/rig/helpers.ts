import * as THREE from 'three'
import type { Channel, ChannelTarget, Ease, Sequence } from './types'

export function ch(target: ChannelTarget, from: number, to: number): Channel {
  return { target, from, to }
}

export function seq(
  name: string,
  part: string,
  at: number,
  dur: number,
  channels: Channel[],
  extra?: { ease?: Ease; caption?: string },
): Sequence {
  return { name, part, at, dur, channels, ...extra }
}

/** Sobe do subsolo até y final — o movimento padrão de "brotar do chão". */
export function riseFrom(finalY: number, depth = 1.2): Channel {
  return ch('position.y', finalY - depth, finalY)
}

export function mat(color: string | number, opts?: { emissive?: string | number; flat?: boolean }) {
  return new THREE.MeshStandardMaterial({
    color,
    roughness: 0.65,
    metalness: 0.05,
    flatShading: opts?.flat ?? false,
    emissive: opts?.emissive ?? 0x000000,
    emissiveIntensity: opts?.emissive ? 0.6 : 0,
  })
}

export function box(w: number, h: number, d: number, color: string | number) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color))
}

export function cylinder(rTop: number, rBottom: number, h: number, color: string | number, segments = 24) {
  return new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, h, segments), mat(color))
}

export function sphere(r: number, color: string | number, segments = 24) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, segments, segments), mat(color))
}

export function cone(r: number, h: number, color: string | number, segments = 24) {
  return new THREE.Mesh(new THREE.ConeGeometry(r, h, segments), mat(color))
}

export function torus(r: number, tube: number, color: string | number) {
  return new THREE.Mesh(new THREE.TorusGeometry(r, tube, 16, 40), mat(color))
}
