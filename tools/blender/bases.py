"""Esculpe as peças-base do personagem padrão (person() em src/rig/helpers.ts)
e exporta para public/assets/bases.glb.

uso: Blender -b --python tools/blender/bases.py -- public/assets/bases.glb [preview.png]

Contrato com person(): cada peça é exportada nas MESMAS dimensões que as
primitivas que ela substitui, para altura de personagem = 1 (person() escala
pela altura). Assim chapéus, óculos, barbas e braços reposicionados nas 39
cartas continuam encaixando sem mudar nada nelas.

  base_head  substitui sphere(headR)                headR = 0.19, centro na origem
  base_body  substitui capsule(bodyR, bodyH-2bodyR) bodyR = 0.17, bodyH = 0.52, centro na origem
  base_arm   substitui capsule(armR, armLen)        armR = 0.0646, armLen = 0.26, centro na origem
  base_hand  substitui sphere(handR)                handR = 0.068, centro na origem

Técnica: primitivas que se SOBREPÕEM de propósito, fundidas por voxel remesh
(união orgânica, sem emenda), booleana para escavar (órbitas, barra da camisa,
separação das pernas) e suavização. Determinístico: o que se posiciona é o que
sai — ao contrário de metaballs, que dependem de calibrar campos de influência.

Eixos: o glTF converte o Blender (Z para cima, -Y para frente) no three.js
(Y para cima, +Z para frente). Aqui "frente" = -Y e "cima" = +Z.
"""
import math
import sys

import bpy
from mathutils import Matrix, Vector

argv = sys.argv[sys.argv.index("--") + 1 :]
OUT = argv[0]
PREVIEW = argv[1] if len(argv) > 1 else None

HEAD_R = 0.19
BODY_R = 0.17
BODY_H = 0.52
ARM_R = BODY_R * 0.38
ARM_LEN = BODY_H * 0.5
HAND_R = BODY_R * 0.4


def log(*a):
    print("[bases]", *a, flush=True)


bpy.ops.wm.read_factory_settings(use_empty=True)


# ---------------------------------------------------------------- primitivas
def ellipsoid(center, scale, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(radius=1, segments=48, ring_count=24, location=center, rotation=rot)
    o = bpy.context.active_object
    o.scale = scale
    return o


def capsule(radius, length, center=(0, 0, 0), rot=(0, 0, 0), r_top=None):
    """Cápsula ao longo de Z (opcionalmente afunilada: r_top ≠ radius)."""
    r_top = radius if r_top is None else r_top
    parts = []
    bpy.ops.mesh.primitive_cone_add(vertices=48, radius1=radius, radius2=r_top, depth=length, location=(0, 0, 0))
    parts.append(bpy.context.active_object)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=radius, segments=48, ring_count=24, location=(0, 0, -length / 2))
    parts.append(bpy.context.active_object)
    bpy.ops.mesh.primitive_uv_sphere_add(radius=r_top, segments=48, ring_count=24, location=(0, 0, length / 2))
    parts.append(bpy.context.active_object)
    o = join(parts)
    o.rotation_euler = rot
    o.location = center
    return o


def torus(major, minor, center, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=major, minor_radius=minor, major_segments=64, minor_segments=16, location=center, rotation=rot)
    return bpy.context.active_object


def box(size, center):
    bpy.ops.mesh.primitive_cube_add(size=1, location=center)
    o = bpy.context.active_object
    o.scale = size
    return o


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def join(objs):
    select_only(objs)
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if len(objs) > 1:
        bpy.ops.object.join()
    return bpy.context.view_layer.objects.active


def remesh(o, voxel):
    select_only([o])
    m = o.modifiers.new("remesh", "REMESH")
    m.mode = "VOXEL"
    m.voxel_size = voxel
    bpy.ops.object.modifier_apply(modifier=m.name)


def carve(o, cutters):
    """Subtrai os cortadores (booleana exata) e os descarta."""
    select_only([o])
    for c in cutters:
        b = o.modifiers.new("carve", "BOOLEAN")
        b.operation = "DIFFERENCE"
        b.solver = "EXACT"
        b.object = c
        bpy.ops.object.modifier_apply(modifier=b.name)
        bpy.data.objects.remove(c, do_unlink=True)


def smooth(o, iterations=10, factor=0.5):
    select_only([o])
    m = o.modifiers.new("smooth", "CORRECTIVE_SMOOTH")
    m.iterations = iterations
    m.factor = factor
    m.use_only_smooth = True
    bpy.ops.object.modifier_apply(modifier=m.name)


def bbox(o):
    pts = [o.matrix_world @ Vector(c) for c in o.bound_box]
    lo = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
    hi = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return lo, hi


def sculpt(name, positives, negatives, voxel, fit_axis, fit_size, budget):
    """União por remesh → escavação → remesh fino → suavização → normaliza."""
    o = join(positives)
    remesh(o, voxel)
    if negatives:
        carve(o, negatives)
        remesh(o, voxel * 0.8)
    smooth(o, iterations=12, factor=0.55)

    lo, hi = bbox(o)
    s = fit_size / max(1e-9, (hi - lo)["xyz".index(fit_axis)])
    select_only([o])
    o.scale = (s, s, s)
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    lo, hi = bbox(o)
    o.data.transform(Matrix.Translation(-(lo + hi) / 2))

    tris = sum(len(p.vertices) - 2 for p in o.data.polygons)
    if tris > budget:
        d = o.modifiers.new("decimate", "DECIMATE")
        d.ratio = budget / tris
        d.use_collapse_triangulate = True
        bpy.ops.object.modifier_apply(modifier=d.name)
    bpy.ops.object.shade_smooth()

    lo, hi = bbox(o)
    bpy.ops.object.mode_set(mode="EDIT")
    bpy.ops.mesh.select_all(action="SELECT")
    bpy.ops.uv.cube_project(cube_size=max((hi - lo).length, 1e-3), scale_to_bounds=False)
    bpy.ops.object.mode_set(mode="OBJECT")
    o.name = o.data.name = name
    dims = tuple(round(v, 3) for v in (hi - lo))
    log(f"{name}: {sum(len(p.vertices) - 2 for p in o.data.polygons)} tris, dims {dims}")
    return o


# ---------------------------------------------------------------- cabeça
# Unidade: raio da cabeça = 1. Olhos do person() ficam em (±0.38, -0.82, 0.12).
head = sculpt(
    "base_head",
    positives=[
        ellipsoid((0, 0, 0), (0.97, 1.0, 1.0)),  # crânio
        ellipsoid((0, -0.25, -0.42), (0.8, 0.76, 0.6)),  # bochechas e mandíbula
        ellipsoid((0, -0.99, -0.08), (0.14, 0.17, 0.19)),  # nariz
        ellipsoid((0, -0.87, 0.34), (0.52, 0.15, 0.11)),  # arco das sobrancelhas
        ellipsoid((-0.96, 0.05, 0.0), (0.13, 0.21, 0.27)),  # orelha esq.
        ellipsoid((0.96, 0.05, 0.0), (0.13, 0.21, 0.27)),  # orelha dir.
        ellipsoid((0, -0.7, -0.66), (0.3, 0.22, 0.2)),  # queixo
    ],
    negatives=[
        ellipsoid((-0.38, -1.0, 0.14), (0.23, 0.2, 0.21)),  # órbita esq.
        ellipsoid((0.38, -1.0, 0.14), (0.23, 0.2, 0.21)),  # órbita dir.
    ],
    voxel=0.018,
    fit_axis="z",
    fit_size=HEAD_R * 2,
    budget=5000,
)

# ---------------------------------------------------------------- corpo
# Unidade: raio do corpo = 1; altura total h ≈ 3.06. Mesma silhueta de
# cápsula, com ombros, pés à frente, sulco entre as pernas e barra da camisa.
h = BODY_H / BODY_R
half = h / 2
body = sculpt(
    "base_body",
    positives=[
        capsule(1.0, h - 2.0),
        ellipsoid((-0.6, 0, half - 0.78), (0.62, 0.62, 0.48)),  # ombro esq.
        ellipsoid((0.6, 0, half - 0.78), (0.62, 0.62, 0.48)),  # ombro dir.
        ellipsoid((-0.42, -0.42, -half + 0.26), (0.36, 0.62, 0.26)),  # pé esq.
        ellipsoid((0.42, -0.42, -half + 0.26), (0.36, 0.62, 0.26)),  # pé dir.
    ],
    negatives=[
        box((0.14, 0.9, 1.1), (0, -0.85, -half + 0.45)),  # separação das pernas (frente)
        box((0.14, 0.9, 1.1), (0, 0.85, -half + 0.45)),  # separação das pernas (trás)
        torus(1.0, 0.07, (0, 0, -0.18)),  # barra da camisa
    ],
    voxel=0.03,
    fit_axis="z",
    fit_size=BODY_H,
    budget=6000,
)

# ---------------------------------------------------------------- braço
# Unidade: raio do braço = 1. Afunila do ombro ao punho, cotovelo e punho de manga.
al = ARM_LEN / ARM_R  # comprimento do tronco cilíndrico em raios (≈4.03)
arm = sculpt(
    "base_arm",
    positives=[
        capsule(0.86, al, r_top=1.08),  # afunilado: grosso em cima (ombro)
        ellipsoid((0, 0.06, -0.15), (0.97, 0.97, 0.9)),  # cotovelo
        torus(0.84, 0.16, (0, 0, -al / 2 + 0.55)),  # punho da manga
    ],
    negatives=[],
    voxel=0.06,
    fit_axis="z",
    fit_size=ARM_LEN + 2 * ARM_R,
    budget=2500,
)

# ---------------------------------------------------------------- mão
# Unidade: raio da mão = 1. Luva: palma fina em X (vira para o corpo), dedos
# juntos, polegar à frente (-Y) — serve para mão esquerda e direita.
hand = sculpt(
    "base_hand",
    positives=[
        ellipsoid((0, 0, -0.15), (0.55, 0.88, 1.05)),  # palma + dedos
        capsule(0.26, 0.55, center=(0, -0.72, 0.15), rot=(math.radians(55), 0, 0)),  # polegar
        ellipsoid((0, 0, 0.78), (0.5, 0.62, 0.42)),  # pulso
    ],
    negatives=[
        box((0.7, 0.03, 0.5), (0, -0.28, -0.75)),  # vão entre os dedos
        box((0.7, 0.03, 0.5), (0, 0.28, -0.75)),
    ],
    voxel=0.05,
    fit_axis="z",
    fit_size=HAND_R * 2.3,
    budget=1800,
)

# ---------------------------------------------------------------- export
objs = [head, body, arm, hand]
mat = bpy.data.materials.new("base")
for o in objs:
    o.data.materials.clear()
    o.data.materials.append(mat)
select_only(objs)
bpy.ops.export_scene.gltf(filepath=OUT, export_format="GLB", use_selection=True, export_apply=True)
log(f"salvo {OUT}")

# ---------------------------------------------------------------- prévia
if PREVIEW:
    # personagem montado como no person() (altura 1, braços abertos 0.5 rad)
    head.location = (0, 0, BODY_H + HEAD_R * 0.85)
    body.location = (0, 0, BODY_H / 2)
    for side in (-1, 1):
        a = arm if side > 0 else arm.copy()
        if side < 0:
            bpy.context.collection.objects.link(a)
        a.location = (side * BODY_R * 1.15, 0, BODY_H * 0.62)
        a.rotation_euler = (0, side * 0.5, 0)
        hd = hand if side > 0 else hand.copy()
        if side < 0:
            bpy.context.collection.objects.link(hd)
        # mão: filha do braço, a -bodyH*0.32 no eixo do braço
        hd.location = a.location + (a.rotation_euler.to_matrix() @ Vector((0, 0, -BODY_H * 0.32)))
        hd.rotation_euler = a.rotation_euler
    for e in (-1, 1):  # olhos como o person() (esclera + pupila)
        for r, y, col in ((0.22, -0.82, 1.0), (0.1, -0.97, 0.05)):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=HEAD_R * r, location=(e * HEAD_R * 0.38, HEAD_R * y, BODY_H + HEAD_R * 0.85 + HEAD_R * 0.12))
            eye = bpy.context.active_object
            eye.scale.y = 0.6 if r > 0.15 else 1.0
            m = bpy.data.materials.new(f"eye{col}")
            m.diffuse_color = (col, col, col, 1)
            eye.data.materials.append(m)
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_WORKBENCH"
    scene.display.shading.light = "STUDIO"
    scene.display.shading.color_type = "MATERIAL"
    scene.display.shading.show_cavity = True
    mat.diffuse_color = (0.86, 0.7, 0.58, 1)
    scene.render.resolution_x = 1000
    scene.render.resolution_y = 700
    cam = bpy.data.objects.new("cam", bpy.data.cameras.new("cam"))
    bpy.context.collection.objects.link(cam)
    cam.data.lens = 60
    cam.location = (0.62, -1.55, 0.78)
    cam.rotation_euler = (Vector((0, 0, 0.47)) - cam.location).to_track_quat("-Z", "Y").to_euler()
    scene.camera = cam
    scene.render.filepath = PREVIEW
    bpy.ops.render.render(write_still=True)
    log(f"prévia {PREVIEW}")
