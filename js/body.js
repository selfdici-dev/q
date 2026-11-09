// Comprendre ton corps : des leçons courtes pour savoir pourquoi tu fais ce que
// tu fais (ce que tu manges, tes séances, ton sommeil), chacune vérifiée dans
// les études (src). Même forme que les leçons de finance : l'idée, un exemple,
// quelque chose à essayer, un quiz (2 bonnes réponses sur 3 pour la valider).
// Une leçon validée va au même endroit que celles de finance (state.lessons,
// id « corps-… ») : elle rapporte l'XP d'une leçon, compte pour « Apprendre »,
// et ses questions passent dans tes révisions. Logique pure (sans DOM), testée
// par tests/body.test.js.

export const BODY_LESSONS = [
  {
    id: 'corps-calories',
    title: 'Pourquoi on prend ou on perd du gras',
    idea: 'Ton corps dépense de l’énergie toute la journée : pour vivre, bouger, digérer. Si tu manges plus que ce que tu dépenses, le surplus est rangé en gras ; si tu manges moins, ton corps puise dans ses réserves. 1 kg de gras, c’est environ 7 700 kcal d’énergie stockée.',
    example: 'Cap estime que tu dépenses ≈ 2 350 kcal par jour à 8 000 pas. Si tu manges 1 850 kcal, il manque 500 kcal par jour, soit 3 500 sur la semaine : environ 0,45 kg de gras. Ce n’est pas exact au gramme près (ton corps, l’eau), mais c’est la bonne direction.',
    exercise: 'Note tes repas d’aujourd’hui dans Manger, et regarde ce soir ta carte « Ton déficit ».',
    src: 'Repère courant en nutrition ; estimation de dépense de Cap.',
    quiz: [
      { q: 'Si tu manges moins que ce que tu dépenses pendant des semaines…', a: ['Ton corps puise dans ses réserves de gras', 'Rien ne se passe, seul le sport compte', 'Tu prends du muscle à coup sûr'], c: 0, why: 'L’énergie qui manque est prise dans tes réserves : c’est ça, perdre du gras.' },
      { q: '1 kg de gras, c’est environ…', a: ['770 kcal', '7 700 kcal', '77 000 kcal'], c: 1, why: '≈ 7 700 kcal : c’est pour ça que le gras part lentement, quelques centaines de grammes par semaine.' },
      { q: '500 kcal de déficit par jour pendant une semaine, ça fait…', a: ['≈ 0,05 kg de gras', '≈ 0,45 kg de gras', '≈ 3 kg de gras'], c: 1, why: '500 × 7 = 3 500 kcal, et 3 500 ÷ 7 700 ≈ 0,45 kg.' },
    ],
  },
  {
    id: 'corps-gras',
    title: 'Où part le gras quand tu maigris',
    idea: 'Le gras ne fond pas en chaleur et ne part pas aux toilettes : il est brûlé, et ses atomes repartent surtout par tes poumons. 84 % du gras perdu sort en gaz carbonique (CO₂) quand tu expires, 16 % en eau (urine, sueur, souffle).',
    example: 'Pour brûler 10 kg de gras, ton corps inspire 29 kg d’oxygène et rejette 28 kg de CO₂ et 11 kg d’eau. Respirer plus fort n’y change rien : c’est ce que tu dépenses et ce que tu manges qui décide.',
    exercise: 'Pendant ta marche d’aujourd’hui, pense-y : à chaque expiration, un tout petit bout de gras s’en va.',
    src: 'Meerman et Brown, BMJ 2014 ; Vispute et al. 2011.',
    quiz: [
      { q: 'Par où sort la plus grande partie du gras perdu ?', a: ['Par la sueur', 'Par les poumons, en CO₂', 'Par l’intestin'], c: 1, why: '84 % sort en CO₂ quand tu expires ; le reste devient de l’eau.' },
      { q: 'Respirer très fort fait-il perdre plus de gras ?', a: ['Oui', 'Non'], c: 1, why: 'La respiration suit ce que ton corps brûle. Ce qui fait brûler, c’est le déficit et le mouvement.' },
      { q: 'Faire des abdos fait-il partir le gras du ventre en premier ?', a: ['Oui, le gras du muscle travaillé part d’abord', 'Non, le gras part de partout à la fois'], c: 1, why: 'Dans un essai, 6 semaines d’abdos n’ont pas fait perdre de gras sur le ventre : il part de partout, selon le déficit.' },
    ],
  },
  {
    id: 'corps-proteines',
    title: 'Les protéines : les briques',
    idea: 'Les protéines construisent et réparent tes muscles, et ce sont elles qui calent le plus. Quand tu manges moins pour sécher, elles aident à garder ton muscle. Le repère des études : environ 1,6 g par kilo de poids et par jour ; au-delà, le gain devient très faible.',
    example: 'Pour ≈ 70 kg, ça fait ≈ 110 à 120 g par jour (l’objectif de Cap : 120 g). Avec 2 repas (12 h et 20 h), vise ≈ 60 g à chacun : 2 steaks hachés ≈ 39 g, l’omelette 3 œufs et thon ≈ 45 g, 175 g de poulet ≈ 40 g.',
    exercise: 'Aujourd’hui, compte tes protéines avec les boutons de Ma journée.',
    src: 'Morton et al. 2018 ; Leidy et al. 2015.',
    quiz: [
      { q: 'Pourquoi manger assez de protéines quand on sèche ?', a: ['Pour garder son muscle et avoir moins faim', 'Pour brûler du gras directement', 'Ça ne sert à rien en sèche'], c: 0, why: 'Elles protègent le muscle quand tu manges moins, et elles calent.' },
      { q: 'Le repère des études, par kilo de poids et par jour ?', a: ['0,5 g', '≈ 1,6 g', '5 g'], c: 1, why: 'Au-delà de ≈ 1,6 g, les gains de muscle deviennent très faibles.' },
      { q: 'Avec 2 repas par jour, combien viser à chaque repas pour 120 g ?', a: ['≈ 20 g', '≈ 60 g', '≈ 120 g'], c: 1, why: '120 g en 2 repas : ≈ 60 g chacun.' },
    ],
  },
  {
    id: 'corps-glucides',
    title: 'Glucides, eau et balance',
    idea: 'Les glucides (patates, maïs, pois chiches, pâtes, pain) sont le carburant de tes muscles. Ton corps les range dans les muscles et le foie avec beaucoup d’eau. Quand tu manges plus de glucides ou de sel, ton poids peut monter de 1 à 2 kg en quelques jours : de l’eau, pas du gras.',
    example: 'Un week-end de pizzas, et 1,5 kg de plus le lundi : c’est surtout de l’eau et de la nourriture en route ; ça repart en quelques jours de repas normaux. Le gras, lui, se compte sur des semaines.',
    exercise: 'La prochaine fois que tu as l’impression d’avoir « pris d’un coup », pense à l’eau : juge sur plusieurs semaines, pas sur un jour.',
    src: 'Holt et al. 1995 ; physiologie du glycogène.',
    quiz: [
      { q: 'Pourquoi le poids peut monter de 1 à 2 kg en 2 jours ?', a: ['C’est 2 kg de gras', 'C’est surtout de l’eau, rangée avec les glucides et le sel', 'Le muscle pousse très vite'], c: 1, why: 'Les glucides sont stockés avec de l’eau ; le sel en retient aussi.' },
      { q: 'Les patates font-elles grossir ?', a: ['Oui, toujours', 'Non : cuites à l’eau ou au four, ce sont même les plus rassasiantes', 'Seulement le soir'], c: 1, why: 'Dans une étude sur 38 aliments, les pommes de terre cuites à l’eau calaient le plus. En frites, beaucoup moins.' },
      { q: 'Les glucides servent surtout à…', a: ['Donner de l’énergie aux muscles', 'Construire les os', 'Rien du tout'], c: 0, why: 'C’est le carburant de l’effort.' },
    ],
  },
  {
    id: 'corps-insuline',
    title: 'L’insuline et le jeûne',
    idea: 'L’insuline est l’hormone qui range le sucre après un repas. Elle monte et redescend tous les jours, c’est normal, et elle ne fait pas grossir toute seule. Avec les mêmes calories, manger dans une fenêtre courte (jeûne 16:8) ou toute la journée donne à peu près le même résultat.',
    example: 'Un essai d’un an : mêmes calories, repas entre 8 h et 16 h ou quand on veut, pas de différence nette de poids. Un autre de 12 semaines (midi-20 h) : pas plus de poids perdu, un peu plus de muscle perdu. Et des gens nourris avec beaucoup de glucides, donc plus d’insuline, ont mangé 550 à 700 kcal de moins par jour qu’en régime cétogène.',
    exercise: 'Ton 12 h-20 h te convient ? Garde-le, avec ≈ 60 g de protéines à chaque repas. S’il te laisse sans énergie le matin ou te fait craquer le soir, essaie une semaine avec un petit-déjeuner.',
    src: 'Liu et al. 2022 (NEJM) ; Lowe et al. 2020 ; Hall et al. 2021 ; Sievert et al. 2019 (BMJ).',
    quiz: [
      { q: 'L’insuline, c’est…', a: ['L’hormone qui range le sucre après un repas', 'Une hormone qui fait grossir à coup sûr', 'Une vitamine'], c: 0, why: 'Elle monte après chaque repas et redescend : c’est son travail.' },
      { q: 'Avec les mêmes calories, le jeûne 16:8 fait-il perdre beaucoup plus ?', a: ['Oui, deux fois plus', 'Non, à peu près pareil'], c: 1, why: 'Les essais trouvent à peu près le même résultat : ce qui compte, c’est le total de la journée.' },
      { q: 'Pourquoi sauter le petit-déjeuner aide-t-il certains ?', a: ['Ils mangent moins sur la journée (≈ 260 kcal en moyenne)', 'L’insuline disparaît', 'Le corps brûle plus de muscle'], c: 0, why: 'D’après 13 essais, ceux qui prennent un petit-déjeuner mangent ≈ 260 kcal de plus par jour.' },
    ],
  },
  {
    id: 'corps-sommeil',
    title: 'Le sommeil fait (vraiment) maigrir',
    idea: 'Dormir peu fait manger plus : environ 385 kcal de plus par jour en moyenne. Pendant un régime, le manque de sommeil fait perdre du muscle à la place du gras. Et une seule nuit blanche fait baisser de 18 % la fabrication de muscle.',
    example: 'Même régime pendant 2 semaines : en dormant 8 h 30, des gens ont perdu 1,4 kg de gras ; en dormant 5 h 30, seulement 0,6 kg. Le reste, c’était surtout de l’eau et du muscle.',
    exercise: 'Ce soir : téléphone loin du lit à l’heure du coucher visé, et réveil à la même heure demain.',
    src: 'Al Khatib et al. 2017 ; Nedeltcheva et al. 2010 ; Lamon et al. 2021.',
    quiz: [
      { q: 'Dormir peu fait manger en moyenne…', a: ['≈ 385 kcal de plus par jour', 'Moins', 'Pareil'], c: 0, why: 'D’après 11 études regroupées.' },
      { q: 'En régime avec peu de sommeil, on perd…', a: ['Plus de gras', 'Moins de gras, et plus d’eau et de muscle'], c: 1, why: '0,6 kg de gras au lieu de 1,4 kg, avec le même régime.' },
      { q: 'Une nuit blanche, pour le muscle, c’est…', a: ['≈ 18 % de fabrication de muscle en moins', 'Aucun effet'], c: 0, why: 'Mesuré le lendemain d’une nuit sans dormir.' },
    ],
  },
  {
    id: 'corps-abdos',
    title: 'Abdos, muscle et effet « boum »',
    idea: 'Les abdos se voient quand le gras baisse sur tout le corps (autour de 10 à 12 % de gras pour un homme, selon les sources). Les exercices d’abdos les épaississent, donc ils ressortent mieux une fois sec, mais ils ne brûlent pas le gras du ventre. Et le muscle se construit lentement : au poids du corps, en mangeant moins que ce que tu dépenses, tu ne deviens pas massif par accident.',
    example: 'Juste après une séance, le sang gonfle les muscles pendant une heure ou deux : tu te trouves « boum », puis ça redescend. Ce qui épaissit vraiment la silhouette, c’est le gras, quand on mange trop plusieurs jours de suite.',
    exercise: 'Fais ta version flemme du A 2 ou 3 fois cette semaine, et laisse l’assiette et les pas s’occuper du ventre.',
    src: 'Vispute et al. 2011 ; Grgic et al. 2022 ; Barakat et al. 2020.',
    quiz: [
      { q: 'Qu’est-ce qui rend les abdos visibles ?', a: ['500 crunchs par jour', 'Un taux de gras plus bas', 'Les étirements'], c: 1, why: 'Les abdos sont là ; c’est la couche de gras qui les cache.' },
      { q: 'Pourquoi on se trouve plus gros juste après une séance ?', a: ['Le sang gonfle les muscles, puis ça redescend', 'On a pris 1 kg de muscle', 'On a pris du gras'], c: 0, why: 'C’est la congestion : elle dure une heure ou deux.' },
      { q: 'Faut-il aller au bout de ses forces à chaque série ?', a: ['Oui, sinon ça ne sert à rien', 'Non, s’arrêter 1 ou 2 répétitions avant donne autant de résultats'], c: 1, why: 'D’après 15 études regroupées, aller jusqu’à l’échec n’est pas nécessaire.' },
    ],
  },
  {
    id: 'corps-pas',
    title: 'Marcher : la meilleure arme',
    idea: 'Marcher dépense de l’énergie toute la journée sans t’épuiser, et c’est souvent ce qui fait le plus de différence. Pour la santé, avant 60 ans, le risque de mourir baisse jusqu’à 8 000 à 10 000 pas par jour. Et marcher un peu après manger aide à faire redescendre le sucre dans le sang.',
    example: 'Cap compte ≈ 0,04 kcal par pas : passer de 3 000 à 10 000 pas, c’est ≈ 280 kcal de plus dépensées par jour, plus que six séances A.',
    exercise: 'Cette semaine : 15 minutes de marche après chaque repas. Le ménage compte aussi.',
    src: 'Paluch et al. 2022 ; Buffey et al. 2022 ; estimation de dépense de Cap.',
    quiz: [
      { q: 'Avant 60 ans, le risque baisse jusqu’à combien de pas par jour ?', a: ['2 000', '8 000 à 10 000', '30 000'], c: 1, why: 'D’après 15 études, 47 000 personnes.' },
      { q: 'De 3 000 à 10 000 pas, ça dépense en plus environ…', a: ['30 kcal', '280 kcal', '2 800 kcal'], c: 1, why: '7 000 pas × 0,04 kcal ≈ 280 kcal.' },
      { q: 'Quand marcher pour aider le sucre dans le sang ?', a: ['Après les repas', 'Seulement à jeun', 'Jamais'], c: 0, why: 'Bouger un peu au lieu de rester assis fait baisser le sucre après les repas.' },
    ],
  },
  {
    id: 'corps-envies',
    title: 'Les envies : éviter plutôt que résister',
    idea: 'Les gens qui ont « de la volonté » ont autant d’envies que les autres, mais ils se mettent moins souvent face à la tentation. Ce qui marche : rendre le bon facile et le mauvais pénible. Et après un écart, la honte fait souvent tout lâcher (« au point où j’en suis… ») ; être indulgent avec soi aide à repartir.',
    example: 'Des gâteaux dans ta chambre : chaque soir, il faut résister. Pas de gâteaux dans ta chambre : il n’y a rien à résister. Une revue Cochrane montre que la nourriture placée plus loin est moins mangée.',
    exercise: 'Range une tentation hors de portée aujourd’hui : la manette dans un tiroir, ou le grignotage hors de ta chambre.',
    src: 'Hofmann et al. 2012 ; Hollands et al. 2019 (Cochrane) ; Breines et Chen 2012 ; Adriaanse et al. 2011.',
    quiz: [
      { q: 'Que font surtout les gens qui ont beaucoup de contrôle d’eux-mêmes ?', a: ['Ils résistent plus fort', 'Ils évitent les tentations'], c: 1, why: 'Ils vivent moins de conflits parce qu’ils se mettent moins face à la tentation.' },
      { q: 'Après un écart, qu’est-ce qui aide le plus à repartir ?', a: ['Se punir', 'Être indulgent, et reprendre au repas suivant'], c: 1, why: 'L’indulgence donne plus envie de s’améliorer ; la honte fait tout lâcher.' },
      { q: 'Un plan « si… alors… » marche mieux pour…', a: ['Ajouter une bonne habitude', 'S’interdire un aliment'], c: 0, why: 'Pour manger, prévoir ce qu’on mange marche presque deux fois mieux que de s’interdire.' },
    ],
  },
];

// Combien de leçons validées, et la prochaine à faire (null : toutes faites).
// lessons : state.lessons (celles de finance y sont aussi, on les ignore).
const ok = (lessons) => (lessons && typeof lessons === 'object' ? lessons : {});
export const bodyDone = (lessons) => BODY_LESSONS.filter((l) => ok(lessons)[l.id]).length;
export const bodyNext = (lessons) => BODY_LESSONS.find((l) => !ok(lessons)[l.id]) ?? null;

// Le résultat d'un quiz : picks[i] = l'index de la réponse choisie à la
// question i. Validée avec 2 bonnes réponses sur 3 ; parfaite avec toutes.
export function bodyScore(lesson, picks = []) {
  const score = lesson.quiz.filter((q, i) => picks[i] === q.c).length;
  return { score, passed: score >= Math.min(2, lesson.quiz.length), perfect: score === lesson.quiz.length };
}
