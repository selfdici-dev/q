"""Les personnages de la Salle, façon jeu vidéo : chaque poste a son perso (teint,
coiffure, débardeur aux couleurs de la séance), rendu en 3D par render.py
(STYLE=jeu), puis dessiné ici en « toon » : couleurs en aplats, ombres en deux
tons, liseré de lumière sur le bord, petit reflet, contour foncé et ombre au sol.

Usage :
  python3 jeu.py toon <dossier _passes> <sortie.png>    une image
  python3 jeu.py rendre [slug ...]                       rendu + dessin, dans jeu/
  python3 jeu.py images [<dépôt>]                        img/jeu/, js/heroes-data.js, sw.js
"""
import json, os, re, subprocess, sys
import numpy as np
from PIL import Image
from scipy import ndimage

HERE = os.path.dirname(os.path.abspath(__file__))

# Les persos des postes (le nom de l'exercice dans js/poses.js, son slug, son look).
# top : le haut (vêtement MakeHuman) ; hair : la coiffure ; colors : teintes (#rrggbb).
CAST = {
    'P': dict(name='Tractions', slug='tractions', look=dict(top='Tank_Top_01', hair='short04', colors=dict(
        skin='#c98a5e', top='#e7b84a', shorts='#2a2630', hair='#1d130e', brows='#1d130e', shoes='#f4f1ea'))),
    'M': dict(name='Fente basse', slug='fente-basse', look=dict(top='Tank_Top_01', hair='afro01', colors=dict(
        skin='#8d5a3b', top='#a985d6', shorts='#2b2a3a', hair='#17100c', brows='#17100c', shoes='#f4f1ea'))),
    'A': dict(name='Crunch vélo', slug='crunch-velo', look=dict(top='Tank_Top_01', hair='short02', colors=dict(
        skin='#e8b48c', top='#6dbb5f', shorts='#22303a', hair='#5a3520', brows='#4a2c1a', shoes='#f4f1ea'))),
    'C': dict(name='Shadow boxing', slug='shadow-boxing', look=dict(top='Tank_Top_01', hair='Harvey_Hawk1', gloves=True, colors=dict(
        skin='#6e4630', top='#ef7b4f', shorts='#1f1d22', hair='#120c09', brows='#120c09', shoes='#f4f1ea', gloves='#d83a2c', cuff='#f4f1ea'))),
    'B': dict(name='Pompes (sur parallettes)', slug='pompes-parallettes', look=dict(top='Tank_Top_01', hair='short03', colors=dict(
        skin='#d79d72', top='#5aa8d8', shorts='#26232b', hair='#2a1a12', brows='#2a1a12', shoes='#f4f1ea'))),
}

# La lumière du dessin, dans le repère de la caméra (droite, haut, vers elle) :
# en haut à gauche, un peu de face.
LIGHT = np.array([-0.5, 0.72, 0.5])
LINE = np.array([0.13, 0.085, 0.06])      # le contour : brun très foncé
SHADE = np.array([0.63, 0.59, 0.66])      # le côté à l'ombre : plus sombre, un peu froid
RIM = np.array([1.0, 0.82, 0.62])         # le liseré de lumière, chaud
GLOSS = {4: 0.22, 8: 0.5, 13: 0.45}       # reflet par matière : cheveux, gants, métal


def load(path, mode=None):
    im = Image.open(path)
    a = np.asarray(im).astype(np.float64)
    return a / (65535.0 if a.max() > 255 else 255.0)


def smooth_step(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def toon(passes, out):
    """Les passes d'une image (render.py, STYLE=jeu) → le dessin final, fond transparent."""
    meta = json.load(open(f'{passes}/meta.json'))
    f = lambda n: f'{passes}/{n}0001.png'
    img = load(f('image'))
    alb = load(f('albedo'))
    nor = load(f('normal'))[..., :3] * 2 - 1
    dep = load(f('depth'))
    idx = np.rint(load(f('index')) * 16).astype(int)
    ao = load(f('ao'))
    if dep.ndim == 3: dep = dep[..., 0]
    if idx.ndim == 3: idx = idx[..., 0]
    if ao.ndim == 3: ao = ao[..., 0]
    body = idx > 0                             # le corps et ses objets (pas l'ombre, pas le sol)
    cov = ndimage.gaussian_filter(body.astype(float), 0.5)
    # lumière, en coordonnées du monde
    R, U, B = (np.array(meta[k]) for k in ('right', 'up', 'back'))
    L = LIGHT[0] * R + LIGHT[1] * U + LIGHT[2] * B
    L /= np.linalg.norm(L)
    n = nor / np.maximum(np.linalg.norm(nor, axis=2, keepdims=True), 1e-6)
    n[(n @ np.array(meta['back'])) < 0] *= -1   # faces vues de dos (cheveux, intérieur du haut) : tournées vers nous
    ndl = n @ L
    ndv = n @ B
    lit = smooth_step(0.05, 0.13, ndl)          # deux tons, frontière nette
    shade = SHADE + (1 - SHADE) * lit[..., None]
    base = alb[..., :3]
    col = base * shade
    col *= (0.72 + 0.28 * np.clip(ao, 0, 1) ** 0.7)[..., None]   # contacts (sous les bras, entre les jambes)
    # liseré : sur le bord, côté ombre (détache le perso du fond sombre)
    rim = smooth_step(0.6, 0.72, 1 - np.clip(ndv, 0, 1)) * (1 - lit) * 0.32
    col = col + rim[..., None] * RIM * base.mean(2, keepdims=True).clip(0.35, 1)
    # reflet net sur les matières brillantes
    H = L + B; H /= np.linalg.norm(H)
    spec = smooth_step(0.978, 0.986, n @ H)
    gloss = np.zeros_like(ndl)
    for k, g in GLOSS.items(): gloss[idx == k] = g
    col = col + (spec * gloss)[..., None] * (1 - col)
    # contour : le bord du corps, les changements de matière, les plis (profondeur, normales)
    def diff(a):
        d = np.zeros(a.shape[:2])
        for ax in (0, 1):
            sh = np.roll(a, 1, axis=ax)
            dd = np.abs(a - sh)
            if dd.ndim == 3: dd = dd.max(2)
            d = np.maximum(d, dd)
        return d
    k = max(1, round(meta['w'] / 280))         # épaisseur du trait (px du rendu)
    # pas de trait autour des yeux ni des sourcils (un masque noir, en petit)
    part = np.where((idx == 5) | (idx == 6), 1, idx).astype(float)
    edge = (diff(part) > 0.5) & (ndimage.maximum_filter(body, 3))
    depth_jump = diff(dep) > 0.012
    crease = (1 - np.minimum.reduce([np.sum(n * np.roll(n, s, axis=a), 2) for a in (0, 1) for s in (1, -1)])) > 0.9
    inner = (edge | ((depth_jump | crease) & ndimage.binary_erosion(body, iterations=1)))
    inner = ndimage.binary_dilation(inner, iterations=max(1, k - 1))
    outer = ndimage.grey_dilation(cov, size=(2 * k + 1, 2 * k + 1))
    line = np.maximum(inner.astype(float) * cov, outer * (1 - cov))
    line = ndimage.gaussian_filter(line, 0.6)
    a_body = np.maximum(cov, outer)
    col = col * (1 - line[..., None]) + LINE * line[..., None]
    # ombre au sol : la partie de l'image hors du corps, en un seul ton doux
    sh = np.clip(img[..., 3] - a_body, 0, 1)
    sh = 0.38 * smooth_step(0.08, 0.35, sh)
    near = ndimage.binary_dilation(a_body > 0.5, iterations=max(4, meta['w'] // 14))   # près du perso seulement
    sh = ndimage.gaussian_filter(sh * near, 1.0)
    alpha = np.clip(a_body + sh * (1 - a_body), 0, 1)
    rgb = np.where(a_body[..., None] > 0, col * a_body[..., None], 0) + (1 - a_body[..., None]) * sh[..., None] * np.array([0.05, 0.03, 0.03])
    rgb = rgb / np.maximum(alpha[..., None], 1e-6)
    outim = np.dstack([np.clip(rgb, 0, 1), alpha])
    Image.fromarray((outim * 255 + 0.5).astype(np.uint8), 'RGBA').save(out)
    return meta


def frames_of(slug):
    sys.path.insert(0, HERE)
    import exos
    for ex in exos.EX.values():
        if ex['slug'] == slug: return len(ex['frames'])
    raise SystemExit(f'exercice inconnu : {slug}')


def rendre(slugs, dest=None, W=840, H=630, samples=12):
    """Rend chaque image des persos demandés (ou de tous), puis la dessine."""
    dest = dest or os.path.join(HERE, 'jeu')
    os.makedirs(dest, exist_ok=True)
    py = os.environ.get('PY', sys.executable)
    for st, c in CAST.items():
        if slugs and c['slug'] not in slugs and st not in slugs: continue
        for t in range(frames_of(c['slug'])):
            out = f"{dest}/{c['slug']}-{t}"
            if os.path.exists(out + '-jeu.png'): continue
            env = dict(os.environ, T=str(t), STYLE='jeu', SCULPT='1', SUBDIV=os.environ.get('SUBDIV', '1'), LOOK=json.dumps(c['look']))
            with open(out + '.log', 'w') as log:
                subprocess.run([py, os.path.join(HERE, 'render.py'), c['slug'], out + '.png', 'auto', str(samples), str(W), str(H)], env=env, stdout=log, stderr=subprocess.STDOUT, check=True)
            toon(out + '_passes', out + '-jeu.png')
            print(st, c['slug'], t, flush=True)


MAX_W, MAX_H = 460, 380     # dans la Salle, un perso fait au plus ~160 px (×3 sur un écran Retina)
PAD = 10


def js(v):
    if isinstance(v, dict):
        key = lambda k: k if re.fullmatch(r'[A-Za-z_$][\w$]*', k) else js(k)
        return '{ ' + ', '.join(f'{key(k)}: {js(x)}' for k, x in v.items()) + ' }'
    if isinstance(v, (list, tuple)):
        return '[' + ', '.join(js(x) for x in v) + ']'
    return json.dumps(v, ensure_ascii=False).replace('"', "'")


def images(repo=None, src=None):
    """Les images de l'appli (img/jeu/), le manifeste js/heroes-data.js et la liste
    GAME de sw.js (images gardées hors ligne)."""
    repo = repo or os.path.normpath(os.path.join(HERE, '..', '..'))
    src = src or os.path.join(HERE, 'jeu')
    sys.path.insert(0, HERE)
    from exos import EX
    os.makedirs(f'{repo}/img/jeu', exist_ok=True)
    entries, game, total = {}, {}, 0
    for st, c in CAST.items():
        name, ex = next((k, e) for k, e in EX.items() if e['slug'] == c['slug'])
        n = len(ex['frames'])
        frames = [Image.open(f"{src}/{c['slug']}-{k}-jeu.png").convert('RGBA') for k in range(n)]
        meta = json.load(open(f"{src}/{c['slug']}-0_passes/meta.json"))
        A = np.max([np.asarray(f)[..., 3] for f in frames], axis=0)
        H, W = A.shape
        ys, xs = np.where(A > 8)
        box = (max(0, xs.min() - PAD), max(0, ys.min() - PAD), min(W, xs.max() + 1 + PAD), min(H, ys.max() + 1 + PAD))
        w0, h0 = box[2] - box[0], box[3] - box[1]
        s = min(1.0, MAX_W / w0, MAX_H / h0)
        w, h = round(w0 * s), round(h0 * s)
        for k, f in enumerate(frames):
            out = f"{repo}/img/jeu/{c['slug']}-{k}.webp"
            f.crop(box).resize((w, h), Image.LANCZOS).save(out, 'WEBP', quality=78, alpha_quality=70, method=6)
            total += os.path.getsize(out)
        # mesures, en part de l'image : le sol (bas du perso, pas son ombre), le haut,
        # et le milieu du perso et de son matériel, de gauche à droite
        solid = (A > 150)[box[1]:box[3], box[0]:box[2]]
        sy, sx = np.where(solid)
        bottom = sy.max()
        e = dict(slug=c['slug'], n=n, w=w, h=h, segs=ex['segs'])
        if ex.get('side'): e['side'] = ex['side']
        e.update(ground=round((bottom + 1) / h0, 3), top=round(sy.min() / h0, 3), center=round((sx.min() + sx.max()) / 2 / w0, 3),
                 unit=round(meta['ppu'] * s, 2))
        if c['look'].get('gloves'):   # jusqu'où vont les gants (part de la largeur)
            reach = 0
            for k in range(n):
                idx = np.rint(load(f"{src}/{c['slug']}-{k}_passes/index0001.png") * 16).astype(int)
                if idx.ndim == 3: idx = idx[..., 0]
                gx = np.where((idx == 8).any(0))[0]
                if len(gx): reach = max(reach, gx.max())
            e['reach'] = round((reach - box[0]) / w0, 3)
        entries[name] = e
        game[c['slug']] = n
        print(f"{st} {c['slug']:20s} {n} images {w}×{h}", {k: e[k] for k in ('ground', 'top', 'center', 'unit') if k in e}, e.get('reach', ''))
    print(f'{sum(game.values())} images, {total / 1024:.0f} Ko')
    lines = [
        '// Fabriqué par outils/dessins/jeu.py : ne pas modifier à la main.',
        '// Les personnages de la Salle, façon jeu vidéo (img/jeu/<slug>-<n>.webp), sous le',
        '// nom de leur bonhomme (js/poses.js) : n images de w × h px ; segs : comme dans',
        '// js/drawings-data.js (les images de chaque passage, au rythme du bonhomme) ;',
        '// side : le côté rendu. Mesures en part de l\'image : ground (le sol, sous les',
        '// pieds), top (le haut du corps), center (le milieu des appuis), reach (jusqu\'où',
        '// vont les gants) ; unit : une unité du corps 3D (≈ 1 dm), en px de l\'image.',
        'export const HEROES = {',
    ]
    for name, e in entries.items():
        lines.append(f'  {js(name)}: {js(e)},')
    lines.append('};')
    open(f'{repo}/js/heroes-data.js', 'w').write('\n'.join(lines) + '\n')
    sw = open(f'{repo}/sw.js').read()
    new = 'const GAME = ' + js(game) + ';'
    sw2, k = re.subn(r'const GAME = \{[^}]*\};', new, sw)
    if k != 1: raise SystemExit('sw.js : la ligne « const GAME = {…}; » est introuvable')
    open(f'{repo}/sw.js', 'w').write(sw2)
    print('js/heroes-data.js et sw.js (GAME) à jour')


if __name__ == '__main__':
    cmd = sys.argv[1] if len(sys.argv) > 1 else ''
    if cmd == 'toon':
        toon(sys.argv[2], sys.argv[3])
    elif cmd == 'rendre':
        rendre(sys.argv[2:])
    elif cmd == 'images':
        images(*sys.argv[2:3])
    else:
        print(__doc__)
