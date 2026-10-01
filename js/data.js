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
// work = secondes d'effort au niveau 2 ; le niveau 1 fait -10 s, le niveau 3 +10 s.
export const WORKOUTS = [
  {
    id: 'A',
    name: 'A · Tronc et abdos',
    desc: 'Gainage profond, sans tirer sur la nuque. 3 tours.',
    rounds: 3,
    rest: 15,
    roundRest: 60,
    exercises: [
      { name: 'Dead bug', work: 40, cue: 'Bas du dos collé au tapis. Bras et jambe opposés descendent lentement. Expire en descendant.' },
      { name: 'Planche sur avant-bras', work: 40, cue: 'Coudes sous les épaules, fesses serrées, bassin ni haut ni bas. Sur les genoux si le dos creuse.' },
      { name: 'Planche latérale (droite)', work: 25, cue: 'Coude sous l’épaule, corps aligné. Genou au sol si besoin.' },
      { name: 'Planche latérale (gauche)', work: 25, cue: 'Même chose de l’autre côté.' },
      { name: 'Hollow hold genoux pliés', work: 25, cue: 'Bas du dos plaqué. Si le dos décolle : genoux plus près, bras plus bas.' },
      { name: 'Bird dog', work: 40, cue: 'À quatre pattes, bras et jambe opposés tendus, pause 2 s, alterne. Dos plat comme une table.' },
    ],
  },
  {
    id: 'B',
    name: 'B · Haut du corps et posture',
    desc: 'Pectoraux, épaules, haut du dos pour une silhouette en V et une posture droite. 3 tours.',
    rounds: 3,
    rest: 20,
    roundRest: 75,
    exercises: [
      { name: 'Pompes', work: 40, cue: 'Corps gainé, coudes à 45°, descends lentement (2 s). Arrête 2 reps avant l’échec.' },
      { name: 'Superman Y (allongé sur le ventre)', work: 30, cue: 'Bras en Y, pouces vers le ciel, décolle bras et poitrine de 5 cm. Regard vers le tapis.' },
      { name: 'Pompes pike', work: 30, cue: 'Fesses hautes en V inversé, tête qui descend devant les mains. Amplitude courte au début.' },
      { name: 'Superman W', work: 30, cue: 'Coudes pliés en W, serre les omoplates vers le bas et l’arrière.' },
      { name: 'Shoulder taps en planche', work: 30, cue: 'Pieds écartés, touche l’épaule opposée sans faire balancer le bassin.' },
      { name: 'Chin tucks au sol', work: 30, cue: 'Allongé sur le dos, rentre le menton (double menton) et pousse l’arrière du crâne dans le tapis, 3 s.' },
    ],
  },
  {
    id: 'M',
    name: 'M · Mobilité et posture (8 min)',
    desc: 'Tous les jours, même les jours de repos. C’est aussi ton minimum de reprise.',
    rounds: 1,
    rest: 5,
    roundRest: 0,
    fixed: true,
    exercises: [
      { name: 'Chat-vache', work: 45, cue: 'À quatre pattes, enroule puis creuse le dos lentement avec la respiration.' },
      { name: 'Livre ouvert (droite)', work: 40, cue: 'Allongé sur le côté gauche, genoux pliés, ouvre le bras droit vers l’arrière en suivant la main des yeux.' },
      { name: 'Livre ouvert (gauche)', work: 40, cue: 'Même chose de l’autre côté.' },
      { name: 'Fente basse (droite)', work: 40, cue: 'Genou arrière au sol, bassin rétroversé, sens l’étirement à l’avant de la hanche. Contre la posture assise.' },
      { name: 'Fente basse (gauche)', work: 40, cue: 'Même chose de l’autre côté.' },
      { name: 'Chin tucks', work: 30, cue: 'Assis bien droit, rentre le menton, tiens 3 s, relâche.' },
      { name: 'Posture de l’enfant', work: 45, cue: 'Fesses vers les talons, bras devant, respire dans le dos.' },
      { name: 'Respiration 4-6', work: 60, cue: 'Sur le dos : inspire 4 s par le nez, expire 6 s. Calme le système nerveux.' },
    ],
  },
];

// Semaine type : A lundi/jeudi, B mardi/vendredi, mobilité les autres jours.
export const WEEK_PLAN = { 1: 'A', 2: 'B', 3: 'M', 4: 'A', 5: 'B', 6: 'M', 0: 'M' };

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
export function demoUrl(name) {
  const q = name.replace(/\s*\((droite|gauche)\)/, '').replace(/^Superman /, 'prone ');
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${q} exercice technique`)}`;
}
