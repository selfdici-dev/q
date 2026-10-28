# Cap

Appli personnelle pour **tenir** et **apprendre** : habitudes à deux niveaux (minimum / complet), règle « jamais deux fois de suite », sprints de 7 jours, focus 25 min, minuteur anti-scroll, séances guidées sur tapis, sommeil.

Design « Cuivre » : l’ambiance d’une salle de sport haut de gamme le soir. Fond noir chaud, cuivre pour les boutons, les anneaux, les barres et ce qui est fait (comme un logo en cuivre éclairé), texte crème, parallettes en bois, une touche de bleu glacé (la lumière des bains froids) ; barre d’onglets en verre dépoli avec de vraies icônes ; des icônes fines au trait, dessinées pour l’appli, dans les titres, les sections repliées, le plan du jour et la séance (plus d’emojis dans l’interface ; ceux des habitudes et des messages restent) ; chiffres arrondis ; en séance, lueur cuivre pendant l’effort et bleu glacé pendant le repos (thème clair « crème » en option). Le look précédent, « Aurore », revient en retirant `css/cuivre.css` de `index.html`. Elle fonctionne hors ligne et s’installe sur le téléphone. Aucune donnée ne quitte l’appareil. Les animations (changement d’onglet, anneau et barres qui se remplissent, case cochée) se coupent si le téléphone demande de réduire les animations.

## Principes

- **Minimum / Complet.** Chaque habitude a une version de 2 minutes. La journée est validée dès que tous les minimums sont faits. Un mauvais jour se sauve avec les minimums.
- **Jamais deux fois de suite.** Un jour raté isolé ne casse pas la chaîne, avec une seule reprise par fenêtre de 7 jours. Le lendemain d’un raté, l’appli passe en *mode reprise* : seulement les minimums, de préférence avant midi.
- **L’historique ne bouge pas.** Chaque jour garde la liste d’habitudes en vigueur ce jour-là.
- **Sprints de 7 jours.** 12 sprints, soit 12 semaines. Un sprint est réussi à 5 jours validés sur 7. Chaque objectif a une fin proche.
- **La journée se termine à 4 h.** Un coucher à 1 h compte pour la veille.
- **Bilan du dimanche.** 3 questions et une seule chose à changer.
- **XP et niveaux.** Calculés à partir de tes données (habitudes, séances, sessions, leçons, trades), jamais stockés : impossible de tricher par erreur.

## Bilan pour Claude

- *Jour > Ton plan du jour > Copier mon bilan du jour* : habitudes faites, séance, focus, protéines, créatine (si la case est affichée), grignotages, coucher visé, poids si saisi.
- *Moi > Bilan > Copier mon bilan de la semaine* : les mêmes chiffres sur le sprint, plus tes 3 réponses du bilan.

Le texte part seulement dans le presse-papiers : tu le colles toi-même dans Claude.

## Révisions

Révision espacée (boîtes de Leitner) : chaque leçon de finance validée ajoute ses questions comme cartes, et tu crées les tiennes (trading, crypto, culture, livres). Une carte réussie revient après 1, 3, 7, 14, 30, 60 puis 120 jours ; une carte ratée revient le jour même. Accès depuis la carte « Révisions » de l’onglet Jour (`#revision`).

## Onglets

4 onglets, la Salle s’ouvre en premier : Salle, Jour, Manger et Moi. L’onglet Focus est retiré (son minuteur reste joignable par `#focus`, tes données sont intactes) et Argent est rangé dans Moi.

Sur chaque onglet, le petit « ? » (à côté du titre, ou de la date sur Jour) explique en 3 phrases comment il marche.

| Onglet | Contenu |
|---|---|
| Jour | Au premier écran : ton double (un portrait buste dans un médaillon, qui évolue avec ton niveau : 8 paliers, la poitrine puis les abdos, la mâchoire et le V du ventre se dessinent ; l’anneau s’allume avec ta chaîne ; touche-le pour voir le prochain palier), la chaîne (sprint, niveau, message du jour) et ton plan du jour, qui commence par « Maintenant » (la prochaine chose à faire, avec un gros bouton) : séance, leçon, révisions, lecture et finit par « Copier mon bilan du jour ». En dessous, sections repliées avec résumé : habitudes (plus une case « Créatine » à part, qui ne compte pas dans la chaîne, masquable dans les réglages), alimentation (protéines, grignotages avec déclencheur, déclencheurs des 14 derniers jours), nuit dernière (avec le réveil progressif, lancé d’une touche : debout à 10 h, puis 30 min plus tôt tous les 3 jours jusqu’au réveil visé, 8 h 30 par défaut, réglable dans Moi > Réglages, 7 jours sur 7 ; au lit au plus tard 8 h avant le réveil du lendemain ; une frise montre les étapes ; une fois lancé, il fixe le coucher visé partout, bilans copiés compris), régularité (calendrier des 12 semaines), règles « Si… alors… », pensée du jour ; minuteur « Envie de scroller ? » de 10 min avant d’ouvrir Snap ou TikTok (venu de l’ancien onglet Focus) |
| Salle | À l’ouverture de l’appli, tu entres dans ta salle : elle est dans le noir, les spots s’allument un par un, la bande LED s’éclaire, le logo de cuivre brille au mur, puis « Ta salle est ouverte » et la séance du jour (≈ 2 s, une fois par ouverture, une touche pour passer, rien si le téléphone demande de réduire les animations). Au premier écran : la séance du jour en grand, jouée par le bonhomme dans un vrai décor de salle (mur en pierre sombre, grille et logo de cuivre, trois spots, bande LED, parquet), et ton niveau (XP) ; les 5 postes (A, B, C, P, M), des stations éclairées avec une bande LED à leur couleur, à lancer d’une touche ; le mur des records, en plaques de cuivre gravées (ton meilleur chiffre par exercice, tous tours confondus ; un record battu y brille 3 jours avec un ruban « Nouveau · +3 ») ; quand la séance démarre, on passe de la salle au lecteur en douceur, et la séance se joue dans ta salle : le bonhomme a les pieds sur le parquet, sous les spots, devant la bande LED (cuivre pendant l’effort, bleu glacé pendant le repos) ; au lancement, les spots s’allument un par un (rien si le téléphone demande de réduire les animations). Le reste est rangé en sections repliées : objectif « fin, sec et élancé » (abdos et mâchoire visibles, posture droite, pas de volume), semaine type (A et B en alternance du lundi au samedi, cardio C en plus au choix avec un bouton sur la carte du jour, ou les tractions P au parc à la place, M et repos le dimanche), séances au poids du corps (tapis, roue abdominale, parallettes et 4 élastiques en boucle pour la B, la M et l’échauffement) : A (abdos, un minimum chiffré au début de chaque consigne : crunch vélo, roue ×2 à 40 s, crunch inversé pour le bas du ventre, Russian twist pieds décollés, planches latérales avec main sous le torse, hollow body par étapes, 2 tours durs : descentes en 2 à 3 s, 1 ou 2 répétitions en réserve au bip, version plus dure écrite dans la consigne (bouteille d’eau pour le Russian twist), ≈ 15 min), B (calisthénie : pectoraux, dos et bras, sur parallettes avec 4 élastiques en boucle (noir, violet, vert, orange) pour les 2 tirages et le curl, poussée et tirage alternés, 2 tours, ≈ 16 min, consignes en 3 étapes avec la couleur d’élastique et une version sans matériel, une phrase « pourquoi » affichée pendant la série : pompes sur parallettes, rowing penché, pompes pike par étapes (négatives, jusqu’à un coussin, complètes, pieds plus près), tirage assis, pompes serrées, curl biceps, L-sit genoux groupés), C (cardio boxe dense sans saut, un minimum chiffré par exercice, 3 tours avec 10 s de pause, ≈ 15 min : shadow boxing, burpees sans saut, esquives et crochets (bonhomme de face), mountain climbers rapides, fentes arrière alternées pour les jambes, shadow boxing rapide), P (tractions au parc pendant la marche, à la place d’une C, séance fixe sans échauffement sur tapis, 3 tours, ≈ 15 min : suspension à la barre (échauffement au 1er tour), tractions par étapes (négatives, élastique orange, vraies, pause en haut), tractions australiennes genoux pliés, relevés de genoux suspendu ; bonhomme suspendu à une barre vue de biais), M (posture et dos droit, dans 2 m², un objectif par exercice, ≈ 7 min : fentes basses, superman, pont fessier, tirage superman, chin tucks, passage d’épaules et écarté arrière à l’élastique, étirement des pectoraux mains dans le dos), un bonhomme animé qui montre chaque mouvement en boucle (lisse : un seul contour par membre, sans rotules ni traits aux articulations, buste en V), au rythme écrit dans la consigne (pompes : descente 2 s, montée 1 s ; rowing et tirage : 1 s serré en haut ; pompes pike : 3 s de descente ; roue et crunch inversé : retour lent ; Russian twist vu de face pour que la rotation se voie, crunch vélo où le coude vient toucher le genou opposé, planche latérale où la main libre passe sous le torse puis remonte, L-sit qui décolle bras tendus puis monte les genoux vers la poitrine) (avec des yeux pour voir dans quel sens il regarde : un de profil, deux de face ; parallettes et élastique dessinés), le muscle travaillé allumé en blanc, ou en noir en thème clair (dans la séance et dans la liste des exercices), objectif de chaque exercice affiché, séance lisible du sol (bouton « Lire la consigne » qui met en pause et affiche la consigne en entier, en gros ; secondes géantes, écran qui se remplit de lignes claires pendant l’effort et de hachures sombres pendant le repos, gros boutons), bips 3-2-1, échauffement intégré, coach vocal à activer dans Moi > Réglages (une voix du téléphone annonce chaque exercice, ton objectif ou ton record, et le repos ; choix de la voix, bouton 🔊 pour couper pendant la séance, sans internet), objectifs qui montent tout seuls (pendant le repos, tu notes en une touche combien tu en as fait : 5 nombres autour de ton objectif, ‹ › pour aller plus bas ou plus haut, « Corriger » si tu t’es trompé, le coach vocal te le rappelle, et à la fin de la séance tu rattrapes ce que tu as oublié ; plus de zoom quand on tape vite ; à la séance suivante, l’objectif affiché devient ton record + 1, un record par exercice et par tour, pas pour les tenues ; record battu : une plaque de cuivre neuve s’allume pendant le repos, avec le chiffre, de combien tu as monté et l’ancien record, un reflet qui la traverse et un anneau de lumière, et le coach vocal l’annonce), calories estimées par séance (MET × poids, avec le dernier poids noté ou 70 kg), ressenti en fin de séance et suggestion de niveau, 3 niveaux, lecteur guidé, démos vidéo, tests de niveau (pompes, planches, hollow), sécurité |
| Manger | Que des conseils, rien à calculer (protéines et grignotages se notent dans Jour) : journée type du réveil à 23 h (≈ 1 850 kcal avec 8 000 pas, ≈ 2 000 les jours à 12 000 pas), sans petit-déjeuner obligatoire ; ce qu’on peut manger en 3 couleurs : vert tous les jours, jaune un peu, rouge prévu 2 ou 3 fois par semaine, rien d’interdit, et comment prendre le rouge ; collations (les protéines d’abord) et le test de la pomme contre le grignotage d’ennui ; le thé : quand le boire (loin des repas, pas après 15 h) et quoi éviter ; règles, 6 recettes de débutant |
| Moi | 5 sous-onglets : programme (avec tes outils à configurer, rangés dans une section repliée), argent (parcours de 23 leçons courtes (idée, exemple, exercice réel, quiz) dont les questions deviennent des cartes de révision. Patrimoine, trading, calculatrices et actu sont masqués : leur code et tes données restent), bilan (calendrier de régularité des 12 sprints : raté, minimum, complet, séance ; revue hebdomadaire), livres (couvertures sur des étagères par catégorie, à retourner pour lire le résumé et changer le statut, filtres À lire / En cours / Lus), réglages (habitudes, règles, export/import) |

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
