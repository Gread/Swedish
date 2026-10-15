"""Compara blockout vs refinado: posição do nó de cada peça e centro dos meshes.

uso: Blender -b --python tools/blender/compare.py -- a.glb b.glb
"""
import sys

import bpy
from mathutils import Vector

a, b = sys.argv[sys.argv.index("--") + 1 :][:2]


def snapshot(path):
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.import_scene.gltf(filepath=path)
    root = bpy.data.objects["blockout"]
    out = {}
    for p in root.children:
        meshes = [c for c in p.children_recursive if c.type == "MESH"]
        pts = [m.matrix_world @ Vector(c) for m in meshes for c in m.bound_box]
        center = sum(pts, Vector()) / len(pts) if pts else Vector()
        loc, rot, _ = p.matrix_world.decompose()
        out[p.name] = (loc, rot.to_euler(), center, len(meshes))
    return out


A, B = snapshot(a), snapshot(b)
for name in sorted(A):
    la, ra, ca, na = A[name]
    if name not in B:
        print(f"{name:<12} AUSENTE no refinado")
        continue
    lb, rb, cb, nb = B[name]
    print(
        f"{name:<12} nó Δ={(la - lb).length:.3f} "
        f"rotA=({ra.x:+.2f},{ra.y:+.2f},{ra.z:+.2f}) rotB=({rb.x:+.2f},{rb.y:+.2f},{rb.z:+.2f}) "
        f"centro Δ={(ca - cb).length:.3f} meshes {na}->{nb}"
    )
