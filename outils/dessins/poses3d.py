"""Poses en 3D : directions des os (repère MakeHuman : x = gauche du perso, y = haut, z = devant)."""
import numpy as np

def nz(v):
    v = np.asarray(v, float); return v / np.linalg.norm(v)

def perp(v, d):
    v = np.asarray(v, float); v = v - d * (v @ d); n = np.linalg.norm(v)
    return v / n if n > 1e-6 else None

def frame(d, p):
    d = nz(d); p = perp(p, d); return np.c_[d, p, np.cross(d, p)]

def rot(axis, ang):
    a = nz(axis); K = np.array([[0, -a[2], a[1]], [a[2], 0, -a[0]], [-a[1], a[0], 0]])
    return np.eye(3) + np.sin(ang) * K + (1 - np.cos(ang)) * K @ K

def arc(a, b):
    a = nz(a); b = nz(b); c = a @ b
    if c > 0.999999: return np.eye(3)
    if c < -0.999999:
        ax = perp([1, 0, 0], a); ax = ax if ax is not None else perp([0, 1, 0], a)
        return rot(ax, np.pi)
    return rot(np.cross(a, b), np.arccos(np.clip(c, -1, 1)))

def signed(a, b, axis):
    return np.arctan2(np.cross(a, b) @ axis, a @ b)

UP, FWD = np.array([0, 1., 0]), np.array([0, 0, 1.])


class Poser:
    def __init__(self, h):
        self.h = h
        H, T = h.head, h.tail
        self.r = {}
        for s in 'LR':
            up = nz(T[f'upperarm02.{s}'] - H[f'upperarm01.{s}'])
            fo = nz(T[f'lowerarm02.{s}'] - H[f'lowerarm01.{s}'])
            hd = nz(H[f'finger3-1.{s}'] - H[f'wrist.{s}'])
            across = nz(H[f'finger2-1.{s}'] - H[f'finger5-1.{s}'])
            palm = nz(np.cross(across, hd)) * (1 if s == 'R' else -1)
            th = nz(H[f'lowerleg01.{s}'] - H[f'upperleg01.{s}'])
            sh = nz(H[f'foot.{s}'] - H[f'lowerleg01.{s}'])
            ft = (T[f'foot.{s}'] - H[f'foot.{s}']) * [1, 0, 1]
            self.r[s] = dict(up=up, elbow=perp(up - fo, up), fo=fo, hd=hd, palm=palm, th=th, knee=perp(FWD, th), sh=sh, ft=nz(ft))

    def lengths(self, s):
        H = self.h.head
        return dict(arm=(np.linalg.norm(H[f'lowerarm01.{s}'] - H[f'upperarm01.{s}']), np.linalg.norm(H[f'wrist.{s}'] - H[f'lowerarm01.{s}'])),
                    leg=(np.linalg.norm(H[f'lowerleg01.{s}'] - H[f'upperleg01.{s}']), np.linalg.norm(H[f'foot.{s}'] - H[f'lowerleg01.{s}'])))

    def solve(self, spec):
        """spec : body=(haut, devant), chest, neck, head, drop (le bassin descend) ;
        armR/armL = dict(up, fo, hand, palm, fist) ou dict(at=cible du poignet, elbow=indice, ...) ;
        legR/legL = dict(th, sh, foot, top) ou dict(at=cible de la cheville, knee=indice, ...).
        Renvoie G, L et la translation du corps."""
        h = self.h
        G, L = {}, {}
        R0 = frame(UP, FWD)
        G['root'] = frame(*spec['body']) @ R0.T
        if 'chest' in spec: G['spine02'] = frame(*spec['chest']) @ R0.T
        if 'neck' in spec: G['neck01'] = frame(*spec['neck']) @ R0.T
        if 'head' in spec: G['head'] = frame(*spec['head']) @ R0.T
        body_front = nz(spec['body'][1])
        t = np.array(spec['move'], float) if 'move' in spec else np.array([0, -spec.get('drop', 0.0), 0])
        # cibles (cinématique inverse à deux os) : épaules et hanches une fois le buste placé
        if any('at' in (spec.get(k) or {}) for k in ('armR', 'armL', 'legR', 'legL')):
            h.pose(G, {}, t)
            for s in 'LR':
                ln = self.lengths(s)
                for kind, joint, hint_key, keys in (('arm', f'upperarm01.{s}', 'elbow', ('up', 'fo')), ('leg', f'upperleg01.{s}', 'knee', ('th', 'sh'))):
                    g = spec.get(f'{kind}{s}')
                    if not g or 'at' not in g: continue
                    root = (h.M[joint] @ np.r_[h.head[joint], 1])[:3]
                    d1, d2 = two_bone(root, np.asarray(g['at'], float), *ln[kind], np.asarray(g[hint_key], float))
                    g = dict(g); g[keys[0]] = d1; g[keys[1]] = d2
                    spec = dict(spec); spec[f'{kind}{s}'] = g
        for s in 'LR':
            r = self.r[s]
            a = spec.get(f'arm{s}')
            if a:
                up, fo = nz(a['up']), nz(a['fo'])
                pole = perp(up - fo, up)
                if pole is None or np.linalg.norm(up - fo) < 0.08: pole = perp(a.get('elbow', -body_front), up)
                Gu = frame(up, pole) @ frame(r['up'], r['elbow']).T
                G[f'upperarm01.{s}'] = Gu
                Gl = arc(Gu @ r['fo'], fo) @ Gu
                hand = nz(a.get('hand', fo))
                palm = a.get('palm')
                if palm is not None:
                    have = perp(Gl @ r['palm'], fo); want = perp(palm, fo)
                    tw = signed(have, want, fo) if have is not None and want is not None else 0
                    G[f'lowerarm01.{s}'] = rot(fo, tw * 0.45) @ Gl
                    G[f'lowerarm02.{s}'] = rot(fo, tw * 0.85) @ Gl
                    G[f'wrist.{s}'] = frame(hand, palm) @ frame(r['hd'], r['palm']).T
                else:
                    G[f'lowerarm01.{s}'] = Gl
                    G[f'wrist.{s}'] = arc(Gl @ r['hd'], hand) @ Gl
                self.fingers(L, s, a.get('fist', 0.25))
            g = spec.get(f'leg{s}')
            if g:
                th, sh = nz(g['th']), nz(g['sh'])
                pole = perp(th - sh, th)
                if pole is None or np.linalg.norm(th - sh) < 0.08: pole = perp(g.get('knee', body_front), th)
                Gt = frame(th, pole) @ frame(r['th'], r['knee']).T
                G[f'upperleg01.{s}'] = Gt
                Gs = arc(Gt @ r['sh'], sh) @ Gt
                G[f'lowerleg01.{s}'] = Gs
                foot = nz(g.get('foot', body_front))
                top = g.get('top', -sh)
                G[f'foot.{s}'] = frame(foot, top) @ frame(r['ft'], UP).T
                if g.get('toes'):  # orteils relevés (sur la pointe, orteils retournés)
                    for f_ in range(1, 6):
                        tb = f'toe{f_}-1.{s}'
                        if tb in h.head: L[tb] = rot([1, 0, 0], -np.radians(g['toes']))
        return G, L, t

    def fingers(self, L, s, k):
        """Doigts pliés : k = 0 tendus (mais détendus), 1 poing fermé ; k < 0 : main à plat
        (k = -1 : doigts bien droits, posés au sol)."""
        h = self.h
        r = self.r[s]
        flat = 1 + min(k, 0.0)
        k = max(k, 0.0)
        # angles (degrés) des trois articulations, de l'index à l'auriculaire ; un peu plus
        # fermés côté auriculaire, comme une vraie main
        for f, (a1, a2, a3) in {2: (78, 92, 40), 3: (82, 95, 42), 4: (86, 98, 44), 5: (90, 100, 46)}.items():
            for j, ang in zip((1, 2, 3), (a1, a2, a3)):
                b = f'finger{f}-{j}.{s}'
                if b not in h.head: continue
                d = nz(h.tail[b] - h.head[b])
                base = ((6, 10, 8)[j - 1] + (f - 2) * 2) * flat  # main au repos : un peu fléchie
                L[b] = rot(np.cross(d, r['palm']), np.radians(base + (ang - base) * k))
        for b, R in self.thumb(s, k, L).items(): L[b] = R

    def thumb(self, s, k, L):
        """Pouce : poing fermé, il se pose en travers des phalanges du milieu de l'index
        et du majeur ; main ouverte, il reste détendu le long de l'index."""
        key = (s, round(k, 2))
        if not hasattr(self, '_thumb'): self._thumb = {}
        if key in self._thumb: return self._thumb[key]
        from scipy.optimize import minimize
        h, r = self.h, self.r[s]
        H, T = h.head, h.tail
        def chain(bones, rots):
            R = np.eye(3); p = H[bones[0]].copy(); pts = []
            for b in bones:
                R = R @ rots.get(b, np.eye(3))
                p_t = p + R @ (T[b] - H[b]); pts.append((p, p_t)); p = p_t
            return pts
        fings = []
        for f in (2, 3, 4):
            fings += chain([f'metacarpal{f - 1}.{s}', f'finger{f}-1.{s}', f'finger{f}-2.{s}', f'finger{f}-3.{s}'], L)[1:]
        mids = [(seg[0] + seg[1]) / 2 for seg in fings[1::3][:2]]
        wr = H[f'wrist.{s}']
        across = nz(np.cross(r['palm'], r['hd']))
        bones = [f'finger1-1.{s}', f'finger1-2.{s}', f'finger1-3.{s}']
        d1 = nz(T[bones[0]] - H[bones[0]])
        palm_c = (H[f'finger2-1.{s}'] + H[f'finger5-1.{s}']) / 2 * 0.5 + wr * 0.5 + r['palm'] * 0.1
        pad = perp(palm_c - (H[bones[1]] + T[bones[1]]) / 2, d1)
        flex = nz(np.cross(d1, pad))                       # axe de flexion du pouce (au repos)
        if k > 0.5:
            target = mids[0] * 0.62 + mids[1] * 0.38 + r['palm'] * 0.17
        else:
            target = H[f'finger2-1.{s}'] * 0.5 + chain(bones, {})[-1][1] * 0.5 + across * -0.05
        def rots_of(x):
            R1 = rot(x[:3], np.linalg.norm(x[:3])) if np.linalg.norm(x[:3]) > 1e-9 else np.eye(3)
            ax = R1 @ flex
            return {bones[0]: R1, bones[1]: rot(ax, x[3]), bones[2]: rot(ax, x[4])}
        def seg_d(p, a, b):
            ab = b - a; t = np.clip((p - a) @ ab / (ab @ ab), 0, 1); return np.linalg.norm(p - (a + t * ab))
        def cost(x):
            pts = chain(bones, rots_of(x))
            tip = pts[-1][1]
            c = np.sum((tip - target) ** 2) * 10
            c += 2 * (max(0, (tip - wr) @ r['palm'] - 0.48)) ** 2 * 50          # ne dépasse pas sous le poing
            for q in (pts[1][0], (pts[1][0] + tip) / 2, tip):                   # ne traverse pas les doigts
                for a, b in fings:
                    dd = seg_d(q, a, b)
                    if dd < 0.2: c += (0.2 - dd) ** 2 * 60
            c += 0.02 * (np.linalg.norm(x[:3]) ** 2) + 0.2 * (max(0, -x[3]) + max(0, -x[4]) + max(0, x[3] - 1.4) + max(0, x[4] - 1.5))
            return c
        best = None
        for x0 in ([0, 0, 0, 0.3, 0.3], list(d1 * 0.6) + [0.5, 0.5], list(-d1 * 0.6) + [0.5, 0.5], list(r['hd'] * 0.8) + [0.6, 0.6], list(-r['hd'] * 0.8) + [0.6, 0.6]):
            res = minimize(cost, np.array(x0, float), method='Powell', options={'maxiter': 6000, 'xtol': 1e-4, 'ftol': 1e-7})
            if best is None or res.fun < best.fun: best = res
        out = rots_of(best.x)
        self._thumb[key] = out
        return out


def two_bone(root, target, l1, l2, hint):
    """Directions des deux os pour que le bout touche la cible ; le coude (ou le
    genou) part du côté de `hint`."""
    d = target - root; Ld = np.linalg.norm(d)
    Ld = np.clip(Ld, abs(l1 - l2) + 1e-3, l1 + l2 - 1e-3)
    dn = d / np.linalg.norm(d)
    ca = np.clip((l1 * l1 + Ld * Ld - l2 * l2) / (2 * l1 * Ld), -1, 1)
    pole = perp(hint, dn)
    if pole is None: pole = perp([0, 0, 1], dn)
    up = ca * dn + np.sqrt(1 - ca * ca) * pole
    mid = root + up * l1
    return up, nz(root + dn * Ld - mid)


def deg(a): return np.radians(a)
def turn(v, ang):  # tourne autour de la verticale (degrés, vers la gauche du perso)
    return rot(UP, deg(ang)) @ np.asarray(v, float)


POSES = {}
FLOOR = -8.72          # le sol (dm), sous les semelles des baskets
ANKLE = FLOOR + 0.91   # hauteur de la cheville, basket à plat sur le sol


def lerp(a, b, t): return np.asarray(a, float) * (1 - t) + np.asarray(b, float) * t


def _hip_rest(h):
    return (h.head['upperleg01.L'] + h.head['upperleg01.R']) / 2


def lateral(P, t=1.0):
    """Élévations latérales à l'élastique : debout sur l'élastique, les bras montent
    sur les côtés (un peu en avant) jusqu'à hauteur d'épaules, coudes un peu pliés."""
    th = np.radians(14 + (86 - 14) * t)          # angle du bras avec la verticale
    fw = np.radians(22)                           # un peu en avant (plan de l'omoplate)
    spec = dict(view='front34', band=['R', 'L'], focus=['delt_lat'], body=(UP, FWD), neck=(UP, FWD), head=(UP, FWD),
                drop=0.31)                        # les semelles posées sur le sol
    for s_, sx in (('L', 1), ('R', -1)):
        up = nz([sx * np.sin(th) * np.cos(fw), -np.cos(th), np.sin(th) * np.sin(fw)])
        fo = nz(up + np.array([0, 0.1 + 0.08 * t, 0.2]))
        palm = nz(np.cross(up, FWD) * sx) if t > 0.05 else nz([-sx, 0, 0])
        spec[f'arm{s_}'] = dict(up=up, fo=fo, hand=nz(fo + [0, -0.05, 0]), palm=palm, fist=0.85)
        spec[f'leg{s_}'] = dict(th=[sx * 0.06, -1, 0.0], sh=[sx * 0.02, -1, -0.02], foot=[sx * 0.15, 0, 1], top=UP)
    return spec


def pushup(P, t=1.0):
    """Pompes sur parallettes : t = 0 bras tendus, t = 1 en bas (poitrine juste sous les barres).
    Les chevilles restent au même endroit, les mains sur les barres, coudes à 45°."""
    h = P.h
    bar_y = FLOOR + 1.35
    wrist_y = bar_y + 0.86
    reach = sum(P.lengths('L')['arm'])
    def place(ang):
        up = np.array([0, np.sin(ang), np.cos(ang)]); belly = np.array([0, -np.cos(ang), np.sin(ang)])
        sp = dict(view='pushside', focus=['pecs', 'triceps', 'delt_front'], body=(up, belly), neck=(up, belly),
                  head=(nz(up + [0, 0.1, 0]), nz(belly + [0, 0, 0.3])))
        for s_, sg in (('L', 1), ('R', -1)):
            sp[f'leg{s_}'] = dict(th=-up + [sg * 0.02, 0, 0], sh=-up, foot=belly, top=up, toes=72)
        G, L, tr = P.solve(dict(sp, move=(0, 0, 0)))
        h.pose(G, {}, tr)
        ank = (h.M['foot.L'] @ np.r_[h.head['foot.L'], 1])[:3]
        sp['move'] = np.array([ank[0], FLOOR + 1.62, -9.0]) - ank
        sh = (h.M['upperarm01.L'] @ np.r_[h.head['upperarm01.L'], 1])[:3] + sp['move']
        return sp, sh
    def angle_for(sh_y):
        lo, hi = -0.2, 0.8
        for _ in range(40):
            mid = (lo + hi) / 2
            if place(mid)[1][1] < sh_y: lo = mid
            else: hi = mid
        return (lo + hi) / 2
    back = 1.4                       # en haut, les mains sont un peu en arrière des épaules (sous le haut du torse)
    a_top = angle_for(wrist_y + np.sqrt((reach * 0.985) ** 2 - back ** 2 - 0.55 ** 2))
    sp_top, sh_top = place(a_top)
    a_low = angle_for(FLOOR + 3.25)
    spec, _ = place(a_top + (a_low - a_top) * t)
    spec['parallettes'] = []
    for s_, sx in (('L', 1), ('R', -1)):
        bar = np.array([sx * 2.65, bar_y, sh_top[2] - back])
        spec['parallettes'].append(bar)
        spec[f'arm{s_}'] = dict(at=bar + [sx * 0.2, 0.86, 0], elbow=[sx * 0.6, 1, -0.15], hand=[0, -1, 0.05], palm=[-sx, 0, 0], fist=0.72)
    return spec


def boxing(P, t=1.0):
    """Shadow boxing : t = 0 en garde, t = 1 direct du bras avant (gauche) bras tendu.
    Pied gauche devant, genoux souples, talon arrière levé, poings au menton."""
    h = P.h
    turn_b = -38 - 8 * t
    spec = dict(view='boxside', focus=['delt', 'obliques'], body=(nz([0, 1, 0.1]), turn(FWD, turn_b)), chest=(nz([0, 1, 0.16]), turn(FWD, turn_b - 6 - 6 * t)),
                neck=(nz([0, 1, 0.28]), turn(FWD, -16)), head=(nz([0, 1, 0.12]), nz([0.02, -0.22, 1])))
    hip0 = _hip_rest(h)
    hip_goal = np.array([0.0, FLOOR + 9.55, 0.15 * t])
    spec['move'] = hip_goal - hip0
    G, _, tr = P.solve(spec)
    h.pose(G, {}, tr)
    pos = lambda b: (h.M[b] @ np.r_[h.head[b], 1])[:3]
    shL, head = pos('upperarm01.L'), pos('head')
    Rb = h.Rw['spine01']
    reach = sum(P.lengths('L')['arm']) * 0.96
    guard_L = head + Rb @ np.array([0.95, -1.35, 2.35])
    jab_L = shL + reach * nz([0.05, 0.04, 1])
    spec['armL'] = dict(at=lerp(guard_L, jab_L, t), elbow=[0.45, -1, -0.1 + 0.2 * t], hand=nz(lerp(Rb @ np.array([0.1, 0.9, 0.5]), [0.03, 0.04, 1], t)),
                        palm=nz(lerp(Rb @ np.array([-0.9, 0, -0.3]), [0, -1, 0], t)), fist=1)
    spec['armR'] = dict(at=head + Rb @ np.array([-1.0, -1.45, 1.45]), elbow=[-0.15, -1, 0.3], hand=nz(Rb @ np.array([0.2, 0.85, 0.5])),
                        palm=nz(Rb @ np.array([0.9, 0, -0.35])), fist=1)
    spec['legL'] = dict(at=[1.25, ANKLE, 3.3], knee=[0.25, 0, 1], foot=turn(FWD, -12), top=UP)
    spec['legR'] = dict(at=[-1.7, ANKLE + 0.55, -3.2], knee=[-0.15, 0, 1], foot=nz(turn([0, -0.45, 0.89], -42)), top=nz(turn([0, 0.89, 0.45], -42)))
    return spec


def lunge(P, t=1.0):
    """Fente basse (droite) : pied droit devant, genou gauche au sol, buste droit, mains sur
    les hanches ; t = 1 : le bassin avance, l'avant de la hanche gauche s'étire."""
    h = P.h
    knee_back = np.array([1.05, FLOOR + 0.5, -0.4])                    # genou gauche posé
    L1 = P.lengths('L')['leg'][0]
    fwd = 1.15 * t
    hip_c = np.array([0.0, 0, knee_back[2] + fwd])
    hip_c[1] = knee_back[1] + np.sqrt(L1 * L1 - fwd * fwd) - 0.05
    hip0 = _hip_rest(h)
    tilt = np.radians(-4 - 4 * t)                                        # bassin rentré (fesse serrée)
    body_up = nz([0, np.cos(tilt), np.sin(tilt)])
    spec = dict(view='left_side34', focus=['hipflex_L'], body=(body_up, nz(np.cross(np.cross(body_up, FWD), body_up))),
                chest=(nz([0, 1, 0.05]), FWD), neck=(UP, FWD), head=(UP, FWD))
    spec['move'] = hip_c - hip0
    G, _, tr = P.solve(spec)
    h.pose(G, {}, tr)
    hipL = (h.M['upperleg01.L'] @ np.r_[h.head['upperleg01.L'], 1])[:3]
    hipR = (h.M['upperleg01.R'] @ np.r_[h.head['upperleg01.R'], 1])[:3]
    # jambe arrière (gauche) : la cuisse descend au genou posé, le tibia à plat vers l'arrière, orteils retournés
    th = nz(knee_back - hipL)
    spec['legL'] = dict(th=th, sh=nz([0.0, 0.245, -0.97]), foot=nz([0, -0.95, 0.3]), top=nz([0, 0.3, 0.95]), toes=70)
    # jambe avant (droite) : cheville fixe, le genou avance avec le bassin
    ank_R = np.array([-1.15, ANKLE, hipR[2] - 0.0 * fwd + 4.1 - fwd])
    spec['legR'] = dict(at=ank_R, knee=[-0.05, 0.3, 1], foot=FWD, top=UP)
    for s_, sg in (('L', 1), ('R', -1)):
        hip = hipL if s_ == 'L' else hipR
        spec[f'arm{s_}'] = dict(at=hip + [sg * 0.75, 1.15, 0.35], elbow=[sg * 1, 0, -0.5], hand=nz([sg * 0.25, -0.35, 1]),
                               palm=[-sg, -0.1, 0], fist=0.15)
    return spec


POSES['lateral'] = lateral
POSES['pushup'] = pushup
POSES['boxing'] = boxing
POSES['lunge'] = lunge
POSES['fisttest'] = dict(
    view='side', body=(UP, FWD), neck=(UP, FWD), head=(UP, FWD),
    armR=dict(up=[-0.1, -0.05, 1], fo=[-0.05, 0.0, 1], hand=[0, 0, 1], palm=[0, -1, 0], fist=1),
    armL=dict(up=[0.12, -1, 0.1], fo=[0.06, -1, 0.22], hand=[0.04, -1, 0.1], palm=[-1, 0, 0.15], fist=0.3),
    legR=dict(th=[-0.06, -1, 0.0], sh=[-0.02, -1, -0.02], foot=[-0.15, 0, 1], top=UP),
    legL=dict(th=[0.06, -1, 0.0], sh=[0.02, -1, -0.02], foot=[0.15, 0, 1], top=UP),
)
