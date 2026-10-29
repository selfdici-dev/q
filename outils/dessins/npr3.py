"""Croquis détaillé : traits fins d'épaisseur variable, hachures en anneaux qui suivent
le corps (comme dans les planches d'anatomie), muscles travaillés en rouge et cernés.
Usage : python3 npr3.py <passes> <sortie.png> <papier|encre|decoupe>"""
import sys
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter as gf, grey_dilation

src, out, mode = sys.argv[1], sys.argv[2], sys.argv[3]


def load(name, rgba=False):
    im = Image.open(f'{src}/{name}0001.png')
    if rgba:
        a = np.asarray(im.convert('RGBA'), dtype=np.float64)
    else:
        a = np.asarray(im, dtype=np.float64)
        if a.ndim == 3: a = a[..., 0]
    return a / (65535.0 if a.max() > 255 else 255.0)


def ss(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1); return t * t * (3 - 2 * t)


rgba = load('image', True)
H, W = rgba.shape[:2]
alpha = rgba[..., 3]
L = 0.3 * rgba[..., 0] + 0.59 * rgba[..., 1] + 0.11 * rgba[..., 2]
ao = load('ao'); idx = load('index'); depth = load('depth')
focus = load('focus')
phase_raw = np.asarray(Image.open(f'{src}/phase0001.png'), dtype=np.float64)
if phase_raw.ndim == 3: phase_raw = phase_raw[..., 0]
ph = phase_raw / 65535.0 * 20 - 10                      # dm, le long du corps
try:
    fib_raw = np.asarray(Image.open(f'{src}/fiber0001.png'), dtype=np.float64)
    if fib_raw.ndim == 3: fib_raw = fib_raw[..., 0]
    fib = fib_raw / 65535.0 * 20 - 10                  # suit les fibres des muscles
except FileNotFoundError:
    fib = ph
fig = ss(0.3, 0.7, idx) * alpha
shadow = np.clip(alpha - fig, 0, 1)
inside = fig > 0.5
soft_in = ss(0.4, 0.95, gf(fig, 1.2))

# ——— valeurs ———
T = L * (0.6 + 0.4 * ao)
lo, hi = np.percentile(T[inside], 2), np.percentile(T[inside], 99.5)
T = np.clip((T - lo) / (hi - lo), 0, 1)
Tf = gf(T * fig, 1.0) / np.maximum(gf(fig, 1.0), 1e-3)
shade = ss(0.7, 0.1, Tf)

rng = np.random.default_rng(5)
def noise(scale, seed):
    r = np.random.default_rng(seed).random((H // scale + 2, W // scale + 2))
    return np.asarray(Image.fromarray((r * 255).astype(np.uint8)).resize((W + 2 * scale, H + 2 * scale), Image.BICUBIC), float)[:H, :W] / 255

# ——— traits des plis (XDoG), fins ———
def xdog(img, sigma, k=1.6, tau=0.98, eps=-0.005, phi=90):
    D = gf(img, sigma) - tau * gf(img, sigma * k)
    return np.clip(np.where(D >= eps, 1.0, 1.0 + np.tanh(phi * (D - eps))), 0, 1)
crease = (1 - xdog(Tf, 0.85)) * soft_in
crease = np.maximum(crease, 0.5 * (1 - xdog(Tf, 1.7, tau=0.99)) * soft_in)
crease *= 0.65 + 0.35 * noise(9, 3)

# ——— contour : plus épais du côté de l'ombre, fin du côté de la lumière ———
e_thin = np.clip(np.abs(fig - gf(fig, 0.7)) * 5, 0, 1)
e_thick = np.clip(np.abs(gf(fig, 1.6) - fig) * 3.2, 0, 1) * (fig > 0.2)
side_dark = gf(shade * fig, 3) / np.maximum(gf(fig, 3), 1e-3)
edge = np.maximum(e_thin, e_thick * ss(0.35, 0.8, side_dark))
dz = np.maximum(np.abs(np.diff(depth, axis=1, prepend=depth[:, :1])), np.abs(np.diff(depth, axis=0, prepend=depth[:1, :])))
edge = np.maximum(edge, ss(0.004, 0.014, dz) * soft_in * 0.9)
edge *= 0.8 + 0.2 * noise(7, 4)

# ——— hachures en anneaux : lignes de niveau du champ « phase » ———
def rings(spacing, width_px, grad_cap=0.5, field=None):
    p = (ph if field is None else field) / spacing
    gy, gx = np.gradient(gf(p, 0.6))
    g = np.hypot(gx, gy)
    dfrac = np.abs(p - np.round(p))
    dist = dfrac / np.maximum(g, 1e-4)
    ok = (g < grad_cap) & inside
    return (1 - ss(width_px * 0.5, width_px * 0.5 + 0.9, dist)) * ok
w_ring = 0.55 + 1.1 * shade
r1 = rings(0.105, 1.0) * ss(0.22, 0.55, shade)
r1 = np.clip(r1 * (0.35 + 0.65 * shade), 0, 1) * (0.75 + 0.25 * noise(5, 8))
try:
    _hm = np.asarray(Image.open(f'{src}/hair0001.png'), dtype=np.float64)
    _hm = (_hm[..., 0] if _hm.ndim == 3 else _hm) / 65535.0
    r1 *= 1 - ss(0.3, 0.7, _hm)
except FileNotFoundError:
    pass
# ombres profondes : en plus, des hachures obliques fines
yy, xx = np.mgrid[0:H, 0:W]
def hatch(angle, period, width, seed):
    a = np.radians(angle)
    s = xx * np.cos(a) + yy * np.sin(a) + (noise(16, seed) - 0.5) * 3.0
    f = (s / period) % 1.0
    d = np.minimum(f, 1 - f) * period
    return 1 - ss(width * 0.5, width * 0.5 + 0.8, d)
h2 = hatch(-38, 4.6, 0.8, 21) * ss(0.8, 0.95, shade) * soft_in * 0.45
light = ss(0.72, 0.98, Tf) * inside
# cheveux : des traits fins le long des mèches (lignes de niveau de la coordonnée u)
try:
    def raw(nm):
        a = np.asarray(Image.open(f'{src}/{nm}0001.png'), dtype=np.float64)
        return (a[..., 0] if a.ndim == 3 else a) / 65535.0
    hairm = ss(0.3, 0.7, raw('hair')) * inside
    hu = raw('hairu')
    q = hu * 140.0
    gy, gx = np.gradient(gf(q, 0.5)); g = np.hypot(gx, gy)
    dd = np.abs(q - np.round(q)) / np.maximum(g, 1e-4)
    strands = (1 - ss(0.35, 1.2, dd)) * (g < 0.6) * hairm * (0.45 + 0.55 * ss(0.85, 0.25, Tf))
except FileNotFoundError:
    hairm = np.zeros((H, W)); strands = np.zeros((H, W))

# ——— muscles qui travaillent : lavis rouge, anneaux rouges serrés, bord cerné ———
red = gf(focus, 1.0) * soft_in
red_rings = rings(0.055, 0.95, field=fib, grad_cap=0.6) * ss(0.15, 0.5, red) * (0.55 + 0.45 * ss(0.9, 0.3, Tf))
red_edge = np.clip(np.abs(gf(focus, 0.8) - gf(focus, 2.2)) * 4.0, 0, 1) * ss(0.05, 0.3, gf(focus, 2.5)) * soft_in

graphite = np.array([0.15, 0.15, 0.17])
redc = np.array([0.78, 0.13, 0.1])
if mode == 'decoupe':
    figc = np.array([0.87, 0.86, 0.84])
    paper = np.broadcast_to(np.array([0.66, 0.70, 0.75]), (H, W, 3))
else:
    grain = gf(rng.random((H, W)), 1.1); grain = (grain - grain.mean()) / grain.std()
    paper = np.array([0.66, 0.70, 0.75])[None, None, :] * (1 + 0.012 * grain[..., None])
    figc = paper * 0.3 + np.array([0.87, 0.88, 0.9]) * 0.7
# couleur propre de chaque objet (short, élastique noir, cheveux…) : plus foncé au crayon
try:
    alb = load('albedo')
    alb = np.where(alb <= 0.04045, alb / 12.92, ((alb + 0.055) / 1.055) ** 2.4)     # sRGB → linéaire
    alb = gf(alb * fig, 0.8) / np.maximum(gf(fig, 0.8), 1e-3)
    darkness = np.clip(1 - alb / 0.66, 0, 1) ** 0.85 * inside
except FileNotFoundError:
    darkness = np.zeros((H, W))
figc = np.broadcast_to(figc, (H, W, 3)) * (1 - 0.8 * darkness[..., None]) + graphite * 0.8 * darkness[..., None]
img = paper * (1 - fig[..., None]) + figc * fig[..., None]
tone = ss(0.8, 0.15, Tf) * 0.16 * inside                       # un léger lavis gris dans l'ombre
img = img * (1 - tone[..., None])
# élastique vert : sa couleur, avec le modelé de la lumière
try:
    _t = np.asarray(Image.open(f'{src}/tint0001.png'), dtype=np.float64)
    tint = ss(0.3, 0.7, (_t[..., 0] if _t.ndim == 3 else _t) / 65535.0) * inside
    gsh = np.array([0.3, 0.58, 0.34])[None, None, :] * (0.55 + 0.45 * Tf[..., None])
    img = img * (1 - 0.85 * tint[..., None]) + gsh * 0.85 * tint[..., None]
except FileNotFoundError:
    pass
sh = gf(shadow, 2.5) * 0.32
img = img * (1 - sh[..., None]) + graphite * sh[..., None]
img = img * (1 - 0.55 * red[..., None]) + np.array([0.95, 0.48, 0.42]) * 0.55 * red[..., None]
img = img * (1 - 0.8 * red_rings[..., None]) + redc * 0.8 * red_rings[..., None]
img = img * (1 - r1[..., None] * 0.85) + graphite * r1[..., None] * 0.85
img = img * (1 - h2[..., None]) + graphite * h2[..., None]
img = img * (1 - crease[..., None] * 0.9) + graphite * crease[..., None] * 0.9
img = img * (1 - 0.35 * hairm[..., None]) + graphite * 0.35 * hairm[..., None]          # cheveux : un ton plus sombre
img = img * (1 - strands[..., None] * 0.8) + graphite * strands[..., None] * 0.8
img = img * (1 - red_edge[..., None] * 0.9) + redc * red_edge[..., None] * 0.9
img = img * (1 - edge[..., None] * 0.95) + graphite * edge[..., None] * 0.95
chalk = light * (0.32 + 0.3 * darkness)
img = img * (1 - chalk[..., None]) + np.array([0.99, 0.99, 0.98]) * chalk[..., None]
res = np.clip(img, 0, 1)

ys, xs = np.where((fig > 0.3) | (gf(shadow, 3) > 0.12))
pad = int(0.04 * max(H, W))
y0, y1, x0, x1 = max(0, ys.min() - pad), min(H, ys.max() + pad), max(0, xs.min() - pad), min(W, xs.max() + pad)
import os
if os.environ.get('NOCROP'):  # animation : toutes les images au même cadre
    y0, y1, x0, x1 = 0, H, 0, W
if mode == 'papier':
    Image.fromarray((res[y0:y1, x0:x1] * 255).astype(np.uint8)).save(out)
else:
    a_ = np.clip(np.maximum(gf(fig, 0.5), np.maximum(gf(shadow, 3) * 0.5, edge * 0.95)), 0, 1)
    if mode == 'decoupe':  # sur le fond sombre de la salle : l'ombre au sol est sombre, pas du papier
        res = np.where(fig[..., None] > 0.02, res, np.array([0.05, 0.04, 0.035]))
    rr = np.dstack([res, a_])[y0:y1, x0:x1].copy()
    hh, ww = rr.shape[:2]
    fy = np.minimum(np.arange(hh), np.arange(hh)[::-1]) / max(1, pad * 0.8)
    fx = np.minimum(np.arange(ww), np.arange(ww)[::-1]) / max(1, pad * 0.8)
    rr[..., 3] *= np.clip(np.minimum(fy[:, None], fx[None, :]), 0, 1)
    Image.fromarray((np.clip(rr, 0, 1) * 255).astype(np.uint8), 'RGBA').save(out)
print('croquis détaillé', out)
