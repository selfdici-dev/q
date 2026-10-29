"""Liste « slug n° » de toutes les images à rendre (ou seulement des slugs donnés)."""
import os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import exos
want = sys.argv[1:]
for ex in exos.EX.values():
    if want and ex['slug'] not in want: continue
    for i in range(len(ex['frames'])): print(ex['slug'], i)
