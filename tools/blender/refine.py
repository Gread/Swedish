"""Refina o blockout de uma carta: funde as primitivas das peças orgânicas numa
pele contínua, preserva detalhes pequenos e faz bake de oclusão ambiente.

uso:
  Blender -b --python tools/blender/refine.py -- \
      <entrada.glb> <saida.glb> --organic a,b,c [--ao] [--budget 9000]

Contrato com o runtime (src/rig/refined.ts):
  - cada peça é um nó filho de "blockout" com o MESMO nome da peça da carta;
  - a geometria está no espaço local da peça (o blockout já sai assim), então
    o refinado volta exatamente para o lugar e as animações seguem valendo;
  - peças fora de --organic passam intactas (só reagrupadas por material).
"""
import os
import sys

import bmesh
import bpy
from mathutils import Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1 :]
SRC, DST = argv[0], argv[1]
ORGANIC = set()
AO = "--ao" in argv
BUDGET = 9000
if "--organic" in argv:
    ORGANIC = {s for s in argv[argv.index("--organic") + 1].split(",") if s}
if "--budget" in argv:
    BUDGET = int(argv[argv.index("--budget") + 1])

# fração do volume da peça abaixo da qual um mesh é "detalhe" (olho, botão,
# dente): fica nítido por cima da pele em vez de ser fundido nela
DETAIL_FRACTION = 0.004


def log(*a):
    print("[refine]", *a, flush=True)


def bbox_world(obj):
    return [obj.matrix_world @ Vector(c) for c in obj.bound_box]


def bbox_volume(points):
    xs, ys, zs = zip(*((p.x, p.y, p.z) for p in points))
    return max(1e-9, (max(xs) - min(xs)) * (max(ys) - min(ys)) * (max(zs) - min(zs)))


def bbox_diag(points):
    xs, ys, zs = zip(*((p.x, p.y, p.z) for p in points))
    return (Vector((max(xs), max(ys), max(zs))) - Vector((min(xs), min(ys), min(zs)))).length


def is_open(obj):
    """Malha com bordas soltas (não fecha volume). Vértices coincidentes das
    primitivas do three (costuras de UV) são soldados antes de testar."""
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-5)
    open_ = any(e.is_boundary for e in bm.edges)
    bm.free()
    return open_


def select_only(objs, active=None):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active or objs[0]


def join(objs):
    """Junta cópias dos objetos num só, preservando slots de material."""
    copies = []
    for o in objs:
        c = o.copy()
        c.data = o.data.copy()
        bpy.context.collection.objects.link(c)
        copies.append(c)
    select_only(copies)
    # Solta do pai ANTES de aplicar: transform_apply num filho só aplica o
    # transform local, e a geometria ficaria no espaço da peça — o inverso da
    # peça aplicado depois a deslocaria em dobro (bug visto em peças giradas).
    bpy.ops.object.parent_clear(type="CLEAR_KEEP_TRANSFORM")
    if len(copies) > 1:
        bpy.ops.object.join()
    joined = bpy.context.view_layer.objects.active
    # aplica transformações: a geometria passa a ficar no espaço do mundo
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    return joined


def transfer_materials(skin, src):
    """Cada face da pele herda o material da face mais próxima da fonte."""
    skin.data.materials.clear()
    for slot in src.material_slots:
        skin.data.materials.append(slot.material)
    depsgraph = bpy.context.evaluated_depsgraph_get()
    bvh = BVHTree.FromObject(src, depsgraph)
    src_polys = src.data.polygons
    for poly in skin.data.polygons:
        hit = bvh.find_nearest(poly.center)
        if hit[2] is not None:
            poly.material_index = src_polys[hit[2]].material_index


def refine_organic(part, meshes):
    pts = [p for m in meshes for p in bbox_world(m)]
    part_vol = bbox_volume(pts)
    diag = bbox_diag(pts)

    # Detalhe = pequeno OU aberto. Malha aberta (tubo de cauda, cone sem
    # tampa, plano) não tem volume: o remesh por voxel a faria sumir.
    detail = [
        m for m in meshes
        if bbox_volume(bbox_world(m)) < part_vol * DETAIL_FRACTION or is_open(m)
    ]
    body = [m for m in meshes if m not in detail]
    if not body:  # peça feita só de miudezas: nada a fundir
        return None

    src = join(body)
    skin = src.copy()
    skin.data = src.data.copy()
    bpy.context.collection.objects.link(skin)

    voxel = max(0.006, min(0.03, diag / 170))
    rm = skin.modifiers.new("remesh", "REMESH")
    rm.mode = "VOXEL"
    rm.voxel_size = voxel
    rm.adaptivity = 0.0
    select_only([skin])
    bpy.ops.object.modifier_apply(modifier=rm.name)

    # suaviza o serrilhado do voxel sem encolher o volume
    cs = skin.modifiers.new("smooth", "CORRECTIVE_SMOOTH")
    cs.iterations = 6
    cs.factor = 0.6
    cs.use_only_smooth = True
    bpy.ops.object.modifier_apply(modifier=cs.name)

    # Relevo "esculpido": ruído de baixa frequência deslocando a superfície ao
    # longo da normal. É o que tira a cara de primitiva lisa — a forma ganha
    # ondulações como argila modelada à mão. Amplitude proporcional à peça.
    tex = bpy.data.textures.new(f"{part.name}_sculpt", type="CLOUDS")
    tex.noise_scale = diag * 0.18
    tex.noise_depth = 2
    disp = skin.modifiers.new("sculpt", "DISPLACE")
    disp.texture = tex
    disp.strength = diag * 0.012
    disp.mid_level = 0.5
    disp.texture_coords = "GLOBAL"
    bpy.ops.object.modifier_apply(modifier=disp.name)

    transfer_materials(skin, src)

    tris = sum(len(p.vertices) - 2 for p in skin.data.polygons)
    if tris > BUDGET:
        dec = skin.modifiers.new("decimate", "DECIMATE")
        dec.ratio = BUDGET / tris
        dec.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=dec.name)

    bpy.ops.object.shade_smooth()

    # UV por projeção em caixa, normalizada para 0..1 no tamanho da peça —
    # a mesma convenção das primitivas do app, para os mapas procedurais de
    # microrrelevo/brilho (src/rig/textures.ts) voltarem a funcionar na pele.
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=max(diag, 1e-3), scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")

    bpy.data.objects.remove(src, do_unlink=True)

    # detalhes: cópias intactas, também no espaço do mundo
    keep = [join([d]) for d in detail]
    log(
        f"  {part.name}: {len(body)} primitivas fundidas (voxel {voxel:.4f}), "
        f"{len(detail)} detalhes nítidos, "
        f"{sum(len(p.vertices) - 2 for p in skin.data.polygons)} tris na pele"
    )
    return [skin] + keep


def bake_ao(objs):
    """Bake de oclusão ambiente em atributo de cor (vira COLOR_0 no glTF)."""
    scene = bpy.context.scene
    scene.render.engine = "CYCLES"
    scene.cycles.samples = 64
    scene.cycles.device = "CPU"
    if os.environ.get("REFINE_CPU"):  # repescagem do refine.sh após crash na GPU
        log("dispositivo de bake: CPU (forçado)")
        return bake_groups(objs)
    try:  # GPU (Metal no Mac) quando disponível: bake bem mais rápido
        prefs = bpy.context.preferences.addons["cycles"].preferences
        prefs.compute_device_type = "METAL"
        prefs.refresh_devices()
        if any(d.type == "METAL" for d in prefs.devices):
            for d in prefs.devices:
                d.use = True
            scene.cycles.device = "GPU"
    except Exception as e:  # noqa: BLE001
        log(f"GPU indisponível, bake em CPU ({e})")
    log(f"dispositivo de bake: {scene.cycles.device}")
    bake_groups(objs)


def bake_groups(objs):
    for o in objs:
        if not o.data.color_attributes.get("AO"):
            o.data.color_attributes.new("AO", "BYTE_COLOR", "CORNER")
        o.data.color_attributes.active_color = o.data.color_attributes["AO"]
    # Uma peça por vez, só com ela visível: a oclusão é a da própria forma
    # (dobras, axilas, sob o queixo). Com a cena inteira, sombras de OUTRAS
    # peças ficariam "pintadas" na pele e apareceriam como manchas escuras
    # durante a montagem, antes de essas peças chegarem.
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    by_part = {}
    for o in objs:
        by_part.setdefault(o.parent.name if o.parent else "", []).append(o)
    for group in by_part.values():
        for m in meshes:
            m.hide_render = m not in group
        select_only(group)
        bpy.ops.object.bake(type="AO", target="VERTEX_COLORS")
    for m in meshes:
        m.hide_render = False


# ---------------------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=SRC)
root = bpy.data.objects["blockout"]
parts = [o for o in root.children]
log(f"{len(parts)} peças; orgânicas: {sorted(ORGANIC) or 'nenhuma'}")
unknown = ORGANIC - {p.name for p in parts}
if unknown:
    log(f"AVISO: peças declaradas que não existem na carta: {sorted(unknown)}")

refined_all = []
for part in parts:
    meshes = [c for c in part.children_recursive if c.type == "MESH"]
    if part.name not in ORGANIC or not meshes:
        continue
    result = refine_organic(part, meshes)
    if not result:
        continue
    # troca os filhos da peça pelo resultado, de volta ao espaço local dela
    inv = part.matrix_world.inverted()
    for m in meshes:
        bpy.data.objects.remove(m, do_unlink=True)
    for i, o in enumerate(result):
        o.name = f"{part.name}__r{i}"
        o.parent = part
        o.matrix_parent_inverse.identity()
        o.data.transform(inv)
        o.matrix_world = part.matrix_world
        refined_all.append(o)

if AO and refined_all:
    log(f"bake de AO em {len(refined_all)} objetos…")
    bake_ao(refined_all)

# O runtime só troca peças que têm filhos "__r": as demais continuam com a
# geometria procedural do app. Elas só serviam de oclusor no bake — fora do
# arquivo final, que cai de vários MB para o tamanho das peles orgânicas.
dropped = 0
for part in parts:
    if part.name in ORGANIC:
        continue
    for m in [c for c in part.children_recursive if c.type == "MESH"]:
        bpy.data.objects.remove(m, do_unlink=True)
        dropped += 1
log(f"{dropped} meshes não orgânicos fora do arquivo final")

bpy.ops.export_scene.gltf(
    filepath=DST,
    export_format="GLB",
    export_apply=True,
    export_vertex_color="ACTIVE" if AO else "MATERIAL",
    export_all_vertex_colors=False,
    # Draco: as peles fundidas são densas; comprimido o arquivo cai ~10x
    # (o app decodifica com public/draco/, ver src/rig/refined.ts)
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=6,
    export_draco_position_quantization=14,
    export_draco_normal_quantization=10,
    export_draco_texcoord_quantization=12,
    export_draco_color_quantization=10,
)
log(f"salvo {DST}")
