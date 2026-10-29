"""Planche d'aperçus : une ligne par exercice, ses images côte à côte.
Usage : python3 planche.py <sortie.png> <dossier des aperçus> <slug> ..."""
import sys, glob, os
from PIL import Image, ImageDraw, ImageFont
out, R = sys.argv[1], sys.argv[2]; slugs = sys.argv[3:]
F = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf', 16)
rows = []
for sl in slugs:
    fs = sorted(glob.glob(f'{R}/{sl}-[0-9]-e.png'), key=lambda f: int(f.split('-')[-2]))
    ims = [Image.open(f).convert('RGBA') for f in fs]
    if not ims: continue
    w, h = ims[0].size
    row = Image.new('RGB', (w * len(ims), h + 24), (168, 179, 191))
    d = ImageDraw.Draw(row); d.text((6, 3), sl, font=F, fill=(20, 20, 24))
    for i, im in enumerate(ims):
        bg = Image.new('RGBA', im.size, (168, 179, 191, 255)); bg.alpha_composite(im)
        row.paste(bg.convert('RGB'), (i * w, 24)); d.text((i * w + w - 18, 3), str(i), font=F, fill=(120, 20, 20))
    rows.append(row)
W = max(r.width for r in rows); H = sum(r.height for r in rows)
sheet = Image.new('RGB', (W, H), (150, 160, 170)); y = 0
for r in rows: sheet.paste(r, (0, y)); y += r.height
sheet.save(out); print(out, sheet.size)
