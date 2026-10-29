# Cap — notes pour Claude

Appli personnelle de discipline (PWA) : habitudes minimum/complet, chaîne
« jamais deux fois de suite », sprints de 7 jours, focus, séances guidées,
suivi, argent. HTML + CSS + JavaScript (modules ES), sans dépendance ni build.
L'utilisateur est débutant : explique simplement, en français.

## Fichiers

- `js/app.js` : vues et événements (DOM). `js/money.js` : onglet Argent.
- `js/logic.js` : logique pure (dates, chaîne, sprints, XP, finance).
- `js/summary.js`, `js/backup.js` : bilans à copier, sauvegarde (logique pure).
- `js/figures.js` : moteur des bonshommes animés (poses en angles → SVG animé) ;
  `js/poses.js` : une pose par exercice (vue de profil, tête à droite, sol à y = 70).
- `js/avatar.js` : « ton double », personnage qui évolue avec le niveau (calculé, jamais stocké).
- `js/tree.js` : arbre du focus qui pousse pendant la session (unique par session, calculé).
- `js/room.js` : décor de la salle (mur, spots, LED, parquet) ; `js/gym.js` : la salle
  interactive de l'onglet Salle (un poste par séance) ; `js/icons.js` : icônes au trait.
- `js/drawings.js` : dessins au crayon des exercices (corps en 3D, muscles travaillés
  en rouge), joués au rythme du bonhomme ; sans dessin, le bonhomme reste.
  `js/drawings-data.js` (leur manifeste) et `img/ex/*.webp` (leurs images) sont
  fabriqués par `outils/dessins/` (Python + Blender, pas servi par l'appli, voir son README).
- `js/data.js`, `js/finance-data.js`, `js/quotes.js` : contenu (séances, leçons…).
- `css/styles.css` : styles de base ; `css/luxe.css` : structure du design
  (verre, cartes, jetons de couleur), chargé après ; `css/cuivre.css` : couleurs
  « Cuivre » (noir chaud, cuivre, crème, bois, bleu glacé), chargé en dernier.
- `tests/*.test.js` : tests `node --test`. `sw.js` : cache hors ligne.

## Règles

1. **Ne pas réécrire l'appli** : modifications ciblées, dans le style existant.
2. **Ne pas changer la structure des données** (objet `state` dans
   `localStorage['cap-v1']`) : pas de champ renommé, déplacé ou supprimé.
   Les IDs de séances (`A`, `B`, `C`, `M`) et d'habitudes sont stockés : ne pas les changer.
3. **Un test pour chaque nouvelle logique** : la mettre dans un module sans DOM
   et la tester dans `tests/`.
4. **`npm test` après chaque étape**, tout doit passer.
5. **Incrémenter `VERSION` dans `sw.js`** à chaque modification des fichiers
   servis ; ajouter tout nouveau fichier à `FILES`. Les images des dessins vont
   dans `DRAWN` (écrit par `outils/dessins/images.py`) ; si des images changent
   sous le même nom, changer aussi `IMG`.
6. **Un commit par modification**, message clair en français.
7. **Aucune donnée ne quitte l'appareil** : pas de requête réseau avec des
   données, pas d'analytics, pas de CDN ni de police externe. Copier, exporter
   et importer restent locaux (presse-papiers, fichier).
8. Respecter `prefers-reduced-motion` pour toute animation.

## Commandes

```bash
npm test    # tests de la logique
npm start   # http://localhost:8080
```
