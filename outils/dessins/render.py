"""Rendu réaliste d'une pose (Blender / Cycles), studio sombre aux tons cuivre.
Usage : python3 render.py <pose> <sortie.png> [vue] [échantillons] [largeur] [hauteur]"""
import sys, os, math
import numpy as np
import bpy
from mathutils import Vector
from bpy_extras.object_utils import world_to_camera_view

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from mh import Human, Mesh, athlete, D
from poses3d import Poser, POSES, nz
import exos  # noqa: F401 — enregistre tous les exercices de Cap (POSES[slug], t = n° d'image)

DATA = D + 'public/data/'
args = sys.argv[1:]
pose_name = args[0] if len(args) > 0 else 'lateral'
out = args[1] if len(args) > 1 else f'/tmp/{pose_name}.png'
view = args[2] if len(args) > 2 else 'auto'
samples = int(args[3]) if len(args) > 3 else 96
W = int(args[4]) if len(args) > 4 else 1000
Hh = int(args[5]) if len(args) > 5 else 700

# ——— le corps posé ———
STYLE = os.environ.get('STYLE', 'photo')
h = Human()
h.morph(athlete(muscle=float(os.environ.get('MUSCLE', 1.0)), weight=float(os.environ.get('WEIGHT', 0.45 if STYLE == 'photo' else 0.3))))
P = Poser(h)
spec = POSES[pose_name]
if callable(spec): spec = spec(P, float(os.environ.get('T', 1.0)))
G, L, T = P.solve(spec)
V = h.pose(G, L, T)
Rhead = h.Rw['head']


def to_b(v):  # MakeHuman (y en haut, z devant) → Blender (z en haut, le perso regarde vers -y)
    v = np.asarray(v)
    return np.c_[v[:, 0], -v[:, 2], v[:, 1]]


def clip(polys, s, thr):
    """Garde la partie des polygones où s < thr ; coupe net le long de s = thr.
    Un point est un sommet d'origine (entier) ou un mélange ('mix', p, q, t)."""
    def val(p):
        if isinstance(p, (int, np.integer)): return s[p]
        _, a, b, t = p
        return (1 - t) * val(a) + t * val(b)
    res = []
    for f in polys:
        poly = []
        n = len(f)
        for k in range(n):
            a, b = f[k], f[(k + 1) % n]
            va, vb = val(a), val(b)
            if va < thr: poly.append(a)
            if (va < thr) != (vb < thr):
                t = (thr - va) / (vb - va)
                if repr(b) < repr(a): a, b, t = b, a, 1 - t
                poly.append(('mix', a, b, round(float(t), 6)))
        if len(poly) >= 3: res.append(poly)
    return res


def resolve(polys, Vp):
    """Polygones (sommets d'origine ou mélanges) → sommets et faces."""
    verts, index, faces = [], {}, []
    def pos(p):
        if isinstance(p, (int, np.integer)): return Vp[p]
        _, a, b, t = p
        return (1 - t) * pos(a) + t * pos(b)
    for poly in polys:
        f = []
        for p in poly:
            key = p if isinstance(p, (int, np.integer)) else repr(p)
            if key not in index:
                index[key] = len(verts); verts.append(pos(p))
            f.append(index[key])
        faces.append(f)
    return np.array(verts), faces


body = h.body
names = body.mats
keep_body = [i for i, m in enumerate(body.fmat) if names[m] == 'body']
# baskets : le pied caché dans la chaussure est retiré (rien ne dépasse du cuir)
SHOES = os.environ.get('SHOES', 'shoes06')
shoe_pm = Mesh(DATA + f'proxies/clothes/{SHOES}/{SHOES}.json') if SHOES else None
if shoe_pm is not None and shoe_pm.delete is not None:
    keep_body = [i for i in keep_body if not shoe_pm.delete[body.faces[i]].all()]
scene_pts = []


def new_mesh(name, verts_b, faces, uvflat=None, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts_b.tolist(), [], faces)
    if uvflat is not None:
        layer = me.uv_layers.new(name='UV')
        layer.data.foreach_set('uv', np.asarray(uvflat, dtype=np.float32).ravel())
    me.update()
    me.polygons.foreach_set('use_smooth', [smooth] * len(me.polygons))
    ob = bpy.data.objects.new(name, me)
    bpy.context.collection.objects.link(ob)
    scene_pts.append(verts_b)
    return ob


def mesh_from(name, verts, faces, uv=None, fuv=None):
    used = sorted({j for f in faces for j in f})
    remap = {j: k for k, j in enumerate(used)}
    flat = None
    if uv is not None and fuv is not None and all(u is not None for u in fuv):
        flat = np.array([uv[k] for fu in fuv for k in fu])
    return new_mesh(name, to_b(verts[used]), [[remap[j] for j in f] for f in faces], flat)


def subsurf(ob, lv=1):
    m = ob.modifiers.new('sub', 'SUBSURF'); m.levels = lv; m.render_levels = lv


def principled(name, color=(0.8, 0.8, 0.8, 1), rough=0.5, **kw):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = color
    b.inputs['Roughness'].default_value = rough
    for k, v in kw.items(): b.inputs[k].default_value = v
    return m, nt, b


def image(nt, path):
    t = nt.nodes.new('ShaderNodeTexImage'); t.image = bpy.data.images.load(path); return t


bpy.ops.wm.read_factory_settings(use_empty=True)
try:
    bpy.ops.preferences.addon_enable(module='cycles')
except Exception:
    pass

# ——— peau : texture hâlée, diffusion sous la surface, grain fin ———
skin, nt, b = principled('skin', rough=0.47)
t = image(nt, DATA + 'skins/young_caucasian_male/textures/young_lightskinned_male_diffuse.png')
mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'
mix.inputs['Factor'].default_value = 0.5
mix.inputs['B'].default_value = (0.9, 0.66, 0.5, 1)
nt.links.new(t.outputs['Color'], mix.inputs['A'])
nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
b.inputs['Subsurface Weight'].default_value = 0.2
b.inputs['Subsurface Radius'].default_value = (1.0, 0.4, 0.25)
b.inputs['Subsurface Scale'].default_value = 0.06
b.inputs['Specular IOR Level'].default_value = 0.42
grain = nt.nodes.new('ShaderNodeTexNoise'); grain.inputs['Scale'].default_value = 900; grain.inputs['Detail'].default_value = 4
bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = 0.05; bump.inputs['Distance'].default_value = 0.004
nt.links.new(grain.outputs['Fac'], bump.inputs['Height']); nt.links.new(bump.outputs['Normal'], b.inputs['Normal'])


# ——— short de sport noir : le collant d'aide, coupé net à la taille et à mi-cuisse ———
tights = [body.faces[i] for i, m in enumerate(body.fmat) if names[m] == 'helper-tights']
Vr = h.V
# pas les bras : on écarte les faces dont un sommet suit surtout un os du bras
arm_b = np.array([any(k in b_ for k in ('arm', 'wrist', 'finger', 'metacarpal', 'shoulder', 'clavicle')) for b_ in h.bones])
main_b = h.skin_b[np.arange(h.nv), h.sw.argmax(1)]
on_arm = arm_b[main_b]
region = [f for f in tights if not on_arm[f].any()]
waist = h.head['upperleg01.L'][1] + 0.95
polys = clip(region, Vr[:, 1], waist)
# ourlet : perpendiculaire à chaque cuisse, à 45 % de sa longueur
hemv = np.zeros(len(Vr))
for s, sg in (('L', 1), ('R', -1)):
    hip, knee = h.head[f'upperleg01.{s}'], h.head[f'lowerleg01.{s}']
    ax = nz(knee - hip)
    side = (Vr[:, 0] * sg) > 0
    hemv[side] = ((Vr[side] - hip) @ ax) / np.linalg.norm(knee - hip)
hemv[np.abs(Vr[:, 0]) < 1e-6] = 0
polys = clip(polys, hemv, 0.45)
sv, sf = resolve(polys, V)
# la peau sous le short ne sert à rien (et peut percer le tissu) : on la retire
under = (Vr[:, 1] < waist - 0.2) & (hemv < 0.45 - 0.08) & ~on_arm
keep_body = [i for i in keep_body if not under[body.faces[i]].all()]
ob_body = mesh_from('body', V, [body.faces[i] for i in keep_body], body.uv, [body.fuv[i] for i in keep_body])
ob_body.data.materials.append(skin); subsurf(ob_body, 2)
SCULPT = float(os.environ.get('SCULPT', 0))
if SCULPT:
    from sculpt import height
    ob_rest = mesh_from('rest', h.V, [body.faces[i] for i in keep_body]); scene_pts.pop()
    SUB = int(os.environ.get('SUBDIV', 2))
    for ob_ in (ob_body, ob_rest):
        for m_ in list(ob_.modifiers): ob_.modifiers.remove(m_)
        subsurf(ob_, SUB)
    dg = bpy.context.evaluated_depsgraph_get()
    mp = bpy.data.meshes.new_from_object(ob_body.evaluated_get(dg))
    mr = bpy.data.meshes.new_from_object(ob_rest.evaluated_get(dg))
    def arr(coll, attr, n):
        a = np.zeros(n * 3); coll.foreach_get(attr, a); return a.reshape(-1, 3)
    n_ = len(mp.vertices)
    Pp, Pr = arr(mp.vertices, 'co', n_), arr(mr.vertices, 'co', n_)
    Np, Nr_ = arr(mp.vertex_normals, 'vector', n_), arr(mr.vertex_normals, 'vector', n_)
    Rm = np.c_[Pr[:, 0], Pr[:, 2], -Pr[:, 1]]; Nm = np.c_[Nr_[:, 0], Nr_[:, 2], -Nr_[:, 1]]
    # os principal de chaque sommet subdivisé : celui du sommet d'origine le plus proche
    from scipy.spatial import cKDTree
    from sculpt import limbs
    used_v = np.array(sorted({j for i in keep_body for j in body.faces[i]}))
    main_b = np.array(h.bones)[h.skin_b[used_v, h.sw[used_v].argmax(1)]]
    _, near = cKDTree(h.V[used_v]).query(Rm)
    from sculpt import extra, phase_field
    bone_n = main_b[near]
    Pp += Np * (height(Rm, Nm, SCULPT) + limbs(Rm, bone_n, h, SCULPT) + extra(Rm, Nm, bone_n, h, SCULPT))[:, None]
    mp.vertices.foreach_set('co', Pp.ravel()); mp.update()
    # hachures en anneaux : un champ qui suit le corps (passe « phase »)
    ph = phase_field(Rm, bone_n, h)
    at = mp.attributes.new('phase', 'FLOAT', 'POINT'); at.data.foreach_set('value', ((ph + 10) / 20).astype(np.float32))
    from muscles import fiber_field
    fb = fiber_field(Rm, bone_n, h)
    at = mp.attributes.new('fiber', 'FLOAT', 'POINT'); at.data.foreach_set('value', ((fb + 10) / 20).astype(np.float32))
    # muscles travaillés : un poids 0…1 par sommet (passe « focus », peinte en rouge au dessin)
    if spec.get('focus'):
        from muscles import mask as muscle_mask
        fw = muscle_mask(Rm, Nm, main_b[near], h, spec['focus'])
        # points d'accroche des étiquettes : le centre de chaque muscle, de chaque côté
        ANCH = {}
        for g_ in spec['focus']:
            sides_ = [g_] if g_[-2:] in ('_L', '_R') else [g_ + '_L', g_ + '_R']
            for gs in sides_:
                w_ = muscle_mask(Rm, Nm, main_b[near], h, [gs])
                if w_.sum() > 1:
                    ANCH[gs] = ((Pp * w_[:, None]).sum(0) / w_.sum(), (Np * w_[:, None]).sum(0) / w_.sum())
        at = mp.attributes.new('focus', 'FLOAT', 'POINT'); at.data.foreach_set('value', fw.astype(np.float32))
    for ob_ in (ob_body, ob_rest): bpy.data.objects.remove(ob_)
    ob_body = bpy.data.objects.new('body', mp); bpy.context.collection.objects.link(ob_body)
    ob_body.data.polygons.foreach_set('use_smooth', [True] * len(ob_body.data.polygons))
cloth, nt, b = principled('shorts', color=(0.03, 0.028, 0.027, 1), rough=0.75, **{'Sheen Weight': 0.5, 'Sheen Tint': (0.55, 0.5, 0.46, 1)})
ob_sh = new_mesh('shorts', to_b(sv), sf)
ob_sh.data.materials.append(cloth)
sol = ob_sh.modifiers.new('epaisseur', 'SOLIDIFY'); sol.thickness = 0.05; sol.offset = 1
subsurf(ob_sh, 2)

# ——— tête : yeux, sourcils, cheveux courts ———
def proxy(path, name, mat):
    pm = Mesh(DATA + 'proxies/' + path)
    pv = h.fit(pm)
    ob = mesh_from(name, pv, pm.faces, pm.uv, pm.fuv)
    ob.data.materials.append(mat)
    return ob


eye_m, nt, b = principled('eyes', rough=0.12, **{'Coat Weight': 1.0})
nt.links.new(image(nt, DATA + 'proxies/eyes/HighPolyEyes/textures/brown_eye.png').outputs['Color'], b.inputs['Base Color'])
proxy('eyes/HighPolyEyes/HighPolyEyes.json', 'eyes', eye_m)
brow_m, nt, b = principled('brows', color=(0.025, 0.017, 0.012, 1), rough=0.6)
nt.links.new(image(nt, DATA + 'proxies/eyebrows/eyebrow001/textures/eyebrow001.png').outputs['Alpha'], b.inputs['Alpha'])
proxy('eyebrows/eyebrow001/eyebrow001.json', 'brows', brow_m)
hair_m, nt, b = principled('hair', color=(0.022, 0.014, 0.01, 1), rough=0.42)
nt.links.new(image(nt, DATA + 'proxies/hair/short02/textures/short02_diffuse.png').outputs['Alpha'], b.inputs['Alpha'])
proxy('hair/short02/short02.json', 'hair', hair_m)

ground0 = to_b(V[sorted({j for i in keep_body for j in body.faces[i]})])[:, 2].min()
FLOOR_B = to_b(np.array([[0, -8.72, 0]]))[0][2]
def posed(bone, p):
    return to_b(np.array([(h.M[bone] @ np.r_[p, 1])[:3]]))[0]

# ——— baskets ———
if shoe_pm is not None:
    shoe_m, nt, b = principled('shoes', color=(0.85, 0.85, 0.84, 1), rough=0.6)
    mesh_from('shoes', h.fit(shoe_pm), shoe_pm.faces).data.materials.append(shoe_m)

# ——— élastique (une boucle) : deux brins plats, de sous la basket jusque dans le poing ———
# noir, ou vert (band_color = 'vert' : teinté en vert au dessin)
GREEN = spec.get('band_color') == 'vert'
BAND = 'vband' if GREEN else 'band'
band_m, nt, b = principled('band', color=(0.05, 0.3, 0.1, 1) if GREEN else (0.02, 0.02, 0.022, 1), rough=0.45)
def ribbon(name, A, B, wdir, width=0.34, thick=0.035, mat=None):
    A, B = np.asarray(A, float), np.asarray(B, float)
    ax = nz(B - A); w = wdir - ax * (wdir @ ax); w = nz(w) * width / 2
    tn = nz(np.cross(ax, w)) * thick / 2
    vs = [A - w - tn, A + w - tn, A + w + tn, A - w + tn, B - w - tn, B + w - tn, B + w + tn, B - w + tn]
    fs = [(0, 1, 2, 3), (4, 7, 6, 5), (0, 4, 5, 1), (1, 5, 6, 2), (2, 6, 7, 3), (3, 7, 4, 0)]
    me = bpy.data.meshes.new(name); me.from_pydata([list(v) for v in vs], [], fs); me.update()
    ob = bpy.data.objects.new(name, me); bpy.context.collection.objects.link(ob); ob.data.materials.append(mat or band_m)
    return ob
def hand_of(s_):
    """Poing posé : le point serré au creux de la main, l'axe des doigts, le travers de la main."""
    wr_ = posed(f'wrist.{s_}', h.head[f'wrist.{s_}']); kn = posed(f'finger3-1.{s_}', h.head[f'finger3-1.{s_}'])
    i2 = posed(f'finger2-1.{s_}', h.head[f'finger2-1.{s_}']); i5 = posed(f'finger5-1.{s_}', h.head[f'finger5-1.{s_}'])
    hd = nz(kn - wr_); acr = nz(i2 - i5)
    palm_ = nz(np.cross(acr, hd)) * (1 if s_ == 'R' else -1)
    return wr_ + hd * 0.72 + palm_ * 0.14, hd, acr
fwd = to_b(np.array([[0, 0, 1.0]]))[0]
for s_ in spec.get('band', []):
    fh, ft = h.head[f'foot.{s_}'], h.tail[f'foot.{s_}']
    under = posed(f'foot.{s_}', fh + (ft - fh) * 0.3)
    under[2] = FLOOR_B + 0.06
    grip, hd, acr = hand_of(s_)
    for k_, off in enumerate((-0.16, 0.16)):
        ribbon(f'{BAND}{s_}{k_}', under + fwd * off * 1.6, grip + acr * off * 0.5, fwd)
# assis : l'élastique passe sous le milieu des pieds (la plante), puis va aux poings
for s_ in spec.get('band_seated', []):
    fh, ft = h.head[f'foot.{s_}'], h.tail[f'foot.{s_}']
    mid = posed(f'foot.{s_}', fh + (ft - fh) * 0.5)
    top = to_b(np.array([(h.M[f'foot.{s_}'][:3, :3] @ np.array([0, 1.0, 0]))]))[0]
    side = to_b(np.array([(h.M[f'foot.{s_}'][:3, :3] @ np.array([1.0, 0, 0]))]))[0]
    sole = mid - nz(top) * 0.62
    grip, hd, acr = hand_of(s_)
    ends = [sole + nz(side) * 0.42, sole - nz(side) * 0.42]
    ribbon(f'{BAND}{s_}s', ends[0], ends[1], nz(np.cross(side, top)))
    for k_, e_ in enumerate(ends):
        ribbon(f'{BAND}{s_}{k_}', e_, grip + acr * (0.08 if k_ == 0 else -0.08), nz(top))
# tenu entre les deux mains (passage d'épaules, écarté arrière)
if spec.get('band_hands'):
    gL, hdL, _ = hand_of('L'); gR, hdR, _ = hand_of('R')
    ribbon(f'{BAND}H', gL, gR, nz(hdL + hdR))

# ——— roue abdominale : une roue (pneu sombre, moyeu clair) et deux poignées ———
# ——— barre de traction (parc) : une barre ronde sur deux montants ———
def to_b1(p): return to_b(np.array([p]))[0]
metal_m, nt, b = principled('metal', color=(0.5, 0.5, 0.52, 1), rough=0.3, **{'Metallic': 0.9})
rubber_m, nt, b = principled('rubber', color=(0.03, 0.03, 0.03, 1), rough=0.7)
def cyl(name, A, B, r, mat, verts=40):
    A, B = np.asarray(A, float), np.asarray(B, float)
    bpy.ops.mesh.primitive_cylinder_add(vertices=verts, radius=r, depth=float(np.linalg.norm(B - A)), location=tuple((A + B) / 2))
    o = bpy.context.active_object; o.name = name
    o.rotation_euler = Vector(nz(B - A)).to_track_quat('Z', 'Y').to_euler()
    o.data.materials.append(mat); bpy.ops.object.shade_smooth()
    bv = o.modifiers.new('bv', 'BEVEL'); bv.width = min(0.04, r * 0.3); bv.segments = 3
    return o
def prop_points(sp):
    """Points des accessoires (repère MakeHuman), pour cadrer toutes les images pareil."""
    pts = []
    if sp.get('wheel'):
        c_, r_ = np.asarray(sp['wheel']['c'], float), sp['wheel']['r']
        pts += [c_ + [0, r_, 0], c_ + [0, -r_, 0], c_ + [0, 0, r_], c_ + [0, 0, -r_], c_ + [1.35, 0, 0], c_ + [-1.35, 0, 0]]
    if sp.get('bar'):
        c_, hf = np.asarray(sp['bar']['c'], float), sp['bar']['half']
        pts += [c_ + [hf, 0.3, 0], c_ + [-hf, 0.3, 0], [c_[0] + hf, _FLOOR0, c_[2]], [c_[0] - hf, _FLOOR0, c_[2]]]
    for bar_ in sp.get('parallettes', []):
        pts += [np.asarray(bar_, float) + [0, 0, 1.7], np.asarray(bar_, float) - [0, 0, 1.7]]
    return pts
_FLOOR0 = -8.72
if spec.get('wheel'):
    c_ = to_b1(spec['wheel']['c']); r_ = spec['wheel']['r']
    ax_ = to_b1([1.0, 0, 0])
    cyl('wtire', c_ - ax_ * 0.36, c_ + ax_ * 0.36, r_, rubber_m, 64)
    cyl('whub', c_ - ax_ * 0.4, c_ + ax_ * 0.4, r_ * 0.42, metal_m)
    cyl('wgrip_axle', c_ - ax_ * 1.3, c_ + ax_ * 1.3, 0.1, metal_m)
    for e_ in (-1, 1):
        cyl('wgrip', c_ + ax_ * e_ * 0.52, c_ + ax_ * e_ * 1.34, 0.19, rubber_m)
if spec.get('bar'):
    c_ = np.asarray(spec['bar']['c'], float); hf = spec['bar']['half']
    cyl('pbar', to_b1(c_ + [-hf - 0.2, 0, 0]), to_b1(c_ + [hf + 0.2, 0, 0]), 0.16, metal_m)
    for e_ in (-1, 1):
        cyl('ppost', to_b1([c_[0] + e_ * (hf + 0.2), _FLOOR0, c_[2]]), to_b1([c_[0] + e_ * (hf + 0.2), c_[1] + 0.3, c_[2]]), 0.3, metal_m)
for p_ in prop_points(spec): scene_pts.append(to_b(np.array([p_])))

# ——— parallettes en bois : une barre ronde sur deux montants ———
par_m, nt, b = principled('par', color=(0.55, 0.38, 0.22, 1), rough=0.45)
for bar in spec.get('parallettes', []):
    cb = to_b(np.array([bar]))[0]
    fl = to_b(np.array([[0, -8.72, 0]]))[0][2]
    L_ = 3.4
    ax_ = to_b(np.array([[0, 0, 1.0]]))[0]
    bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.165, depth=L_, location=tuple(cb))
    bo = bpy.context.active_object; bo.name = 'par_bar'
    bo.rotation_euler = Vector(ax_).to_track_quat('Z', 'Y').to_euler(); bo.data.materials.append(par_m); bpy.ops.object.shade_smooth()
    for e_ in (-1, 1):
        c_ = cb + ax_ * e_ * (L_ / 2 - 0.22)
        hgt = c_[2] - fl
        bpy.ops.mesh.primitive_cube_add(size=1, location=(c_[0], c_[1], fl + hgt / 2))
        po = bpy.context.active_object; po.name = 'par_post'; po.scale = (0.3, 0.32, hgt); po.data.materials.append(par_m)
        bv = po.modifiers.new('bv', 'BEVEL'); bv.width = 0.05; bv.segments = 3
        bpy.ops.mesh.primitive_cube_add(size=1, location=(c_[0], c_[1], fl + 0.09))
        fo_ = bpy.context.active_object; fo_.name = 'par_foot'; fo_.scale = (1.5, 0.42, 0.18); fo_.data.materials.append(par_m)
        bv = fo_.modifiers.new('bv', 'BEVEL'); bv.width = 0.05; bv.segments = 3

# ——— gants de boxe (cuir noir, poignet cuivre) ———
if spec.get('gloves'):
    glove_m, nt, b = principled('glove', color=(0.018, 0.016, 0.015, 1), rough=0.32, **{'Coat Weight': 0.6, 'Coat Roughness': 0.15})
    cuff_m, nt, b = principled('cuff', color=(0.75, 0.38, 0.2, 1), rough=0.3, **{'Metallic': 0.85})
    for s_ in 'LR':
        P_ = lambda b_, p_: posed(b_, p_)
        w = P_(f'wrist.{s_}', h.head[f'wrist.{s_}'])
        k = P_(f'finger3-1.{s_}', h.head[f'finger3-1.{s_}'])
        i2 = P_(f'finger2-1.{s_}', h.head[f'finger2-1.{s_}']); i5 = P_(f'finger5-1.{s_}', h.head[f'finger5-1.{s_}'])
        e = P_(f'lowerarm01.{s_}', h.head[f'lowerarm01.{s_}'])
        ax = Vector(nz(k - w)); across = Vector(nz(i2 - i5))
        palm = ax.cross(across).normalized() * (1 if s_ == 'R' else -1)
        across = palm.cross(ax).normalized() * (1 if s_ == 'R' else -1)
        from mathutils import Matrix
        def place(ob, center, sx, sy, sz):
            M = Matrix((ax, across, -palm)).transposed().to_4x4()
            ob.matrix_world = Matrix.Translation(center) @ M @ Matrix.Diagonal((sx, sy, sz, 1))
        c0 = Vector(w) + ax * 0.95 - palm * 0.05
        bpy.ops.mesh.primitive_uv_sphere_add(segments=48, ring_count=24)
        g = bpy.context.active_object; place(g, c0, 1.35, 0.78, 0.74); g.data.materials.append(glove_m)
        bpy.ops.object.shade_smooth()
        bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16)
        th = bpy.context.active_object; place(th, c0 + across * 0.55 * (1 if s_ == 'L' else 1) + palm * 0.25 - ax * 0.15, 0.7, 0.32, 0.34); th.data.materials.append(glove_m)
        bpy.ops.object.shade_smooth()
        fa = Vector(nz(w - e))
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.62, depth=1.3)
        cu = bpy.context.active_object
        cu.rotation_euler = fa.to_track_quat('Z', 'Y').to_euler(); cu.location = Vector(w) - fa * 0.35
        cu.data.materials.append(glove_m); bpy.ops.object.shade_smooth()
        bv = cu.modifiers.new('bv', 'BEVEL'); bv.width = 0.12; bv.segments = 4
        bpy.ops.mesh.primitive_cylinder_add(vertices=40, radius=0.64, depth=0.22)
        band_ = bpy.context.active_object
        band_.rotation_euler = cu.rotation_euler; band_.location = Vector(w) - fa * 0.55
        band_.data.materials.append(cuff_m); bpy.ops.object.shade_smooth()

# ——— posé au sol ———
from poses3d import FLOOR as _FLOOR
zmin = to_b(np.array([[0, _FLOOR, 0]]))[0][2] if callable(POSES[pose_name]) else to_b(V[sorted({j for i in keep_body for j in body.faces[i]})])[:, 2].min()
for ob in bpy.data.objects:
    ob.location.z -= zmin
# animation : le cadre et les lumières couvrent toutes les images du mouvement (caméra fixe)
FRAME_TS = [float(x) for x in os.environ.get('FRAME_TS', '').split(',') if x.strip()]
if not FRAME_TS and '_frames' in spec:   # exercices de exos.py : toutes leurs images
    FRAME_TS = list(range(spec['_frames']))
if FRAME_TS and callable(POSES[pose_name]):
    used_all = sorted({j for i in keep_body for j in body.faces[i]})
    keepM, keepS, keepR = h.M, h.S, h.Rw
    for t_ in FRAME_TS:
        sp_ = POSES[pose_name](P, t_)
        G_, L_, T_ = P.solve(sp_)
        scene_pts.append(to_b(h.pose(G_, L_, T_)[used_all]))
        for p_ in prop_points(sp_): scene_pts.append(to_b(np.array([p_])))
    h.M, h.S, h.Rw = keepM, keepS, keepR
pts = np.vstack(scene_pts); pts[:, 2] -= zmin
lo, hi = pts.min(0), pts.max(0)
center = (lo + hi) / 2
size = hi - lo

# studio : sol qui remonte en arrondi derrière le perso (pas de ligne d'horizon)
floor_m, nt, b = principled('floor', color=(0.028, 0.02, 0.016, 1), rough=0.55)
prof = [(-400, 0)]
back = center[1] + 55
rr = 70
for k in range(13):
    a = math.radians(90 * k / 12)
    prof.append((back + rr * math.sin(a), rr * (1 - math.cos(a))))
prof.append((back + rr, 500))
verts, faces = [], []
for x in (center[0] - 800, center[0] + 800):
    for (yy, zz) in prof: verts.append((x, yy, zz))
n = len(prof)
for k in range(n - 1): faces.append((k, k + 1, n + k + 1, n + k))
me = bpy.data.meshes.new('cyc'); me.from_pydata(verts, [], faces); me.update()
me.polygons.foreach_set('use_smooth', [True] * len(me.polygons))
cyc = bpy.data.objects.new('cyc', me); bpy.context.collection.objects.link(cyc); cyc.data.materials.append(floor_m)

world = bpy.data.worlds.new('w'); bpy.context.scene.world = world; world.use_nodes = True
bg = world.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.006, 0.0045, 0.0035, 1)


def light(name, kind, loc, target, energy, color, size_=1.0, spot=None, spread=None):
    ld = bpy.data.lights.new(name, kind); ld.energy = energy; ld.color = color
    if kind == 'AREA':
        ld.size = size_
        if spread: ld.spread = math.radians(spread)
    if kind == 'SPOT': ld.spot_size = spot or math.radians(40); ld.spot_blend = 0.9; ld.shadow_soft_size = size_
    ob = bpy.data.objects.new(name, ld); bpy.context.collection.objects.link(ob)
    ob.location = loc
    ob.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler()
    return ob


def around(az, el, dist, c):
    az, el = math.radians(az), math.radians(el)
    return Vector((c[0] + math.sin(az) * math.cos(el) * dist, c[1] - math.cos(az) * math.cos(el) * dist, c[2] + math.sin(el) * dist))


c = Vector(center)
R = 60
K = float(os.environ.get('KEY', spec.get('light', 0.85)))
light('key', 'AREA', around(-40, 40, R, c), c, 7000 * K, (1.0, 0.9, 0.8), 14, spread=60)
light('rimL', 'AREA', around(128, 24, R, c), c, 14000 * K, (1.0, 0.55, 0.28), 7, spread=55)
light('rimR', 'AREA', around(-132, 28, R, c), c, 12000 * K, (1.0, 0.6, 0.32), 7, spread=55)
light('fill', 'AREA', around(50, 6, R, c), c, 900 * K, (0.62, 0.78, 1.0), 20, spread=80)
# halo cuivré sur le fond, derrière le perso
gl = Vector((c[0], back - 5, 4))
light('glow', 'AREA', gl, (c[0], back + rr, size[2] * 0.9), 9000 * K, (1.0, 0.5, 0.25), 10, spread=70)

# ——— caméra : cadrée sur le corps ———
cam_d = bpy.data.cameras.new('cam'); cam_d.lens = 90
cam = bpy.data.objects.new('cam', cam_d); bpy.context.collection.objects.link(cam)
sc = bpy.context.scene
sc.camera = cam
sc.render.resolution_x, sc.render.resolution_y = W, Hh
VIEWS = {'boxside': (-78, 6), 'pushside': (-72, 12), 'left_side34': (62, 9), 'front34': (-28, 6), 'side34': (-64, 9), 'side': (-90, 4), 'front': (0, 4), 'left34': (40, 6), 'high': (-55, 22), 'right34': (-40, 5)}
v_ = view if view != 'auto' else spec.get('view', 'front34')
if isinstance(v_, str) and ',' in v_: v_ = tuple(float(x) for x in v_.split(','))
az, el = VIEWS[v_] if isinstance(v_, str) else v_
look = Vector((center[0], center[1], center[2]))
dist = 120
body_pts = [Vector(p) for p in np.vstack(scene_pts)[::5]]
FOCUS = os.environ.get('FOCUS')
if FOCUS:  # gros plan sur un os (vérifications)
    fp = (h.M[FOCUS] @ np.r_[h.head[FOCUS], 1])[:3]
    fb = to_b(np.array([fp]))[0]
    body_pts = [Vector(fb + d) for d in np.array([[1, 1, 1], [-1, -1, -1], [1, -1, 1], [-1, 1, -1]]) * 1.3]
    look = Vector(fb) - Vector((0, 0, zmin))
for _ in range(6):
    cam.location = around(az, el, dist, look)
    cam.rotation_euler = (look - cam.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.context.view_layer.update()
    co = np.array([world_to_camera_view(sc, cam, p - Vector((0, 0, zmin)))[:2] for p in body_pts])
    w_, h_ = co[:, 0].max() - co[:, 0].min(), co[:, 1].max() - co[:, 1].min()
    fill = max(w_ / 0.86, h_ / 0.8) if STYLE != 'dessin' else max(w_ / 0.92, h_ / 0.9)
    dist *= fill
    mid = Vector(((co[:, 0].max() + co[:, 0].min()) / 2 - 0.5, (co[:, 1].max() + co[:, 1].min()) / 2 - 0.47))
    # recentre le point visé
    right = cam.matrix_world.to_3x3() @ Vector((1, 0, 0)); up = cam.matrix_world.to_3x3() @ Vector((0, 1, 0))
    span = 2 * dist * math.tan(cam_d.angle / 2)
    look += right * mid.x * span + up * mid.y * span * Hh / W

# ——— style dessin : tout en argile grise, ombre portée seule, passes pour le dessin ———
sc.render.engine = 'CYCLES'
if STYLE == 'dessin':
    def clay(name, v, alpha_img=None, tint=0.0):
        m, nt_, b_ = principled(name, color=(v, v, v, 1), rough=0.55, **{'Specular IOR Level': 0.35})
        # teinte (élastique vert) : 1 là où le dessin doit passer en vert
        tv = nt_.nodes.new('ShaderNodeValue'); tv.outputs[0].default_value = tint
        ta = nt_.nodes.new('ShaderNodeOutputAOV'); ta.aov_name = 'tint'; nt_.links.new(tv.outputs[0], ta.inputs['Value'])
        tex_a = None
        if alpha_img:  # cheveux et sourcils : des mèches (texture à trous), pas un casque
            tex_a = image(nt_, alpha_img)
            nt_.links.new(tex_a.outputs['Alpha'], b_.inputs['Alpha'])
        # cheveux : la coordonnée u des mèches (pour dessiner des traits le long des mèches)
        ah = nt_.nodes.new('ShaderNodeOutputAOV'); ah.aov_name = 'hair'
        if 'hair' in name and tex_a is not None:
            nt_.links.new(tex_a.outputs['Alpha'], ah.inputs['Value'])
        else:
            hv = nt_.nodes.new('ShaderNodeValue'); hv.outputs[0].default_value = 0.0; nt_.links.new(hv.outputs[0], ah.inputs['Value'])
        if 'hair' in name:
            uvn = nt_.nodes.new('ShaderNodeUVMap'); sep = nt_.nodes.new('ShaderNodeSeparateXYZ')
            nt_.links.new(uvn.outputs['UV'], sep.inputs[0])
            au = nt_.nodes.new('ShaderNodeOutputAOV'); au.aov_name = 'hairu'; nt_.links.new(sep.outputs['X'], au.inputs['Value'])
        for nm in ('focus', 'phase', 'fiber'):
            at_ = nt_.nodes.new('ShaderNodeAttribute'); at_.attribute_name = nm
            ao_ = nt_.nodes.new('ShaderNodeOutputAOV'); ao_.aov_name = nm
            nt_.links.new(at_.outputs['Fac'], ao_.inputs['Value'])
        return m
    tones = {'body': 0.66, 'shorts': 0.36, 'hair': 0.2, 'eyes': 0.6, 'brows': 0.25, 'band': 0.16, 'vband': 0.4, 'shoes': 0.8, 'par': 0.62,
             'wtire': 0.2, 'whub': 0.72, 'wgrip': 0.22, 'pbar': 0.6, 'ppost': 0.52}
    mats = {}
    for ob in bpy.data.objects:
        if ob.type not in ('MESH', 'CURVE') or ob.name == 'cyc': continue
        key = next((k for k in tones if ob.name.startswith(k)), None)
        v = tones.get(key, 0.3 if spec.get('gloves') and ob.type == 'MESH' else 0.6)
        mats.setdefault(v, clay(f'clay{v}', v))
        ob.data.materials.clear(); ob.data.materials.append(mats[v])
        if key == 'vband':
            ob.data.materials[0] = mats.setdefault('vband', clay('clay-vband', v, tint=1.0))
        if key == 'brows' or key == 'hair':
            ob.data.materials[0] = clay(f'clay-a{key}', v, DATA + ('proxies/hair/short02/textures/short02_diffuse.png' if key == 'hair' else 'proxies/eyebrows/eyebrow001/textures/eyebrow001.png'))
        ob.pass_index = 1
    cyc.is_shadow_catcher = True
    for ob in [o for o in bpy.data.objects if o.type == 'LIGHT']:
        bpy.data.objects.remove(ob)
    light('key', 'AREA', around(-38, 50, R, c), c, 4200, (1, 1, 1), 4, spread=60)
    light('fill', 'AREA', around(60, 5, R, c), c, 380, (1, 1, 1), 20, spread=90)
    light('rim', 'AREA', around(150, 35, R, c), c, 3600, (1, 1, 1), 6, spread=60)
    sc.render.film_transparent = True
    vl = sc.view_layers[0]
    vl.use_pass_ambient_occlusion = True; vl.use_pass_z = True; vl.use_pass_object_index = True
    vl.use_pass_diffuse_color = True
    for nm in ('focus', 'phase', 'fiber', 'hair', 'hairu', 'tint'):
        aov = vl.aovs.add(); aov.name = nm; aov.type = 'VALUE'
    sc.use_nodes = True
    tree = sc.node_tree
    for nd in list(tree.nodes): tree.nodes.remove(nd)
    rl = tree.nodes.new('CompositorNodeRLayers')
    comp = tree.nodes.new('CompositorNodeComposite'); tree.links.new(rl.outputs['Image'], comp.inputs['Image'])
    fo = tree.nodes.new('CompositorNodeOutputFile')
    fo.base_path = os.path.splitext(out)[0] + '_passes'
    fo.format.file_format = 'PNG'; fo.format.color_depth = '16'; fo.format.color_mode = 'RGBA'
    fo.file_slots.clear()
    for name, sock in (('image', 'Image'), ('ao', 'AO'), ('index', 'IndexOB'), ('focus', 'focus'), ('albedo', 'DiffCol')):
        fo.file_slots.new(name); tree.links.new(rl.outputs[sock], fo.inputs[name])
    nz_ = tree.nodes.new('CompositorNodeNormalize'); tree.links.new(rl.outputs['Depth'], nz_.inputs[0])
    fo.file_slots.new('depth'); tree.links.new(nz_.outputs[0], fo.inputs['depth'])
    # la phase : des données, pas une couleur (aucune courbe d'affichage)
    fo2 = tree.nodes.new('CompositorNodeOutputFile')
    fo2.base_path = fo.base_path
    fo2.format.file_format = 'PNG'; fo2.format.color_depth = '16'; fo2.format.color_mode = 'BW'
    try:
        fo2.format.color_management = 'OVERRIDE'; fo2.format.view_settings.view_transform = 'Raw'
    except Exception as e:
        print('gestion des couleurs', e)
    fo2.file_slots.clear()
    for nm in ('phase', 'fiber', 'hair', 'hairu', 'tint'):
        fo2.file_slots.new(nm); tree.links.new(rl.outputs[nm], fo2.inputs[nm])

# ——— rendu ———
sc.render.engine = 'CYCLES'
sc.cycles.device = 'CPU'
sc.cycles.samples = samples
sc.cycles.use_denoising = True
sc.cycles.max_bounces = 6
sc.render.threads_mode = 'FIXED'; sc.render.threads = int(os.environ.get('THREADS', 4))
if STYLE == 'dessin':
    sc.view_settings.view_transform = 'Standard'
else:
    sc.view_settings.view_transform = 'AgX'
    try:
        sc.view_settings.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
sc.render.filepath = out
# étiquettes : chaque muscle, du côté le plus visible (tourné vers la caméra), en pixels
if 'ANCH' in globals() and ANCH:
    import json
    res_ = {}
    cam_pos = np.array(cam.location)
    for gs, (p3, n3) in ANCH.items():
        p3 = np.array(p3); p3[2] -= zmin
        co_ = world_to_camera_view(sc, cam, Vector(p3))
        facing = float(np.dot(nz(n3), nz(cam_pos - p3)))
        res_[gs] = dict(x=co_.x * W, y=(1 - co_.y) * Hh, depth=co_.z, facing=facing)
    os.makedirs(os.path.splitext(out)[0] + '_passes', exist_ok=True)
    json.dump(res_, open(os.path.splitext(out)[0] + '_passes/anchors.json', 'w'), indent=1)
if os.environ.get('ANCHORS_ONLY'):
    raise SystemExit
bpy.ops.render.render(write_still=True)
print('rendu', out)
