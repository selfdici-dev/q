// Contenu par défaut : habitudes et séances. Tout est modifiable dans l'appli
// (habitudes) ou ici (séances).

export const DEFAULT_HABITS = [
  { id: 'sommeil', emoji: '📵', name: 'Téléphone hors du lit', min: 'Téléphone posé hors du lit à l’heure cible', full: 'Téléphone hors de la chambre + couché à l’heure cible' },
  { id: 'sport', emoji: '💪', name: 'Bouger', min: 'Mobilité 8 min OU 5 pompes + 30 s de gainage', full: 'Séance du jour + 8 000 pas' },
  { id: 'focus', emoji: '🎯', name: 'Focus', min: '1 session de 25 min', full: '4 sessions de 25 min' },
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
    desc: 'Abdos visibles et taille fine : roue abdominale deux fois par tour, crunch, crunch inversé, Russian twist et gainage, sans tirer sur la nuque. 3 tours.',
    rounds: 3,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Crunch', work: 30, target: 'Haut des abdos · la tablette', cue: 'Sur le dos, genoux pliés, pieds au sol, mains croisées sur la poitrine (jamais derrière la nuque). Enroule le haut du dos pour décoller les omoplates en expirant, tiens 1 s, redescends lentement. Le bas du dos reste collé au tapis.' },
      { name: 'Roue abdominale à genoux (1/2)', work: 30, target: 'Abdos complets · le plus efficace', cue: 'À genoux sur le tapis, mains sur la roue sous les épaules, dos légèrement arrondi, fesses serrées. Roule devant toi tant que le bas du dos ne creuse pas, puis reviens en contractant les abdos. Niveau 1 : amplitude courte (30 cm).' },
      { name: 'Crunch inversé', work: 30, target: 'Bas des abdos · la tablette', cue: 'Sur le dos, mains au sol le long du corps, genoux pliés à 90°. Enroule le bassin pour ramener les genoux vers la poitrine, sans élan, puis redescends en 3 s sans poser les pieds.' },
      { name: 'Planche sur avant-bras', work: 40, target: 'Gainage · ventre plat', cue: 'Coudes sous les épaules, fesses serrées, bassin ni haut ni bas. Sur les genoux si le dos creuse.' },
      { name: 'Planche latérale (droite)', work: 25, target: 'Obliques · taille gainée', cue: 'Couché sur le côté, coude sous l’épaule, soulève le bassin : le corps forme une ligne droite. Genou au sol si besoin.' },
      { name: 'Planche latérale (gauche)', work: 25, target: 'Obliques · taille gainée', cue: 'Même chose de l’autre côté.' },
      { name: 'Russian twist', work: 30, target: 'Obliques · taille dessinée', cue: 'Assis, genoux pliés, buste penché en arrière, dos bien droit. Mains jointes devant la poitrine : tourne les épaules d’un côté puis de l’autre, lentement, le regard suit les mains. Pieds au sol au début, décollés quand c’est facile.' },
      { name: 'Roue abdominale à genoux (2/2)', work: 30, target: 'Abdos complets · deuxième passage', cue: 'Deuxième passage, tu es fatigué : garde une amplitude plus courte plutôt que de laisser le bas du dos creuser. La qualité passe avant la distance.' },
    ],
  },
  {
    id: 'B',
    name: 'B · Haut du corps et posture',
    desc: 'Poids du corps seulement : un buste dessiné et un dos droit, sans prendre de volume. Tu te muscles sans t’élargir. 3 tours.',
    rounds: 3,
    rest: 20,
    roundRest: 75,
    exercises: [
      { name: 'Pompes', work: 40, target: 'Pectoraux · buste dessiné', cue: 'Mains un peu plus larges que les épaules, corps gainé, coudes à 45°. Descends lentement (2 s). Sur les genoux si besoin. Arrête 2 reps avant l’échec.' },
      { name: 'Planche inversée', work: 30, target: 'Dos et épaules · poitrine ouverte', cue: 'Assis, genoux pliés, pieds à plat, mains au sol derrière toi, doigts vers les pieds. Pousse dans les mains et les talons pour monter le bassin en table : épaules, hanches et genoux alignés. Serre les omoplates 3 s, redescends. Contre le dos rond.' },
      { name: 'Toucher d’épaules en planche', work: 30, target: 'Épaules · gainage', cue: 'En planche haute, mains sous les épaules, pieds écartés à la largeur des hanches. Touche l’épaule gauche avec la main droite, repose, puis l’autre côté, sans que le bassin bascule. Sur les genoux si besoin.' },
      { name: 'Superman Y (allongé sur le ventre)', work: 30, target: 'Haut du dos · posture droite', cue: 'Bras tendus en Y au-dessus de la tête, pouces vers le ciel. Décolle bras et poitrine de 5 cm, tiens 2 s, repose. Regard vers le tapis.' },
      { name: 'Pompes serrées', work: 30, target: 'Triceps · bras dessinés', cue: 'Mains sous les épaules, coudes qui frôlent le corps en descendant. Sur les genoux au début : la forme passe avant le nombre.' },
      { name: 'Superman W', work: 30, target: 'Omoplates · épaules ouvertes', cue: 'Allongé sur le ventre, coudes pliés en W le long du corps. Décolle la poitrine et serre les omoplates vers le bas et l’arrière, 2 s.' },
    ],
  },
  {
    id: 'C',
    name: 'C · Cardio sans saut',
    desc: 'Brûler des calories dans 2 m², sans bruit pour les voisins : c’est ce qui rend sec et fait apparaître abdos et mâchoire. 3 tours, ça monte vite.',
    rounds: 3,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Shadow boxing', work: 40, target: 'Cardio · corps sec', cue: 'Garde haute, enchaîne direct-direct-crochet, pivote sur les pieds. Expire à chaque coup.' },
      { name: 'Montées de genoux sur place', work: 30, target: 'Cardio · brûle des calories', cue: 'Sans sauter : un genou puis l’autre à hauteur de hanche, bras qui suivent.' },
      { name: 'Mountain climbers lents', work: 30, target: 'Cardio + abdos', cue: 'En planche haute, ramène un genou vers la poitrine puis l’autre, bassin stable.' },
      { name: 'Jumping jacks sans saut', work: 30, target: 'Cardio · tout le corps', cue: 'Écarte un pied sur le côté pendant que les bras montent au-dessus de la tête, reviens, puis l’autre pied. Rythme rapide, toujours un pied au sol : silencieux.' },
      { name: 'Shadow boxing rapide', work: 30, target: 'Cardio · dernier effort', cue: 'Coups courts et rapides, reste léger sur les appuis.' },
    ],
  },
  {
    id: 'M',
    name: 'M · Mobilité, posture et mâchoire',
    desc: 'Tous les jours, même les jours de repos : une posture droite fait paraître plus grand et dégage la mâchoire. C’est aussi ton minimum de reprise.',
    rounds: 1,
    rest: 5,
    roundRest: 0,
    fixed: true,
    exercises: [
      { name: 'Chat-vache', work: 45, target: 'Colonne souple', cue: 'À quatre pattes, mains sous les épaules, genoux sous les hanches. Inspire en creusant le dos (regard devant), expire en l’arrondissant (menton vers la poitrine). Lentement.' },
      { name: 'Livre ouvert (droite)', work: 40, target: 'Haut du dos · poitrine ouverte', cue: 'Allongé sur le côté gauche, genoux pliés, bras tendus devant toi l’un sur l’autre. Ouvre le bras droit vers l’arrière en suivant la main des yeux, puis reviens.' },
      { name: 'Livre ouvert (gauche)', work: 40, target: 'Haut du dos · poitrine ouverte', cue: 'Même chose de l’autre côté.' },
      { name: 'Fente basse (droite)', work: 40, target: 'Hanches · se tenir droit', cue: 'Un pied devant, genou arrière posé au sol. Avance doucement le bassin : tu sens l’étirement à l’avant de la hanche arrière. Contre la posture assise.' },
      { name: 'Fente basse (gauche)', work: 40, target: 'Hanches · se tenir droit', cue: 'Même chose de l’autre côté.' },
      { name: 'Chin tucks', work: 30, target: 'Cou · tête droite, mâchoire dégagée', cue: 'Assis ou debout, dos droit. Recule la tête à l’horizontale, comme pour faire un double menton, sans baisser le regard. Tiens 3 s, relâche. Corrige la tête en avant qui « efface » la mâchoire.' },
      { name: 'Renforcement du cou', work: 30, target: 'Cou · ligne de la mâchoire', cue: 'Allongé sur le dos, rentre le menton puis soulève la tête de 2-3 cm, tiens 5 s, repose. Tout doucement : le cou se renforce vite, sans à-coups.' },
      { name: 'Langue au palais', work: 30, target: 'Posture de la bouche · mâchoire', cue: 'Bouche fermée, dents à peine en contact, toute la langue collée au palais (pas seulement le bout). Respire par le nez. Garde cette position aussi dans la journée.' },
      { name: 'Vacuum abdominal', work: 40, target: 'Muscle profond · taille fine', cue: 'À quatre pattes. Souffle tout l’air, puis rentre le nombril vers la colonne comme pour fermer un jean trop serré. Tiens 10 à 15 s en respirant à petits coups, relâche, recommence. Idéal le ventre vide.' },
      { name: 'Posture de l’enfant', work: 45, target: 'Étirement du dos · détente', cue: 'À genoux, gros orteils qui se touchent, genoux écartés. Assieds-toi sur les talons, puis penche le buste en avant jusqu’à poser le front sur le tapis, bras tendus devant toi. Relâche tout et respire dans le bas du dos.' },
      { name: 'Respiration 4-6', work: 60, target: 'Récupération · calme', cue: 'Allongé sur le dos, genoux pliés : inspire 4 s par le nez, expire 6 s par la bouche. Calme le système nerveux.' },
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
  Crunch: 'crunch abdominal bonne technique',
  'Russian twist': 'russian twist débutant',
  'Planche inversée': 'reverse tabletop exercise',
  'Toucher d’épaules en planche': 'plank shoulder taps',
  'Crunch inversé': 'reverse crunch',
  'Vacuum abdominal': 'stomach vacuum exercise',
  'Jumping jacks sans saut': 'step jacks low impact',
  'Renforcement du cou': 'supine neck flexion chin tuck',
  'Langue au palais': 'correct tongue posture',
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
