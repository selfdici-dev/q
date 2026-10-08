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
// Matériel : le corps, un tapis et une roue abdominale. Rien d'autre.
// work = secondes d'effort au niveau 2 ; le niveau 1 fait -10 s, le niveau 3 +10 s.
// target = à quoi sert l'exercice (objectif : fin, sec et élancé, abdos
// visibles, mâchoire nette, pas de volume). Les IDs A, B, C, M sont stockés :
// ne pas les changer.
export const WORKOUTS = [
  {
    id: 'A',
    name: 'A · Abdos et tronc',
    met: 3.8,
    desc: 'Abdos visibles, taille fine et V du bas du ventre : crunch vélo (n° 1 des mesures), roue abdominale deux fois par tour, Russian twist, planches et hollow body. Que des exercices qu’on sent. 3 tours.',
    rounds: 3,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Crunch vélo', work: 30, target: 'Abdos et obliques · le n° 1 des études', cue: 'Sur le dos, bout des doigts derrière les oreilles (sans tirer sur la nuque), omoplates décollées. Amène un coude vers le genou opposé pendant que l’autre jambe s’allonge au ras du sol, puis change de côté, lentement, comme si tu pédalais. Expire à chaque rotation.' },
      { name: 'Roue abdominale à genoux (1/2)', work: 40, target: 'Abdos complets · le plus efficace', cue: 'À genoux sur le tapis, mains sur la roue sous les épaules, dos légèrement arrondi, fesses serrées. Roule devant toi tant que le bas du dos ne creuse pas, puis reviens en contractant les abdos. Prends ton temps : 3 s pour partir, 2 s pour revenir. Niveau 1 : amplitude courte (30 cm).' },
      { name: 'Russian twist', work: 30, target: 'Obliques · taille dessinée', cue: 'Assis, genoux pliés, buste penché en arrière, dos bien droit. Mains jointes devant la poitrine : tourne les épaules d’un côté puis de l’autre, lentement, le regard suit les mains. Pieds au sol au début, décollés quand c’est facile.' },
      { name: 'Planche sur avant-bras', work: 40, target: 'Gainage · ventre plat', cue: 'Coudes sous les épaules, fesses serrées, bassin ni haut ni bas, nombril rentré. Pousse le sol avec les avant-bras. Sur les genoux si le dos creuse.' },
      { name: 'Planche latérale (droite)', work: 30, target: 'Obliques · taille gainée', cue: 'Couché sur le côté, coude sous l’épaule, soulève le bassin : le corps forme une ligne droite. Version plus dure (celle que tu aimes) : passe la main libre sous ton torse le plus loin possible en tournant le buste, puis rouvre le bras vers le plafond, le regard suit la main. Le bassin ne descend jamais. Genou au sol si besoin.' },
      { name: 'Planche latérale (gauche)', work: 30, target: 'Obliques · taille gainée', cue: 'Même chose de l’autre côté, avec ou sans la main qui passe sous le torse.' },
      { name: 'Hollow hold genoux pliés', work: 30, target: 'Grand droit · la tablette', cue: 'Sur le dos, bas du dos plaqué au tapis, épaules et pieds décollés, bras tendus vers les pieds. Tiens en respirant. Plus dur : jambes plus tendues, bras au-dessus de la tête. Si le dos décolle : genoux plus près, bras plus bas.' },
      { name: 'Roue abdominale à genoux (2/2)', work: 40, target: 'Abdos complets · deuxième passage', cue: 'Deuxième passage, tu es fatigué : garde une amplitude plus courte plutôt que de laisser le bas du dos creuser. La qualité passe avant la distance.' },
    ],
  },
  {
    id: 'B',
    name: 'B · Bras, avant-bras et épaules',
    met: 3.8,
    desc: 'Des bras, des avant-bras et des épaules secs et forts, sans gonfler : poids du corps seulement, ≈ 13 min. Pompes sur les genoux tant que les complètes sont trop dures. 2 tours.',
    rounds: 2,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Pompes', work: 30, target: 'Pectoraux et triceps · bras dessinés', cue: 'Sur les genoux pour l’instant, c’est normal : mains un peu plus larges que les épaules, corps droit des genoux à la tête, coudes à 45°. Descends lentement (2 s), remonte en poussant fort. Arrête 2 reps avant l’échec. Quand 12 pompes propres sur les genoux deviennent faciles, passe aux pompes complètes.' },
      { name: 'Curl contre la cuisse', work: 30, target: 'Biceps · bras secs et forts', cue: '1. Assis sur le tapis, genoux pliés, pieds au sol. 2. Glisse les deux mains sous la cuisse droite, près du genou, paumes vers le haut. 3. Tire avec les bras comme pour amener le genou à ta poitrine pendant que la jambe pousse vers le bas : 5 s à fond, les biceps brûlent, relâche 2 s. 4. Change de cuisse à la moitié. Plus la jambe résiste, plus c’est dur.' },
      { name: 'Pompes sphinx', work: 30, target: 'Triceps · arrière des bras dessiné', cue: '1. Sur les genoux, avant-bras posés au sol, coudes sous les épaules. 2. Pousse dans les paumes pour décoller les coudes et tendre les bras. 3. Redescends doucement sur les avant-bras. Tu le sens à l’arrière des bras. Plus dur : sur les pieds au lieu des genoux.' },
      { name: 'Superman W', work: 30, target: 'Dos · arrière des épaules', cue: '1. À plat ventre, regard vers le tapis. 2. Plie les coudes en W : coudes près des côtes, mains à hauteur des épaules, pouces vers le plafond. 3. Décolle la poitrine et les bras, puis tire les coudes vers les hanches en serrant fort les omoplates comme pour pincer un crayon entre elles. 4. Tiens 2 s, relâche. Tu le sens entre les omoplates et à l’arrière des épaules.' },
      { name: 'Toucher d’épaules en planche', work: 30, target: 'Épaules et avant-bras · gainage', cue: 'En planche haute sur les genoux (ou sur les pieds si tu peux), mains sous les épaules, doigts bien écartés qui agrippent le tapis. Touche l’épaule gauche avec la main droite, repose, puis l’autre côté, sans que le bassin bascule.' },
      { name: 'Poings serrés-ouverts', work: 30, target: 'Avant-bras · secs et veineux', cue: 'Debout, bras tendus devant toi à hauteur d’épaules. Serre les poings le plus fort possible, puis ouvre et écarte grand les doigts, le plus vite possible, sans baisser les bras. Ça brûle dans les avant-bras : c’est le but. Les bras qui tiennent en l’air travaillent les épaules en même temps.' },
      { name: 'Cercles de bras', work: 30, target: 'Épaules · dessinées, sans s’élargir', cue: 'Debout, bras tendus sur les côtés à hauteur d’épaules, paumes vers le sol. Fais de petits cercles rapides vers l’avant, puis change de sens à la moitié. Ne baisse pas les bras, même quand ça brûle.' },
    ],
  },
  {
    id: 'C',
    name: 'C · Cardio sans saut',
    met: 6,
    desc: 'Brûler des calories dans 2 m², sans bruit pour les voisins : c’est ce qui rend sec et fait apparaître abdos et mâchoire. 3 tours, ça monte vite.',
    rounds: 3,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Shadow boxing', work: 40, target: 'Cardio · corps sec', cue: 'Garde haute, enchaîne direct-direct-crochet, pivote sur les pieds. Expire à chaque coup.' },
      { name: 'Burpees sans saut', work: 30, target: 'Cardio · corps entier, celui qui brûle le plus', cue: '1. Debout, accroupis-toi et pose les mains au sol devant tes pieds. 2. Recule les pieds l’un après l’autre jusqu’en planche, corps gainé. 3. Ramène-les l’un après l’autre près des mains. 4. Relève-toi d’un coup et tends les bras vers le plafond, sur la pointe des pieds. Va vite : c’est le rythme qui fait brûler, pas le saut. Plus dur : recule et ramène les pieds en sautant, ou saute en haut si les voisins ne sont pas gênés.' },
      { name: 'Mountain climbers lents', work: 30, target: 'Cardio + abdos', cue: 'En planche haute, ramène un genou vers la poitrine puis l’autre, bassin stable.' },
      { name: 'Genou-coude croisé debout', work: 30, target: 'Cardio + obliques · le V du bas du ventre', cue: 'Debout, bout des doigts derrière les oreilles. Monte le genou droit vers le coude gauche en tournant le buste, repose, puis le genou gauche vers le coude droit. Rythme rapide, toujours un pied au sol : silencieux. Expire à chaque contact.' },
      { name: 'Shadow boxing rapide', work: 30, target: 'Cardio · dernier effort', cue: 'Coups courts et rapides, reste léger sur les appuis.' },
    ],
  },
  {
    id: 'M',
    name: 'M · Posture, cou et mâchoire',
    met: 2.3,
    desc: 'Tous les jours, même les jours de repos, ≈ 8 min : paraître plus grand (bassin droit, dos et nuque forts, épaules ouvertes), une tête droite qui dégage la mâchoire, une taille fine. Que des exercices qu’on sent, sur le tapis. Dans la journée : tête droite, épaules basses. C’est aussi ton minimum de reprise.',
    rounds: 1,
    rest: 5,
    roundRest: 0,
    fixed: true,
    exercises: [
      { name: 'Fente basse (droite)', work: 40, target: 'Hanches · bassin droit, paraître plus grand', cue: 'Un pied devant, genou arrière posé au sol. Serre la fesse du côté du genou au sol et avance doucement le bassin : tu sens l’étirement à l’avant de la hanche. Contre le ventre poussé en avant et le dos cambré après la journée assise.' },
      { name: 'Fente basse (gauche)', work: 40, target: 'Hanches · bassin droit, paraître plus grand', cue: 'Même chose de l’autre côté, fesse serrée.' },
      { name: 'Pont fessier', work: 40, target: 'Fessiers · bassin droit, meilleure démarche', cue: 'Sur le dos, genoux pliés, pieds à plat près des fesses. Pousse dans les talons et monte le bassin jusqu’à aligner genoux, hanches et épaules. Serre fort les fesses 2 s en haut, redescends lentement. Ça raffermit sans faire grossir et ça remet le bassin droit : tu te tiens et tu marches plus grand.' },
      { name: 'Livre ouvert (droite)', work: 40, target: 'Haut du dos · poitrine ouverte', cue: '1. Couché sur le côté gauche, genoux pliés à 90° devant toi, tête posée. 2. Bras tendus devant toi, mains l’une sur l’autre. 3. Ouvre lentement le bras droit vers le plafond puis vers le sol derrière toi, comme un livre qui s’ouvre : le regard suit la main, les genoux restent collés au sol. 4. Expire en ouvrant, tiens 2 s, reviens. Tu sens la poitrine s’étirer et le haut du dos tourner.' },
      { name: 'Livre ouvert (gauche)', work: 40, target: 'Haut du dos · poitrine ouverte', cue: 'Même chose couché sur le côté droit, c’est le bras gauche qui s’ouvre.' },
      { name: 'Anges au sol', work: 40, target: 'Haut du dos et épaules · se tenir droit, paraître plus grand', cue: '1. Sur le dos, genoux pliés, pieds à plat, bas du dos collé au tapis. 2. Bras au sol en W : coudes près des côtes, dos des mains et coudes touchent le tapis. 3. Fais glisser lentement les bras au-dessus de la tête en Y sans jamais les décoller du sol, puis redescends en W en serrant les omoplates vers le bas. 4. Si les mains ou les coudes décollent, va moins loin. Tu le sens entre les omoplates et à l’avant des épaules.' },
      { name: 'Étirement des pectoraux au sol (droite)', work: 30, target: 'Pectoraux · épaules en arrière, buste droit', cue: '1. À plat ventre, bras droit tendu sur le côté à hauteur d’épaule, paume au sol. 2. Main gauche posée près de ta poitrine. 3. Pousse avec la main gauche pour rouler doucement sur le côté gauche, plie la jambe droite et pose le pied derrière toi. 4. Arrête-toi dès que ça tire dans la poitrine et l’avant de l’épaule droite, respire, tiens. Jamais de douleur dans l’épaule.' },
      { name: 'Étirement des pectoraux au sol (gauche)', work: 30, target: 'Pectoraux · épaules en arrière, buste droit', cue: 'Même chose avec le bras gauche tendu sur le côté : tu roules sur le côté droit.' },
      { name: 'Superman', work: 40, target: 'Bas et haut du dos · se tenir droit', cue: '1. À plat ventre, bras tendus devant toi, regard vers le tapis. 2. Serre les fesses et rentre le nombril. 3. Décolle en même temps bras, poitrine et jambes de quelques cm (pas plus haut). 4. Tiens 2 s, repose 1 s. Tu le sens tout le long du dos ; pas de douleur dans le bas du dos.' },
      { name: 'Chin tucks', work: 30, target: 'Cou · tête droite, mâchoire dégagée', cue: 'Assis ou debout, dos droit. Recule la tête à l’horizontale, comme pour faire un double menton, sans baisser le regard. Tiens 5 s en poussant fort, relâche. Tu dois sentir l’arrière du cou travailler.' },
      { name: 'Extension du cou', work: 30, target: 'Nuque · ligne de la mâchoire', cue: 'Allongé sur le ventre, front tourné vers le tapis (« front bas »). Garde le menton rentré et relève doucement la tête jusqu’à regarder un peu devant toi (« front haut »), tiens 3 s, redescends. Une nuque forte tient la tête droite et dégage la mâchoire de profil.' },
    ],
  },
];

// Semaine type : A lundi/jeudi, B mardi/vendredi, C mercredi/samedi, mobilité le dimanche.
// La mobilité M reste le minimum de reprise n'importe quel jour.
export const WEEK_PLAN = { 1: 'A', 2: 'B', 3: 'C', 4: 'A', 5: 'B', 6: 'C', 0: 'M' };

// Échauffement ajouté avant A, B et C.
export const WARMUP = [
  { name: 'Rotations des épaules et des bras', work: 30, cue: 'Grands cercles vers l’avant puis vers l’arrière.' },
  { name: 'Chat-vache', work: 30, cue: 'À quatre pattes, enroule puis creuse le dos lentement.' },
  { name: 'Montées de genoux lentes', work: 30, cue: 'Sur place, sans sauter, pour monter le cardio doucement.' },
  { name: 'Pompes sur les genoux', work: 20, cue: 'Amplitude complète, tranquille : on prépare les épaules.' },
];

// Repères nutrition (pour un homme de ~75 kg qui veut perdre du gras en gardant son muscle).
export const PROTEIN_TARGET = 4; // portions par jour, ≈ 25-30 g de protéines chacune
export const PROTEIN_EXAMPLES = '1 portion ≈ 3 œufs, 1 filet de poulet, 1 boîte de thon, 200 g de skyr ou 1 boîte de lentilles + 1 yaourt.';

// Déclencheurs de grignotage : les repérer compte plus que de les compter.
export const SNACK_TRIGGERS = ['Faim', 'Ennui', 'Devant un écran', 'Fatigue', 'Stress', 'C’était là'];

export const FOOD_RULES = [
  'Une source de protéines à chaque repas (œufs, viande, poisson, skyr, lentilles, tofu) : ça cale et ça protège les muscles.',
  'La moitié de l’assiette en légumes (les surgelés comptent, c’est pareil).',
  'Petit-déjeuner avec des protéines : c’est lui qui évite le grignotage de 11 h et de 16 h.',
  'Une collation prévue (fruit + skyr, ou une poignée d’amandes) vaut mieux que 5 grignotages imprévus.',
  'Ne pas manger devant TikTok ou Netflix : on mange sans s’en rendre compte.',
  'Les grignotages sucrés ou salés ne sont pas dans ta chambre. Ce qui n’est pas à portée de main ne se mange pas.',
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
  'Crunch vélo': 'bicycle crunch bonne technique',
  'Pont fessier': 'glute bridge technique',
  Superman: 'superman exercise technique',
  'Extension du cou': 'prone neck extension chin tuck',
  Crunch: 'crunch abdominal bonne technique',
  'Russian twist': 'russian twist débutant',
  'Planche inversée': 'reverse tabletop exercise',
  'Curl contre la cuisse': 'self resisted bicep curl leg',
  'Pompes sphinx': 'sphinx push up',
  'Poings serrés-ouverts': 'hand clench forearm exercise',
  'Cercles de bras': 'arm circles exercise',
  'Toucher d’épaules en planche': 'plank shoulder taps',
  'Crunch inversé': 'reverse crunch',
  'Vacuum abdominal': 'stomach vacuum exercise',
  'Jumping jacks sans saut': 'step jacks low impact',
  'Renforcement du cou': 'supine neck flexion chin tuck',
  'Langue au palais': 'correct tongue posture',
  'Anges au sol': 'floor angels exercise',
  'Étirement des pectoraux au sol': 'prone pec stretch',
  'Burpees sans saut': 'no jump burpee',
};

// Nom sans précision entre parenthèses : « Roue abdominale à genoux (1/2) » → « Roue abdominale à genoux ».
export function baseName(name) {
  return name.replace(/\s*\([^)]*\)\s*$/, '');
}

export function demoUrl(name) {
  const base = baseName(name);
  const q = DEMO_QUERIES[base] ?? `${base.replace(/^Superman /, 'prone ')} exercice technique`;
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
      'Ton plan du jour te dit quoi faire ensuite : touche le gros bouton de la carte « Maintenant ».',
      'Un jour raté, ça arrive : jamais deux fois de suite. Le soir, copie ton bilan pour Claude.',
    ],
  },
  focus: {
    title: 'Comment marche Focus',
    lines: [
      'Écris la seule chose sur laquelle tu travailles, pose le téléphone loin, puis Démarrer.',
      'Un arbre pousse pendant les 25 minutes : va au bout et il rejoint ton jardin du jour.',
      'Envie de scroller ? Lance le minuteur de 10 minutes et fais autre chose en attendant.',
    ],
  },
  sport: {
    title: 'Comment marche Corps',
    lines: [
      'Touche « Lancer la séance » et pose le téléphone au sol : l’appli te guide, bips compris.',
      'Chaque jour a sa séance (A, B, C ou M). Pas la forme ? La mobilité suffit pour valider.',
      'À la fin, note la séance : après 2 « Facile » ou 2 « Dur » de suite, l’appli te propose un autre niveau.',
    ],
  },
  argent: {
    title: 'Comment marche Argent',
    lines: [
      'Une leçon dure environ 10 minutes : une idée, un exemple, un exercice réel, un quiz.',
      'Les leçons s’ouvrent dans l’ordre : fais la suivante quand ton plan du jour la propose.',
      'Les questions du quiz reviennent ensuite en cartes de révision, juste avant l’oubli.',
    ],
  },
  moi: {
    title: 'Comment marche Moi',
    lines: [
      'Programme : où tu en es sur les 12 semaines, tes objectifs et tes outils à configurer.',
      'Bilan : tes sprints et ta semaine à copier pour Claude. Livres : quoi lire ensuite.',
      'Réglages : habitudes, règles, thème et sauvegarde. Exporte une fois par semaine.',
    ],
  },
};
