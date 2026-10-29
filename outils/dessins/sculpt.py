"""Relief des muscles (abdos, V, pectoraux, dentelés…) : sillons creusés sur le
corps au repos, puis reportés sur le corps posé (le long des normales).
Repère MakeHuman au repos : x = gauche du perso, y = haut, z = devant (dm)."""
import numpy as np


def seg_dist(P, A, B):
    """Distance des points P (n×2) au segment AB."""
    AB = B - A
    t = np.clip(((P - A) @ AB) / max(AB @ AB, 1e-12), 0, 1)
    Q = A + t[:, None] * AB
    return np.linalg.norm(P - Q, axis=1)


def line_dist(P, pts):
    pts = np.asarray(pts, float)
    return np.min([seg_dist(P, pts[k], pts[k + 1]) for k in range(len(pts) - 1)], axis=0)


# sillons (côté gauche, x ≥ 0 ; le côté droit est en miroir) : points, profondeur, largeur
GROOVES = [
    # ligne blanche : du bas-ventre au sternum
    ([(0, 2.0), (0, 4.2)], 0.06, 0.1),
    # intersections des abdos (3 rangées au-dessus du nombril)
    ([(0, 2.93), (0.42, 2.99), (0.86, 3.07)], 0.055, 0.09),
    ([(0, 3.43), (0.42, 3.48), (0.9, 3.58)], 0.06, 0.09),
    ([(0, 3.9), (0.45, 3.95), (0.95, 4.05)], 0.05, 0.085),
    # bord externe des abdos (ligne semi-lunaire)
    ([(0.48, 1.25), (0.74, 2.0), (0.9, 2.8), (1.0, 3.55), (1.08, 4.1)], 0.085, 0.1),
    # le V (pli de l'aine) : de la hanche vers le pubis
    ([(1.5, 2.45), (1.2, 1.85), (0.75, 1.3), (0.38, 1.0)], 0.11, 0.12),
    # bas des pectoraux
    ([(0, 4.3), (0.6, 4.27), (1.2, 4.28), (1.65, 4.5), (2.0, 4.85)], 0.11, 0.12),
    # entre les pectoraux (sternum)
    ([(0, 4.35), (0, 5.45)], 0.05, 0.11),
    # dentelés : trois doigts obliques sur le côté des côtes
    ([(1.82, 4.38), (1.46, 4.1)], 0.055, 0.06),
    ([(1.84, 4.08), (1.47, 3.8)], 0.055, 0.06),
    ([(1.8, 3.78), (1.46, 3.55)], 0.05, 0.06),
    # sillon entre épaule et pectoral
    ([(1.35, 5.75), (1.72, 5.28), (2.08, 4.88)], 0.07, 0.1),
]


def height(R, Nr, scale=1.0):
    """R : sommets au repos (n×3), Nr : leurs normales. Renvoie le déplacement (dm, < 0 = creux)."""
    P = np.c_[np.abs(R[:, 0]), R[:, 1]]
    front = np.clip((R[:, 2] - 0.15) / 0.35, 0, 1) * np.clip((Nr[:, 2] + 0.35) / 0.5, 0, 1)
    torso = (R[:, 1] > 0.6) & (R[:, 1] < 6.0) & (np.abs(R[:, 0]) < 2.3)
    d = np.zeros(len(R))
    for pts, depth, sig in GROOVES:
        dist = line_dist(P, pts)
        d -= depth * np.exp(-dist ** 2 / (2 * sig * sig))
    # chaque bloc des abdos est une bosse arrondie (3 rangées × 2), plus le bas du ventre
    for cy, hgt in ((3.18, 0.06), (3.68, 0.065), (4.07, 0.05), (2.45, 0.035)):
        d += hgt * np.exp(-((P[:, 0] - 0.44) / 0.27) ** 2 - ((P[:, 1] - cy) / (0.2 if cy > 2.6 else 0.35)) ** 2)
    # pectoraux, obliques au-dessus de la hanche, doigts des dentelés
    d += 0.06 * np.exp(-((P[:, 0] - 0.95) / 0.7) ** 2 - ((P[:, 1] - 4.85) / 0.42) ** 2)
    d += 0.04 * np.exp(-((P[:, 0] - 1.3) / 0.22) ** 2 - ((P[:, 1] - 2.5) / 0.4) ** 2)
    for cy in (4.22, 3.93, 3.66):
        d += 0.03 * np.exp(-((P[:, 0] - 1.62) / 0.16) ** 2 - ((P[:, 1] - cy) / 0.09) ** 2)
    return d * front * torso * scale


def _nz(v):
    v = np.asarray(v, float); return v / np.linalg.norm(v)


def _perp(v, a):
    v = np.asarray(v, float) - a * (np.asarray(v, float) @ a); return v / np.linalg.norm(v)


def limbs(R, bone, h, scale=1.0):
    """Relief des bras et des jambes, dans le repère de chaque os (au repos).
    bone : nom de l'os principal de chaque sommet."""
    d = np.zeros(len(R))
    H = h.head
    def seg(names, A, B, side):
        sel = np.isin(bone, names)
        if not sel.any(): return None
        a = _nz(B - A); Lg = np.linalg.norm(B - A)
        f = _perp([0, 0, 1], a); l = _perp([1 if side == 'L' else -1, 0, 0], a)
        P = R[sel] - A
        t = (P @ a) / Lg
        rv = P - np.outer(P @ a, a)
        rl = np.linalg.norm(rv, axis=1)
        phi = np.degrees(np.arctan2(rv @ f, rv @ l))
        return sel, t, phi, rl, Lg
    def groove_t(t, rl, Lg, tb, depth, sig):
        return -depth * np.exp(-((t - tb) * Lg) ** 2 / (2 * sig * sig))
    def groove_phi(phi, rl, ph0, depth, sig):
        dp = np.radians((phi - ph0 + 180) % 360 - 180) * rl
        return -depth * np.exp(-dp ** 2 / (2 * sig * sig))
    def window(t, t0, t1, soft=0.06):
        return np.clip((t - t0) / soft, 0, 1) * np.clip((t1 - t) / soft, 0, 1)
    for s in 'LR':
        # bras : deltoïde (bord en V), sillon biceps / triceps, biceps qui bombe
        r = seg([f'upperarm01.{s}', f'upperarm02.{s}', f'shoulder01.{s}'], H[f'upperarm01.{s}'], H[f'lowerarm01.{s}'], s)
        if r:
            sel, t, phi, rl, Lg = r
            tb = 0.42 - 0.26 * (np.minimum(np.abs(phi), 100) / 90) ** 1.4
            dd = groove_t(t, rl, Lg, tb, 0.075, 0.07) * (np.abs(phi) < 108)
            dd += groove_phi(phi, rl, -8, 0.05, 0.07) * window(t, 0.44, 0.92)
            dd += 0.035 * np.exp(-((t - 0.6) / 0.18) ** 2 - (((phi - 80 + 180) % 360 - 180) / 38) ** 2)
            dd += 0.03 * np.exp(-((t - 0.2) / 0.16) ** 2 - (phi / 70) ** 2)
            d[sel] += dd
        # avant-bras : le long muscle du dessus
        r = seg([f'lowerarm01.{s}', f'lowerarm02.{s}'], H[f'lowerarm01.{s}'], H[f'wrist.{s}'], s)
        if r:
            sel, t, phi, rl, Lg = r
            d[sel] += groove_phi(phi, rl, 28, 0.04, 0.06) * window(t, 0.05, 0.55) + 0.025 * np.exp(-((t - 0.22) / 0.15) ** 2 - (((phi - 60 + 180) % 360 - 180) / 40) ** 2)
        # cuisse : quadriceps (sillons de devant, goutte au-dessus du genou), couturier
        r = seg([f'upperleg01.{s}', f'upperleg02.{s}'], H[f'upperleg01.{s}'], H[f'lowerleg01.{s}'], s)
        if r:
            sel, t, phi, rl, Lg = r
            dd = groove_phi(phi, rl, 42, 0.05, 0.09) * window(t, 0.25, 0.86)
            dd += groove_phi(phi, rl, 118, 0.045, 0.08) * window(t, 0.6, 0.86)
            ph_s = 70 + (t - 0.08) / 0.82 * 90
            dd += groove_phi(phi, rl, ph_s, 0.035, 0.08) * window(t, 0.1, 0.88)
            dd += 0.04 * np.exp(-((t - 0.86) / 0.07) ** 2 - (((phi - 140 + 180) % 360 - 180) / 30) ** 2)
            dd += 0.03 * np.exp(-((t - 0.5) / 0.25) ** 2 - (((phi - 85 + 180) % 360 - 180) / 30) ** 2)
            d[sel] += dd
        # mollet : les deux têtes et leur bord en V
        r = seg([f'lowerleg01.{s}', f'lowerleg02.{s}'], H[f'lowerleg01.{s}'], H[f'foot.{s}'], s)
        if r:
            sel, t, phi, rl, Lg = r
            back = ((phi + 90 + 180) % 360 - 180)
            dd = groove_phi(phi, rl, -90, 0.035, 0.06) * window(t, 0.12, 0.42)
            tb = 0.48 + 0.14 * np.minimum(np.abs(back), 75) / 60
            dd += groove_t(t, rl, Lg, tb, 0.045, 0.06) * (np.abs(back) < 80)
            d[sel] += dd
    return d * scale


def _seg3(P, A, B):
    """Distance de points 3D au segment AB."""
    A = np.asarray(A, float); B = np.asarray(B, float)
    AB = B - A
    t = np.clip(((P - A) @ AB) / (AB @ AB), 0, 1)
    return np.linalg.norm(P - (A + t[:, None] * AB), axis=1)


def extra(R, Nr, bone, h, scale=1.0):
    """Plus de détails : cou, clavicules, dos, têtes du deltoïde, triceps, avant-bras,
    veines, genou, tibia, tendon d'Achille, flancs."""
    d = np.zeros(len(R))
    x, y, z = R[:, 0], R[:, 1], R[:, 2]
    P = np.c_[np.abs(x), y]
    on_limb = np.array([b.startswith(('upperarm', 'lowerarm', 'wrist', 'finger', 'metacarpal', 'upperleg', 'lowerleg', 'foot', 'toe')) for b in bone])
    trunk = ~on_limb
    g = lambda dist, depth, sig: depth * np.exp(-dist ** 2 / (2 * sig * sig))
    # cou : les deux muscles en V (du derrière de l'oreille au haut du sternum) et le creux entre eux
    for sx in (1, -1):
        d += trunk * g(_seg3(R, (sx * 0.58, 7.5, 0.05), (sx * 0.14, 5.97, 0.78)), 0.04, 0.085)
        # clavicule : un relief, et le creux juste dessous
        d += trunk * g(_seg3(R, (sx * 0.22, 5.98, 0.8), (sx * 1.95, 6.05, 0.22)), 0.03, 0.06)
        d -= trunk * g(_seg3(R, (sx * 0.5, 5.72, 0.85), (sx * 1.7, 5.75, 0.55)), 0.02, 0.08)
    d -= trunk * g(_seg3(R, (0, 6.0, 0.85), (0, 6.35, 0.75)), 0.03, 0.07)
    # dos : sillon de la colonne, muscles le long, omoplates, bord des grands dorsaux
    back = trunk * np.clip((-z - 0.1) / 0.3, 0, 1) * np.clip((-Nr[:, 2] + 0.2) / 0.5, 0, 1)
    dd = -g(line_dist(P, [(0, 1.6), (0, 6.3)]), 0.05, 0.08)
    dd += g(line_dist(P, [(0.42, 1.7), (0.45, 3.9)]), 0.035, 0.2)
    dd -= g(line_dist(P, [(0.78, 5.5), (0.85, 4.45), (1.1, 4.1)]), 0.03, 0.07)
    dd += g(line_dist(P, [(0.7, 5.55), (1.9, 5.88)]), 0.03, 0.07)
    dd -= g(line_dist(P, [(2.05, 4.75), (1.75, 3.8), (1.35, 2.7)]), 0.04, 0.09)
    d += back * dd
    # flancs : fibres de l'oblique externe, discrètes ; ligne basse des abdos
    front = trunk * np.clip((z - 0.0) / 0.3, 0, 1)
    for a, b in (((1.62, 3.62), (1.22, 3.02)), ((1.66, 3.27), (1.26, 2.67)), ((1.62, 2.92), (1.3, 2.38))):
        d -= front * g(line_dist(P, [a, b]), 0.02, 0.05)
    d -= front * g(line_dist(P, [(0, 2.5), (0.7, 2.56)]), 0.02, 0.07)

    H = h.head
    def seg(names, A, B, side):
        sel = np.isin(bone, names)
        a = _nz(B - A); Lg = np.linalg.norm(B - A)
        f = _perp([0, 0, 1], a); l = _perp([1 if side == 'L' else -1, 0, 0], a)
        Q = R - A
        t = (Q @ a) / Lg
        rv = Q - np.outer(Q @ a, a)
        rl = np.linalg.norm(rv, axis=1)
        phi = np.degrees(np.arctan2(rv @ f, rv @ l))
        return sel, t, phi, rl, Lg
    def wrap(p): return (p + 180) % 360 - 180
    def along(phi, rl, ph0, t, t0, t1, depth, sig, soft=0.06):
        dp = np.radians(wrap(phi - ph0)) * rl
        win = np.clip((t - t0) / soft, 0, 1) * np.clip((t1 - t) / soft, 0, 1)
        return depth * np.exp(-dp ** 2 / (2 * sig * sig)) * win
    for s in 'LR':
        sel, t, phi, rl, Lg = seg([f'upperarm01.{s}', f'upperarm02.{s}', f'shoulder01.{s}'], H[f'upperarm01.{s}'], H[f'lowerarm01.{s}'], s)
        tb = 0.42 - 0.26 * (np.minimum(np.abs(phi), 100) / 90) ** 1.4
        dd = -(along(phi, rl, 45, t, 0.02, 0.36, 0.025, 0.05) + along(phi, rl, -45, t, 0.02, 0.36, 0.025, 0.05)) * (t < tb)
        dd -= along(phi, rl, 35, t, 0.55, 0.9, 0.03, 0.06)
        hb = np.abs(wrap(phi + 90))
        tt = 0.62 + 0.15 * np.minimum(hb, 50) / 50
        dd -= 0.035 * np.exp(-((t - tt) * Lg) ** 2 / (2 * 0.06 ** 2)) * (hb < 55)
        dd += along(phi, rl, 62, t, 0.42, 0.95, 0.012, 0.022)          # veine du biceps
        d += sel * dd
        sel, t, phi, rl, Lg = seg([f'lowerarm01.{s}', f'lowerarm02.{s}'], H[f'lowerarm01.{s}'], H[f'wrist.{s}'], s)
        ph_v = 70 + 25 * t
        dd = -along(phi, rl, 95, t, 0.1, 0.6, 0.03, 0.06) - along(phi, rl, -95, t, 0.15, 0.7, 0.025, 0.06)
        dd += along(phi, rl, ph_v, t, 0.1, 0.85, 0.012, 0.022) + along(phi, rl, 20, t, 0.05, 0.55, 0.01, 0.02)
        d += sel * dd
        sel, t, phi, rl, Lg = seg([f'upperleg01.{s}', f'upperleg02.{s}'], H[f'upperleg01.{s}'], H[f'lowerleg01.{s}'], s)
        dd = -along(phi, rl, -12, t, 0.3, 0.95, 0.03, 0.07) - along(phi, rl, -90, t, 0.35, 0.85, 0.03, 0.07)
        dd += 0.03 * np.exp(-((t - 0.99) * Lg / 0.18) ** 2 - (wrap(phi - 90) / 28) ** 2)   # rotule
        d += sel * dd
        sel, t, phi, rl, Lg = seg([f'lowerleg01.{s}', f'lowerleg02.{s}'], H[f'lowerleg01.{s}'], H[f'foot.{s}'], s)
        dd = along(phi, rl, 62, t, 0.1, 0.6, 0.02, 0.07) - along(phi, rl, 32, t, 0.12, 0.6, 0.025, 0.05)
        dd += along(phi, rl, -90, t, 0.72, 0.98, 0.015, 0.035) - along(phi, rl, -55, t, 0.72, 0.97, 0.03, 0.04) - along(phi, rl, -125, t, 0.72, 0.97, 0.03, 0.04)
        d += sel * dd
    return d * scale


def phase_field(R, bone, h):
    """Champ pour les hachures en anneaux : la distance le long de l'os pour les membres,
    la hauteur pour le buste, le cou et la tête (en dm)."""
    H = h.head
    ph = R[:, 1].copy()
    segs = []
    for s in 'LR':
        segs += [((f'upperarm01.{s}', f'upperarm02.{s}', f'shoulder01.{s}'), f'upperarm01.{s}', f'lowerarm01.{s}'),
                 ((f'lowerarm01.{s}', f'lowerarm02.{s}', f'wrist.{s}'), f'lowerarm01.{s}', f'wrist.{s}'),
                 ((f'upperleg01.{s}', f'upperleg02.{s}'), f'upperleg01.{s}', f'lowerleg01.{s}'),
                 ((f'lowerleg01.{s}', f'lowerleg02.{s}'), f'lowerleg01.{s}', f'foot.{s}')]
    for names, a, b in segs:
        sel = np.isin(bone, names)
        A, B = H[a], H[b]
        ax = _nz(B - A)
        ph[sel] = (R[sel] - A) @ ax
    return ph
