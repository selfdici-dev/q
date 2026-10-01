// Contenu par défaut : habitudes et séances. Tout est modifiable dans l'appli
// (habitudes) ou ici (séances).

export const DEFAULT_HABITS = [
  { id: 'sommeil', name: 'Téléphone hors du lit', min: 'Téléphone posé hors du lit à l’heure cible', full: 'Téléphone hors de la chambre + couché à l’heure cible' },
  { id: 'sport', name: 'Bouger', min: 'Mobilité 8 min OU 5 pompes + 30 s de gainage', full: 'Séance du jour + 8 000 pas' },
  { id: 'focus', name: 'Focus', min: '1 session de 25 min', full: '4 sessions de 25 min' },
  { id: 'lecture', name: 'Lire', min: '2 pages', full: '20 minutes' },
  { id: 'manger', name: 'Pas de grignotage', min: 'Pas de grignotage après le dîner', full: 'Zéro grignotage hors des repas' },
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
