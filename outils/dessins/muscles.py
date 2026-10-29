"""Où sont les muscles (sur le corps au repos), pour les colorier en rouge.
Repère MakeHuman au repos : x = gauche du perso, y = haut, z = devant (dm)."""
import numpy as np


def _nz(v):
    v = np.asarray(v, float); return v / np.linalg.norm(v)


def _perp(v, a):
    v = np.asarray(v, float) - a * (np.asarray(v, float) @ a); return v / np.linalg.norm(v)


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)


def band(x, lo, hi, soft):
    return ss(lo - soft, lo + soft, x) * (1 - ss(hi - soft, hi + soft, x))


def ang_band(phi, lo, hi, soft=12):
    """phi (degrés) entre lo et hi, bords doux."""
    mid = (lo + hi) / 2
    d = (phi - mid + 180) % 360 - 180
    half = (hi - lo) / 2
    return 1 - ss(half - soft, half + soft, np.abs(d))


ARM = ('upperarm', 'lowerarm', 'wrist', 'finger', 'metacarpal')


def mask(R, Nr, bone, h, groups):
    """Poids 0…1 par sommet pour les groupes demandés (ex. 'delt_lat', 'pecs', 'quads_R')."""
    H = h.head
    m = np.zeros(len(R))
    x, y, z = R[:, 0], R[:, 1], R[:, 2]
    ax = np.abs(x)
    on_arm = np.array([any(b.startswith(a) for a in ARM) for b in bone])
    torso = ~on_arm & ~np.array([b.startswith(('upperleg', 'lowerleg', 'foot', 'toe')) for b in bone])

    def seg(names, A, B, side):
        sel = np.isin(bone, names)
        a = _nz(B - A); Lg = np.linalg.norm(B - A)
        f = _perp([0, 0, 1], a); l = _perp([1 if side == 'L' else -1, 0, 0], a)
        P = R - A
        t = (P @ a) / Lg
        rv = P - np.outer(P @ a, a)
        phi = np.degrees(np.arctan2(rv @ f, rv @ l))
        return sel, t, phi

    for g in groups:
        side = g[-1] if g[-2:] in ('_L', '_R') else None
        name = g[:-2] if side else g
        sides = [side] if side else ['L', 'R']
        for s in sides:
            sx = 1 if s == 'L' else -1
            here = (x * sx) > -0.05
            if name.startswith('delt') or name in ('biceps', 'triceps'):
                sel, t, phi = seg([f'upperarm01.{s}', f'upperarm02.{s}', f'shoulder01.{s}'], H[f'upperarm01.{s}'], H[f'lowerarm01.{s}'], s)
                tb = 0.44 - 0.26 * (np.minimum(np.abs(phi), 100) / 90) ** 1.4
                delt = sel * (1 - ss(tb + 0.0, tb + 0.08, t)) * ss(-0.35, -0.15, t)
                if name == 'delt_lat': w = delt * ang_band(phi, -70, 70, 18)
                elif name == 'delt_front': w = delt * ang_band(phi, 25, 120, 15)
                elif name == 'delt_rear': w = delt * ang_band(phi, -120, -25, 15)
                elif name == 'delt': w = delt * ang_band(phi, -120, 120, 15)
                elif name == 'biceps': w = sel * band(t, 0.36, 0.9, 0.05) * ang_band(phi, 40, 140, 15)
                else: w = sel * band(t, 0.25, 0.92, 0.05) * ang_band(phi, -175, -40, 15)
            elif name == 'forearms':
                sel, t, phi = seg([f'lowerarm01.{s}', f'lowerarm02.{s}'], H[f'lowerarm01.{s}'], H[f'wrist.{s}'], s)
                w = sel * band(t, 0.02, 0.72, 0.06)
            elif name in ('quads', 'hams', 'hipflex'):
                sel, t, phi = seg([f'upperleg01.{s}', f'upperleg02.{s}'], H[f'upperleg01.{s}'], H[f'lowerleg01.{s}'], s)
                if name == 'quads': w = sel * band(t, 0.1, 0.9, 0.05) * ang_band(phi, -35, 165, 15)
                elif name == 'hams': w = sel * band(t, 0.12, 0.88, 0.05) * ang_band(phi, -160, -45, 15)
                else:  # fléchisseurs de la hanche : psoas (bas du ventre) et droit fémoral (bande de devant de la cuisse)
                    w = sel * band(t, -0.1, 0.86, 0.08) * ang_band(phi, 55, 125, 18)
                    w = np.maximum(w, torso * here * band(y, 0.85, 1.75, 0.12) * band(ax, 0.55, 1.45, 0.12) * ss(0.2, 0.5, z))
            elif name == 'calves':
                sel, t, phi = seg([f'lowerleg01.{s}', f'lowerleg02.{s}'], H[f'lowerleg01.{s}'], H[f'foot.{s}'], s)
                w = sel * band(t, 0.06, 0.6, 0.05) * ang_band(phi, -160, -20, 15)
            elif name == 'pecs':
                under = 4.3 + 0.55 * ss(1.1, 2.1, ax)
                w = torso * here * band(ax, 0.12, 2.15, 0.08) * ss(under - 0.06, under + 0.06, y) * (1 - ss(5.55, 5.75, y)) * ss(0.25, 0.6, z)
            elif name == 'abs':
                w = torso * here * band(ax, -0.1, 0.98, 0.06) * band(y, 1.3, 4.25, 0.08) * ss(0.4, 0.7, z)
            elif name == 'obliques':
                w = torso * here * band(ax, 0.98, 1.8, 0.08) * band(y, 1.9, 3.9, 0.12) * ss(-0.4, 0.0, z)
            elif name == 'lats':
                w = torso * here * band(ax, 0.7, 2.3, 0.1) * band(y, 3.0, 5.2, 0.15) * (1 - ss(-0.1, 0.25, z))
            elif name == 'glutes':
                w = torso * here * band(y, 0.3, 2.0, 0.12) * band(ax, -0.1, 1.85, 0.1) * (1 - ss(-0.45, -0.1, z))
            elif name == 'upper_back':   # rhomboïdes et trapèze moyen, entre les omoplates
                w = torso * here * band(ax, -0.1, 1.55, 0.1) * band(y, 4.3, 6.0, 0.15) * (1 - ss(-0.2, 0.15, z))
            elif name == 'traps':        # haut du trapèze, du cou aux épaules
                w = torso * here * band(ax, 0.3, 2.0, 0.12) * band(y, 5.75, 6.7, 0.12) * (1 - ss(0.0, 0.35, z))
            elif name == 'lower_back':   # muscles le long de la colonne (lombaires)
                w = torso * here * band(ax, -0.1, 0.95, 0.1) * band(y, 1.7, 4.4, 0.15) * (1 - ss(-0.35, -0.05, z))
            elif name in ('neck_back', 'neck_front'):
                neck = np.array([b.startswith('neck') for b in bone])
                back = name == 'neck_back'
                w = neck * (1 - ss(-0.05, 0.25, z - 0.2)) if back else neck * ss(0.25, 0.55, z - 0.2)
            else:
                continue
            m = np.maximum(m, w * (here if name not in ('delt_lat', 'delt_front', 'delt_rear', 'delt', 'biceps', 'triceps', 'forearms', 'quads', 'hams', 'hipflex', 'calves', 'neck_back', 'neck_front') else 1))
    return np.clip(m, 0, 1)


def fiber_field(R, bone, h):
    """Champ dont les lignes de niveau suivent les fibres des muscles (pour les
    hachures rouges) : le long des membres ; en éventail vers l'aisselle pour les
    pectoraux et les grands dorsaux ; en biais pour les obliques ; vertical pour les abdos."""
    H = h.head
    x, y, z = R[:, 0], R[:, 1], R[:, 2]
    ax = np.abs(x)
    f = y.copy()
    # buste
    front = z > 0.0
    pec = front & (y > 4.15)
    f[pec] = np.arctan2(y[pec] - 5.0, 2.2 - ax[pec]) * 1.6
    abd = front & (y <= 4.15) & (ax < 1.0)
    f[abd] = ax[abd]
    obl = (y <= 4.15) & (ax >= 1.0) & (z > -0.45)
    f[obl] = 0.7 * ax[obl] - 0.7 * y[obl]
    back = z <= 0.0
    lat = back & (y > 2.4) & (y < 5.3) & (ax > 0.6)
    f[lat] = np.arctan2(y[lat] - 4.9, 2.15 - ax[lat]) * 1.6
    glu = back & (y <= 2.4)
    f[glu] = 0.7 * ax[glu] + 0.7 * y[glu]
    ub = back & (y > 4.3) & (ax < 1.6)
    f[ub] = 0.8 * y[ub] - 0.6 * ax[ub]
    lb = back & (y > 1.7) & (y <= 4.3) & (ax < 0.95)
    f[lb] = ax[lb] * 1.6
    # membres : lignes le long de l'os (longueur d'arc autour du membre)
    for s in 'LR':
        for names, a, b in (((f'upperarm01.{s}', f'upperarm02.{s}', f'shoulder01.{s}'), f'upperarm01.{s}', f'lowerarm01.{s}'),
                            ((f'lowerarm01.{s}', f'lowerarm02.{s}', f'wrist.{s}'), f'lowerarm01.{s}', f'wrist.{s}'),
                            ((f'upperleg01.{s}', f'upperleg02.{s}'), f'upperleg01.{s}', f'lowerleg01.{s}'),
                            ((f'lowerleg01.{s}', f'lowerleg02.{s}'), f'lowerleg01.{s}', f'foot.{s}')):
            sel = np.isin(bone, names)
            if not sel.any(): continue
            A, B = H[a], H[b]
            axis = _nz(B - A)
            fr = _perp([0, 0, 1], axis); la = _perp([1 if s == 'L' else -1, 0, 0], axis)
            Q = R[sel] - A
            rv = Q - np.outer(Q @ axis, axis)
            rl = np.linalg.norm(rv, axis=1)
            phi = np.arctan2(rv @ fr, rv @ la)
            f[sel] = phi * np.maximum(rl, 0.3)
    return f
