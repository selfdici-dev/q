"""Images de l'appli : pour chaque exercice, ses dessins (mode « découpe », fond
transparent) recadrés tous pareil, réduits et enregistrés en WebP dans img/ex/ ;
puis le manifeste js/drawings-data.js et la liste des images gardées hors ligne
(DRAWN dans sw.js).
Usage : python3 images.py <dossier des rendus> [<dépôt>]
Les rendus attendus : <slug>-<n>-decoupe.png (voir lot.sh)."""
import json, os, re, sys
import numpy as np
from PIL import Image

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from exos import EX, ALIAS

SRC = sys.argv[1]
REPO = sys.argv[2] if len(sys.argv) > 2 else os.path.normpath(os.path.join(HERE, '..', '..'))
MAX_W, MAX_H = 800, 600        # le lecteur fait au plus ~460 × 300 px : assez net sur un écran Retina
PAD = 14                       # marge autour du mouvement (px du rendu)
os.makedirs(f'{REPO}/img/ex', exist_ok=True)

entries, drawn, total = {}, {}, 0
for name, ex in EX.items():
    slug, n = ex['slug'], len(ex['frames'])
    paths = [f'{SRC}/{slug}-{k}-decoupe.png' for k in range(n)]
    if not all(os.path.exists(f) for f in paths):
        print(f'{slug:24s} pas encore rendu : gardé en bonhomme')
        continue
    frames = [Image.open(f).convert('RGBA') for f in paths]
    # même cadre pour toutes les images : la réunion du mouvement (et de son ombre)
    A = np.max([np.asarray(f)[..., 3] for f in frames], axis=0)
    ys, xs = np.where(A > 8)
    H, W = A.shape
    box = (max(0, xs.min() - PAD), max(0, ys.min() - PAD), min(W, xs.max() + 1 + PAD), min(H, ys.max() + 1 + PAD))
    w0, h0 = box[2] - box[0], box[3] - box[1]
    s = min(1.0, MAX_W / w0, MAX_H / h0)
    w, h = round(w0 * s), round(h0 * s)
    for k, f in enumerate(frames):
        im = f.crop(box).resize((w, h), Image.LANCZOS)
        out = f'{REPO}/img/ex/{slug}-{k}.webp'
        im.save(out, 'WEBP', quality=58, alpha_quality=55, method=6)   # ≈ 20 Ko, à l'œil comme à 70
        total += os.path.getsize(out)
    entries[name] = dict(slug=slug, n=n, w=w, h=h, segs=ex['segs'], **({'side': ex['side']} if ex.get('side') else {}))
    drawn[slug] = n
    print(f'{slug:24s} {n} images {w}×{h}')
for name, al in ALIAS.items():
    if al['of'] in entries: entries[name] = dict(entries[al['of']], segs=al['segs'])
print(f'{sum(drawn.values())} images, {total / 1024 / 1024:.1f} Mo')


def js(v):
    if isinstance(v, dict):
        key = lambda k: k if re.fullmatch(r'[A-Za-z_$][\w$]*', k) else js(k)
        return '{ ' + ', '.join(f'{key(k)}: {js(x)}' for k, x in v.items()) + ' }'
    if isinstance(v, (list, tuple)):
        return '[' + ', '.join(js(x) for x in v) + ']'
    return json.dumps(v, ensure_ascii=False).replace('"', "'")


lines = [
    '// Fabriqué par outils/dessins/images.py : ne pas modifier à la main.',
    '// Clé : le nom du bonhomme (js/poses.js). slug : nom des images',
    '// (img/ex/<slug>-<n>.webp) ; n : nombre d\'images ; w, h : leur taille (px) ;',
    '// segs : pour chaque passage d\'une pose clé à la suivante, dans l\'ordre joué',
    '// par le bonhomme, ses images de la pose de départ à la pose d\'arrivée ;',
    '// side : le côté dessiné (l\'autre côté est le même dessin en miroir).',
    'export const DRAWINGS = {',
]
for name, e in entries.items():
    lines.append(f'  {js(name)}: {js(e)},')
lines.append('};')
open(f'{REPO}/js/drawings-data.js', 'w').write('\n'.join(lines) + '\n')

# sw.js : la liste des dessins gardés hors ligne
sw = open(f'{REPO}/sw.js').read()
new = 'const DRAWN = ' + js(drawn) + ';'
sw2, k = re.subn(r'const DRAWN = \{[^}]*\};', new, sw)
if k != 1: raise SystemExit('sw.js : la ligne « const DRAWN = {…}; » est introuvable')
open(f'{REPO}/sw.js', 'w').write(sw2)
print('js/drawings-data.js et sw.js (DRAWN) à jour')
