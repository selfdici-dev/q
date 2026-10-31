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
| Jour | Au premier écran : ton double (un portrait buste dans un médaillon, qui évolue avec ton niveau : 8 paliers, la poitrine puis les abdos, la mâchoire et le V du ventre se dessinent ; l’anneau s’allume avec ta chaîne ; touche-le pour voir le prochain palier), la chaîne (sprint, niveau, message du jour) et ton plan du jour, qui commence par « Maintenant » (la prochaine chose à faire, avec un gros bouton) : routine du matin (un grand verre d’eau, douche, sérum sourcils The Ordinary, crème cheveux SheaMoisture ; en tête jusqu’à midi, ensuite elle ne passe plus devant le reste), séance, leçon, révisions, lecture, routine du soir (vêtements de demain prêts, au lit à l’heure du coucher visé ; elle passe en « Maintenant » une heure avant), et finit par « Copier mon bilan du jour ». Les routines se cochent geste par geste dans une fiche, hors chaîne (une aide, pas une obligation), et comptent dans les bilans copiés. En dessous, sections repliées avec résumé : habitudes (plus une case « Créatine » à part, qui ne compte pas dans la chaîne, masquable dans les réglages), alimentation (protéines, grignotages avec déclencheur, déclencheurs des 14 derniers jours), nuit dernière (avec le réveil progressif, lancé d’une touche : debout à 10 h, puis 30 min plus tôt tous les 3 jours jusqu’au réveil visé, 8 h par défaut (passé une fois de 8 h 30 à 8 h, si tu ne l’avais pas changé), réglable dans Moi > Réglages, 7 jours sur 7 ; au lit au plus tard 8 h avant le réveil du lendemain ; une frise montre les étapes ; une fois lancé, il fixe le coucher visé partout, bilans copiés compris), régularité (calendrier des 12 semaines), règles « Si… alors… », pensée du jour ; minuteur « Envie de scroller ? » de 10 min avant d’ouvrir Snap ou TikTok (venu de l’ancien onglet Focus) |
| Salle | À l’ouverture de l’appli, tu entres dans ta salle : elle est dans le noir, les spots s’allument un par un, la bande LED s’éclaire, le logo de cuivre brille au mur, puis « Ta salle est ouverte » et la séance du jour (≈ 2 s, une fois par ouverture, une touche pour passer, rien si le téléphone demande de réduire les animations), et on passe la porte : l’écran s’efface en avançant et la salle arrive en plein écran, comme si on y entrait. Au premier écran, ta salle (js/gym.js) en plein écran, jusque sous la barre d’état, en maquette vue d’un peu haut, façon jeu vidéo : la pièce en biais, habillée du décor choisi (voir « Décors de la Salle » ; au départ, murs sombres avec grille et logo de cuivre, miroir, écran qui affiche la séance choisie, bandes LED au pied des murs, tapis de course), une borne d’arcade (voir « Arcade ») et une plateforme par séance, chacune avec son bonhomme et son matériel : P à la tour de traction, C au sac de boxe, M sur son tapis de yoga près d’une plante, A sur son tapis avec la roue, B sur ses parallettes devant le porte-élastiques ; touche un poste : sa plateforme s’allume (contour qui pulse, faisceau de lumière, poussières qui montent), son bonhomme se met au travail (les autres attendent), sa séance s’écrit au-dessus de lui (« B · Pectoraux, dos et bras ») et s’affiche dessous avec le bouton ▶ pour la lancer ; en arrivant, c’est celle du jour, marquée comme une quête (un « ! » doré au coin de sa lettre), ✓ sur celles déjà faites ; ton niveau et ton XP dans un HUD en haut, l’aide « ? » en haut à droite, la séance choisie et son bouton posés en bas de la salle, comme dans un jeu ; le mur des records, en plaques de cuivre gravées (ton meilleur chiffre par exercice, tous tours confondus ; un record battu y brille 3 jours avec un ruban « Nouveau · +3 ») ; quand la séance démarre, on passe de la salle au lecteur en douceur, et la séance se joue dans ta salle : le bonhomme a les pieds sur le parquet, sous les spots, devant la bande LED (cuivre pendant l’effort, bleu glacé pendant le repos) ; au lancement, les spots s’allument un par un (rien si le téléphone demande de réduire les animations). Le reste est rangé en sections repliées : objectif « fin, sec et élancé » (abdos et mâchoire visibles, posture droite, pas de volume), semaine type (B le mardi, le jeudi et le samedi, A le lundi et le vendredi, cardio C le mercredi, M et repos le dimanche ; C en plus au choix, ou les tractions P au parc à sa place quand il y a une barre), séances au poids du corps (tapis, roue abdominale, parallettes et 4 élastiques en boucle pour la B, la M et l’échauffement) : A (abdos, un minimum chiffré au début de chaque consigne : crunch vélo, roue ×2 à 40 s, crunch inversé pour le bas du ventre, Russian twist pieds décollés, planches latérales avec main sous le torse, hollow body par étapes, 2 tours durs : descentes en 2 à 3 s, 1 ou 2 répétitions en réserve au bip, version plus dure écrite dans la consigne (bouteille d’eau pour le Russian twist), ≈ 15 min), B (calisthénie : pectoraux, dos et bras, sur parallettes avec 4 élastiques en boucle (noir, violet, vert, orange) pour les 2 tirages, le curl et les élévations latérales, poussée et tirage alternés, 2 tours, ≈ 16 min, consignes en 3 étapes avec la couleur d’élastique et une version sans matériel, une phrase « pourquoi » affichée pendant la série : pompes sur parallettes, rowing penché, pompes pike par étapes (négatives, jusqu’à un coussin, complètes, pieds plus près), tirage assis, pompes serrées, curl biceps, élévations latérales à l’élastique noir (le côté des épaules, pour le V vu de face), L-sit genoux groupés), C (cardio boxe dense sans saut, un minimum chiffré par exercice, 3 tours avec 10 s de pause, ≈ 15 min : shadow boxing, burpees sans saut, esquives et crochets (bonhomme de face), mountain climbers rapides, fentes arrière alternées pour les jambes, shadow boxing rapide), P (tractions au parc pendant la marche, à la place d’une C, séance fixe sans échauffement sur tapis, 3 tours, ≈ 15 min : suspension à la barre (échauffement au 1er tour), tractions par étapes (négatives, élastique orange, vraies, pause en haut), tractions australiennes genoux pliés, relevés de genoux suspendu ; bonhomme suspendu à une barre vue de biais), M (posture et dos droit, dans 2 m², un objectif par exercice, ≈ 7 min : fentes basses, superman, pont fessier, tirage superman, chin tucks, passage d’épaules et écarté arrière à l’élastique, étirement des pectoraux mains dans le dos), un dessin au crayon qui montre chaque mouvement en boucle (un corps en 3D dessiné à la main : traits fins, hachures qui suivent les muscles, muscles travaillés en rouge, matériel dessiné ; voir « Dessins des exercices »), ou, pour les exercices qui n’en ont pas encore, un bonhomme animé (lisse : un seul contour par membre, sans rotules ni traits aux articulations, buste en V), au rythme écrit dans la consigne (pompes : descente 2 s, montée 1 s ; rowing et tirage : 1 s serré en haut ; pompes pike : 3 s de descente ; roue et crunch inversé : retour lent ; Russian twist vu de face pour que la rotation se voie, crunch vélo où le coude vient toucher le genou opposé, planche latérale où la main libre passe sous le torse puis remonte, L-sit qui décolle bras tendus puis monte les genoux vers la poitrine) (avec des yeux pour voir dans quel sens il regarde : un de profil, deux de face ; parallettes et élastique dessinés), le muscle travaillé allumé en blanc, ou en noir en thème clair (dans la séance et dans la liste des exercices), objectif de chaque exercice affiché, séance lisible du sol (bouton « Lire la consigne » qui met en pause et affiche la consigne en entier, en gros ; secondes géantes, écran qui se remplit de lignes claires pendant l’effort et de hachures sombres pendant le repos, gros boutons), bips 3-2-1, échauffement intégré, coach vocal à activer dans Moi > Réglages (une voix du téléphone annonce chaque exercice, ton objectif ou ton record, et le repos ; choix de la voix, bouton 🔊 pour couper pendant la séance, sans internet), objectifs qui montent tout seuls (pendant le repos, tu notes en une touche combien tu en as fait : 5 nombres autour de ton objectif, ‹ › pour aller plus bas ou plus haut, « Corriger » si tu t’es trompé, le coach vocal te le rappelle, et à la fin de la séance tu rattrapes ce que tu as oublié ; plus de zoom quand on tape vite ; à la séance suivante, l’objectif affiché devient ton record + 1, un record par exercice et par tour, pas pour les tenues ; record battu : une plaque de cuivre neuve s’allume pendant le repos, avec le chiffre, de combien tu as monté et l’ancien record, un reflet qui la traverse et un anneau de lumière, et le coach vocal l’annonce), calories estimées par séance (MET × poids, avec le dernier poids noté ou 70 kg), ressenti en fin de séance et suggestion de niveau, 3 niveaux, lecteur guidé, démos vidéo, tests de niveau (pompes, planches, hollow), sécurité |
| Manger | En haut, ton assiette du jour : touche ce que tu manges (≈ 40 aliments courants en 6 familles, patate douce, poulet, riz, skyr, pizza, kebab, soda…, chacun en une portion facile à estimer à l’œil, d’après la table Ciqual), un aliment = une portion, − et + par demi-portion ; les calories et les protéines du jour s’additionnent, comparées à l’objectif qui suit tes pas (1 850 kcal à 8 000 pas, ≈ 2 000 à 12 000, entre 1 650 et 2 150) ; des repères à ±15 %, pas une balance ; les protéines des repas comptent dans Jour (dont les boutons protéines notent l’aliment), et les calories passent dans les bilans à copier. Ensuite, des conseils : journée type du réveil à 23 h (≈ 1 850 kcal avec 8 000 pas, ≈ 2 000 les jours à 12 000 pas), sans petit-déjeuner obligatoire ; ce qu’on peut manger en 3 couleurs : vert tous les jours, jaune un peu, rouge prévu 2 ou 3 fois par semaine, rien d’interdit, et comment prendre le rouge ; collations (les protéines d’abord) et le test de la pomme contre le grignotage d’ennui ; remplacer le chocolat de tous les jours (garder le moment, changer l’aliment : mousse skyr-cacao, chocolat chaud maison, banane glacée, dattes et amandes, 2 carrés de noir à 85 %, thé à la menthe après le repas ; un jour sur deux la 1re semaine, puis tous les jours) ; le thé : quand le boire (loin des repas, pas après 15 h) et quoi éviter ; règles, 6 recettes de débutant |
| Moi | 5 sous-onglets : programme (avec tes outils à configurer, rangés dans une section repliée), argent (parcours de 23 leçons courtes (idée, exemple, exercice réel, quiz) dont les questions deviennent des cartes de révision. Patrimoine, trading, calculatrices et actu sont masqués : leur code et tes données restent), bilan (calendrier de régularité des 12 sprints : raté, minimum, complet, séance ; revue hebdomadaire), livres (couvertures sur des étagères par catégorie, à retourner pour lire le résumé et changer le statut, filtres À lire / En cours / Lus), réglages (habitudes, règles, export/import) |

## Arcade

Dans la Salle, une borne d’arcade (marquée « Jeux ») ouvre sept jeux faits pour Cap, présentés en tuiles, sans pub, sans internet et sans son, pour occuper tes mains :

- **Blocs** : glisse les pièces sur une grille de 8 × 8 ; une ligne ou une colonne pleine disparaît. Plusieurs lignes d’un coup, ou des lignes à plusieurs coups de suite, rapportent plus. La partie continue tant qu’une pièce rentre, et reprend là où tu l’as laissée.
- **Calcul éclair** : 60 secondes de calcul utile (soldes, pourcentages, intérêts, prix à l’unité, tables), une réponse parmi quatre ; trois bonnes d’affilée et ça monte d’un niveau, une erreur et ça redescend.
- **Cristaux** : échange deux cristaux voisins (en les touchant l’un après l’autre, ou en glissant) pour en aligner trois de la même couleur ; ils éclatent, ceux du dessus tombent et ça peut s’enchaîner (points multipliés). Une ligne de quatre laisse un cristal éclair qui, en éclatant, emporte toute sa ligne et sa colonne. Un niveau : un score à atteindre en 20 coups (1 000 points au niveau 1, 400 de plus à chaque niveau), les coups restants rapportent un bonus. Chaque couleur a sa forme (rond, losange, carré, hexagone, pentagone) ; après 6 s sans jouer, un coup possible frétille.
- **Serpent** : guide le serpent vers les fruits, en glissant le doigt sur la grille, avec les flèches à l’écran ou celles du clavier ; il grandit à chaque fruit et accélère tous les 5 fruits. Ne touche ni les bords ni ta queue. La partie se met en pause si tu quittes l’arcade.
- **Paires** : retourne les cartes deux par deux pour retrouver les jumelles (les dessins de l’appli, une couleur par paire) ; deux cartes différentes se referment toutes seules. Niveaux de 6, 8, 10, 12 puis 15 paires ; 3 étoiles en au plus 1,5 coup par paire.
- **Code secret** : trouve la suite cachée de 4 couleurs (parmi 6, une couleur peut revenir) en 10 essais au plus. Après chaque essai, ● une bonne couleur à la bonne place, ○ une bonne couleur mal placée. Chaque couleur a sa forme.
- **Sudoku** : des grilles fabriquées dans l’appli, à solution unique, en 3 niveaux (38, 31 ou 26 chiffres donnés). Touche une case puis un chiffre ; un chiffre faux s’affiche en rouge et compte une erreur ; mode notes pour les chiffres possibles (ils s’effacent tout seuls quand tu places le bon) ; un chiffre placé 9 fois se grise. Le temps compté est le temps actif (une pause de plus d’une minute ne compte pas).

Tes records (meilleur score, lignes effacées, meilleure série, niveau des Cristaux et des Paires, fruits du Serpent, codes trouvés, grilles résolues et meilleurs temps) restent sur le téléphone, dans la sauvegarde ; une partie de Blocs, Cristaux, Paires, Code secret ou Sudoku en cours reprend là où tu l’as laissée.

## Décors de la Salle

Le bouton « Décor », en haut de la Salle, change l’habillage de la pièce : les mêmes postes, les mêmes bonshommes et la même borne, dans un autre monde. Douze décors, à choisir librement parmi ceux que tu as débloqués, et durs à débloquer :

| Décor | Pour le débloquer |
| --- | --- |
| La salle (murs sombres, grille et logo de cuivre, LED) | ouvert dès le départ |
| Temple grec (marbre et colonnes au-dessus des nuages, au coucher du soleil) | 15 séances |
| Forêt au crépuscule (ponton de bois sous les arbres, guirlande, lucioles) | 20 matins avec ta routine complète |
| Dojo (bois, papier de riz, tatamis, lanternes, pétales de cerisier qui tombent) | 3 000 points aux Blocs |
| Toit de la ville (en haut d’une tour, la nuit, néon « CAP » qui grésille) | 30 points au Calcul éclair |
| Fond marin (vitres sur la mer, poissons qui passent, algues, bulles, coffre au trésor) | 10 sudokus résolus |
| Grand hall (pierre, feu de cheminée et braises, torches, blason noir et or) | 40 séances |
| Néon rétro (soleil à rayures, palmiers de néon, sol quadrillé qui défile) | niveau 8 réussi aux Cristaux |
| Station spatiale (hublots, planète bleue, écran holographique) | niveau 12 |
| Arène romaine (arches et foule qui t’encourage, fanions, braseros, sable) | 60 séances |
| Ponton sur la mer (soleil couchant, île à palmiers, voilier, mouettes) | 6 000 points aux Blocs |
| Sommet (montagnes enneigées, aurore boréale, neige qui tombe) | niveau 20 |

Une séance compte une fois par jour, sans compter M ; pour les jeux, c’est ta meilleure partie. Les décors verrouillés montrent ce qu’il reste à faire, et un décor qui se débloque est fêté. Le choix est gardé dans tes réglages ; ce qui est débloqué est recalculé depuis tes données, jamais stocké. Les animations (sans son) s’arrêtent si le téléphone demande de les réduire.

## Dessins des exercices

Chaque exercice des séances a son dessin au crayon, comme dans un livre de musculation : un corps sec et musclé en 3D, posé comme dans la consigne, rendu en croquis (traits fins, hachures en anneaux qui suivent les formes, mèches de cheveux), les muscles travaillés en rouge, le matériel dessiné (parallettes, roue, élastique noir ou vert, barre du parc). Quelques images par mouvement, jouées au rythme exact du bonhomme (mêmes poses clés, même tempo, mêmes arrêts) ; l’autre côté (gauche, droite) est le même dessin en miroir. Si le téléphone demande de réduire les animations : la pose de départ, et l’arrivée en transparence. Les images (`img/ex/`, WebP, ≈ 20 Ko chacune) ont leur propre cache hors ligne, gardé d’une version à l’autre. Elles sont fabriquées par `outils/dessins/` (Python et Blender, sur l’ordi, pas dans l’appli) : voir son README.

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
