"""Vérifie que chaque image de chaque exercice se calcule (sans Blender) et mesure le
point le plus bas de la peau visible (hors pieds cachés dans les baskets) et des baskets."""
import os, sys, time, traceback
import numpy as np
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from mh import Human, athlete
from poses3d import Poser, FLOOR
import exos
h = Human(); h.morph(athlete(muscle=1.0, weight=0.3))
P = Poser(h)
exos.skin(P)
shoe = exos._SKIN['shoe']
vis = exos._SKIN['skin'].copy()
if shoe.delete is not None: vis &= ~shoe.delete
main_b = np.array(h.bones)[h.skin_b[np.arange(h.nv), h.sw.argmax(1)]]
only = sys.argv[1:]
for name, ex in exos.EX.items():
    if only and ex['slug'] not in only: continue
    t0 = time.time()
    for i, fr in enumerate(ex['frames']):
        try:
            sp = ex['build'](P, fr)
            G, L, t = P.solve(sp)
            V = h.pose(G, L, t)
            idx = np.where(vis)[0]
            j = idx[V[idx, 1].argmin()]
            sh = h.fit(shoe)
            print(f"{ex['slug']:24s} {i} peau {V[j,1]-FLOOR:+.2f} ({main_b[j]:14s}) baskets {sh[:,1].min()-FLOOR:+.2f}  haut {V[:,1].max()-FLOOR:5.1f}")
        except Exception:
            print(ex['slug'], i, 'ERREUR'); traceback.print_exc(limit=3)
