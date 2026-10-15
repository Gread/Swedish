"""Lista as peças de um blockout .glb: nº de meshes, triângulos e materiais.

uso: Blender -b --python tools/blender/inspect.py -- blockout/<id>.glb
"""
import sys

import bpy

path = sys.argv[sys.argv.index("--") + 1]
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=path)

root = bpy.data.objects.get("blockout")
parts = [o for o in bpy.data.objects if o.parent == root] if root else []
total = 0
for p in parts:
    meshes = [c for c in p.children_recursive if c.type == "MESH"]
    tris = sum(sum(len(poly.vertices) - 2 for poly in m.data.polygons) for m in meshes)
    mats = {s.material.name for m in meshes for s in m.material_slots if s.material}
    total += tris
    print(f"PART {p.name:<28} meshes={len(meshes):>3} tris={tris:>7} mats={len(mats)}")
print(f"TOTAL parts={len(parts)} tris={total}")
