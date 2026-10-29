"""Corps humain MakeHuman (données libres) : forme, squelette, pose (skinning)."""
import json, os, re
import numpy as np

# données MakeHuman (CC0) : voir le README
D = os.environ.get('MH_DATA') or os.path.join(os.path.dirname(os.path.abspath(__file__)), 'makehuman-data', 'package')
D = D.rstrip('/') + '/'


def short(p):
    p = p.lower()
    p = re.sub(r'^.+targets/', '', p)
    return re.sub(r'\.target$', '', p)


def parse_faces(F, nuv=1):
    i, faces, fuv, fmat = 0, [], [], []
    while i < len(F):
        t = F[i]; i += 1
        n = 4 if t & 1 else 3
        vs = F[i:i + n]; i += n
        m = 0
        if t & 2: m = F[i]; i += 1
        if t & 4: i += nuv
        uvs = None
        if t & 8:
            uvs = F[i:i + n]; i += n * nuv
        if t & 16: i += 1
        if t & 32: i += n
        if t & 64: i += 1
        if t & 128: i += n
        faces.append(vs); fuv.append(uvs); fmat.append(m)
    return faces, fuv, fmat


class Mesh:
    """Maillage three.js (corps ou accessoire)."""
    def __init__(self, path):
        d = json.load(open(path))
        self.d = d
        self.V = np.array(d['vertices'], dtype=np.float64).reshape(-1, 3)
        self.uv = np.array(d['uvs'][0], dtype=np.float64).reshape(-1, 2) if d.get('uvs') and d['uvs'][0] else None
        self.faces, self.fuv, self.fmat = parse_faces(d['faces'], max(1, len(d.get('uvs') or [1])))
        self.mats = [m.get('DbgName', '') for m in d.get('materials', [])]
        self.delete = np.array(d['metadata'].get('deleteVerts', []), dtype=bool) if 'metadata' in d and d['metadata'].get('deleteVerts') else None
        self.matinfo = d.get('materials', [])
        if 'ref_vIdxs' in d:
            self.ref = np.array(d['ref_vIdxs'], dtype=np.int64)
            self.w = np.array(d['weights'], dtype=np.float64)
            self.off = np.array(d['offsets'], dtype=np.float64)


class Human:
    def __init__(self):
        self.body = Mesh(D + 'public/data/models/human_full_size.json')
        d = self.body.d
        self.V0 = self.body.V.copy()
        self.nv = len(self.V0)
        si = np.array(d['skinIndices'], dtype=np.int64).reshape(-1, 4)
        sw = np.array(d['skinWeights'], dtype=np.float64).reshape(-1, 4)
        self.si, self.sw = si, sw / np.maximum(sw.sum(1, keepdims=True), 1e-9)
        self.entries = d['bones']
        self.jidx = d['metadata']['joint_pos_idxs']
        tl = json.load(open(D + 'src/json/targets/target-list.json'))['targets']
        self.tnames = sorted((short(p) for p in tl))
        self.tindex = {n: i for i, n in enumerate(self.tnames)}
        self.T = np.memmap(D + 'public/data/targets/targets.bin', dtype='<i2', mode='r').reshape(len(self.tnames), self.nv, 3)
        # os : chaque « X____head » est l'os X (tête = articulation) ; son parent est l'os dont la queue le porte
        self.bones = []
        self.entry_bone = {}
        for i, e in enumerate(self.entries):
            if e['name'].endswith('____head'):
                self.bones.append(e['name'][:-8])
        idx = {e['name']: i for i, e in enumerate(self.entries)}
        self.parent = {}
        for b in self.bones:
            p = self.entries[idx[b + '____head']]['parent']
            pn = self.entries[p]['name'] if p >= 0 else None
            self.parent[b] = pn.replace('____head', '') if pn else None
        for i, e in enumerate(self.entries):
            self.entry_bone[i] = e['name'].replace('____head', '')
        self.order = []
        seen = set()
        def visit(b):
            if b in seen: return
            if self.parent[b]: visit(self.parent[b])
            seen.add(b); self.order.append(b)
        for b in self.bones: visit(b)
        self.bi = {b: i for i, b in enumerate(self.bones)}
        # index d'os pour chaque influence de peau
        self.skin_b = np.vectorize(lambda k: self.bi[self.entry_bone[k]])(self.si)

    def morph(self, weights):
        V = self.V0.copy()
        for name, w in weights.items():
            if w: V += self.T[self.tindex[name]].astype(np.float64) * 1e-3 * w
        self.V = V
        self.joints = {k: V[np.array(v)].mean(0) for k, v in self.jidx.items()}
        self.head = {b: self.joints[b + '____head'] for b in self.bones}
        self.tail = {b: self.joints.get(b + '____tail', self.joints[b + '____head']) for b in self.bones}
        return V

    def pose(self, G, L=None, root_t=np.zeros(3)):
        """G : rotation monde (3×3) voulue pour certains os ; L : rotation en plus
        du parent (repère de repos) pour d'autres (doigts) ; le reste suit son parent.
        Renvoie les sommets posés (et garde les matrices 4×4 de chaque os)."""
        L = L or {}
        M = {}
        Rw = {}
        for b in self.order:
            p = self.parent[b]
            Rp = Rw[p] if p else np.eye(3)
            Rw[b] = G[b] if b in G else Rp @ L[b] if b in L else Rp
            R = Rp.T @ Rw[b]  # rotation locale (repère de repos)
            h = self.head[b]
            Lm = np.eye(4); Lm[:3, :3] = R; Lm[:3, 3] = h - R @ h
            if p:
                M[b] = M[p] @ Lm
            else:
                T0 = np.eye(4); T0[:3, 3] = root_t
                M[b] = T0 @ Lm
        self.Rw = Rw
        Ms = np.stack([M[b] for b in self.bones])
        # matrice de peau de chaque sommet (mélange des os) : sert aussi aux accessoires
        S = np.zeros((self.nv, 4, 4))
        for k in range(4):
            S += self.sw[:, k, None, None] * Ms[self.skin_b[:, k]]
        self.S = S
        Vh = np.c_[self.V, np.ones(self.nv)]
        out = np.einsum('nij,nj->ni', S, Vh)[:, :3]
        self.M = M
        return out

    def fit(self, pm):
        """Accessoire (cheveux, yeux, chaussures…) : placé sur le corps au repos, puis
        déplacé comme les sommets du corps auxquels il est accroché."""
        rest = (self.V[pm.ref] * pm.w[:, :, None]).sum(1) + pm.off
        S = (self.S[pm.ref] * pm.w[:, :, None, None]).sum(1)
        return np.einsum('nij,nj->ni', S, np.c_[rest, np.ones(len(rest))])[:, :3]

    def where(self, b, M=None):
        M = M or self.M
        h = np.r_[self.head[b], 1]; t = np.r_[self.tail[b], 1]
        return (M[b] @ h)[:3], (M[b] @ t)[:3]


def fit_proxy(mesh, V):
    """Accessoire (cheveux, yeux, sourcils, vêtement) posé sur le corps V."""
    return (V[mesh.ref] * mesh.w[:, :, None]).sum(1) + mesh.off


ATHLETE = {
    # homme jeune, musclé, sec (poids un peu sous la moyenne), proportions idéales
}
def athlete(muscle=1.0, weight=0.45, extra=True):
    w = {}
    # muscle 0.5 = moyen, 1 = max ; poids 0.5 = moyen, 0 = min
    mu = {'averagemuscle': 1 - (muscle - 0.5) * 2, 'maxmuscle': (muscle - 0.5) * 2} if muscle >= 0.5 else {'minmuscle': (0.5 - muscle) * 2, 'averagemuscle': 1 - (0.5 - muscle) * 2}
    we = {'averageweight': 1 - (0.5 - weight) * 2, 'minweight': (0.5 - weight) * 2} if weight <= 0.5 else {'averageweight': 1 - (weight - 0.5) * 2, 'maxweight': (weight - 0.5) * 2}
    for m, a in mu.items():
        for k, b in we.items():
            if a * b == 0: continue
            w[f'macrodetails/universal-male-young-{m}-{k}'] = a * b
            w[f'macrodetails/proportions/male-young-{m}-{k}-idealproportions'] = a * b
    for r in ('caucasian', 'african', 'asian'):
        w[f'macrodetails/{r}-male-young'] = {'caucasian': 0.7, 'african': 0.15, 'asian': 0.15}[r]
    if extra:
        # le physique visé : épaules larges, dos en V, taille fine, ventre plat
        w['torso/torso-vshape-more'] = 0.8
        w['torso/torso-muscle-dorsi-incr'] = 0.6
        w['torso/torso-muscle-pectoral-incr'] = 0.45
        w['stomach/stomach-pregnant-decr'] = 0.6
        w['measure/measure-waist-decrease'] = 0.35
        for s in 'lr':
            w[f'armslegs/{s}-upperarm-muscle-incr'] = 0.6
            w[f'armslegs/{s}-upperarm-shoulder-muscle-incr'] = 0.7
            w[f'armslegs/{s}-lowerarm-muscle-incr'] = 0.4
            w[f'armslegs/{s}-upperleg-muscle-incr'] = 0.4
            w[f'armslegs/{s}-lowerleg-muscle-incr'] = 0.4
    return w
