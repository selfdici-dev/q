# Cap

Appli personnelle pour **tenir** et **apprendre** : habitudes à deux niveaux (minimum / complet), règle « jamais deux fois de suite », sprints de 7 jours, focus 25 min, minuteur anti-scroll, séances guidées sur tapis, suivi du poids, du sommeil, de l’écran et des pas.

Elle fonctionne hors ligne et s’installe sur le téléphone. Aucune donnée ne quitte l’appareil.

## Principes

- **Minimum / Complet.** Chaque habitude a une version de 2 minutes. La journée est validée dès que tous les minimums sont faits. Un mauvais jour se sauve avec les minimums.
- **Jamais deux fois de suite.** Un jour raté isolé ne casse pas la chaîne, avec une seule reprise par fenêtre de 7 jours. Le lendemain d’un raté, l’appli passe en *mode reprise* : seulement les minimums, de préférence avant midi.
- **L’historique ne bouge pas.** Chaque jour garde la liste d’habitudes en vigueur ce jour-là.
- **Sprints de 7 jours.** 12 sprints, soit 12 semaines. Un sprint est réussi à 5 jours validés sur 7. Chaque objectif a une fin proche.
- **La journée se termine à 4 h.** Un coucher à 1 h compte pour la veille.
- **Bilan du dimanche.** 3 questions et une seule chose à changer.
- **XP et niveaux.** Calculés à partir de tes données (habitudes, séances, sessions, leçons, trades), jamais stockés : impossible de tricher par erreur.

## Révisions

Révision espacée (boîtes de Leitner) : chaque leçon de finance validée ajoute ses questions comme cartes, et tu crées les tiennes (trading, crypto, culture, livres). Une carte réussie revient après 1, 3, 7, 14, 30, 60 puis 120 jours ; une carte ratée revient le jour même. Accès depuis la carte « Révisions » de l’onglet Jour (`#revision`).

## Onglets

| Onglet | Contenu |
|---|---|
| Jour | Chaîne, sprint, habitudes, révisions du jour, protéines et grignotages (avec déclencheur), séance du jour, nuit dernière, règles « Si… alors… » |
| Focus | Minuteur 25/5 avec une plante qui pousse, jardin du jour, minuteur « Envie de scroller ? » de 10 min |
| Argent | Parcours de 23 leçons (dont une unité Crypto : frais, fiscalité, petites cryptos) (dont une unité « La méthode » fondée sur les études : Barber & Odean, McLean & Pontiff, tendance, dérive après résultats, pratique délibérée ; volatilité/ATR, stratégie, actu), feuille de route trading en 6 étapes chiffrées, modes backtest/simulé/réel (des bases au trading, fiscalité 2026) avec quiz ; patrimoine par poches avec alertes de concentration ; trading réel/simulé avec checklist obligatoire, règles bloquantes (3 positions, 2 pertes, −25 %), aperçu du risque, courbe en R, statistiques par setup, copie pour relecture par Claude ; calculatrices (taille de position, stop ATR, intérêts composés) ; routine d’actualité et sources |
| Corps | Régularité (séances de la semaine, semaines tenues), semaine type, séances A (tronc), B (haut du corps et posture), C (cardio sans saut), M (mobilité 8 min), échauffement intégré, ressenti en fin de séance et suggestion de niveau, 3 niveaux, lecteur guidé, démos vidéo, règles alimentaires, 6 recettes de débutant |
| Suivi | Saisie, moyennes sur 7 jours, graphiques, déclencheurs de grignotage, tests de niveau (pompes, planches, hollow) |
| Bilan | 12 sprints, revue hebdomadaire, habitudes, règles, réglages, export/import |

## Installer sur le téléphone

1. Héberge le dossier en HTTPS (voir ci-dessous).
2. Ouvre l’URL dans Chrome (Android) ou Safari (iPhone).
3. Android : menu ⋮ > *Ajouter à l’écran d’accueil*. iPhone : bouton Partager > *Sur l’écran d’accueil*.

Les données sont propres à chaque appareil. Pour passer du téléphone à l’ordi, utilise *Bilan > Exporter*, puis *Importer* sur l’autre appareil. **Exporte chaque semaine** : c’est ta seule sauvegarde.

## Hébergement gratuit

- **GitHub Pages** : le workflow `.github/workflows/pages.yml` déploie la branche `main`. Active-le dans *Settings > Pages > Source : GitHub Actions*. GitHub Pages sur un dépôt privé demande un compte payant ; sinon, rends le dépôt public (il ne contient aucune donnée personnelle) ou utilise l’option suivante.
- **Netlify Drop** (app.netlify.com/drop) : glisse-dépose le dossier, tu obtiens une URL en HTTPS.

## En local

```bash
npm start   # http://localhost:8080
npm test    # tests de la logique (chaîne, reprise, sprints, sommeil)
```

Aucune dépendance et aucune étape de build : HTML, CSS et JavaScript (modules ES).

## Modifier

- Habitudes et règles : directement dans l’onglet Bilan.
- Séances et planning de la semaine : `js/data.js`.
- Après une modification des fichiers, incrémente `VERSION` dans `sw.js` pour que le téléphone récupère la nouvelle version.
