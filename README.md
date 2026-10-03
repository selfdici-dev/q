# Cap

Appli personnelle pour **tenir** et **apprendre** : habitudes à deux niveaux (minimum / complet), règle « jamais deux fois de suite », sprints de 7 jours, focus 25 min, minuteur anti-scroll, séances guidées sur tapis, sommeil.

Design « Horlogerie » : noir pur, or champagne, titres et chiffres à empattements (thème clair ivoire et bronze en option). Elle fonctionne hors ligne et s’installe sur le téléphone. Aucune donnée ne quitte l’appareil. Les animations (changement d’onglet, anneau et barres qui se remplissent, case cochée) se coupent si le téléphone demande de réduire les animations.

## Principes

- **Minimum / Complet.** Chaque habitude a une version de 2 minutes. La journée est validée dès que tous les minimums sont faits. Un mauvais jour se sauve avec les minimums.
- **Jamais deux fois de suite.** Un jour raté isolé ne casse pas la chaîne, avec une seule reprise par fenêtre de 7 jours. Le lendemain d’un raté, l’appli passe en *mode reprise* : seulement les minimums, de préférence avant midi.
- **L’historique ne bouge pas.** Chaque jour garde la liste d’habitudes en vigueur ce jour-là.
- **Sprints de 7 jours.** 12 sprints, soit 12 semaines. Un sprint est réussi à 5 jours validés sur 7. Chaque objectif a une fin proche.
- **La journée se termine à 4 h.** Un coucher à 1 h compte pour la veille.
- **Bilan du dimanche.** 3 questions et une seule chose à changer.
- **XP et niveaux.** Calculés à partir de tes données (habitudes, séances, sessions, leçons, trades), jamais stockés : impossible de tricher par erreur.

## Bilan pour Claude

- *Jour > Ton plan du jour > Copier mon bilan du jour* : habitudes faites, séance, focus, protéines, grignotages, coucher visé, poids si saisi.
- *Moi > Bilan > Copier mon bilan de la semaine* : les mêmes chiffres sur le sprint, plus tes 3 réponses du bilan.

Le texte part seulement dans le presse-papiers : tu le colles toi-même dans Claude.

## Révisions

Révision espacée (boîtes de Leitner) : chaque leçon de finance validée ajoute ses questions comme cartes, et tu crées les tiennes (trading, crypto, culture, livres). Une carte réussie revient après 1, 3, 7, 14, 30, 60 puis 120 jours ; une carte ratée revient le jour même. Accès depuis la carte « Révisions » de l’onglet Jour (`#revision`).

## Onglets

Sur chaque onglet, le petit « ? » (à côté du titre, ou de la date sur Jour) explique en 3 phrases comment il marche.

| Onglet | Contenu |
|---|---|
| Jour | Au premier écran : ton double (un personnage qui évolue avec ton niveau, 8 paliers, aura dorée selon ta chaîne ; touche-le pour voir le prochain palier), la chaîne (sprint, niveau, message du jour) et ton plan du jour, qui commence par « Maintenant » (la prochaine chose à faire, avec un gros bouton ; dans l’heure avant le coucher visé, poser le téléphone passe devant) et finit par « Copier mon bilan du jour ». En dessous, sections repliées avec résumé : habitudes, alimentation (protéines, grignotages avec déclencheur, déclencheurs des 14 derniers jours), nuit dernière, régularité (calendrier des 12 semaines), règles « Si… alors… », pensée du jour |
| Focus | Minuteur 25/5 : un arbre doré pousse au centre (unique à chaque session, fruits à la fin), jardin d’arbres du jour, minuteur « Envie de scroller ? » de 10 min |
| Argent | Parcours de 23 leçons courtes (idée, exemple, exercice réel, quiz) dont les questions deviennent des cartes de révision. Patrimoine, trading, calculatrices et actu sont masqués : leur code et tes données restent |
| Corps | Au premier écran : la séance du jour (gros bouton « Lancer la séance ») et la régularité (séances de la semaine, semaines tenues). Le reste est rangé en sections repliées : objectif « fin, sec et élancé » (abdos et mâchoire visibles, posture droite, pas de volume), semaine type, séances au poids du corps (tapis + roue abdominale seulement) : A (abdos : roue ×2, crunch inversé, gainage), B (haut du corps et posture : pompes, tirage superman, pike, Y, W), C (cardio sans saut), M (mobilité, posture, cou et mâchoire, vacuum, ≈ 8 min), un bonhomme animé façon mannequin qui montre chaque mouvement en boucle, le muscle travaillé allumé en or (dans la séance et dans la liste des exercices), objectif de chaque exercice affiché, séance lisible du sol (secondes géantes, écran qui se remplit d’or pendant l’effort et de bleu pendant le repos, gros boutons), bips 3-2-1, échauffement intégré, ressenti en fin de séance et suggestion de niveau, 3 niveaux, lecteur guidé, démos vidéo, tests de niveau (pompes, planches, hollow), manger et cuisiner (règles, 6 recettes de débutant), sécurité |
| Moi | 4 sous-onglets : programme (avec tes outils à configurer, rangés dans une section repliée), bilan (calendrier de régularité des 12 sprints : raté, minimum, complet, séance ; revue hebdomadaire), livres (couvertures sur des étagères par catégorie, à retourner pour lire le résumé et changer le statut, filtres À lire / En cours / Lus), réglages (habitudes, règles, export/import) |

## Installer sur le téléphone

1. Héberge le dossier en HTTPS (voir ci-dessous).
2. Ouvre l’URL dans Chrome (Android) ou Safari (iPhone).
3. Android : menu ⋮ > *Ajouter à l’écran d’accueil*. iPhone : bouton Partager > *Sur l’écran d’accueil*.

Les données sont propres à chaque appareil. Pour passer du téléphone à l’ordi, utilise *Moi > Réglages > Exporter*, puis *Importer* sur l’autre appareil. **Exporte chaque semaine** : c’est ta seule sauvegarde. Au-delà de 7 jours sans export, un bandeau sur l’onglet Jour te le rappelle, avec un bouton d’export direct. À l’import, le fichier est entièrement vérifié (format, dates, valeurs) et son contenu t’est montré avant de remplacer quoi que ce soit.

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
