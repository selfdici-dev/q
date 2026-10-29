"""Tous les exercices de Cap, en 3D : pour chacun, les images à rendre (réglages de la
pose), l'ordre où elles se jouent (segments, au rythme des poses 2D de js/poses.js),
la vue, les muscles travaillés et le matériel.

Repère MakeHuman (dm) : x = gauche du perso debout, y = haut, z = devant ; sol à FLOOR.
Chaque mouvement : build(P, p) → spec pour Poser.solve (voir poses3d.py) ; frames =
liste de réglages p ; segs = images de chaque passage d'une pose clé à la suivante."""
import numpy as np
from poses3d import (Poser, POSES, FLOOR, ANKLE, UP, FWD, nz, perp, rot, turn, lerp, two_bone,
                     lateral, pushup, boxing, lunge)
from mh import Mesh, D

DATA = D + 'public/data/'
DOWN, BACK = -UP, -FWD
LEFT = np.array([1.0, 0, 0])
WRIST_FLAT = FLOOR + 0.49      # poignet d'une main posée à plat (doigts droits : fist = -1)
ANK_TOE = FLOOR + 1.85         # cheville d'un pied sur la pointe (orteils pliés), corps en planche


def deg(a): return np.radians(a)


def ang(v_from, angle_deg, v_to):
    """Tourne v_from vers v_to (dans leur plan) de angle degrés."""
    a = nz(v_from); b = perp(v_to, a)
    return nz(np.cos(deg(angle_deg)) * a + np.sin(deg(angle_deg)) * b)


# ——— mesures et placement ———
_SKIN = {}


def skin(P):
    if 'skin' not in _SKIN:
        h = P.h
        m = np.zeros(h.nv, bool)
        m[[j for i, mm in enumerate(h.body.fmat) if h.body.mats[mm] == 'body' for j in h.body.faces[i]]] = True
        _SKIN['skin'] = m
        _SKIN['shoe'] = Mesh(DATA + 'proxies/clothes/shoes06/shoes06.json')
        d = _SKIN['shoe'].delete
        _SKIN['vis'] = m & ~d if d is not None else m
        _SKIN['bone'] = np.array(h.bones)[h.skin_b[np.arange(h.nv), h.sw.argmax(1)]]
    return _SKIN['skin']


def jpos(h, name):
    if name == 'hips': return (jpos(h, 'upperleg01.L') + jpos(h, 'upperleg01.R')) / 2
    if name == 'shoulders': return (jpos(h, 'upperarm01.L') + jpos(h, 'upperarm01.R')) / 2
    return (h.M[name] @ np.r_[h.head[name], 1])[:3]


def body_part(spec):
    return {k: v for k, v in spec.items() if k in ('body', 'chest', 'neck', 'head', 'move', 'drop')}


def measure(P, spec, names):
    G, L, t = P.solve(body_part(spec))
    P.h.pose(G, {}, t)
    return {n: jpos(P.h, n) for n in names}


def place(P, spec, joint, at):
    """Déplace le corps pour que l'articulation (ou 'hips', 'shoulders') soit en at."""
    sp = dict(spec); sp['move'] = np.zeros(3)
    m = measure(P, sp, [joint])[joint]
    sp['move'] = np.asarray(at, float) - m
    return sp


def shift_targets(spec, d):
    sp = dict(spec)
    for k in ('armL', 'armR', 'legL', 'legR'):
        g = sp.get(k)
        if g and 'at' in g:
            g = dict(g); g['at'] = np.asarray(g['at'], float) + d; sp[k] = g
    for k in ('parallettes',):
        if k in sp: sp[k] = [np.asarray(b, float) + d for b in sp[k]]
    for k in ('bar', 'wheel'):
        if k in sp:
            o = dict(sp[k]); o['c'] = np.asarray(o['c'], float) + d; sp[k] = o
    return sp


def ground(P, spec, lift=0.0):
    """Pose le corps au sol : son point le plus bas (peau ou basket) touche FLOOR."""
    h = P.h
    skin(P)
    sp = dict(spec); sp.setdefault('move', np.zeros(3))
    G, L, t = P.solve(sp)
    V = h.pose(G, L, t)
    lo = min(V[_SKIN['skin'], 1].min(), h.fit(_SKIN['shoe'])[:, 1].min())
    d = np.array([0, FLOOR + lift - lo, 0])
    sp = shift_targets(sp, d)
    sp['move'] = np.asarray(sp['move'], float) + d
    return sp


def rest_on(P, spec, parts, lift=0.0):
    """Descend (ou monte) le corps pour que la peau de ces parties (débuts de noms d'os)
    touche le sol ; les cibles des pieds et des mains ne bougent pas."""
    h = P.h
    skin(P)
    sp = dict(spec); sp.setdefault('move', np.zeros(3))
    G, L, t = P.solve(sp)
    V = h.pose(G, L, t)
    sel = _SKIN['vis'] & np.array([b.startswith(tuple(parts)) for b in _SKIN['bone']])
    d = FLOOR + lift - V[sel, 1].min()
    sp['move'] = np.asarray(sp['move'], float) + [0, d, 0]
    return sp


def foot_from(shin, front):
    """Pied à angle droit du tibia, orteils du côté front ; dessus du pied vers le genou."""
    f = perp(front, shin)
    return f, -nz(shin)


def leg_dirs(lat, flex, bend, side_out=0.0):
    """Jambe d'un corps couché sur le dos (tête vers +z) : flex = flexion de la hanche
    (0 = jambe allongée vers les pieds), bend = flexion du genou (degrés)."""
    th = nz([lat * 0.12 + side_out, np.sin(deg(flex)), -np.cos(deg(flex))])
    a = flex - bend
    sh = nz([lat * 0.06 + side_out * 0.5, np.sin(deg(a)), -np.cos(deg(a))])
    foot, top = foot_from(sh, UP)
    return dict(th=th, sh=sh, foot=foot, top=top, knee=UP)


# ——— corps de base ———
SUPINE = (nz([0, 0, 1.0]), nz([0, 1.0, 0]))     # sur le dos, tête vers +z (son côté gauche vers -x)
PRONE = (nz([0, 0, 1.0]), nz([0, -1.0, 0]))     # à plat ventre, tête vers +z (son côté gauche vers +x)


def standing_legs(spec, width=1.1, z=0.0, knee=0.0):
    for s, sx in (('L', 1), ('R', -1)):
        spec[f'leg{s}'] = dict(at=[sx * width, ANKLE, z], knee=nz([sx * 0.12, 0, 1]), foot=nz([sx * 0.12, 0, 1]), top=UP)
    return spec


# ═══════════════ A · abdos ═══════════════

def crunch_velo(P, p):
    """Sur le dos, mains derrière les oreilles, omoplates décollées ; s = +1 : coude droit
    vers genou gauche (le gauche monte), s = -1 : l'inverse."""
    h = P.h
    s = p['s']
    curl = 34
    cu = nz([0, np.sin(deg(curl)), np.cos(deg(curl))])
    cf = nz([0, np.cos(deg(curl)), -np.sin(deg(curl))])
    tw = -20 * s                                   # le buste tourne vers le genou qui monte
    R = rot(cu, deg(tw))
    spec = dict(view=(-72, 26), focus=['abs', 'obliques'], body=SUPINE, chest=(cu, R @ cf),
                neck=(nz(cu + [0, 0.25, 0]), R @ cf), head=(nz(cu + [0, 0.45, 0]), R @ nz(cf + [0, 0, -0.35])))
    spec = place(P, spec, 'hips', [0, 0, 0])
    # mains derrière la tête (le repère de la tête une fois le buste placé)
    m = measure(P, spec, ['head'])
    Rh = h.Rw['head']
    hu, hf, hl = Rh @ np.array([0, 1, 0]), Rh @ np.array([0, 0, 1]), Rh @ np.array([1, 0, 0])
    hc = m['head'] + hu * 0.9
    up_k = (1 + s) / 2
    for side, sx in (('L', 1), ('R', -1)):
        reach = (side == 'R' and s > 0) or (side == 'L' and s < 0)
        e_hint = nz(hl * sx * 1.0 + hu * (0.6 if reach else 0.1) + cf * 0.2)
        spec[f'arm{side}'] = dict(at=hc + hl * sx * 0.95 - hf * 0.55 + hu * 0.15, elbow=e_hint,
                                  hand=nz(hu * 0.6 - hl * sx * 0.4 + hf * 0.2), palm=nz(-hl * sx), fist=0.1)
    # jambes : le genou du côté s monte vers la poitrine, l'autre s'allonge au ras du sol
    kL = up_k            # gauche (côté -x de ce corps couché)
    kR = 1 - up_k
    for side, k, lat in (('L', kL, -1), ('R', kR, 1)):
        spec[f'leg{side}'] = leg_dirs(lat, lerp(9, 112, k), lerp(4, 100, k))
    return ground(P, spec)


def roue(P, p):
    """Roue abdominale à genoux : r = 0 roue sous les épaules, r = 1 roulé loin devant."""
    h = P.h
    r = p['r']
    knee = np.array([0, FLOOR + 0.5, 0.0])
    a_t = lerp(8, 52, r)                                    # cuisse : inclinaison vers l'avant
    hip = knee + 4.28 * np.array([0, np.cos(deg(a_t)), np.sin(deg(a_t))])
    a_b = lerp(76, 96, r)                                   # buste : presque à l'horizontale
    up_b = np.array([0, np.cos(deg(a_b)), np.sin(deg(a_b))])
    front_b = np.array([0, -np.sin(deg(a_b)), np.cos(deg(a_b))])
    chest_u = ang(up_b, 10, -front_b)                        # dos un peu rond
    spec = dict(view=(-72, 10), focus=['abs'], body=(up_b, front_b), chest=(chest_u, perp(front_b, chest_u)),
                neck=(nz(chest_u + front_b * 0.2), perp(front_b, chest_u)), head=(nz(chest_u + front_b * 0.45), perp(front_b + up_b * 0.3, chest_u)))
    spec = place(P, spec, 'hips', hip)
    sh = measure(P, spec, ['shoulders'])['shoulders']
    R_w = 0.85
    wy = FLOOR + R_w
    dy = sh[1] - wy
    wz = sh[2] + np.sqrt(max(0.0, 4.95 ** 2 - dy ** 2))
    spec['wheel'] = dict(c=np.array([0, wy, wz]), r=R_w)
    hand = nz([0, -0.5, 0.86]); palm = nz([0, -0.86, -0.5])
    for side, sx in (('L', 1), ('R', -1)):
        grip = np.array([sx * 0.95, wy, wz])
        spec[f'arm{side}'] = dict(at=grip - hand * 0.72 - palm * 0.14, elbow=nz([sx * 0.4, 0.2, -1]), hand=hand, palm=palm, fist=0.85)
    for side, sx in (('L', 1), ('R', -1)):
        k = knee + [sx * 1.0, 0, 0]
        hp = jpos(h, f'upperleg01.{side}') + 0
        spec[f'leg{side}'] = dict(th=nz(k - hp), sh=nz([0, 0.06, -1]), foot=nz([0, -0.25, -0.97]), top=nz([0, -0.97, 0.25]))
    return spec


def russian(P, p):
    """Assis, buste penché en arrière, pieds décollés ; r de -1 à 1 : les mains jointes
    passent d'un côté du bassin à l'autre, la tête suit."""
    h = P.h
    r = p['r']
    lean = 42
    up_b = nz([0, np.cos(deg(lean)), -np.sin(deg(lean))])
    front_b = nz([0, np.sin(deg(lean)), np.cos(deg(lean))])
    Rc = rot(up_b, deg(-38 * r))
    spec = dict(view=(-26, 22), focus=['obliques', 'abs'], body=(up_b, front_b),
                chest=(ang(up_b, -6, front_b), Rc @ front_b),
                neck=(nz(up_b + front_b * 0.35), rot(up_b, deg(-52 * r)) @ front_b),
                head=(nz(up_b + front_b * 0.45), rot(up_b, deg(-60 * r)) @ nz(front_b + DOWN * 0.3)))
    spec = place(P, spec, 'hips', [0, 0, 0])
    m = measure(P, spec, ['shoulders', 'hips'])
    side = LEFT * (-1)          # r > 0 : vers la droite du perso (vers -x)
    center = m['shoulders'] + front_b * 3.4 - up_b * 1.6
    low = m['hips'] + side * 2.6 * np.sign(r if r != 0 else 1) + front_b * 1.6 + UP * 0.2
    T = lerp(center, low, abs(r) ** 0.8) if abs(r) > 1e-3 else center
    for s_, sx in (('L', 1), ('R', -1)):
        spec[f'arm{s_}'] = dict(at=T + LEFT * sx * 0.32, elbow=nz([sx * 0.8, -0.6, 0.0]), hand=nz(front_b - LEFT * sx * 0.5),
                                palm=nz(-LEFT * sx), fist=0.55)
    for s_, sx in (('L', 1), ('R', -1)):
        th = nz([sx * 0.22, np.sin(deg(40)), np.cos(deg(40))])
        sh = nz([-sx * 0.12, -0.12, 1.0])
        foot, top = foot_from(sh, UP)
        spec[f'leg{s_}'] = dict(th=th, sh=sh, foot=foot, top=top)
    return ground(P, spec)


def crunch_inverse(P, p):
    """Sur le dos, mains au sol ; c = 0 genoux pliés en l'air, c = 1 genoux vers la poitrine,
    le bassin s'enroule (le bas du dos décolle)."""
    c = p['c']
    tilt = 32 * c
    root_u = nz([0, -np.sin(deg(tilt)), np.cos(deg(tilt))])
    root_f = nz([0, np.cos(deg(tilt)), np.sin(deg(tilt))])
    spec = dict(view=(-70, 12), focus=['abs'], body=(root_u, root_f), chest=SUPINE, neck=SUPINE,
                head=(nz([0, 0.15, 1]), nz([0, 1, -0.15])))
    spec = place(P, spec, 'shoulders', [0, 0, 4.4])
    for s_, sx in (('L', -1), ('R', 1)):
        d = nz([sx * 0.22, 0.0, -1.0])
        spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=DOWN, elbow=UP, fist=0.05)
    for s_, lat in (('L', -1), ('R', 1)):
        spec[f'leg{s_}'] = leg_dirs(lat, lerp(88, 138, c), lerp(88, 112, c))
    return ground(P, spec)


def planche_laterale(P, p):
    """Planche latérale sur le côté droit, de face : a = 0 bras libre vers le plafond,
    a = 1 main libre glissée sous le torse."""
    a = p['a']
    tilt = 11
    up_b = nz([-np.cos(deg(tilt)), np.sin(deg(tilt)), 0])     # tête à gauche de l'écran
    front_b = np.array([0, 0, 1.0])                            # le ventre face à nous
    spec = dict(view=(0, 22), focus=['obliques'], body=(up_b, front_b), chest=(up_b, front_b),
                neck=(up_b, front_b), head=(nz(up_b + [0, 0.05, 0]), front_b))
    spec = place(P, spec, 'upperarm01.R', [0, FLOOR + 3.05, 0])
    spec['armR'] = dict(up=DOWN, fo=nz([0, -0.04, 1]), hand=nz([0, 0.05, 1]), palm=nz([1, 0, 0]), fist=0.8)   # poing posé sur la tranche
    up_a = nz(lerp([0, 1, 0.02], [0.1, -0.55, 0.83], a))
    fo_a = nz(lerp([0, 1, 0.02], [0.35, -0.45, -0.82], a))
    spec['armL'] = dict(up=up_a, fo=fo_a, hand=fo_a, palm=nz(lerp([0, 0, 1], [0, -1, 0], a)), elbow=front_b, fist=0.15)
    hipR = measure(P, spec, ['upperleg01.R'])['upperleg01.R']
    along = -up_b
    ankR = hipR + along * 8.55
    ankR[1] = FLOOR + 0.64; ankR[2] = 0.25
    ankL = ankR + np.array([0.35, 0.92, -0.42])
    for s_, at in (('R', ankR), ('L', ankL)):
        spec[f'leg{s_}'] = dict(at=at, knee=front_b, foot=front_b, top=up_b)
    return spec


def hollow(P, p):
    """Hollow hold genoux pliés : bas du dos au tapis, épaules décollées, bras vers les pieds."""
    k = p['k']
    curl = 24 + 4 * k
    cu = nz([0, np.sin(deg(curl)), np.cos(deg(curl))])
    cf = nz([0, np.cos(deg(curl)), -np.sin(deg(curl))])
    spec = dict(view=(-62, 30), focus=['abs'], body=SUPINE, chest=(cu, cf), neck=(nz(cu + [0, 0.25, 0]), cf),
                head=(nz(cu + [0, 0.4, 0]), nz(cf + [0, 0, -0.3])))
    spec = place(P, spec, 'hips', [0, 0, 0])
    for s_, sx in (('L', -1), ('R', 1)):
        d = nz([sx * 0.2, 0.3 + 0.03 * k, -1.0])
        spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=nz([-sx * 0.3, -1, 0]), elbow=UP, fist=0.1)
    for s_, lat in (('L', -1), ('R', 1)):
        spec[f'leg{s_}'] = leg_dirs(lat, 62 + 2 * k, 64 + 2 * k)
    return ground(P, spec)


# ═══════════════ B · haut du corps ═══════════════

def rowing(P, p):
    """Rowing penché à l'élastique vert : genoux pliés, buste penché dos plat ;
    p = 0 bras pendants, p = 1 coudes tirés vers les hanches."""
    q = p['p']
    hinge = 50
    up_b = nz([0, np.cos(deg(hinge)), np.sin(deg(hinge))])
    front_b = nz([0, -np.sin(deg(hinge)), np.cos(deg(hinge))])
    spec = dict(view=(-72, 8), focus=['lats', 'upper_back', 'delt_rear'], band=['L', 'R'], band_color='vert',
                body=(up_b, front_b), chest=(up_b, front_b), neck=(nz(up_b + front_b * 0.15), front_b),
                head=(nz(up_b + front_b * 0.3), nz(front_b + up_b * 0.5)))
    spec = place(P, spec, 'hips', [0, ANKLE + 8.25, -1.5])
    standing_legs(spec, 1.12, 0.35)
    for s_, sx in (('L', 1), ('R', -1)):
        up_hang = nz([sx * 0.06, -1, 0.12])
        up_pull = nz(-up_b + [sx * 0.28, -0.05, 0])
        up = nz(lerp(up_hang, up_pull, q))
        fo = nz(lerp(up_hang, [sx * 0.05, -1, 0.08], q))
        spec[f'arm{s_}'] = dict(up=up, fo=fo, hand=fo, palm=nz([-sx, 0, 0.1]), elbow=BACK, fist=0.85)
    return spec


def circles(c1, r1, c2, r2):
    """Intersection de deux cercles (plan y-z, x = 0) : la solution du haut."""
    d = np.linalg.norm(c2 - c1); a = (r1 ** 2 - r2 ** 2 + d ** 2) / (2 * d)
    hh = np.sqrt(max(0.0, r1 ** 2 - a ** 2)); u = (c2 - c1) / d
    n = nz(np.cross(u, [1.0, 0, 0])); n = n if n[1] > 0 else -n
    return c1 + u * a + n * hh


def aim(P, spec, joint, hip, target, iters=3):
    """Tourne le corps (autour de l'axe des x) pour que l'articulation vise la cible,
    les hanches restant en place."""
    sp = dict(spec)
    for _ in range(iters):
        sp = place(P, sp, 'hips', hip)
        m = measure(P, sp, [joint])[joint]
        a1 = np.arctan2((m - hip)[1], (m - hip)[2]); a2 = np.arctan2((target - hip)[1], (target - hip)[2])
        R = rot([1.0, 0, 0], -(a2 - a1))
        for key in ('body', 'chest', 'neck', 'head'):
            if key in sp: sp[key] = (R @ sp[key][0], R @ sp[key][1])
    return place(P, sp, 'hips', hip)


def pike(P, p):
    """Pompes pike : V à l'envers ; k = 0 bras tendus dans l'axe du buste, k = 1 en bas :
    la tête descend vers le sol devant les mains, coudes vers l'arrière, hanches hautes."""
    k = p['k']
    W = np.array([0, WRIST_FLAT, 3.4])                 # poignets (milieu), mains à plat
    A = np.array([0, ANK_TOE - 0.2, -6.1])             # chevilles, sur la pointe des pieds
    ln = P.lengths('L')
    L_leg = sum(ln['leg']) - 0.06
    m0 = measure(P, dict(body=(UP, FWD), chest=(UP, FWD), neck=(UP, FWD), head=(UP, FWD)), ['hips', 'shoulders'])
    L_tr = np.linalg.norm(m0['shoulders'] - m0['hips'])
    r0 = sum(ln['arm']) * 0.975
    hip0 = circles(A, L_leg, W, L_tr + r0)
    S0 = W + nz(hip0 - W) * r0
    S1 = W + np.array([0, 2.75, 0.85])
    e = 0.5 - np.cos(np.pi * k) / 2
    a0 = np.arctan2(*(S0 - W)[1:]); a1 = np.arctan2(*(S1 - W)[1:])
    an = lerp(a0, a1, e); r = lerp(r0, np.linalg.norm(S1 - W), e)
    S = W + r * np.array([0, np.sin(an), np.cos(an)])
    hip = circles(A, L_leg, S, L_tr)
    up_b = nz(S - hip)
    front_b = nz(perp(A - hip, up_b))
    spec = dict(view=(-80, 6), focus=['delt_front', 'delt_lat', 'triceps'], body=(up_b, front_b), chest=(up_b, front_b),
                neck=(up_b, front_b), head=(nz(up_b + front_b * 0.1), nz(front_b - up_b * 0.2)))
    spec = aim(P, spec, 'shoulders', hip, S)
    for s_, sx in (('L', 1), ('R', -1)):
        spec[f'arm{s_}'] = dict(at=W + [sx * 2.4, 0, 0], elbow=nz([sx * 0.6, 0.15, -1]), hand=FWD, palm=DOWN, fist=-1)
        hp = measure(P, spec, [f'upperleg01.{s_}'])[f'upperleg01.{s_}']
        an_ = A + [sx * 1.1, 0, 0]
        dl = nz(an_ - hp)
        spec[f'leg{s_}'] = dict(at=hp + dl * (sum(ln['leg']) + 0.2), knee=FWD, foot=perp(nz([0, -1, 0.35]), dl), top=-dl, toes=62)
    return spec


def tirage_assis(P, p):
    """Tirage assis à l'élastique vert autour des pieds : q = 0 bras tendus vers les pieds,
    q = 1 coudes tirés jusqu'aux côtes."""
    q = p['q']
    up_b = nz([0, 1, -0.06 - 0.04 * q])
    front_b = perp(FWD, up_b)
    spec = dict(view=(-74, 12), focus=['lats', 'upper_back', 'biceps'], band_seated=['L', 'R'], band_color='vert',
                body=(up_b, front_b), chest=(up_b, front_b), neck=(up_b, front_b), head=(UP, nz([0, -0.12, 1])))
    spec = place(P, spec, 'hips', [0, 0, 0])
    m = measure(P, spec, ['shoulders'])
    shp = m['shoulders']
    for s_, sx in (('L', 1), ('R', -1)):
        reach = shp + np.array([sx * 1.05, -1.9, 4.6])
        pulled = shp + np.array([sx * 1.75, -3.1, 1.05])
        spec[f'arm{s_}'] = dict(at=lerp(reach, pulled, q), elbow=nz(lerp([sx * 0.4, -1, 0], [sx * 0.35, -0.4, -1], q)),
                                hand=nz([0, -0.15, 1]), palm=nz([-sx, 0, 0]), fist=0.85)
        th = nz([sx * 0.1, np.sin(deg(7)), np.cos(deg(7))])
        sh = nz([sx * 0.04, -np.sin(deg(8)), np.cos(deg(8))])
        spec[f'leg{s_}'] = dict(th=th, sh=sh, foot=nz([0, 0.96, 0.28]), top=nz([0, -0.28, 0.96]))
    return ground(P, spec)


def pompes_serrees(P, p):
    """Pompes diamant : mains sous la poitrine, pouces et index qui se touchent, coudes collés."""
    k = p['k']
    h = P.h
    reach = sum(P.lengths('L')['arm'])
    wrist_y = WRIST_FLAT

    def place_ang(an):
        up = np.array([0, np.sin(an), np.cos(an)]); belly = np.array([0, -np.cos(an), np.sin(an)])
        sp = dict(view=(-74, 12), focus=['triceps', 'pecs'], body=(up, belly), neck=(up, belly),
                  head=(nz(up + [0, 0.1, 0]), nz(belly + [0, 0, 0.3])))
        for s_, sg in (('L', 1), ('R', -1)):
            sp[f'leg{s_}'] = dict(th=-up + [sg * 0.02, 0, 0], sh=-up, foot=belly, top=up, toes=72)
        G, L, tr = P.solve(dict(sp, move=(0, 0, 0)))
        h.pose(G, {}, tr)
        ank = jpos(h, 'foot.L')
        sp['move'] = np.array([ank[0], ANK_TOE, -9.0]) - ank
        shm = jpos(h, 'shoulders') + sp['move']
        return sp, shm

    def angle_for(y):
        lo, hi = -0.2, 0.8
        for _ in range(36):
            mid = (lo + hi) / 2
            if place_ang(mid)[1][1] < y: lo = mid
            else: hi = mid
        return (lo + hi) / 2
    back = 0.9
    a_top = angle_for(wrist_y + np.sqrt((reach * 0.98) ** 2 - back ** 2 - 1.8 ** 2))
    _, sh_top = place_ang(a_top)
    a_low = angle_for(FLOOR + 2.35)
    spec, _ = place_ang(a_top + (a_low - a_top) * k)
    for s_, sx in (('L', 1), ('R', -1)):
        spec[f'arm{s_}'] = dict(at=np.array([sx * 0.5, wrist_y, sh_top[2] - back]), elbow=nz([sx * 0.25, 0.55, -1]),
                                hand=nz([-sx * 0.55, 0, 0.83]), palm=DOWN, fist=-1)
    return spec


def curl(P, p):
    """Curl biceps à l'élastique noir : coudes collés aux côtes ; c = 0 bras tendus, c = 1 mains aux épaules."""
    c = p['c']
    spec = dict(view=(-42, 6), focus=['biceps', 'forearms'], band=['L', 'R'], body=(UP, FWD), neck=(UP, FWD), head=(UP, FWD))
    spec = place(P, spec, 'hips', [0, ANKLE + 8.62, 0])
    standing_legs(spec, 1.12, 0.05)
    th = lerp(4, 148, c)
    for s_, sx in (('L', 1), ('R', -1)):
        up = nz([sx * 0.07, -1, 0.06])
        fo = nz([sx * 0.04, -np.cos(deg(th)), np.sin(deg(th))])
        palm = nz([0, np.sin(deg(th)), np.cos(deg(th))])
        spec[f'arm{s_}'] = dict(up=up, fo=fo, hand=fo, palm=palm, fist=0.85)
    return spec


def lsit(P, p):
    """L-sit genoux groupés entre deux parallettes : l = décollage des fesses, g = genoux montés."""
    h = P.h
    l, g = p['l'], p['g']
    bar_y = FLOOR + 1.35
    lean = 8
    up_b = nz([0, np.cos(deg(lean)), np.sin(deg(lean))])
    front_b = perp(FWD, up_b)
    spec = dict(view=(-70, 10), focus=['abs', 'triceps'], body=(up_b, front_b), chest=(up_b, front_b),
                neck=(up_b, front_b), head=(UP, nz([0, -0.1, 1])))
    seat = rest_on(P, place(P, spec, 'shoulders', [0, FLOOR + 5.9, 0.2]), ['spine05', 'pelvis'])
    seat_y = measure(P, seat, ['shoulders'])['shoulders'][1]
    sh_y = lerp(seat_y, bar_y + 0.86 + 5.0, l)
    spec = place(P, spec, 'shoulders', [0, sh_y, 0.2])
    bars = [np.array([sx * 2.35, bar_y, 0.55]) for sx in (1, -1)]
    spec['parallettes'] = bars
    for (s_, sx), bar in zip((('L', 1), ('R', -1)), bars):
        spec[f'arm{s_}'] = dict(at=bar + [sx * 0.05, 0.86, 0], elbow=nz([sx * 0.3, 0, -1]), hand=DOWN, palm=nz([-sx, 0, 0]), fist=0.72)
    hips = measure(P, spec, ['upperleg01.L', 'upperleg01.R'])
    for s_, sx in (('L', 1), ('R', -1)):
        hp = hips[f'upperleg01.{s_}']
        heel = np.array([sx * 1.0, FLOOR + 0.74, hp[2] + 6.6])
        if g < 1e-3:
            spec[f'leg{s_}'] = dict(at=heel, knee=nz([sx * 0.15, 1, 0.2]), foot=nz([0, 0.85, 0.5]), top=nz([0, -0.5, 0.85]))
        else:
            fl = lerp(30, 58, g); bd = lerp(62, 132, g)
            th = nz([sx * 0.12, np.sin(deg(fl)), np.cos(deg(fl))])
            a2 = fl - bd
            sh = nz([sx * 0.05, np.sin(deg(a2)), np.cos(deg(a2))])
            foot, top = foot_from(sh, FWD)
            spec[f'leg{s_}'] = dict(th=th, sh=sh, foot=foot, top=top)
    if l < 1e-3:
        spec = rest_on(P, spec, ['spine05', 'pelvis', 'upperleg01'])
    return spec


# ═══════════════ C · cardio ═══════════════

def boxe(P, p):
    """Shadow boxing : j = direct du bras avant (gauche), c = direct du bras arrière (droit)."""
    h = P.h
    j, c = p['j'], p['c']
    turn_b = -38 - 8 * j + 46 * c
    spec = dict(view=(-78, 6), focus=['delt', 'obliques'], body=(nz([0, 1, 0.1]), turn(FWD, turn_b)),
                chest=(nz([0, 1, 0.16]), turn(FWD, turn_b - 6 - 6 * j + 8 * c)),
                neck=(nz([0, 1, 0.28]), turn(FWD, -16 + 10 * c)), head=(nz([0, 1, 0.12]), nz([0.02, -0.22, 1])))
    hip0 = (h.head['upperleg01.L'] + h.head['upperleg01.R']) / 2
    spec['move'] = np.array([0.0, FLOOR + 9.55, 0.15 * j + 0.35 * c]) - hip0
    G, _, tr = P.solve(spec)
    h.pose(G, {}, tr)
    shL, shR, head = jpos(h, 'upperarm01.L'), jpos(h, 'upperarm01.R'), jpos(h, 'head')
    Rb = h.Rw['spine01']
    reach = sum(P.lengths('L')['arm']) * 0.96
    guard_L = head + Rb @ np.array([0.95, -1.35, 2.35])
    jab_L = shL + reach * nz([0.05, 0.04, 1])
    guard_R = head + Rb @ np.array([-1.0, -1.45, 1.45])
    cross_R = shR + reach * nz([0.18, 0.04, 1])
    spec['armL'] = dict(at=lerp(guard_L, jab_L, j), elbow=[0.45, -1, -0.1 + 0.2 * j],
                        hand=nz(lerp(Rb @ np.array([0.1, 0.9, 0.5]), [0.03, 0.04, 1], j)),
                        palm=nz(lerp(Rb @ np.array([-0.9, 0, -0.3]), [0, -1, 0], j)), fist=1)
    spec['armR'] = dict(at=lerp(guard_R, cross_R, c), elbow=[-0.15 - 0.3 * c, -1, 0.3 - 0.2 * c],
                        hand=nz(lerp(Rb @ np.array([0.2, 0.85, 0.5]), [0.08, 0.04, 1], c)),
                        palm=nz(lerp(Rb @ np.array([0.9, 0, -0.35]), [0, -1, 0], c)), fist=1)
    spec['legL'] = dict(at=[1.25, ANKLE, 3.3], knee=[0.25, 0, 1], foot=turn(FWD, -12), top=UP)
    piv = -42 + 30 * c                       # le pied arrière pivote sur la pointe au direct arrière
    spec['legR'] = dict(at=[-1.7, ANKLE + 0.55 + 0.15 * c, -3.2], knee=[-0.15 + 0.2 * c, 0, 1],
                        foot=nz(turn([0, -0.45, 0.89], piv)), top=nz(turn([0, 0.89, 0.45], piv)), toes=35)
    return spec


def esquive(P, p):
    """Esquives et crochets, de face : e = esquive (-1 à gauche, +1 à droite du perso),
    k = crochet du même côté (bras gauche après l'esquive à gauche…)."""
    h = P.h
    e, k = p['e'], p['k']
    side = np.sign(e) if abs(e) > 1e-3 else (np.sign(k) if abs(k) > 1e-3 else 1)
    lean = 16 * e                      # le buste penche (vers sa gauche si e < 0 → +x)
    twist = -30 * k                    # rotation des hanches au crochet
    up_b = nz(rot(FWD, deg(lean)) @ UP)
    front_b = turn(FWD, twist * 0.6)
    spec = dict(view=(-12, 6), focus=['obliques', 'delt', 'quads'], body=(up_b, front_b),
                chest=(nz(rot(FWD, deg(lean * 1.2)) @ UP), turn(FWD, twist)),
                neck=(up_b, turn(FWD, twist * 0.5)), head=(UP, turn(nz([0, -0.15, 1]), twist * 0.3)))
    hip0 = (h.head['upperleg01.L'] + h.head['upperleg01.R']) / 2
    dip = 0.9 * max(abs(e), 0.0) + 0.4
    spec['move'] = np.array([-1.2 * e * 0.0, FLOOR + 9.6 - dip, 0]) - hip0
    G, _, tr = P.solve(spec)
    h.pose(G, {}, tr)
    shL, shR, head = jpos(h, 'upperarm01.L'), jpos(h, 'upperarm01.R'), jpos(h, 'head')
    Rb = h.Rw['spine01']
    gL = head + Rb @ np.array([0.95, -1.35, 2.2]); gR = head + Rb @ np.array([-0.95, -1.35, 2.2])
    hook_L = shL + Rb @ np.array([-1.2, 0.05, 2.6]); hook_R = shR + Rb @ np.array([1.2, 0.05, 2.6])
    kl = max(0.0, -k); kr = max(0.0, k)      # k < 0 : crochet gauche ; k > 0 : crochet droit
    spec['armL'] = dict(at=lerp(gL, hook_L, kl), elbow=nz(lerp([0.6, -1, -0.1], [1, 0.1, 0], kl)), hand=nz(lerp(Rb @ np.array([0.1, 0.9, 0.5]), Rb @ np.array([-1, 0, 0.3]), kl)),
                        palm=nz(lerp(Rb @ np.array([-0.9, 0, -0.3]), Rb @ np.array([0, -1, 0]), kl)), fist=1)
    spec['armR'] = dict(at=lerp(gR, hook_R, kr), elbow=nz(lerp([-0.6, -1, -0.1], [-1, 0.1, 0], kr)), hand=nz(lerp(Rb @ np.array([-0.1, 0.9, 0.5]), Rb @ np.array([1, 0, 0.3]), kr)),
                        palm=nz(lerp(Rb @ np.array([0.9, 0, -0.3]), Rb @ np.array([0, -1, 0]), kr)), fist=1)
    for s_, sx in (('L', 1), ('R', -1)):
        spec[f'leg{s_}'] = dict(at=[sx * 1.9, ANKLE, 0.4 * sx], knee=nz([sx * 0.4, 0, 1]), foot=nz([sx * 0.3, 0, 1]), top=UP)
    return spec


def plank_body(P, ang_deg, wrist_z, ankles_z=-9.0, hands_flat=True, tag='plank'):
    """Planche (bras tendus) : renvoie un spec avec le corps placé (chevilles fixes)."""
    h = P.h
    an = deg(ang_deg)
    up = np.array([0, np.sin(an), np.cos(an)]); belly = np.array([0, -np.cos(an), np.sin(an)])
    sp = dict(body=(up, belly), neck=(up, belly), head=(nz(up + [0, 0.12, 0]), nz(belly + [0, 0, 0.35])))
    for s_, sg in (('L', 1), ('R', -1)):
        sp[f'leg{s_}'] = dict(th=-up + [sg * 0.02, 0, 0], sh=-up, foot=belly, top=up, toes=72)
    G, L, tr = P.solve(dict(sp, move=(0, 0, 0)))
    h.pose(G, {}, tr)
    ank = jpos(h, 'foot.L')
    sp['move'] = np.array([ank[0], ANK_TOE, ankles_z]) - ank
    sp['_ank'] = {s_: np.array([sg * abs(ank[0]), ANK_TOE, ankles_z]) for s_, sg in (('L', 1), ('R', -1))}
    return sp


def plank_leg(P, sp, s_, k, lift=1.0):
    """Jambe d'un corps en planche : k = 0 pied derrière sur la pointe (jambe tendue),
    k = 1 genou ramené sous la poitrine, pied posé sous les hanches ; il décolle entre les deux."""
    if k < 1e-3: return
    sx = 1 if s_ == 'L' else -1
    up, belly = sp['body']
    hip = measure(P, sp, [f'upperleg01.{s_}'])[f'upperleg01.{s_}']
    A0 = sp['_ank'][s_]
    A1 = np.array([sx * 1.05, FLOOR + 1.9, hip[2] + 0.6])
    e = 0.5 - np.cos(np.pi * k) / 2
    at = lerp(A0, A1, e) + UP * lift * np.sin(np.pi * k)
    foot = nz(lerp(belly, nz(DOWN + BACK * 0.35), e))
    sp[f'leg{s_}'] = dict(at=at, knee=nz(FWD + DOWN * 0.25 + [sx * 0.08, 0, 0]), foot=foot, toes=lerp(72, 35, e) * (1 - 0.7 * np.sin(np.pi * k)))


def climbers(P, p):
    """Mountain climbers : planche, kL / kR = genou gauche / droit ramené vers la poitrine."""
    kL, kR = p['kL'], p['kR']
    reach = sum(P.lengths('L')['arm'])
    ang_deg = 26
    sp = plank_body(P, ang_deg, 0)
    sh = measure(P, sp, ['shoulders'])['shoulders']
    wrist = np.array([0, WRIST_FLAT, sh[2] - 0.3])
    # on ajuste la hauteur : bras presque tendus
    for _ in range(3):
        dy = (wrist[1] + np.sqrt(max(0.1, (reach * 0.97) ** 2 - 0.3 ** 2))) - sh[1]
        ang_deg += np.degrees(dy / 13.3)
        sp = plank_body(P, ang_deg, 0)
        sh = measure(P, sp, ['shoulders'])['shoulders']
        wrist = np.array([0, WRIST_FLAT, sh[2] - 0.3])
    sp.update(view=(-76, 10), focus=['abs', 'hipflex', 'delt_front'])
    for s_, sx in (('L', 1), ('R', -1)):
        sp[f'arm{s_}'] = dict(at=wrist + [sx * 2.4, 0, 0], elbow=nz([sx * 0.3, 0.2, -1]), hand=FWD, palm=DOWN, fist=-1)
    plank_leg(P, sp, 'L', kL, lift=1.3)
    plank_leg(P, sp, 'R', kR, lift=1.3)
    return sp


BURPEE_LEGS = {2: (0.5, 1.0), 3: (0.0, 1.0), 4: (0.0, 0.5), 5: (0.0, 0.0), 6: (0.5, 0.0), 7: (1.0, 0.0), 8: (1.0, 0.5)}


def burpee(P, p):
    """Burpees sans saut, aux poses clés du bonhomme : ph = 0 debout bras tendus devant,
    1 accroupi mains au sol, 2 à 8 en planche (jambes droite / gauche : BURPEE_LEGS,
    0 derrière, 1 sous la poitrine, 0.5 en l'air), 9 à mi-chemin en se relevant."""
    ph = p['ph']
    if ph == 0:
        spec = dict(view=(-74, 8), focus=['quads', 'glutes', 'pecs'], body=(UP, FWD), neck=(UP, FWD), head=(UP, FWD))
        spec = place(P, spec, 'hips', [0, ANKLE + 8.62, 0])
        standing_legs(spec, 1.1, 0.0)
        for s_, sx in (('L', 1), ('R', -1)):
            d = nz([sx * 0.04, 0.3, 1]); spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=nz([-sx, 0, 0]), fist=0.25)
        return spec
    if ph in (1, 9):
        # accroupi : fesses basses, buste penché, mains au sol devant les pieds (9 : on se relève)
        rise = 0.45 if ph == 9 else 0.0
        hinge = lerp(58, 35, rise / 0.45 if rise else 0)
        up_b = nz([0, np.cos(deg(hinge)), np.sin(deg(hinge))])
        front_b = nz([0, -np.sin(deg(hinge)), np.cos(deg(hinge))])
        spec = dict(view=(-74, 8), focus=['quads', 'glutes', 'pecs'], body=(up_b, front_b), chest=(up_b, front_b),
                    neck=(nz(up_b + front_b * 0.3), front_b), head=(nz(up_b + front_b * 0.5), nz(front_b + up_b)))
        spec = place(P, spec, 'hips', [0, FLOOR + 3.4 + rise * 6, -1.2 + rise])
        for s_, sx in (('L', 1), ('R', -1)):
            spec[f'leg{s_}'] = dict(at=[sx * 1.15, ANKLE + 0.25, 0.4], knee=nz([sx * 0.35, 0.3, 1]), foot=nz([sx * 0.15, 0, 1]), top=UP, toes=25)
            if ph == 9:
                d = nz([sx * 0.06, -0.2, 1]); spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=nz([-sx, 0, 0]), fist=0.25)
            else:
                spec[f'arm{s_}'] = dict(at=[sx * 1.9, WRIST_FLAT, 2.8], elbow=nz([sx * 0.4, 0, -1]), hand=FWD, palm=DOWN, fist=-1)
        return spec
    # planche et pieds qui reculent / reviennent (mains fixes au sol)
    sp = plank_body(P, 26, 0)
    sh = measure(P, sp, ['shoulders'])['shoulders']
    wrist = np.array([0, WRIST_FLAT, sh[2] - 0.3])
    sp.update(view=(-74, 8), focus=['quads', 'glutes', 'pecs'])
    for s_, sx in (('L', 1), ('R', -1)):
        sp[f'arm{s_}'] = dict(at=wrist + [sx * 2.4, 0, 0], elbow=nz([sx * 0.3, 0.2, -1]), hand=FWD, palm=DOWN, fist=-1)
    kR, kL = BURPEE_LEGS[ph]
    plank_leg(P, sp, 'R', kR, lift=0.8)
    plank_leg(P, sp, 'L', kL, lift=0.8)
    return sp


def fente_arriere(P, p):
    """Fentes arrière alternées : b = recul de la jambe (0 debout → 1 en bas), side = 'R' ou 'L',
    lift = pied arrière en l'air (aller ou retour)."""
    h = P.h
    b = p['b']; side = p['side']; lift = p.get('lift', 0.0)
    back_leg = side
    front_leg = 'L' if side == 'R' else 'R'
    sxb = -1 if back_leg == 'R' else 1
    sxf = -sxb
    hip_y = lerp(ANKLE + 8.62, FLOOR + 5.2, b)
    hip_z = lerp(0.0, -1.6, b)
    spec = dict(view=(-80, 7), focus=['glutes', 'quads'], body=(nz([0, 1, 0.04 * b]), FWD), neck=(UP, FWD), head=(UP, FWD))
    spec = place(P, spec, 'hips', [0, hip_y, hip_z])
    spec[f'leg{front_leg}'] = dict(at=[sxf * 1.1, ANKLE, 0.0], knee=nz([sxf * 0.1, 0, 1]), foot=FWD, top=UP)
    if b < 0.02 and lift < 0.02:
        spec[f'leg{back_leg}'] = dict(at=[sxb * 1.1, ANKLE, 0.0], knee=nz([sxb * 0.1, 0, 1]), foot=FWD, top=UP)
    else:
        ank = np.array([sxb * 1.1, lerp(ANKLE, FLOOR + 1.45, b) + 1.3 * lift, lerp(0.0, -7.4, b) - 1.2 * lift * (1 - b)])
        spec[f'leg{back_leg}'] = dict(at=ank, knee=nz([sxb * 0.05, -0.2, 1]), foot=nz([0, -0.55 * b, 1]), top=nz([0, 1, 0.55 * b]), toes=55 * b)
    for s_, sx in (('L', 1), ('R', -1)):
        d = nz([sx * 0.14, -1, 0.06])
        spec[f'arm{s_}'] = dict(up=d, fo=nz(d + [0, 0, 0.15]), hand=d, palm=nz([-sx, 0, 0]), fist=0.3)
    return spec


# ═══════════════ P · barre ═══════════════
BAR_Y = FLOOR + 21.5


def hang(P, k=0.0, pull=0.0, knees=0.0, view=(-48, 4), focus=('forearms', 'lats')):
    """Suspendu à la barre (paumes vers l'avant) ; pull = traction (0 bras tendus → 1 menton
    au-dessus), knees = genoux montés aux hanches."""
    h = P.h
    reach = sum(P.lengths('L')['arm'])
    grip_x = 3.1
    bar = np.array([0, BAR_Y, 0.25])
    wrist_y = BAR_Y - 0.62
    sh_y = lerp(wrist_y - reach * 0.985 + 0.25 * k, BAR_Y - 2.1, pull)
    lean = lerp(2, 14, pull)
    up_b = nz([0, np.cos(deg(lean)), -np.sin(deg(lean))])
    front_b = perp(FWD, up_b)
    curl = 32 * knees
    root_u = nz(ang(up_b, -curl * 0.5, front_b)) if knees else up_b
    spec = dict(view=view, focus=list(focus), bar=dict(c=bar, half=7.2),
                body=(root_u, perp(front_b, root_u)), chest=(up_b, front_b), neck=(up_b, front_b),
                head=(nz(up_b + [0, 0, 0.1 + 0.15 * pull]), nz([0, -0.15 + 0.2 * pull, 1])))
    spec = place(P, spec, 'shoulders', [0, sh_y, bar[2] - 0.55 - 0.6 * pull])
    for s_, sx in (('L', 1), ('R', -1)):
        w = np.array([sx * grip_x, wrist_y, bar[2] - 0.3])
        spec[f'arm{s_}'] = dict(at=w, elbow=nz([sx * 0.8, -0.3, -0.4 if pull else -1]), hand=nz([0, 0.4, 0.92]), palm=nz([0, 0.0, 1]), fist=0.78)
        fl = lerp(4, 96, knees); bd = lerp(12, 100, knees)
        th = nz([sx * 0.06, -np.cos(deg(fl)), np.sin(deg(fl))])
        a2 = fl - bd
        sh = nz([sx * 0.03, -np.cos(deg(a2)), np.sin(deg(a2))])
        foot, top = foot_from(sh, FWD)
        spec[f'leg{s_}'] = dict(th=th, sh=sh, foot=nz(foot + [0, -0.35, 0]), top=top)
    return spec


def australian(P, p):
    """Tractions australiennes sous une barre à hauteur de taille : q = 0 bras tendus,
    q = 1 poitrine à la barre (le corps pivote autour des pieds)."""
    h = P.h
    q = p['q']
    bar_y = FLOOR + 11.0
    bar_z = 0.0
    reach = sum(P.lengths('L')['arm'])
    wrist_y = bar_y - 0.62
    knee = np.array([0, FLOOR + 1.22 + 4.47, -8.4])
    L_kt = 4.28 + 4.55
    # q = 0 : épaules sous la barre, bras tendus ; q = 1 : poitrine à la barre
    sh0_y = wrist_y - reach * 0.985
    sh1_y = bar_y - 1.65
    sh_y = lerp(sh0_y, sh1_y, q)
    dz = np.sqrt(max(0.1, L_kt ** 2 - (sh_y - knee[1]) ** 2))
    shoulder = np.array([0, sh_y, knee[2] + dz])
    up_b = nz(shoulder - knee)
    front_b = nz(perp(UP, up_b))
    spec = dict(view=(-74, 10), focus=['lats', 'upper_back', 'biceps'], bar=dict(c=np.array([0, bar_y, bar_z]), half=7.2, low=True, posts='far'),
                body=(up_b, front_b), chest=(up_b, front_b), neck=(up_b, front_b), head=(nz(up_b + front_b * 0.15), nz(front_b - up_b * 0.25)))
    spec = place(P, spec, 'shoulders', shoulder)
    for s_, sx in (('L', 1), ('R', -1)):
        w = np.array([sx * 3.0, wrist_y, bar_z - 0.25])
        spec[f'arm{s_}'] = dict(at=w, elbow=nz([sx * 0.7, -1, -0.5]), hand=nz([0, 0.45, 0.9]), palm=nz([0, 0.9, -0.45]), fist=0.78)
        hp = measure(P, spec, [f'upperleg01.{s_}'])[f'upperleg01.{s_}']
        spec[f'leg{s_}'] = dict(at=np.array([sx * 1.05, ANKLE, knee[2]]), knee=nz([sx * 0.1, 1, 0.3]), foot=FWD, top=UP)
    return spec


# ═══════════════ M · posture ═══════════════

def superman(P, p):
    """Superman : à plat ventre, bras tendus devant ; u = décollage (bras, poitrine, jambes)."""
    u = p['u']
    lift = 12 * u
    cu = nz(ang(PRONE[0], lift, UP))
    cf = perp(PRONE[1], cu)
    spec = dict(view=(-76, 14), focus=['lower_back', 'glutes', 'upper_back'], body=PRONE, chest=(cu, cf),
                neck=(nz(ang(PRONE[0], lift + 4, UP)), cf), head=(nz(ang(PRONE[0], lift + 6, UP)), nz(cf + [0, 0, -0.1])))
    spec = place(P, spec, 'hips', [0, 0, 0])
    for s_, sx in (('L', 1), ('R', -1)):
        d = nz(ang(FWD + [sx * 0.08, 0, 0], lift * 1.4, UP))
        spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=DOWN, elbow=UP, fist=0.15)
        dl = nz(ang(BACK + [sx * 0.05, 0, 0], lift * 0.9, UP))
        foot, top = foot_from(dl, DOWN)
        spec[f'leg{s_}'] = dict(th=dl, sh=dl, foot=nz([sx * 0.1, -0.35, -0.94]), top=nz([0, -0.94, 0.35]), knee=DOWN)
    return ground(P, spec)


def tirage_superman(P, p):
    """Tirage superman : à plat ventre, poitrine et bras décollés ; t = 0 bras tendus devant
    (pouces en haut), t = 1 coudes tirés vers les côtes, omoplates serrées."""
    t = p['t']
    lift = 11
    cu = nz(ang(PRONE[0], lift, UP))
    cf = perp(PRONE[1], cu)
    spec = dict(view=(-74, 14), focus=['upper_back', 'delt_rear', 'lats'], body=PRONE, chest=(cu, cf),
                neck=(nz(ang(PRONE[0], lift + 3, UP)), cf), head=(nz(ang(PRONE[0], lift + 5, UP)), cf))
    spec = place(P, spec, 'hips', [0, 0, 0])
    m = measure(P, spec, ['shoulders'])
    sh = m['shoulders']
    for s_, sx in (('L', 1), ('R', -1)):
        fwd = sh + np.array([sx * 2.6, 1.2, 4.9])
        pulled = sh + np.array([sx * 3.0, 0.9, -1.0])
        spec[f'arm{s_}'] = dict(at=lerp(fwd, pulled, t), elbow=nz([sx * 0.9, 0.25, -0.5]),
                                hand=nz(lerp([0, 0.15, 1], [0, 0.2, 1], t)), palm=nz([-sx, 0, 0]), fist=0.55)
        dl = nz(BACK + [sx * 0.05, 0.02, 0])
        spec[f'leg{s_}'] = dict(th=dl, sh=dl, foot=nz([sx * 0.1, -0.35, -0.94]), top=nz([0, -0.94, 0.35]), knee=DOWN)
    return ground(P, spec)


def pont(P, p):
    """Pont fessier : sur le dos, genoux pliés, pieds à plat ; b = bassin monté (genoux,
    hanches et épaules alignés)."""
    h = P.h
    b = p['b']
    sh = np.array([0, FLOOR + 1.15, 5.2])
    ank = np.array([0, ANKLE, -4.6])
    hip_low = np.array([0, FLOOR + 0.86, 0.4])
    knee_est = np.array([0, FLOOR + 1.22 + 4.4, -3.8])
    hip_high = sh + nz(knee_est - sh) * 4.65
    hip = lerp(hip_low, hip_high, b)
    up_b = nz(sh - hip)
    front_b = nz(perp(UP, up_b))
    spec = dict(view=(-72, 12), focus=['glutes', 'hams'], body=(up_b, front_b), chest=SUPINE if b < 0.2 else (nz(ang(SUPINE[0], -8 * b, DOWN)), SUPINE[1]),
                neck=SUPINE, head=(nz([0, 0.1, 1]), nz([0, 1, -0.1])))
    spec = place(P, spec, 'hips', hip)
    for s_, sx in (('L', -1), ('R', 1)):
        d = nz([sx * 0.25, -0.06, -1.0])
        spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=DOWN, elbow=UP, fist=-0.5)
        spec[f'leg{s_}'] = dict(at=ank + [sx * 1.2, 0, 0], knee=nz([sx * 0.15, 1, 0]), foot=nz([sx * 0.1, 0, -1]), top=UP)
    return rest_on(P, spec, ['spine01', 'spine02', 'neck', 'head', 'shoulder', 'clavicle'])


def chin_tucks(P, p):
    """Chin tucks assis en tailleur, dos droit, mains posées sur les genoux : u = 1 la
    tête recule à l'horizontale."""
    h = P.h
    u = p['u']
    spec = dict(view=(-88, 6), focus=['neck_back'], body=(nz([0, 1, -0.04]), FWD), chest=(UP, FWD),
                neck=(nz([0, 1, lerp(0.22, -0.05, u)]), FWD), head=(nz([0, 1, lerp(0.05, 0.12, u)]), nz([0, -0.04, 1])))
    spec = place(P, spec, 'hips', [0, 0, 0])
    m = measure(P, spec, ['upperleg01.L', 'upperleg01.R'])
    for s_, sx in (('L', 1), ('R', -1)):
        hp = m[f'upperleg01.{s_}']
        knee_dir = nz([sx * 0.78, 0.12, 0.62])
        knee_p = hp + knee_dir * 4.28
        ank = np.array([-sx * 1.3, hp[1] + 0.22, hp[2] + 3.2])
        spec[f'leg{s_}'] = dict(th=knee_dir, sh=nz(ank - knee_p), foot=nz([-sx * 0.6, -0.1, 0.8]), top=nz([sx * 0.2, 1, 0]))
    spec = rest_on(P, spec, ['spine05', 'pelvis'])
    # les mains se posent sur les genoux, une fois le corps assis au sol
    G, L, t = P.solve(spec)
    h.pose(G, L, t)
    for s_, sx in (('L', 1), ('R', -1)):
        knee = jpos(h, f'lowerleg01.{s_}')
        spec[f'arm{s_}'] = dict(at=knee + [-sx * 0.5, 0.75, -0.5], elbow=nz([sx * 0.5, -0.2, -1]), hand=nz([sx * 0.2, -0.8, 0.5]), palm=DOWN, fist=0.2)
    return spec


def passage(P, p):
    """Passage d'épaules à l'élastique, à genoux : a = 0 bras devant, 1 au-dessus de la tête,
    2 derrière ; bras tendus, mains très écartées."""
    a = p['a']
    spec = dict(view=(-80, 8), focus=['delt', 'pecs'], band_hands=True, body=(UP, FWD), chest=(UP, FWD), neck=(UP, FWD), head=(UP, FWD))
    knee_y = FLOOR + 0.5
    spec = place(P, spec, 'hips', [0, knee_y + 4.28, 0])
    theta = lerp(0, 205, a / 2)               # angle des bras depuis l'avant (0) vers l'arrière
    for s_, sx in (('L', 1), ('R', -1)):
        d = nz([sx * 0.62, np.sin(deg(theta)), np.cos(deg(theta))])
        spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=nz(np.cross(d, [sx, 0, 0])) if abs(d[0]) < 0.99 else DOWN, elbow=UP, fist=0.8)
        spec[f'leg{s_}'] = dict(th=nz([sx * 0.05, -1, 0]), sh=nz([0, 0.04, -1]), foot=nz([0, -0.2, -0.98]), top=nz([0, -0.98, 0.2]))
    return spec


def ecarte(P, p):
    """Écarté arrière à l'élastique noir, de face : o = 0 bras tendus devant, 1 bras en T."""
    o = p['o']
    spec = dict(view=(-10, 6), focus=['delt_rear', 'upper_back'], band_hands=True, body=(UP, FWD), neck=(UP, FWD), head=(UP, FWD))
    spec = place(P, spec, 'hips', [0, ANKLE + 8.62, 0])
    standing_legs(spec, 1.15, 0.0)
    for s_, sx in (('L', 1), ('R', -1)):
        a = lerp(12, 77, o)
        d = nz([sx * np.sin(deg(a)), -0.02, np.cos(deg(a))])
        spec[f'arm{s_}'] = dict(up=d, fo=d, hand=d, palm=DOWN, elbow=UP, fist=0.8)
    return spec


def etirement_pecs(P, p):
    """Étirement des pectoraux, doigts croisés dans le dos : e = mains qui montent."""
    e = p['e']
    spec = dict(view=(-66, 6), focus=['pecs', 'delt_front'], body=(UP, FWD), chest=(nz([0, 1, -0.05 - 0.05 * e]), FWD),
                neck=(UP, FWD), head=(UP, nz([0, 0.05, 1])))
    spec = place(P, spec, 'hips', [0, ANKLE + 8.62, 0])
    standing_legs(spec, 1.1, 0.0)
    m = measure(P, spec, ['hips'])
    behind = m['hips'] + np.array([0, -0.4 + 2.6 * e, -2.3 - 1.0 * e])
    for s_, sx in (('L', 1), ('R', -1)):
        spec[f'arm{s_}'] = dict(at=behind + [sx * 0.25, 0, 0], elbow=nz([sx * 0.4, 0, 0.3]), hand=nz([-sx * 0.8, -0.4, -0.4]), palm=nz([-sx, 0, 0]), fist=0.6)
    return spec


# ═══════════════ échauffement ═══════════════

def chat_vache(P, p):
    """Chat-vache à quatre pattes : v = 1 dos arrondi, menton rentré (chat) ; v = -1 dos
    creusé, poitrine vers le tapis, tête levée (vache). Mains sous les épaules, genoux
    sous les hanches."""
    v = p['v']
    hip = np.array([0, FLOOR + 0.5 + 4.25, -2.4])           # genoux au sol sous les hanches
    up_b = nz([0, 0.06 - 0.02 * v, 1])                        # le bassin bascule un peu
    down = DOWN
    chest_u = nz(ang(up_b, -14 * v, UP))                      # v < 0 : le dos s'arrondit vers le plafond
    spec = dict(view=(-80, 10), focus=['lower_back', 'abs'], body=(up_b, down),
                chest=(chest_u, perp(DOWN, chest_u)),
                neck=(nz(ang(chest_u, -30 * v - 8, UP)), perp(DOWN, nz(ang(chest_u, -30 * v - 8, UP)))),
                head=(nz(ang(chest_u, -48 * v - 12, UP)), perp(DOWN + FWD * 0.3 * v, nz(ang(chest_u, -48 * v - 12, UP)))))
    spec = place(P, spec, 'hips', hip)
    sh = measure(P, spec, ['shoulders'])['shoulders']
    for s_, sx in (('L', 1), ('R', -1)):
        spec[f'arm{s_}'] = dict(at=np.array([sx * 1.9, WRIST_FLAT, sh[2] + 0.2]), elbow=nz([sx * 0.2, 0, -1]), hand=FWD, palm=DOWN, fist=-1)
        hp = measure(P, spec, [f'upperleg01.{s_}'])[f'upperleg01.{s_}']
        knee = np.array([sx * 1.0, FLOOR + 0.5, hp[2]])
        spec[f'leg{s_}'] = dict(th=nz(knee - hp), sh=nz([0, 0.05, -1]), foot=nz([0, -0.25, -0.97]), top=nz([0, -0.97, 0.25]))
    return spec


def montees(P, p):
    """Montées de genoux lentes, sur place : r = 1 genou droit monté à la hanche (bras
    gauche devant), r = -1 le gauche, r = 0 debout ; les bras balancent comme en courant."""
    r = p['r']
    spec = dict(view=(-66, 6), focus=['hipflex', 'quads'], body=(UP, FWD), neck=(UP, FWD), head=(UP, FWD))
    spec = place(P, spec, 'hips', [0, ANKLE + 8.62, 0])
    standing_legs(spec, 1.0, 0.0)
    for s_, sx, kk in (('R', -1, max(0.0, r)), ('L', 1, max(0.0, -r))):
        if kk > 1e-3:
            fl = 92 * kk; bd = 95 * kk
            th = nz([sx * 0.06, -np.cos(deg(fl)), np.sin(deg(fl))])
            a2 = fl - bd
            sh = nz([sx * 0.03, -np.cos(deg(a2)), np.sin(deg(a2))])
            spec[f'leg{s_}'] = dict(th=th, sh=sh, foot=nz(perp(FWD + DOWN * 0.3, sh)), top=-sh)
    for s_, sx in (('L', 1), ('R', -1)):
        swing = r if s_ == 'L' else -r          # le bras opposé au genou monte devant
        up = nz([sx * 0.1, -np.cos(deg(38 * swing)), np.sin(deg(38 * swing))])
        fo = nz(ang(up, 85, FWD + UP * 0.2)) if swing > -0.2 else nz(ang(up, 35, FWD))
        spec[f'arm{s_}'] = dict(up=up, fo=fo, hand=fo, palm=nz([-sx, 0, 0]), fist=0.55)
    return spec


def pompes_genoux(P, p):
    """Pompes sur les genoux : genoux au sol, pieds croisés en l'air, corps droit des genoux
    aux épaules ; k = 0 bras tendus, k = 1 poitrine près du sol."""
    h = P.h
    k = p['k']
    reach = sum(P.lengths('L')['arm'])
    L1 = P.lengths('L')['leg'][0]
    knee_z = -3.2

    def place_ang(an):
        up = np.array([0, np.sin(an), np.cos(an)]); belly = np.array([0, -np.cos(an), np.sin(an)])
        sp = dict(view=(-74, 12), focus=['pecs', 'triceps'], body=(up, belly), neck=(up, belly),
                  head=(nz(up + [0, 0.1, 0]), nz(belly + [0, 0, 0.3])))
        sp = place(P, sp, 'hips', np.array([0, FLOOR + 0.5, knee_z]) + up * L1)
        return sp, measure(P, sp, ['shoulders'])['shoulders']

    def angle_for(y):
        lo, hi = 0.0, 1.2
        for _ in range(30):
            mid = (lo + hi) / 2
            if place_ang(mid)[1][1] < y: lo = mid
            else: hi = mid
        return (lo + hi) / 2
    a_top = angle_for(WRIST_FLAT + reach * 0.96)
    _, sh_top = place_ang(a_top)
    a_low = angle_for(FLOOR + 2.3)
    spec, _ = place_ang(a_top + (a_low - a_top) * k)
    for s_, sx in (('L', 1), ('R', -1)):
        spec[f'arm{s_}'] = dict(at=np.array([sx * 2.5, WRIST_FLAT, sh_top[2] - 0.2]), elbow=nz([sx * 0.6, 0.3, -1]),
                                hand=FWD, palm=DOWN, fist=-1)
        hp = measure(P, spec, [f'upperleg01.{s_}'])[f'upperleg01.{s_}']
        knee = np.array([sx * 0.9, FLOOR + 0.5, knee_z])
        sh = nz([-sx * 0.12, np.sin(deg(28)), -np.cos(deg(28))])
        spec[f'leg{s_}'] = dict(th=nz(knee - hp), sh=sh, foot=nz(perp([0, -0.2, -1], sh)), top=-sh)
    return spec


# ═══════════════ catalogue ═══════════════

def seq(key, a, b, n):
    return [{key: lerp(a, b, i / (n - 1)) if not isinstance(a, dict) else None} for i in range(n)]


def pp(n):
    """Aller-retour entre deux poses : n images, segments aller et retour."""
    f = list(range(n))
    return [f, f[::-1]]


EX = {}
ALIAS = {}


def add(name, slug, build, frames, segs, side=None):
    """name : le nom du bonhomme dans js/poses.js ; side : côté dessiné ('droite' ou
    'gauche'), l'autre côté sera le même dessin en miroir."""
    EX[name] = dict(slug=slug, build=build, frames=frames, segs=segs, side=side)


def alias(name, of, segs):
    """Un autre bonhomme qui joue les mêmes images dans un autre ordre."""
    ALIAS[name] = dict(of=of, segs=segs)


# A
add('Crunch vélo', 'crunch-velo', crunch_velo, [dict(s=v) for v in (1, 0.4, -0.4, -1)], [[0, 1, 2, 3], [3, 2, 1, 0]])
add('Roue abdominale à genoux', 'roue', roue, [dict(r=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Russian twist', 'russian-twist', russian, [dict(r=v) for v in (0, 0.5, 1, -0.5, -1)], [[0, 1, 2], [2, 1, 0], [0, 3, 4], [4, 3, 0]])
add('Crunch inversé', 'crunch-inverse', crunch_inverse, [dict(c=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Planche latérale', 'planche-laterale', planche_laterale, [dict(a=v) for v in np.linspace(0, 1, 5)], pp(5), side='droite')
add('Hollow hold genoux pliés', 'hollow', hollow, [dict(k=v) for v in (0, 0.5, 1)], pp(3))
# B
add('Pompes (sur parallettes)', 'pompes-parallettes', lambda P, p: pushup(P, p['t']), [dict(t=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Rowing penché à l’élastique', 'rowing', rowing, [dict(p=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Pompes pike', 'pompes-pike', pike, [dict(k=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Tirage assis à l’élastique', 'tirage-assis', tirage_assis, [dict(q=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Pompes serrées', 'pompes-serrees', pompes_serrees, [dict(k=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Curl biceps à l’élastique', 'curl', curl, [dict(c=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Élévations latérales à l’élastique', 'elevations-laterales', lambda P, p: lateral(P, p['t']), [dict(t=v) for v in np.linspace(0, 1, 5)], pp(5))
add('L-sit', 'l-sit', lsit, [dict(l=0, g=0), dict(l=0.5, g=0), dict(l=1, g=0), dict(l=1, g=0.5), dict(l=1, g=1)],
    [[0, 1, 2], [2, 3, 4], [4, 3, 2], [2, 1, 0]])
# C
add('Shadow boxing', 'shadow-boxing', boxe, [dict(j=0, c=0), dict(j=0.5, c=0), dict(j=1, c=0), dict(j=0, c=0.5), dict(j=0, c=1)],
    [[0, 1, 2], [2, 1, 0], [0, 3, 4], [4, 3, 0]])
alias('Shadow boxing rapide', 'Shadow boxing', [[0, 1, 2], [2, 1, 0, 3, 4], [4, 3, 0]])      # garde, direct, direct arrière
add('Burpees sans saut', 'burpees', burpee, [dict(ph=i) for i in range(10)],
    [[0, 9, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7], [7, 8], [8, 1], [1, 9, 0]])
add('Shadow boxing (esquives et crochets)', 'esquives-crochets', esquive,
    [dict(e=0, k=0), dict(e=-1, k=0), dict(e=-0.4, k=-1), dict(e=1, k=0), dict(e=0.4, k=1), dict(e=-0.5, k=0), dict(e=0.5, k=0)],
    [[0, 5, 1], [1, 2], [2, 0], [0, 6, 3], [3, 4], [4, 0]])
add('Mountain climbers rapides', 'mountain-climbers', climbers,
    [dict(kL=0, kR=0), dict(kL=0, kR=0.5), dict(kL=0, kR=1), dict(kL=0.5, kR=0), dict(kL=1, kR=0)],
    [[0, 1], [1, 2], [2, 1], [1, 0], [0, 3], [3, 4], [4, 3], [3, 0]])
add('Fentes arrière alternées', 'fentes-arriere', fente_arriere,
    [dict(b=0, side='R'), dict(b=0.35, side='R', lift=0.6), dict(b=1, side='R'), dict(b=0.35, side='L', lift=0.6), dict(b=1, side='L')],
    [[0, 1], [1, 2], [2, 1], [1, 0], [0, 3], [3, 4], [4, 3], [3, 0]])
# P
add('Suspension à la barre', 'suspension', lambda P, p: hang(P, k=p['k']), [dict(k=0), dict(k=0.5), dict(k=1)], pp(3))
add('Tractions', 'tractions', lambda P, p: hang(P, pull=p['q'], focus=('lats', 'biceps')), [dict(q=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Tractions australiennes', 'tractions-australiennes', australian, [dict(q=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Relevés de genoux suspendu', 'releves-genoux', lambda P, p: hang(P, knees=p['g'], focus=('abs', 'hipflex', 'forearms')), [dict(g=v) for v in np.linspace(0, 1, 5)], pp(5))
# échauffement
add('Chat-vache', 'chat-vache', chat_vache, [dict(v=v) for v in (1, 0, -1)], pp(3))      # chat, puis vache
add('Montées de genoux lentes', 'montees-genoux', montees, [dict(r=v) for v in (1, 0.5, 0, -0.5, -1)],
    [[0, 1, 2], [2, 3, 4], [4, 3, 2], [2, 1, 0]])
add('Pompes sur les genoux', 'pompes-genoux', pompes_genoux, [dict(k=v) for v in np.linspace(0, 1, 5)], pp(5))
# M
add('Fente basse', 'fente-basse', lambda P, p: lunge(P, p['t']), [dict(t=v) for v in np.linspace(0, 1, 5)], pp(5), side='droite')
add('Superman', 'superman', superman, [dict(u=v) for v in (0, 0.33, 0.67, 1)], [[0, 1, 2, 3], [3], [3, 2, 1, 0], [0]])
add('Pont fessier', 'pont-fessier', pont, [dict(b=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Tirage superman', 'tirage-superman', tirage_superman, [dict(t=v) for v in (0, 0.5, 1)], [[0, 1, 2], [2], [2, 1, 0]])
add('Chin tucks', 'chin-tucks', chin_tucks, [dict(u=v) for v in (0, 0.5, 1)], [[0, 1, 2], [2], [2], [2, 1, 0], [0]])
add('Passage d’épaules à l’élastique', 'passage-epaules', passage, [dict(a=v) for v in (0, 0.5, 1, 1.5, 2)], [[0, 1, 2], [2, 3, 4], [4, 3, 2], [2, 1, 0]])
add('Écarté arrière à l’élastique', 'ecarte-arriere', ecarte, [dict(o=v) for v in np.linspace(0, 1, 5)], pp(5))
add('Étirement des pectoraux mains dans le dos', 'etirement-pectoraux', etirement_pecs, [dict(e=v) for v in (0, 0.5, 1)], pp(3))


def register():
    """Une fonction par exercice pour render.py : POSES[slug](P, t) avec t = n° d'image."""
    for name, ex in EX.items():
        def f(P, t, ex=ex):
            sp = ex['build'](P, ex['frames'][int(round(t))])
            sp['_frames'] = len(ex['frames'])
            return sp
        f.frames = len(ex['frames'])
        POSES[ex['slug']] = f


register()
