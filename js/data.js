// Contenu par défaut : habitudes et séances. Tout est modifiable dans l'appli
// (habitudes) ou ici (séances).

export const DEFAULT_HABITS = [
  { id: 'sport', emoji: '💪', name: 'Bouger', min: 'Mobilité 8 min OU 5 pompes + 30 s de gainage', full: 'Séance du jour + 8 000 pas' },
  { id: 'apprendre', emoji: '📚', name: 'Apprendre', min: '1 leçon de finance OU 2 pages', full: '1 leçon de finance + 20 min de lecture' },
  { id: 'manger', emoji: '🍎', name: 'Pas de grignotage', min: 'Pas de grignotage après le dîner', full: 'Zéro grignotage hors des repas' },
];

export const DEFAULT_RULES = [
  'Si j’ai envie d’ouvrir TikTok, alors j’appuie sur « Envie de scroller » et j’attends 10 min.',
  'Si j’ai raté hier, alors je fais les minimums avant midi.',
  'Si c’est 23 h, alors le téléphone part en charge dans une autre pièce.',
];

// Séances sur tapis, sans mur, petit espace, mouvements contrôlés.
// Matériel : le corps, un tapis, une roue abdominale, des parallettes et 4 élastiques
// en boucle (noir, violet, vert, orange, du plus léger au plus dur) : ils servent dans
// la B (2 tirages et le curl), la M (écarté et passage d’épaules) et l’échauffement.
// Chaque exercice à l’élastique ou sur parallettes garde une version sans matériel.
// Seule exception : la P, au parc, à la barre de traction.
// work = secondes d'effort au niveau 2 ; le niveau 1 fait -10 s, le niveau 3 +10 s.
// target = à quoi sert l'exercice (objectif : fin, sec et élancé, abdos
// visibles, mâchoire nette, pas de volume). Les IDs A, B, C, P, M sont stockés :
// ne pas les changer. prep (facultatif) : la consigne du départ. star : l'exercice
// phare, dont le bonhomme représente la séance dans la Salle.
export const WORKOUTS = [
  {
    id: 'A',
    star: 'Roue abdominale à genoux (1/2)',
    name: 'A · Abdos et tronc',
    met: 3.8,
    desc: 'Abdos visibles, taille fine et V du bas du ventre : crunch vélo et roue abdominale (les deux en tête des mesures, la roue deux fois par tour), crunch inversé pour le bas du ventre, Russian twist pieds décollés, planches latérales et hollow body qui progresse par étapes. 2 tours, mais durs : descentes en 2 à 3 s, et au bip il ne doit te rester que 1 ou 2 répétitions en réserve. Encore de la marge ? Passe à la version plus dure de la consigne.',
    rounds: 2,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Crunch vélo', work: 30, target: 'Abdos et obliques · l’un des deux plus efficaces', cue: 'Objectif : 20 à 24 touches (10 à 12 par côté), lentes. 1. Sur le dos, doigts derrière les oreilles sans tirer la nuque, omoplates décollées. 2. Un coude vers le genou opposé, pendant que l’autre jambe s’allonge au ras du sol. 3. Change de côté lentement, comme si tu pédalais. Expire à chaque touche. Plus de 24 faciles : serre 1 s coude contre genou à chaque touche.' },
      { name: 'Roue abdominale à genoux (1/2)', work: 40, target: 'Abdos complets · l’un des deux plus efficaces', cue: 'Objectif : 8 à 10 allers-retours. 1. À genoux, mains sur la roue sous les épaules, dos un peu rond, fesses serrées. 2. Roule devant toi en 3 s, reviens en 2 s en tirant avec le ventre. 3. Ça tire dans le bas du dos : roule moins loin. Plus de 10 faciles : roule plus loin et marque 1 s de pause tout au bout.' },
      { name: 'Russian twist', work: 30, target: 'Obliques · taille dessinée', cue: 'Objectif : 20 à 24 rotations (10 à 12 par côté), pieds décollés. 1. Assis, buste penché en arrière, dos droit, pieds en l’air. 2. Mains jointes : tourne les épaules d’un côté puis de l’autre, le regard suit les mains. 3. Les pieds retombent : pose les talons et finis la série. Plus de 24 faciles : une bouteille d’eau pleine dans les mains.' },
      { name: 'Crunch inversé', work: 30, target: 'Bas des abdos · le V du ventre', cue: 'Objectif : 8 à 10 crunchs inversés. 1. Sur le dos, mains au sol le long du corps, genoux pliés en l’air. 2. Ramène les genoux vers la poitrine en décollant le bas du dos : le bassin s’enroule. 3. Redescends en 3 s sans poser les pieds. Ça tire dans le dos : va moins loin. Plus de 10 faciles : jambes presque tendues, monte le bassin plus haut.' },
      { name: 'Planche latérale (droite)', work: 30, target: 'Obliques · taille gainée', cue: 'Objectif : 1 seule tenue jusqu’au bip, bassin haut. 1. Couché sur le côté droit, coude sous l’épaule, pieds l’un sur l’autre. 2. Monte le bassin en ligne droite, bras libre vers le plafond. 3. Plus dur : main libre sous le torse puis vers le plafond, en boucle jusqu’au bip. Genou au sol si besoin.' },
      { name: 'Planche latérale (gauche)', work: 30, target: 'Obliques · taille gainée', cue: 'Objectif : 1 seule tenue jusqu’au bip, bassin haut. 1. Couché sur le côté gauche, coude sous l’épaule, pieds l’un sur l’autre. 2. Monte le bassin en ligne droite, bras libre vers le plafond. 3. Plus dur : main libre sous le torse puis vers le plafond, en boucle jusqu’au bip. Genou au sol si besoin.' },
      { name: 'Hollow hold genoux pliés', work: 30, target: 'Grand droit · la tablette', cue: 'Objectif : 1 tenue jusqu’au bip. Bas du dos collé au tapis, épaules décollées, bras vers les pieds. Étape 1 : genoux pliés. Étape 2 : une jambe tendue. Étape 3 : les deux jambes tendues, bras au-dessus de la tête. Le dos décolle : reviens à l’étape d’avant.' },
      { name: 'Roue abdominale à genoux (2/2)', work: 40, target: 'Abdos complets · deuxième passage', cue: 'Objectif : 6 allers-retours. 1. Même position qu’au premier passage : dos un peu rond, fesses serrées. 2. Tu es fatigué : roule moins loin plutôt que de creuser le bas du dos. 3. Ça tire dans le bas du dos : arrête 5 s et reprends plus court.' },
    ],
  },
  {
    id: 'B',
    star: 'Pompes (sur parallettes)',
    name: 'B · Pectoraux, dos et bras',
    met: 4,
    desc: 'Calisthénie : ton corps est l’outil. Pompes profondes et L-sit sur parallettes, pompes pike et diamant, plus 2 tirages, un curl et des élévations latérales à l’élastique pour un dos en V, des épaules un peu plus larges et des bras dessinés. Poussée et tirage alternés : chaque muscle souffle avant de repartir. ≈ 16 min. Chaque série va jusqu’au bip, quitte à finir sur les genoux. 2 tours.',
    rounds: 2,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Pompes (sur parallettes)', work: 40, why: 'Descendre plus bas que les mains étire le pectoral : un torse ferme et dessiné, pas gonflé.', target: 'Pectoraux et triceps · torse ferme', cue: 'Objectif : 10 à 13 pompes. 1. Parallettes sous les épaules, poignées vers l’avant. 2. Corps droit, fesses serrées : descends en 2 s plus bas que les mains, remonte en 1 s. 3. Tu cales : finis sur les genoux. Plus de 13 aux 2 tours : descends en 3 s, tiens 1 s en bas. Sans parallettes : mains au sol.' },
      { name: 'Rowing penché à l’élastique', work: 40, why: 'Le grand dorsal élargit le haut du dos : la taille paraît plus fine, c’est ça le V.', target: 'Dos et arrière des épaules · dos en V', cue: 'Objectif : 10 à 12 rowings. 1. Debout en chaussures, pieds à plat sur le milieu de l’élastique vert, une boucle dans chaque main. 2. Genoux pliés, buste penché, dos plat. 3. Tire les coudes vers les hanches, serre 1 s, redescends en 2 s. Plus de 12 faciles : orange. Sans élastique : tirage superman de la séance M (vise 8).' },
      { name: 'Pompes pike', work: 35, why: 'Le haut des épaules s’arrondit : des épaules nettes font paraître la taille plus fine.', target: 'Épaules · dessinées, sans gonfler', cue: 'Objectif : 4 à 8 pompes pike, à ton étape. Mains au sol, fesses en l’air : un V à l’envers. Étape 1 : négatives : la tête descend en 3 s, remonte sur les genoux. Étape 2 : la tête s’arrête sur un coussin. Étape 3 : complètes, tête au tapis devant les mains. Étape 4 : pieds plus près des mains. Plus de 8 faciles : étape suivante.' },
      { name: 'Tirage assis à l’élastique', work: 40, why: 'Les omoplates se serrent et les épaules s’ouvrent : tu te tiens droit, tu parais plus grand.', target: 'Dos et biceps · dos en V', cue: 'Objectif : 10 à 12 tirages. 1. Assis, genoux un peu pliés, élastique vert autour du milieu des pieds. 2. Attrape chaque côté assez près des pieds pour qu’il soit tendu bras tendus. 3. Tire les coudes jusqu’aux côtes, serre 1 s, reviens en 2 s. Plus de 12 faciles : orange. Sans élastique : tirage superman de la séance M (vise 8).' },
      { name: 'Pompes serrées (diamant)', work: 35, why: 'Le triceps fait les deux tiers du bras : c’est lui qui dessine un bras sec, sans gros biceps.', target: 'Triceps et pectoraux · arrière des bras dessiné', cue: 'Objectif : 6 à 10. 1. Mains au sol sous la poitrine, pouces et index qui se touchent. 2. Coudes collés aux côtes, descends en 2 s, remonte en 1 s. 3. Tu cales : finis sur les genoux. Plus de 10 : descends en 3 s.' },
      { name: 'Curl biceps à l’élastique', work: 35, why: 'Le biceps donne le relief du bras vu de face : avec le triceps, un bras sec et veiné, pas massif.', target: 'Biceps et avant-bras · bras dessinés', cue: 'Objectif : 10 à 12 curls. 1. Debout en chaussures sur le milieu de l’élastique noir, une boucle dans chaque main, sans l’enrouler. 2. Coudes collés aux côtes, monte les mains aux épaules en 1 s. 3. Redescends en 2 s, buste immobile. Plus de 12 faciles : violet. Sans élastique : tirage superman de la séance M (vise 8).' },
      { name: 'Élévations latérales à l’élastique', work: 35, why: 'Le côté de l’épaule s’élargit un peu : au-dessus d’une taille fine, c’est le V vu de face.', target: 'Épaules (le côté) · le V vu de face', cue: 'Objectif : 10 à 12 élévations. 1. Debout en chaussures sur le milieu de l’élastique noir, une boucle dans chaque main. 2. Monte les bras sur les côtés à hauteur d’épaules en 1 s, coudes un peu pliés, épaules basses. 3. Redescends en 2 s. Trop dur : plie les coudes. Plus de 12 faciles : violet. Sans élastique : à vide, lentement.' },
      { name: 'L-sit (genoux groupés)', work: 35, why: 'Les abdos serrent fort en tenue : ils deviennent durs. C’est la sèche qui les rend visibles.', target: 'Abdos, triceps et avant-bras · abdos taillés', cue: 'Objectif : 4 tenues de 5 s. Parallettes parallèles, de chaque côté des hanches. Étape 1 : talons au sol, bras tendus, décolle les fesses. Étape 2 : décolle aussi un pied. Étape 3 : les deux pieds, genoux vers la poitrine. Sans parallettes : poings au sol.' },
    ],
  },
  {
    id: 'C',
    star: 'Shadow boxing',
    name: 'C · Cardio sans saut',
    met: 7,
    desc: 'Cardio boxe, dense, dans 2 m² et sans bruit : 3 tours, 10 s de pause seulement, le cœur reste haut du début à la fin. La moitié des exercices, c’est de la boxe : ça passe plus vite. Les fentes font travailler les jambes, les plus gros muscles, ceux qui dépensent le plus. Ça aide à sécher, mais ce sont l’assiette et les pas qui font le plus gros.',
    rounds: 3,
    rest: 10,
    roundRest: 45,
    exercises: [
      { name: 'Shadow boxing', work: 40, target: 'Cardio et épaules · corps sec', cue: 'Objectif : 40 coups, garde haute jusqu’au bip. 1. Un pied devant, genoux souples, poings au menton. 2. Enchaîne : direct du bras avant, puis direct du bras arrière, en pivotant le pied arrière. 3. Expire à chaque coup et ramène vite le poing en garde.' },
      { name: 'Burpees sans saut', work: 30, target: 'Cardio et gainage · corps entier, celui qui brûle le plus', cue: 'Objectif : 8 burpees. 1. Accroupis-toi, mains au sol devant les pieds. 2. Recule les pieds l’un après l’autre jusqu’en planche, puis ramène-les près des mains. 3. Relève-toi d’un coup, bras tendus devant toi. Va vite : c’est le rythme qui brûle, pas le saut.' },
      { name: 'Shadow boxing (esquives et crochets)', work: 30, target: 'Cardio + obliques · taille dessinée', cue: 'Objectif : 16 esquives, chacune avec son crochet. 1. Garde haute, plie les jambes et penche le buste à gauche, comme pour éviter un coup. 2. Remonte avec un crochet du bras gauche, en tournant les hanches. 3. Puis pareil à droite. Reste bas et léger : cuisses et obliques brûlent.' },
      { name: 'Mountain climbers rapides', work: 30, target: 'Cardio + abdos · gainage en mouvement', cue: 'Objectif : 40 genoux (20 par jambe). 1. En planche, mains sous les épaules, bassin bas. 2. Ramène vite un genou vers la poitrine, puis l’autre, comme si tu courais au sol. 3. Trop dur : ralentis, mais ne t’arrête pas.' },
      { name: 'Fentes arrière alternées', work: 30, target: 'Fessiers et cuisses · cardio, jambes fortes', cue: 'Objectif : 14 fentes (7 par jambe). 1. Debout, pieds sous les hanches, bras le long du corps. 2. Recule un pied d’un grand pas et descends jusqu’à ce que le genou arrière frôle le tapis. 3. Pousse dans le talon de devant pour revenir, puis change de jambe. Buste droit. Trop dur : descends moins bas.' },
      { name: 'Shadow boxing rapide', work: 30, target: 'Cardio et épaules · dernier effort', cue: 'Objectif : 60 coups, le plus vite possible. 1. Garde haute, léger sur les appuis. 2. Directs courts gauche-droite, sans t’arrêter. 3. Ramène le poing en garde à chaque coup : la vitesse, pas la force.' },
    ],
  },
  {
    id: 'P',
    star: 'Tractions (selon ton niveau)',
    name: 'P · Tractions au parc',
    met: 3.8,
    desc: 'À faire pendant ta marche, à la barre d’un parc de street workout, à la place d’une C : ≈ 15 min. La marche te chauffe, et la suspension du 1er tour finit l’échauffement. Tractions à ton étape (négatives, élastique, puis vraies), tractions australiennes pour le milieu du dos, relevés de genoux pour le bas du ventre. Les barres du parc suffisent ; l’élastique orange sert seulement à l’étape 2. 3 tours.',
    rounds: 3,
    rest: 30,
    roundRest: 90,
    fixed: true,
    prep: 'Sous la barre, téléphone posé à côté, mains sèches.',
    exercises: [
      { name: 'Suspension à la barre', work: 30, why: 'La poigne lâche souvent avant le dos : plus tu tiens la barre, plus tu enchaînes de tractions.', target: 'Avant-bras et poigne · tenir plus longtemps à chaque traction', cue: 'Objectif : 1 tenue jusqu’au bip. 1. Mains sur la barre, un peu plus écartées que les épaules, paumes vers l’avant. 2. Bras tendus, épaules loin des oreilles, jambes immobiles. 3. Au 1er tour, sans forcer : c’est ton échauffement. Tu lâches avant le bip : souffle 5 s et raccroche-toi.' },
      { name: 'Tractions (selon ton niveau)', work: 40, why: 'Le geste roi du dos en V et des bras. Chaque kilo de gras perdu rend la suivante plus facile.', target: 'Dos et biceps · dos en V, bras dessinés', cue: 'Objectif : 3 à 6 tractions, à ton étape. Étape 1 : négatives : monte menton au-dessus de la barre (saute, ou un pied sur un banc), puis redescends en 5 s. Étape 2 : élastique orange autour de la barre, un genou dedans. Étape 3 : vraies tractions, de bras tendus à menton au-dessus de la barre. Étape 4 : 1 s de pause en haut. Plus de 6 faciles : étape suivante.' },
      { name: 'Tractions australiennes', work: 40, why: 'Le milieu du dos tire les épaules en arrière : posture droite, et la force de base des tractions.', target: 'Dos et biceps · dos en V, épaules en arrière', cue: 'Objectif : 6 à 10 tractions australiennes. 1. Sous une barre à hauteur de taille, mains un peu plus écartées que les épaules. 2. Pieds à plat, genoux pliés, corps gainé : tire la poitrine jusqu’à la barre, coudes vers le sol. 3. Redescends en 2 s. Plus de 10 faciles : jambes tendues, talons au sol. Pas de barre basse : suspension bras pliés, 5 à 10 s.' },
      { name: 'Relevés de genoux suspendu', work: 35, why: 'Le bassin qui s’enroule, c’est le bas du ventre qui travaille ; la poigne travaille en plus.', target: 'Bas des abdos et avant-bras · le V du ventre', cue: 'Objectif : 6 à 10 relevés. 1. Suspendu bras tendus, épaules loin des oreilles. 2. Monte les genoux jusqu’aux hanches en enroulant le bassin, sans te balancer. 3. Redescends en 2 s. Plus de 10 faciles : genoux jusqu’à la poitrine.' },
    ],
  },
  {
    id: 'M',
    star: 'Superman',
    name: 'M · Posture et dos droit',
    met: 2.3,
    desc: 'Tous les jours, même les jours de repos, ≈ 7 min dans 2 m² : renforcer le dos (c’est ce qui redresse le mieux, plus que s’étirer), ouvrir les épaules et l’avant des hanches, garder la tête droite. La mâchoire, c’est surtout la perte de gras, plus une tête qui ne part pas en avant. C’est aussi ton minimum de reprise.',
    rounds: 1,
    rest: 5,
    roundRest: 0,
    fixed: true,
    exercises: [
      { name: 'Fente basse (droite)', work: 40, target: 'Hanches · avant des hanches libéré après la journée assise', cue: 'Objectif : 1 tenue jusqu’au bip, fesse serrée. 1. Pied droit devant, genou gauche posé au sol, buste droit. 2. Serre la fesse gauche et avance doucement le bassin. 3. Tu sens l’étirement devant la hanche gauche : respire et tiens.' },
      { name: 'Fente basse (gauche)', work: 40, target: 'Hanches · avant des hanches libéré après la journée assise', cue: 'Objectif : 1 tenue jusqu’au bip, fesse serrée. 1. Pied gauche devant, genou droit posé au sol, buste droit. 2. Serre la fesse droite et avance doucement le bassin. 3. Tu sens l’étirement devant la hanche droite : respire et tiens.' },
      { name: 'Superman', work: 40, target: 'Bas et haut du dos · se tenir droit', cue: 'Objectif : 8 montées, 2 s en haut. 1. À plat ventre, bras tendus devant toi, regard vers le tapis, fesses serrées. 2. Décolle en même temps bras, poitrine et jambes de quelques cm, pas plus. 3. Tiens 2 s, repose 1 s. Tu le sens tout le long du dos, sans douleur dans le bas du dos.' },
      { name: 'Pont fessier', work: 45, target: 'Fessiers · bassin stable, meilleure démarche', cue: 'Objectif : 8 ponts, 2 s serrés en haut. 1. Sur le dos, genoux pliés, pieds à plat près des fesses. 2. Pousse dans les talons et monte le bassin jusqu’à aligner genoux, hanches et épaules. 3. Serre fort les fesses 2 s, redescends lentement.' },
      { name: 'Tirage superman', work: 45, target: 'Haut du dos · dos droit, épaules en arrière', cue: 'Objectif : 8 tirages, 2 s serrés. 1. À plat ventre, bras tendus devant toi, pouces vers le plafond, regard vers le tapis. 2. Décolle bras et poitrine de quelques cm. 3. Tire les coudes vers les côtes comme pour une traction, serre les omoplates 2 s, retends les bras sans les poser.' },
      { name: 'Chin tucks', work: 30, target: 'Cou · tête droite, mâchoire dégagée', cue: 'Objectif : 5 tenues de 5 s. 1. Assis sur le tapis, dos droit, regard droit devant. 2. Recule la tête à l’horizontale, comme pour faire un double menton, sans baisser les yeux. 3. Tiens 5 s en poussant fort, relâche. Tu sens l’arrière du cou travailler.' },
      { name: 'Passage d’épaules à l’élastique', work: 35, target: 'Épaules · ouvertes et mobiles', cue: 'Objectif : 6 passages lents. 1. À genoux, fesses serrées, élastique noir tenu bras tendus devant toi, mains très écartées. 2. Bras toujours tendus, monte-les au-dessus de la tête puis descends-les derrière toi, et reviens. 3. Ça coince : écarte encore les mains. Sans élastique : même geste à vide.' },
      { name: 'Écarté arrière à l’élastique', work: 45, target: 'Haut du dos et épaules · épaules en arrière', cue: 'Objectif : 10 écartés. 1. Debout, élastique noir bras tendus devant toi, mains un peu plus écartées que les épaules. 2. Ouvre les bras en T : l’élastique touche la poitrine. Serre les omoplates 1 s. 3. Reviens en 2 s. Plus dur : violet. Sans élastique : à plat ventre, bras en T, décolle-les 2 s.' },
      { name: 'Étirement des pectoraux mains dans le dos', work: 30, target: 'Pectoraux · épaules en arrière, buste droit', cue: 'Objectif : 2 tenues de 12 s. 1. Debout, doigts croisés dans le dos, bras tendus. 2. Ouvre la poitrine, épaules en arrière et basses. 3. Monte doucement les mains jusqu’à sentir l’étirement devant les épaules, respire.' },
    ],
  },
];

// Semaine type (choisie par l'utilisateur, revue après un mois) : B trois fois
// (mardi, jeudi, samedi : 48 h de repos pour chaque muscle), A deux fois (lundi
// et vendredi : 32 séries d'abdos par semaine suffisent, c'est la sèche qui les
// montre), le cardio C le mercredi (pas de tractions : pas de barre), mobilité
// et repos le dimanche. La mobilité M reste le minimum de reprise n'importe quel jour.
export const WEEK_PLAN = { 1: 'A', 2: 'B', 3: 'C', 4: 'B', 5: 'A', 6: 'B', 0: 'M' };

// Échauffement ajouté avant A, B et C.
export const WARMUP = [
  { name: 'Écarté arrière à l’élastique (léger)', work: 30, cue: 'Élastique noir, mains un peu plus écartées que les épaules : 15 écartés tranquilles pour réveiller le haut du dos et les épaules. Sans élastique : même geste à vide.' },
  { name: 'Chat-vache', work: 30, cue: 'À quatre pattes, lentement : enroule le dos vers le plafond en rentrant le menton (chat), puis creuse-le vers le tapis en levant la tête (vache). C’est le dos qui bouge, pas seulement la tête.' },
  { name: 'Montées de genoux lentes', work: 30, cue: 'Sur place, sans sauter, pour monter le cardio doucement.' },
  { name: 'Pompes sur les genoux', work: 20, cue: 'Amplitude complète, tranquille : on prépare les épaules.' },
];

// Repères nutrition (pour un homme de ~75 kg qui veut perdre du gras en gardant son muscle).
export const PROTEIN_TARGET = 4; // portions par jour, ≈ 25-30 g de protéines chacune
// Protéines en grammes (depuis la v53) : objectif du jour et boutons rapides [aliment, g].
export const PROTEIN_GRAMS = 120; // ≈ 1,7 g par kg pour ~70 kg
// Boutons protéines de Jour : ils notent l'aliment dans le journal des repas.
export const PROTEIN_CHIPS = ['oeufs', 'skyr', 'fromage-blanc', 'steak', 'thon', 'poulet', 'jambon', 'lentilles'];

// Journal des repas (onglet Manger) : des aliments courants, en portions
// faciles à estimer à l'œil. kcal et protéines (p, en g) par portion,
// d'après la table Ciqual (Anses), arrondis : des repères, à ±15 % près.
// short : nom court des boutons protéines de Jour (sinon le premier mot).
export const FOOD_CATS = [['prot', 'Protéines'], ['fec', 'Féculents'], ['vert', 'Fruits et légumes'], ['lait', 'Laitiers'], ['extra', 'Extras'], ['boire', 'Boissons']];
export const FOODS = [
  { id: 'poulet', cat: 'prot', emoji: '🍗', name: 'Poulet', portion: '1 filet cuit (120 g)', kcal: 190, p: 37 },
  { id: 'steak', cat: 'prot', emoji: '🥩', name: 'Steak haché 5 %', short: 'Steak haché', portion: '1 steak (100 g cru)', kcal: 130, p: 21 },
  { id: 'thon', cat: 'prot', emoji: '🐟', name: 'Thon au naturel', portion: '1 boîte égouttée (110 g)', kcal: 120, p: 27 },
  { id: 'oeufs', cat: 'prot', emoji: '🥚', name: 'Œufs', portion: '2 œufs', kcal: 150, p: 13 },
  { id: 'jambon', cat: 'prot', emoji: '🍖', name: 'Jambon blanc', portion: '2 tranches (80 g)', kcal: 90, p: 16 },
  { id: 'saumon', cat: 'prot', emoji: '🍣', name: 'Saumon', portion: '1 pavé cuit (120 g)', kcal: 250, p: 27 },
  { id: 'lentilles', cat: 'prot', emoji: '🫘', name: 'Lentilles ou pois chiches', portion: '1 assiette cuite (200 g)', kcal: 230, p: 17 },
  { id: 'patate-douce', cat: 'fec', emoji: '🍠', name: 'Patate douce', portion: '1 grosse cuite (250 g)', kcal: 215, p: 4 },
  { id: 'riz', cat: 'fec', emoji: '🍚', name: 'Riz', portion: '1 assiette cuite (200 g)', kcal: 260, p: 5 },
  { id: 'pates', cat: 'fec', emoji: '🍝', name: 'Pâtes', portion: '1 assiette cuite (200 g)', kcal: 300, p: 10 },
  { id: 'pdt', cat: 'fec', emoji: '🥔', name: 'Pommes de terre', portion: '1 assiette (250 g)', kcal: 210, p: 5 },
  { id: 'pain', cat: 'fec', emoji: '🥖', name: 'Pain', portion: '¼ de baguette (60 g)', kcal: 160, p: 5 },
  { id: 'avoine', cat: 'fec', emoji: '🌾', name: 'Flocons d’avoine', portion: '40 g', kcal: 150, p: 5 },
  { id: 'legumes', cat: 'vert', emoji: '🥦', name: 'Légumes', portion: '1 assiette (250 g)', kcal: 70, p: 4 },
  { id: 'banane', cat: 'vert', emoji: '🍌', name: 'Banane', portion: '1 banane', kcal: 100, p: 1 },
  { id: 'pomme', cat: 'vert', emoji: '🍎', name: 'Pomme', portion: '1 pomme', kcal: 80, p: 0 },
  { id: 'clementines', cat: 'vert', emoji: '🍊', name: 'Clémentines', portion: '2 clémentines', kcal: 70, p: 1 },
  { id: 'avocat', cat: 'vert', emoji: '🥑', name: 'Avocat', portion: '½ avocat', kcal: 120, p: 1 },
  { id: 'amandes', cat: 'vert', emoji: '🥜', name: 'Amandes ou noix', portion: '1 poignée (25 g)', kcal: 150, p: 5 },
  { id: 'skyr', cat: 'lait', emoji: '🫙', name: 'Skyr nature', portion: '1 pot (150 g)', kcal: 90, p: 15 },
  { id: 'fromage-blanc', cat: 'lait', emoji: '🥣', name: 'Fromage blanc 0 %', short: 'Fromage blanc', portion: '1 bol (200 g)', kcal: 100, p: 15 },
  { id: 'yaourt', cat: 'lait', emoji: '🥄', name: 'Yaourt nature', portion: '1 pot (125 g)', kcal: 65, p: 5 },
  { id: 'fromage', cat: 'lait', emoji: '🧀', name: 'Fromage', portion: '1 portion (30 g)', kcal: 110, p: 7 },
  { id: 'lait', cat: 'lait', emoji: '🥛', name: 'Lait demi-écrémé', portion: '1 verre (25 cl)', kcal: 115, p: 8 },
  { id: 'huile', cat: 'extra', emoji: '🫒', name: 'Huile ou beurre', portion: '1 cuillère à soupe', kcal: 90, p: 0 },
  { id: 'mayo', cat: 'extra', emoji: '🥫', name: 'Mayonnaise', portion: '1 cuillère à soupe', kcal: 100, p: 0 },
  { id: 'chocolat', cat: 'extra', emoji: '🍫', name: 'Chocolat', portion: '2 carrés (20 g)', kcal: 110, p: 1 },
  { id: 'biscuits', cat: 'extra', emoji: '🍪', name: 'Biscuits ou gâteau', portion: '3 biscuits (40 g)', kcal: 190, p: 2 },
  { id: 'viennoiserie', cat: 'extra', emoji: '🥐', name: 'Viennoiserie', portion: '1 croissant', kcal: 230, p: 5 },
  { id: 'chips', cat: 'extra', emoji: '🍿', name: 'Chips ou pop-corn', portion: '1 petit paquet (30 g)', kcal: 160, p: 2 },
  { id: 'pizza', cat: 'extra', emoji: '🍕', name: 'Pizza', portion: '½ pizza', kcal: 550, p: 22 },
  { id: 'burger', cat: 'extra', emoji: '🍔', name: 'Burger', portion: '1 burger', kcal: 500, p: 25 },
  { id: 'frites', cat: 'extra', emoji: '🍟', name: 'Frites', portion: '1 portion moyenne', kcal: 340, p: 4 },
  { id: 'kebab', cat: 'extra', emoji: '🌯', name: 'Kebab ou tacos', portion: '1 sandwich', kcal: 850, p: 35 },
  { id: 'sandwich', cat: 'extra', emoji: '🥪', name: 'Sandwich', portion: '1 jambon-beurre', kcal: 400, p: 18 },
  { id: 'soda', cat: 'boire', emoji: '🥤', name: 'Soda', portion: '1 canette (33 cl)', kcal: 140, p: 0 },
  { id: 'jus', cat: 'boire', emoji: '🧃', name: 'Jus de fruits', portion: '1 verre (25 cl)', kcal: 110, p: 1 },
  { id: 'biere', cat: 'boire', emoji: '🍺', name: 'Bière', portion: '1 demi (25 cl)', kcal: 110, p: 1 },
];
export const PROTEIN_EXAMPLES = '1 portion ≈ 3 œufs, 1 filet de poulet, 1 boîte de thon, 200 g de skyr ou 1 boîte de lentilles + 1 yaourt.';

// Déclencheurs de grignotage : les repérer compte plus que de les compter.
export const SNACK_TRIGGERS = ['Faim', 'Ennui', 'Devant un écran', 'Fatigue', 'Stress', 'C’était là'];

export const FOOD_RULES = [
  'Une source de protéines à chaque repas (œufs, viande, poisson, skyr, lentilles, tofu) : ça cale et ça protège les muscles.',
  'La moitié de l’assiette en légumes (les surgelés comptent, c’est pareil).',
  'Un premier repas avec des protéines, au petit-déjeuner ou vers 11 h : c’est lui qui évite le grignotage de l’après-midi.',
  'Une collation prévue (fruit + skyr, ou une poignée d’amandes) vaut mieux que 5 grignotages imprévus.',
  'Ne pas manger devant TikTok ou Netflix : on mange sans s’en rendre compte.',
  'Les grignotages sucrés ou salés ne sont pas dans ta chambre. Ce qui n’est pas à portée de main ne se mange pas.',
];

// Journée type (≈ 1 850 kcal avec 8 000 pas : ≈ 500 de moins que la dépense,
// ≈ 0,5 kg de gras par semaine ; ≈ 2 000 les jours à 12 000 pas) : [moment, quoi]. Pas de petit-déjeuner obligatoire :
// le 1er repas peut glisser vers 11 h, c'est le total du jour qui compte (le
// petit-déjeuner n'aide pas à maigrir : méta-analyse Sievert 2019). Café : 400 mg
// de caféine par jour au plus (EFSA), le dernier à 15 h pour dormir.
export const DAY_PLAN = [
  ['Au réveil', 'Un grand verre d’eau, un café sans sucre, ta créatine.'],
  ['Le matin', 'Ta séance, si tu peux.'],
  ['1er repas', 'Au petit-déjeuner, ou vers 11 h si tu le sautes : 250 g de skyr, 40 g de flocons d’avoine, 1 banane.'],
  ['Midi', 'L’assiette : une protéine grande comme ta paume, un féculent gros comme ton poing, des légumes sur la moitié.'],
  ['15 h', 'Dernier café de la journée (4 au plus par jour).'],
  ['16 h', '2 œufs durs et un fruit, ou un skyr.'],
  ['Le soir', 'La même assiette, ou le repas en famille avec la même règle.'],
  ['Après dîner', 'Plus rien à manger : de l’eau ou une tisane.'],
  ['23 h', 'Téléphone dans une autre pièce.'],
];

// Ce qu'il peut manger, en 3 couleurs. Rien n'est interdit : le rouge veut dire
// « prévu », pas « jamais » (s'interdire des aliments fait plus craquer :
// Westenhoefer 1999). FOOD_TREATS : comment prendre le rouge.
export const FOOD_COLORS = [
  { id: 'vert', title: 'Tous les jours', items: [
    'Légumes, et 2 ou 3 fruits',
    'Poulet, poisson, thon, œufs, steak haché 5 %, skyr, fromage blanc, lentilles, pois chiches',
    'Aux repas : riz, pâtes, pommes de terre, pain complet, flocons d’avoine',
    'Eau, café et thé sans sucre, boissons zéro',
  ] },
  { id: 'jaune', title: 'Un peu chaque jour', items: [
    'Une portion de fromage, 2 carrés de chocolat',
    'Pain blanc, beurre, mayonnaise, ketchup, charcuterie',
  ] },
  { id: 'rouge', title: 'Prévu, 2 ou 3 fois par semaine', items: [
    'Gâteaux, glaces, viennoiseries, biscuits, Nutella, chips',
    'Fast-food, sodas sucrés, jus de fruits, alcool',
  ] },
];
export const FOOD_TREATS = [
  'Choisis tes 2 ou 3 plaisirs à l’avance. Un dessert prévu à la fin d’un repas n’est pas un grignotage.',
  'Mange-le à table, sans écran, une portion : un cornet ou une part, pas un pot d’un litre.',
  'Au fast-food, garde la protéine et enlève un extra (frites, sauce ou soda). De l’eau pour boire.',
  'Un craquage ? Le repas suivant redevient normal : jamais deux fois de suite.',
];

// Collations : quoi prendre quand on a faim entre les repas (ou qu'on grignote
// quand même). Les protéines calent le plus (yaourt protéiné contre chocolat :
// moins faim et ≈ 100 kcal de moins au dîner, Ortinau 2014) ; une pomme
// entière avant un repas y fait manger ≈ 15 % de moins (Flood-Obbagy 2009).
export const SNACKS = [
  { title: 'Ce qui cale le plus : les protéines', items: [
    '150 g de skyr : 15 g de protéines, 90 kcal',
    '2 œufs durs : 13 g, 150 kcal (fais-en 6 d’un coup)',
    '1 boîte de thon au naturel et du citron : 25 g, 110 kcal',
    '2 tranches de jambon blanc : 15 g, 90 kcal',
  ] },
  { title: 'Du volume pour peu de calories', items: [
    'Une pomme (80 kcal) : 15 min avant un repas, elle fait manger moins',
    'Des clémentines, ou une banane (100 kcal)',
    'Carottes, concombre, tomates cerises et 2 cuillères de houmous (90 kcal)',
  ] },
  { title: 'Envie de sucré', items: [
    'La « mousse » : 150 g de skyr, 1 cuillère de cacao non sucré, 1 cuillère à café de miel (130 kcal, 16 g)',
    '2 carrés de chocolat noir avec un fruit',
    'Une compote sans sucre ajouté (60 kcal)',
  ] },
  { title: 'À doser', items: [
    'Amandes ou noix : une poignée de 25 g (150 kcal), dans un bol, jamais dans le paquet',
  ] },
  { title: 'Le soir, ou devant un écran', items: [
    'Thé, tisane, eau pétillante, boisson zéro',
    'Vraiment faim : un bol de popcorn nature fait maison (120 kcal)',
  ] },
];
// Remplacer le chocolat de tous les jours : on garde le moment (après le
// repas, l'après-midi), on change ce qu'on mange ; se priver d'un coup fait
// plus craquer (Westenhoefer 1999). Le skyr cale mieux que le chocolat
// (Ortinau 2014, voir SNACKS).
export const CHOCOLATE = {
  intro: 'Garde le moment où tu prends ton chocolat, change seulement ce que tu manges : c’est plus facile que de t’en priver.',
  swaps: [
    'La mousse au cacao : 150 g de skyr, 1 cuillère de cacao non sucré, 1 cuillère à café de miel (130 kcal, 16 g de protéines).',
    'Un chocolat chaud maison : un bol de lait demi-écrémé et 1 cuillère de cacao non sucré (130 kcal).',
    'Une banane coupée en rondelles et mise au congélateur : elle se mange comme une glace (100 kcal).',
    '2 dattes et 5 amandes, pour le sucré qui croque.',
    'Envie du vrai goût : 2 carrés de chocolat noir à 85 %, à laisser fondre, après un repas (60 kcal).',
    'Après le repas, un thé à la menthe ou un chewing-gum sans sucre : le signal que c’est fini.',
  ],
  plan: 'Semaine 1 : remplace-le un jour sur deux. Semaine 2 : tous les jours. Ensuite, le chocolat au lait redevient un plaisir prévu, 2 ou 3 fois par semaine.',
};
export const SNACK_TEST = 'Faim ou envie ? Demande-toi si tu mangerais une pomme. Non : c’est l’ennui ou l’écran. Un verre d’eau, 5 minutes dehors, et attends 10 minutes.';

// Le thé : 0 kcal sans sucre, mais de la caféine (≈ 45 mg la tasse de noir,
// ≈ 25 mg le vert), un frein au fer pendant les repas (Hurrell 1999) et des
// taches comme le café. Les thés « détox » au séné sont des laxatifs.
export const TEA_TIPS = [
  'Le matin et jusqu’à 15 h : thé vert à la menthe sans sucre, ou Earl Grey.',
  'Après 15 h, sans caféine : rooibos (vanille, caramel) ou tisane (verveine, camomille).',
  'Au moins 1 h après le repas : pendant, le thé bloque une partie du fer.',
  'Rince-toi la bouche à l’eau après : le thé noir tache autant que le café.',
  'À éviter : thés « détox » ou « minceur » (souvent laxatifs), gélules de thé vert, thés glacés sucrés.',
];

// Recettes de débutant : peu d’ustensiles, ingrédients de supermarché, riches en protéines.
export const RECIPES = [
  {
    name: 'Omelette complète',
    time: '10 min',
    items: '3 œufs, 1 tranche de jambon, 1 poignée d’épinards ou de champignons, 1 tranche de pain complet',
    steps: 'Bats les œufs avec sel et poivre. Fais revenir les légumes 2 min dans une poêle huilée, verse les œufs, ajoute le jambon, plie quand le dessus est presque pris.',
  },
  {
    name: 'Pâtes thon-tomate',
    time: '15 min',
    items: '80 g de pâtes (poids cru), 1 boîte de thon au naturel, 150 g de sauce tomate, 1 poignée de haricots verts surgelés',
    steps: 'Cuis les pâtes et les haricots dans la même eau. Égoutte, ajoute sauce tomate et thon, chauffe 1 min.',
  },
  {
    name: 'Riz poulet-légumes',
    time: '20 min',
    items: '1 filet de poulet, 70 g de riz cru (ou un sachet micro-ondes), 200 g de poêlée de légumes surgelée, sauce soja',
    steps: 'Coupe le poulet en dés, saisis-le 6-7 min à feu vif. Ajoute les légumes surgelés 5 min, un trait de sauce soja. Sers avec le riz.',
  },
  {
    name: 'Bol skyr du matin',
    time: '2 min',
    items: '150-200 g de skyr ou fromage blanc, 1 banane ou des fruits rouges surgelés, 30 g de flocons d’avoine',
    steps: 'Tout dans un bol. C’est le petit-déjeuner anti-grignotage le plus simple qui existe.',
  },
  {
    name: 'Wraps au poulet',
    time: '10 min',
    items: '2 galettes de blé, 1 filet de poulet ou du poulet cuit, salade, tomate, 1 cuillère de fromage frais',
    steps: 'Poêle le poulet en lamelles. Tartine les galettes de fromage frais, ajoute poulet, salade et tomate, roule.',
  },
  {
    name: 'Lentilles-saucisse (version légère)',
    time: '15 min',
    items: '1 boîte de lentilles cuites, 1 saucisse de volaille, 1 oignon, carottes',
    steps: 'Fais revenir l’oignon et la saucisse en rondelles, ajoute les carottes en rondelles et les lentilles égouttées, laisse chauffer 8 min.',
  },
];

// Démonstration vidéo : recherche YouTube (un lien de recherche ne casse pas, une vidéo précise si).
// Certains exercices se trouvent mieux avec leur nom anglais.
const DEMO_QUERIES = {
  'Genou-coude croisé debout': 'standing cross body crunch',
  'Crunch vélo': 'bicycle crunch proper form',
  'Pont fessier': 'glute bridge technique',
  'Superman': 'superman exercise technique',
  'Extension du cou': 'prone neck extension chin tuck',
  Crunch: 'crunch abdominal bonne technique',
  'Russian twist': 'russian twist feet off ground',
  'Planche inversée': 'reverse tabletop exercise',
  'Curl contre la cuisse': 'self resisted bicep curl leg',
  'Pompes sphinx': 'sphinx push up',
  'Poings serrés-ouverts': 'hand clench forearm exercise',
  'Cercles de bras': 'arm circles exercise',
  'Curl résisté': 'self resisted bicep curl',
  'Planche vers chien tête en bas': 'plank to downward dog',
  'Poignets en bras de fer': 'self resisted wrist curl',
  'Presse des paumes': 'isometric chest squeeze palms',
  'Planche sur le bout des doigts': 'fingertip plank hold',
  'Rowing penché à l’élastique': 'resistance band bent over row',
  'Extension triceps au-dessus de la tête': 'kneeling band overhead triceps extension',
  'Curl biceps à l’élastique': 'resistance band bicep curl',
  'Tirage assis à l’élastique': 'seated resistance band row',
  'Écarté arrière à l’élastique': 'band pull apart',
  'Curl marteau à l’élastique': 'resistance band hammer curl',
  'Planche penchée': 'planche lean tutorial',
  'L-sit': 'tuck l-sit parallettes tutorial',
  'Pompes pike': 'pike push up tutorial',
  'Toucher d’épaules en planche': 'plank shoulder taps',
  'Crunch inversé': 'reverse crunch proper form',
  'Vacuum abdominal': 'stomach vacuum exercise',
  'Jumping jacks sans saut': 'step jacks low impact',
  'Renforcement du cou': 'supine neck flexion chin tuck',
  'Langue au palais': 'correct tongue posture',
  'Anges au sol': 'floor angels exercise',
  'Étirement des pectoraux au sol': 'prone pec stretch',
  'Rotation du haut du dos à quatre pattes': 'quadruped thoracic rotation',
  'Passage d’épaules à l’élastique': 'band shoulder pass through',
  'Étirement des pectoraux mains dans le dos': 'standing chest stretch hands behind back',
  'Burpees sans saut': 'no jump burpee',
  'Mountain climbers rapides': 'mountain climbers fast',
  'Roue abdominale à genoux': 'ab wheel rollout from knees',
  'Planche latérale': 'side plank reach through',
  'Hollow hold genoux pliés': 'hollow body hold progression',
  'Pompes (sur parallettes)': 'deep push ups on parallettes',
  'Pompes serrées': 'diamond push up proper form',
  'Shadow boxing': 'shadow boxing jab cross beginner',
  'Shadow boxing (esquives et crochets)': 'slip and hook shadow boxing drill',
  'Fentes arrière alternées': 'reverse lunge technique',
  'Shadow boxing rapide': 'speed shadow boxing punches',
  'Fente basse': 'half kneeling hip flexor stretch',
  'Tirage superman': 'prone Y to W raise',
  'Chin tucks': 'chin tuck exercise',
  'Suspension à la barre': 'dead hang pull up bar',
  Tractions: 'pull up progression beginner negatives band',
  'Tractions australiennes': 'bent knee inverted row beginner',
  'Relevés de genoux suspendu': 'hanging knee raise proper form',
};

// Nom sans précision entre parenthèses : « Roue abdominale à genoux (1/2) » → « Roue abdominale à genoux ».
export function baseName(name) {
  return name.replace(/\s*\([^)]*\)\s*$/, '');
}

export function demoUrl(name) {
  const base = baseName(name);
  const q = DEMO_QUERIES[name] ?? DEMO_QUERIES[base] ?? `${base.replace(/^Superman /, 'prone ')} exercice technique`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
}


// ---------- Programme de 12 semaines (partie 3) ----------
export const PHASES = [
  {
    weeks: [1, 4],
    name: 'Fondations',
    focus: [
      'Lever fixe à 8 h 30, 7 jours sur 7 : c’est le levier n° 1 du sommeil.',
      'Semaine 1 : mesurer écran et grignotages sans rien changer.',
      'Temps d’écran + ScreenZen configurés, objectif < 5 h d’écran en semaine 4.',
      'Mobilité tous les jours, A/B/C selon le planning, 6 000 pas.',
      '2 leçons de finance par semaine.',
    ],
  },
  {
    weeks: [5, 8],
    name: 'Montée',
    focus: [
      'Lever à 8 h puis 7 h 30 pour être calé avant l’emploi.',
      'Séances au niveau 2, 8 000 pas, une recette par semaine.',
      'Finir le parcours finance, premiers trades notés dans le journal.',
      'Écran < 3 h 30.',
    ],
  },
  {
    weeks: [9, 12],
    name: 'Nouveau rythme',
    focus: [
      'Adapter les minimums aux horaires de travail dès le 1er jour.',
      'Virement automatique vers le PEA le jour de la paie.',
      '2-3 trades par semaine, revue du journal chaque dimanche.',
      'Écran < 3 h, coucher 23 h 30 tenu.',
    ],
  },
];

// Cibles de fin de semaines 4, 8 et 12.
export const MILESTONES = [
  { week: 4, screen: 300, weight: 74, pushups: 26, plank: 100, lessons: 8 },
  { week: 8, screen: 210, weight: 72.5, pushups: 30, plank: 120, lessons: 16 },
  { week: 12, screen: 180, weight: 71, pushups: 35, plank: 150, lessons: 23 },
];

// ---------- Livres (partie 4) ----------
export const BOOKS = [
  { id: 'aurele', cat: 'Philosophie', title: 'Pensées pour moi-même', author: 'Marc Aurèle', why: 'Le journal d’un empereur qui se répète chaque jour comment rester maître de lui.' },
  { id: 'epictete', cat: 'Philosophie', title: 'Manuel', author: 'Épictète', why: '50 pages pour distinguer ce qui dépend de toi de ce qui n’en dépend pas.', start: true },
  { id: 'seneque', cat: 'Philosophie', title: 'De la brièveté de la vie', author: 'Sénèque', why: 'Un texte court sur le temps qu’on gaspille.' },
  { id: 'platon', cat: 'Philosophie', title: 'Apologie de Socrate', author: 'Platon', why: 'Un homme qui préfère mourir que renoncer à penser par lui-même.' },
  { id: 'frankl', cat: 'Philosophie', title: 'Découvrir un sens à sa vie', author: 'Viktor Frankl', why: 'Pourquoi le sens compte plus que le confort.' },
  { id: 'camus', cat: 'Philosophie', title: 'Le Mythe de Sisyphe', author: 'Albert Camus', why: 'Comment vivre pleinement quand rien n’est garanti.' },
  { id: 'housel', cat: 'Finance', title: 'La psychologie de l’argent', author: 'Morgan Housel', why: 'Ton comportement compte plus que tes connaissances. À lire en premier.', start: true },
  { id: 'lynch', cat: 'Finance', title: 'One Up on Wall Street', author: 'Peter Lynch', why: 'Analyser une entreprise, avec un chapitre sur les cycliques.' },
  { id: 'malkiel', cat: 'Finance', title: 'A Random Walk Down Wall Street', author: 'Burton Malkiel', why: 'Pourquoi la plupart des gens ne battent pas le marché.' },
  { id: 'taleb', cat: 'Finance', title: 'Le Hasard sauvage', author: 'Nassim Taleb', why: 'Chance ou talent ? Le vaccin contre les histoires de « ×16 ».' },
  { id: 'graham', cat: 'Finance', title: 'L’investisseur intelligent', author: 'Benjamin Graham', why: 'La référence de Warren Buffett, dense, à lire après les autres.' },
  { id: 'schwager', cat: 'Trading', title: 'Market Wizards', author: 'Jack Schwager', why: 'Des traders qui ont réussi : tous parlent d’abord de gestion du risque.' },
  { id: 'douglas', cat: 'Trading', title: 'Trading in the Zone', author: 'Mark Douglas', why: 'La psychologie : pourquoi on perd même avec une bonne méthode.' },
  { id: 'lefevre', cat: 'Trading', title: 'Reminiscences of a Stock Operator', author: 'Edwin Lefèvre', why: 'Les fortunes et les ruines d’un spéculateur des années 1920.' },
  { id: 'clear', cat: 'Discipline', title: 'Un rien peut tout changer', author: 'James Clear', why: 'La science des petites habitudes. Ton appli en applique la moitié.' },
  { id: 'newport-dm', cat: 'Discipline', title: 'Digital Minimalism', author: 'Cal Newport', why: 'Reprendre le contrôle de ton téléphone, ton problème n° 1.', start: true },
  { id: 'newport-dw', cat: 'Discipline', title: 'Deep Work', author: 'Cal Newport', why: 'La concentration comme compétence rare.' },
  { id: 'lembke', cat: 'Discipline', title: 'Dopamine Nation', author: 'Anna Lembke', why: 'Pourquoi le scroll est si dur à lâcher, et comment s’en sortir.' },
  { id: 'walker', cat: 'Discipline', title: 'Why We Sleep', author: 'Matthew Walker', why: 'Ce que le sommeil fait au corps. Certains chiffres sont discutés, le message tient.' },
];

// ---------- Apps et réglages (avec mode d’emploi) ----------
export const APPS = [
  { cat: 'Discipline', name: 'Temps d’écran (iPhone)', how: 'Réglages > Temps d’écran : limite TikTok 30 min, Snap 45 min, Temps d’arrêt 23 h – 8 h, code choisi par un parent.' },
  { cat: 'Discipline', name: 'ScreenZen', how: 'Gratuit. Pause de 10 s et 5 ouvertures max par jour pour TikTok et Snap.' },
  { cat: 'Discipline', name: 'Écran en gris', how: 'Réglages > Accessibilité > Raccourci > Filtres de couleur. Triple clic le soir.' },
  { cat: 'Discipline', name: 'Réveil à piles', how: '≈ 10 €. Il permet de laisser le téléphone hors de la chambre.' },
  { cat: 'Corps', name: 'Santé (iPhone)', how: 'Compte tes pas automatiquement. Vise 8 000 pas par jour.' },
  { cat: 'Corps', name: 'Jow', how: 'Gratuit. Une recette par semaine, la liste de courses se fait toute seule.' },
  { cat: 'Argent', name: 'Fortuneo (PEA)', how: 'Programme un versement mensuel. Ne regarde le portefeuille qu’une fois par mois.' },
  { cat: 'Argent', name: 'Trade Republic', how: 'Vérifie ton IBAN (FR ou DE). Poche trading + espèces rémunérées pour la précaution.' },
  { cat: 'Argent', name: 'TradingView', how: 'Graphiques gratuits. Trace supports, résistances, moyenne mobile 200 jours, ATR.' },
  { cat: 'Argent', name: 'Investing.com', how: 'Liste de suivi + alertes sur les dates de résultats et le calendrier économique.' },
  { cat: 'Argent', name: 'justETF', how: 'Avant tout achat d’ETF : frais annuels (TER) et éligibilité au PEA.' },
  { cat: 'Argent', name: 'Finimize', how: 'Newsletter gratuite en anglais : 5 min d’actu finance chaque matin.' },
  { cat: 'Culture', name: 'Bibliothèque municipale', how: 'Carte souvent gratuite pour les jeunes. Emprunte avant d’acheter.' },
];

// ---------- Aide « ? » : comment marche chaque onglet, en 3 phrases ----------
export const HELP = {
  jour: {
    title: 'Comment marche Jour',
    lines: [
      'Fais au moins le minimum de chaque habitude : la journée est validée et ta chaîne 🔥 avance.',
      'Ton plan du jour te guide, routines du matin et du soir comprises. Le soir, copie ton bilan pour Claude.',
      'Un jour raté ? Jamais deux fois de suite. Envie d’ouvrir Snap ? « J’attends 10 min ».',
    ],
  },
  jeux: {
    title: 'Comment marche l’Arcade',
    lines: [
      'Sept jeux : Blocs, Cristaux, Serpent et Paires pour les mains ; Calcul, Code secret et Sudoku pour la tête.',
      'La règle s’affiche sous chaque jeu. Blocs, Cristaux, Paires, Code et Sudoku reprennent où tu les as laissés.',
      'Tes records restent sur le téléphone, et ils comptent pour débloquer des décors de la Salle.',
    ],
  },
  sport: {
    title: 'Comment marche la Salle',
    lines: [
      'Touche « Lancer la séance » et pose le téléphone au sol : l’appli te guide, bips compris.',
      'Chaque jour a sa séance (A, B ou M), plus C ou P si tu veux. Pas la forme ? La mobilité suffit.',
      'À la fin, note la séance : après 2 « Facile » ou 2 « Dur » de suite, l’appli te propose un autre niveau.',
    ],
  },
  manger: {
    title: 'Comment marche Manger',
    lines: [
      'Rien à calculer : ta journée type, ce que tu peux manger en 3 couleurs, et des recettes simples.',
      'Rien n’est interdit : le rouge veut dire « prévu », 2 ou 3 fois par semaine.',
      'Tes protéines et tes grignotages se notent dans Jour, en 2 touches.',
    ],
  },
  moi: {
    title: 'Comment marche Moi',
    lines: [
      'Programme : tes 12 semaines. Bilan : ta semaine à copier pour Claude. Livres : quoi lire.',
      'Argent : une leçon de 10 minutes à la fois, puis des cartes de révision juste avant l’oubli.',
      'Réglages : habitudes, règles, thème et sauvegarde. Exporte une fois par semaine.',
    ],
  },
};
