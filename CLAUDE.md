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
- `js/data.js`, `js/finance-data.js`, `js/quotes.js` : contenu (séances, leçons…).
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
   servis ; ajouter tout nouveau fichier à `FILES`.
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
