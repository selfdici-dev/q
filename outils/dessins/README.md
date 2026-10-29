# Dessins des exercices

Ces outils fabriquent les dessins au crayon des exercices de Cap (le croquis
d'un corps en 3D, les muscles travaillés en rouge). Ils ne sont pas servis par
l'appli : elle n'utilise que leur résultat, les images `img/ex/<slug>-<n>.webp`
et le manifeste `js/drawings-data.js`.

## Comment ça marche

1. **Le corps** (`mh.py`) : le modèle libre de MakeHuman, rendu sec et musclé
   (`athlete`), posé par un squelette (chaque sommet suit ses os).
2. **Les poses** (`poses3d.py`, `exos.py`) : chaque exercice est une fonction
   qui place le corps, les mains (poings, mains à plat) et le matériel
   (parallettes, roue, élastique noir ou vert, barre de traction). `frames` :
   les réglages des images, du départ à l'arrivée ; `segs` : l'ordre où elles
   se jouent, passage par passage, comme les poses clés du bonhomme de
   `js/poses.js` (même nombre de passages, même rythme).
3. **Le rendu** (`render.py`, Blender en module Python) : argile grise, ombre
   au sol, et des « passes » (relief, ombre, muscles travaillés, sens des
   fibres, cheveux, élastique vert).
4. **Le dessin** (`npr3.py`) : traits fins plus épais côté ombre, hachures en
   anneaux qui suivent le corps, muscles travaillés en rouge, mèches de
   cheveux. Mode `decoupe` : fond transparent, pour le fond sombre de la salle.
5. **Les images de l'appli** (`images.py`) : même cadre pour toutes les images
   d'un exercice, au plus 800 × 600 px, en WebP ; puis le manifeste
   `js/drawings-data.js` et la liste `DRAWN` de `sw.js` (cache hors ligne).

## Installer

- Python 3 avec `numpy`, `scipy` et `Pillow`, et Blender en module :
  `pip install bpy==4.5.4` (Python 3.11).
- Les données de MakeHuman (CC0), à poser dans `outils/dessins/makehuman-data/`
  (ignoré par git) :

  ```bash
  cd outils/dessins
  npm pack makehuman-data@0.0.2
  mkdir makehuman-data && tar -xzf makehuman-data-0.0.2.tgz -C makehuman-data
  ```

  Ailleurs : `export MH_DATA=<dossier contenant public/ et src/>`.

## Refaire les dessins

```bash
cd outils/dessins
python3 verif.py                 # chaque image se calcule ; rien sous le sol, rien qui flotte
./apercus.sh roue curl           # aperçus rapides (petits), dans apercus/
python3 planche.py apercus/planche.png apercus roue curl   # une ligne par exercice
./lot.sh                         # rendu final de tout (≈ 1 min par image), dans rendus/
python3 images.py rendus         # img/ex/, js/drawings-data.js, DRAWN dans sw.js
cd ../.. && npm test
```

`./lot.sh <slug> ...` ne refait que ces exercices ; une image déjà rendue
n'est pas refaite (efface `rendus/<slug>-*` pour la refaire). Ensuite, comme
pour tout fichier servi : incrémente `VERSION` dans `sw.js`. Si des images
changent sous le même nom, change aussi `IMG` (sinon les téléphones gardent
les anciennes).

## Ajouter un exercice

1. Dans `exos.py`, une fonction `build(P, p)` qui renvoie la pose (voir les
   autres), puis `add('<nom du bonhomme>', '<slug>', build, frames, segs)`.
   `side='droite'` si le dessin montre un côté : l'autre est son miroir.
2. `python3 verif.py <slug>`, puis les aperçus, jusqu'à ce que la pose soit juste.
3. `./lot.sh <slug>` puis `python3 images.py rendus`.
