# Problèmes du jour

`problemes.mjs` fabrique `js/chess-daily-data.js`, le stock des problèmes du
jour de l'école d'échecs. Pas servi par l'appli : elle n'utilise que le résultat.

## Comment ça marche

1. Cap joue des parties contre lui-même, avec un peu de hasard dans ses coups
   (des parties variées, avec de vraies fautes) ; le hasard part toujours de la
   même graine : on retrouve les mêmes problèmes d'une fois sur l'autre.
2. Dans chaque position (après le 5e coup), on cherche :
   - un **mat en 1** : un seul coup mate ;
   - un **mat en 2** : pas de mat en 1, et un seul premier coup force le mat ;
   - un **gain de matériel** : dans une position à peu près égale, sans être
     en échec, le meilleur coup vaut au moins 2 pions de mieux que tous les
     autres, à 2 puis à 3 demi-coups de calcul (les deux d'accord) ; pas une
     simple reprise.
3. Pas de position déjà gagnée d'avance (plus de 15 pions d'écart), pas de
   doublon ; puis tout est mélangé une fois pour toutes.

Les tests (`tests/chess-daily.test.js`) revérifient chaque problème : la
réponse se joue, elle est la seule à mater (ou à gagner).

## Refaire le stock

```bash
node outils/echecs/problemes.mjs 150    # ≈ 20 min ; 35 % mats en 1, 20 % mats en 2, 45 % gains
npm test
```

Comme pour tout fichier servi : incrémente ensuite `VERSION` dans `sw.js`.
