import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORKOUTS, WEEK_PLAN, WARMUP, HELP, demoUrl, baseName, DAY_PLAN, FOOD_COLORS, FOOD_TREATS, FOOD_RULES, DEFAULT_RULES, PROTEIN_CHIPS, FOODS, FOOD_CATS, SNACKS, SNACK_TEST, TEA_TIPS } from '../js/data.js';
import { goalOf } from '../js/logic.js';

test('séances : les IDs stockés dans l’historique ne changent pas', () => {
  // P (tractions au parc) s'ajoute ; A, B, C et M restent tels quels
  assert.deepEqual(WORKOUTS.map((w) => w.id), ['A', 'B', 'C', 'P', 'M']);
  for (const id of Object.values(WEEK_PLAN)) assert.ok(WORKOUTS.some((w) => w.id === id), id);
  assert.deepEqual(Object.keys(WEEK_PLAN).map(Number).sort(), [0, 1, 2, 3, 4, 5, 6]);
});

test('semaine type : B trois fois, A deux fois, cardio C le mercredi, M le dimanche', () => {
  // revue après un mois : 3 séances d'abdos, c'était trop (la sèche montre les abdos) ;
  // le mercredi devait passer aux tractions, mais pas de barre : ce sera la C
  const count = (id) => Object.values(WEEK_PLAN).filter((x) => x === id).length;
  assert.deepEqual([count('A'), count('B'), count('C'), count('M'), count('P')], [2, 3, 1, 1, 0]);
  assert.equal(WEEK_PLAN[3], 'C');
  assert.equal(WEEK_PLAN[0], 'M');
  // jamais la même séance deux jours de suite : chaque muscle a 48 h pour récupérer
  for (let d = 0; d < 7; d++) assert.notEqual(WEEK_PLAN[d], WEEK_PLAN[(d + 1) % 7], `jour ${d}`);
});

test('chaque exercice a une durée, une consigne et un objectif', () => {
  for (const w of WORKOUTS) {
    assert.ok(w.rounds >= 1 && w.exercises.length >= 4, w.id);
    const names = w.exercises.map((e) => e.name);
    assert.equal(new Set(names).size, names.length, `doublon dans ${w.id}`);
    for (const e of w.exercises) {
      assert.ok(Number.isInteger(e.work) && e.work >= 20 && e.work <= 60, e.name);
      assert.ok(e.cue.length > 20, e.name);
      assert.ok(typeof e.target === 'string' && e.target.length > 3, `objectif manquant : ${e.name}`);
    }
  }
  for (const e of WARMUP) assert.ok(e.work > 0 && e.cue, e.name);
});

test('matériel : le corps, un tapis, une roue abdominale, des parallettes et un élastique en boucle, rien d’autre', () => {
  // à la maison ; la P se fait au parc, à la barre (test plus bas)
  const home = WORKOUTS.filter((w) => w.id !== 'P');
  const all = [...home.flatMap((w) => [w.desc, ...w.exercises.flatMap((e) => [e.name, e.cue])]), ...WARMUP.flatMap((e) => [e.name, e.cue])];
  for (const text of all) assert.doesNotMatch(text, /serviette|sac à dos|haltère|barre|chaise|mur\b|\btable\b|\bporte\b/i, text);
  // A v4 : une bouteille d’eau pleine rend le Russian twist plus dur, et ne sert nulle part ailleurs
  const twist = WORKOUTS.find((w) => w.id === 'A').exercises.find((e) => e.name === 'Russian twist');
  assert.deepEqual(all.filter((text) => /bouteille/i.test(text)), [twist.cue]);
});

test('objectif fin et élancé : roue ×2, burpees sans saut, posture et mâchoire', () => {
  const ex = (id) => WORKOUTS.find((w) => w.id === id).exercises;
  assert.equal(ex('A').filter((e) => baseName(e.name) === 'Roue abdominale à genoux').length, 2);
  // C : burpees sans saut (silencieux) à la place des montées de genoux
  assert.ok(ex('C').some((e) => e.name === 'Burpees sans saut'));
  assert.ok(ex('C').every((e) => !/montées de genoux/i.test(e.name)));
  // M v3 : l'extension du cou retirée à sa demande ; seuls les chin tucks visent honnêtement la tête droite
  assert.ok(ex('M').filter((e) => /mâchoire/.test(e.target)).length >= 1);
  // A : crunch (haut des abdos) et Russian twist (obliques) ; B sans pompes pike ni tirage superman
  // A : ses exercices préférés (planches, hollow, Russian twist) + crunch vélo et roue ×2 à 40 s
  // A v2 : la planche (devenue trop facile) laisse la place au crunch inversé, pour le bas du ventre
  for (const n of ['Crunch vélo', 'Russian twist', 'Crunch inversé', 'Planche latérale (droite)', 'Planche latérale (gauche)', 'Hollow hold genoux pliés']) assert.ok(ex('A').some((e) => e.name === n), n);
  assert.ok(ex('A').every((e) => e.name !== 'Planche sur avant-bras'));
  assert.ok(ex('A').filter((e) => /^Roue/.test(e.name)).every((e) => e.work >= 40));
  // M : posture et mâchoire, sans les exercices où l'on ne sent rien ; dans 2 m² (plus de livre ouvert,
  // d'anges au sol ni d'étirement couché, trop larges ou pas compris), avec l'élastique pour le haut du dos
  // M v3 : sans la rotation à quatre pattes (pas comprise, illisible en 2D) ni l'extension du cou (pas faite),
  // le tirage superman redresse le haut du dos
  assert.ok(['Pont fessier', 'Superman', 'Tirage superman', 'Chin tucks', 'Écarté arrière à l’élastique', 'Étirement des pectoraux mains dans le dos'].every((n) => ex('M').some((e) => e.name === n)));
  assert.ok(ex('M').every((e) => !/extension du cou|rotation du haut du dos|chien tête en bas/i.test(e.name)));
  assert.ok(ex('M').every((e) => !/livre ouvert|anges au sol|pectoraux au sol/i.test(e.name)));
  assert.ok(ex('M').every((e) => /^Objectif : \d/.test(e.cue)), 'objectif manquant dans M');
  // M : plus de langue au palais ni de renforcement du cou (pas de gros cou)
  assert.ok(ex('M').every((e) => !/langue|renforcement du cou/i.test(e.name)));
  assert.ok(ex('M').every((e) => !/respiration|vacuum|chat-vache|posture de l/i.test(e.name)));
  // C : boxe et dense pour sécher (pauses courtes, pas plus de 3 tours pour rester court), mountain climbers rapides
  const C = WORKOUTS.find((w) => w.id === 'C');
  assert.ok(C.rounds <= 3 && C.rest <= 10);
  assert.ok(ex('C').filter((e) => /^Shadow boxing/.test(e.name)).length >= 3);
  assert.ok(ex('C').some((e) => e.name === 'Mountain climbers rapides'));
  // C : plus de jumping jacks ; les jambes (les plus gros muscles) travaillent avec les fentes arrière
  assert.ok(ex('C').every((e) => !/jumping/i.test(e.name)));
  assert.ok(ex('C').some((e) => e.name === 'Fentes arrière alternées'));
  // Échauffement sans cercles de bras (rejetés)
  assert.ok(WARMUP.every((e) => !/rotations des épaules|cercles/i.test(e.name)));
  assert.ok(ex('M').reduce((t, e) => t + e.work + 5, 0) <= 11 * 60);
  // Pompes pike de retour : il enchaîne maintenant ~16 pompes, et la consigne garde une version facile
  assert.ok(ex('B').every((e) => !/tirage superman/i.test(e.name)));
  // B : bras, avant-bras, épaules et dos, sans la posture (déjà dans M), 2 tours faisables
  for (const muscle of [/biceps/i, /triceps/i, /avant-bras/i, /épaules/i, /dos/i]) assert.ok(ex('B').some((e) => muscle.test(e.target)), String(muscle));
  assert.ok(ex('B').every((e) => !/planche inversée|superman y|posture/i.test(`${e.name} ${e.target}`)));
  assert.ok(WORKOUTS.find((w) => w.id === 'B').rounds <= 2);
  // B : un objectif chiffré dans chaque consigne, sans les exercices jugés inutiles ou ennuyeux
  assert.ok(ex('B').every((e) => /^Objectif : \d/.test(e.cue)), 'objectif manquant dans B');
  assert.ok(ex('B').every((e) => !/cercles de bras|poings serrés|curl contre la cuisse|presse des paumes|bout des doigts|curl résisté|sphinx/i.test(e.name)));
  // B : du tirage pour le dos en V, et une variante sans élastique pour chaque exercice à l'élastique
  assert.ok(ex('B').filter((e) => /dos/i.test(e.target)).length >= 2);
  for (const e of ex('B').filter((x) => /élastique/i.test(x.name))) assert.match(e.cue, /Sans élastique : /, e.name);
  // B v3 : l'élastique pour les 2 tirages et un curl biceps (il aime les curls, les biceps n'avaient rien de direct)
  // B v4 : + les élévations latérales (après un mois, il veut le V : épaules un peu plus larges)
  assert.equal(ex('B').filter((e) => /élastique/i.test(e.name)).length, 4);
  assert.ok(ex('B').some((e) => e.name === 'Curl biceps à l’élastique'));
  for (const e of ex('B').filter((x) => /parallettes/i.test(x.cue))) assert.match(e.cue, /Sans parallettes : /, e.name);
  assert.ok(ex('B').some((e) => /^Pompes pike/.test(e.name)) && ex('B').some((e) => /^L-sit/.test(e.name)));
  // B : deux exercices pour des pectoraux fermes (pompes et pompes serrées)
  assert.ok(ex('B').filter((e) => /pectoraux/i.test(e.target)).length >= 2);
  // trapèzes : jamais (ils tassent le cou). Largeur : seulement les élévations latérales de la B,
  // choisies après un mois pour le V (avant : « rien ne vise la largeur »)
  for (const w of WORKOUTS) for (const e of w.exercises) assert.doesNotMatch(`${e.name} ${e.target}`, /trapèze/i);
  const wide = WORKOUTS.flatMap((w) => w.exercises.map((e) => [w.id, e.name])).filter(([, n]) => /latérales/i.test(n) && !/^Planche/.test(n));
  assert.deepEqual(wide, [['B', 'Élévations latérales à l’élastique']]);
  // juste après le curl : même élastique (le noir, le plus léger), même position
  const names = ex('B').map((e) => e.name);
  assert.equal(names.indexOf('Élévations latérales à l’élastique'), names.indexOf('Curl biceps à l’élastique') + 1);
  assert.match(ex('B').find((e) => /^Élévations/.test(e.name)).cue, /élastique noir/);
});

test('A v4 : 2 tours durs plutôt que 3 mous, et une version plus dure quand la fourchette est atteinte', () => {
  const A = WORKOUTS.find((w) => w.id === 'A');
  assert.equal(A.rounds, 2);
  assert.match(A.desc, /2 à 3 s/);
  assert.match(A.desc, /1 ou 2 répétitions en réserve/);
  // En haut de la fourchette, Cap propose la version plus dure : elle est écrite dans la consigne
  const counted = A.exercises.filter((e) => goalOf(e.cue) && !e.name.endsWith('(2/2)'));
  assert.deepEqual(counted.map((e) => e.name), ['Crunch vélo', 'Roue abdominale à genoux (1/2)', 'Russian twist', 'Crunch inversé']);
  for (const e of counted) {
    const g = goalOf(e.cue);
    assert.ok(g.max > g.min, `${e.name} : pas de fourchette`);
    assert.match(e.cue, new RegExp(`Plus de ${g.max} faciles : `), e.name);
  }
});

test('P : au parc, à la barre, à la place d’une C ; tractions par étapes', () => {
  const P = WORKOUTS.find((w) => w.id === 'P');
  // séance fixe (ni échauffement sur tapis ni niveau), en plus de la semaine type, comme la C
  assert.equal(P.fixed, true);
  assert.ok(!Object.values(WEEK_PLAN).includes('P'));
  assert.doesNotMatch(P.prep, /tapis/i);
  assert.match(P.desc, /à la place d’une C/);
  // ≈ 15 min (départ, efforts, pauses, fins de tour), avec des pauses longues : c'est la force qui compte
  const secs = 10 + P.rounds * P.exercises.reduce((t, e) => t + e.work, 0) + P.rounds * (P.exercises.length - 1) * P.rest + (P.rounds - 1) * P.roundRest;
  assert.ok(secs >= 12 * 60 && secs <= 16 * 60, `${secs} s`);
  assert.ok(P.rest >= 30);
  // tout se fait aux barres du parc : ni tapis, ni roue, ni parallettes ; l'élastique pour l'étape 2 seulement
  for (const e of P.exercises) assert.doesNotMatch(`${e.name} ${e.cue}`, /tapis|roue|parallettes/i, e.name);
  assert.deepEqual(P.exercises.filter((e) => /élastique/i.test(e.cue)).map((e) => e.name), ['Tractions (selon ton niveau)']);
  // tractions par étapes : négatives, élastique, puis vraies ; en haut de chaque fourchette, la version plus dure est écrite
  const pull = P.exercises.find((e) => e.name === 'Tractions (selon ton niveau)');
  assert.match(pull.cue, /Étape 1 : négatives.*Étape 2 : élastique.*Étape 3 : vraies tractions/);
  for (const e of P.exercises.filter((x) => goalOf(x.cue))) {
    const g = goalOf(e.cue);
    assert.ok(g.max > g.min, e.name);
    assert.match(e.cue, new RegExp(`Plus de ${g.max} faciles : `), e.name);
  }
  // la suspension ouvre chaque tour (échauffement au 1er) ; chaque exercice dit pourquoi, en une phrase courte
  assert.equal(P.exercises[0].name, 'Suspension à la barre');
  for (const e of P.exercises) assert.ok(e.why && e.why.length <= 110 && !/gonfl|masse/i.test(e.why), e.name);
});

test('Salle : chaque séance a un exercice phare, qui fait partie de la séance', () => {
  for (const w of WORKOUTS) assert.ok(w.exercises.some((e) => e.name === w.star), `${w.id} : ${w.star}`);
});

test('nom de base sans précision entre parenthèses', () => {
  assert.equal(baseName('Roue abdominale à genoux (1/2)'), 'Roue abdominale à genoux');
  assert.equal(baseName('Planche latérale (gauche)'), 'Planche latérale');
  assert.equal(baseName('Chat-vache'), 'Chat-vache');
});

test('liens de démo vidéo', () => {
  const q = (name) => decodeURIComponent(new URL(demoUrl(name)).searchParams.get('search_query'));
  assert.equal(q('Exercice inconnu (droite)'), 'Exercice inconnu exercice technique');
  // Nom complet d'abord, puis nom de base : la vidéo montre la bonne version
  assert.equal(q('Planche latérale (droite)'), 'side plank reach through');
  assert.equal(q('Shadow boxing (esquives et crochets)'), 'slip and hook shadow boxing drill');
  assert.equal(q('Shadow boxing'), 'shadow boxing jab cross beginner');
  assert.equal(q('Superman W'), 'prone W exercice technique');
  assert.equal(q('Superman Y (allongé sur le ventre)'), 'prone Y exercice technique');
  assert.equal(q('Toucher d’épaules en planche'), 'plank shoulder taps');
  assert.equal(q('Tractions (selon ton niveau)'), 'pull up progression beginner negatives band');
  assert.ok(demoUrl('Crunch inversé').startsWith('https://www.youtube.com/results?search_query='));
});

test('aide « ? » : chaque onglet expliqué en 3 phrases courtes', () => {
  // v4 : 4 onglets (Salle, Jour, Manger, Moi) ; Focus retiré, Argent dans Moi
  assert.deepEqual(Object.keys(HELP), ['jour', 'sport', 'manger', 'moi']);
  assert.match(HELP.moi.lines.join(' '), /Argent/);
  for (const [tab, h] of Object.entries(HELP)) {
    assert.ok(h.title, tab);
    assert.equal(h.lines.length, 3, tab);
    for (const l of h.lines) assert.ok(l.length <= 110, `${tab} : phrase trop longue (${l.length})`);
  }
});

test('B : chaque exercice dit pourquoi il sert le physique fin et sec, en une phrase courte', () => {
  for (const e of WORKOUTS.find((w) => w.id === 'B').exercises) {
    assert.ok(e.why && e.why.length <= 110, e.name);
    assert.ok(!/gonfl(er|é) les|prendre du volume|masse/i.test(e.why), e.name);
  }
});

test('A, C et P : un minimum chiffré au début de chaque consigne, pour savoir quand l’exercice est validé', () => {
  for (const id of ['A', 'C', 'P']) {
    for (const e of WORKOUTS.find((w) => w.id === id).exercises) assert.match(e.cue, /^Objectif : \d/, `${id} · ${e.name}`);
  }
});

test('B : des consignes courtes et en étapes, lisibles pendant l’effort', () => {
  for (const e of WORKOUTS.find((w) => w.id === 'B').exercises) {
    assert.ok(e.cue.length <= 330, `${e.name} : ${e.cue.length} caractères`);
    assert.match(e.cue, /1\. |Étape 1 : /, e.name);
  }
});

test('B : pompes pike par étapes, de la négative à la complète', () => {
  // il n'y arrivait pas et ne sentait aucun progrès : 4 étapes, 8 faciles font passer à la suivante
  const pike = WORKOUTS.find((w) => w.id === 'B').exercises.find((e) => e.name === 'Pompes pike');
  assert.match(pike.cue, /Étape 1 : négatives.*Étape 2 : .*Étape 3 : complètes.*Étape 4 : /);
  const g = goalOf(pike.cue);
  assert.equal(g.unit, 'pompes pike');
  assert.match(pike.cue, new RegExp(`Plus de ${g.max} faciles : étape suivante`));
});

test('manger : journée type du réveil au coucher, et 3 couleurs où rien n’est interdit', () => {
  // journée type : des lignes courtes, lisibles d'un coup d'œil
  assert.ok(DAY_PLAN.length >= 6);
  for (const [when, what] of DAY_PLAN) assert.ok(when.length <= 12 && what.length > 10 && what.length <= 120, when);
  const plan = Object.fromEntries(DAY_PLAN);
  assert.match(plan['Au réveil'], /créatine/);
  // pas de petit-déjeuner obligatoire : le 1er repas peut glisser vers 11 h (la règle dit pareil)
  assert.match(plan['1er repas'], /11 h/);
  assert.ok(FOOD_RULES.some((r) => /premier repas avec des protéines.*11 h/.test(r)));
  assert.ok(FOOD_RULES.every((r) => !/^Petit-déjeuner/.test(r)));
  // café : le dernier à 15 h, 4 au plus (400 mg) ; plus rien à manger après le dîner ;
  // téléphone loin à 23 h, comme la règle si-alors
  assert.match(plan['15 h'], /Dernier café.*4 au plus/);
  assert.match(plan['Après dîner'], /Plus rien à manger/);
  assert.ok(DEFAULT_RULES.some((r) => r.includes('23 h')) && /Téléphone/.test(plan['23 h']));
  // 3 couleurs : vert tous les jours (toutes les protéines des boutons, sauf le jambon), jaune un peu, rouge prévu
  assert.deepEqual(FOOD_COLORS.map((c) => c.id), ['vert', 'jaune', 'rouge']);
  const green = FOOD_COLORS[0].items.join(' ').toLowerCase();
  for (const id of PROTEIN_CHIPS.filter((f) => f !== 'jambon')) assert.ok(green.includes(FOODS.find((f) => f.id === id).name.split(' ')[0].toLowerCase()), id);
  const red = FOOD_COLORS[2];
  assert.match(red.title, /^Prévu, 2 ou 3 fois par semaine/);
  assert.ok(/Gâteaux/.test(red.items.join(' ')) && /Fast-food/.test(red.items.join(' ')));
  // rien d'interdit, aucune couleur n'est un « jamais » ; le rouge se prévoit, à table, sans écran
  for (const c of FOOD_COLORS) assert.doesNotMatch(`${c.title} ${c.items.join(' ')}`, /interdit|jamais/i, c.id);
  const treats = FOOD_TREATS.join(' ');
  assert.match(treats, /pas un grignotage/);
  assert.match(treats, /sans écran/);
  assert.match(treats, /jamais deux fois de suite/);
  for (const t of FOOD_TREATS) assert.ok(t.length <= 110, t);
});

test('manger : collations protéinées d’abord, test de la pomme, thé loin des repas et avant 15 h', () => {
  assert.match(SNACKS[0].title, /protéines/);
  const first = SNACKS[0].items.join(' ');
  for (const food of ['skyr', 'œufs', 'thon']) assert.match(first, new RegExp(food), food);
  // chaque collation chiffrée donne ses calories ; rien n'est « interdit »
  for (const g of SNACKS) {
    assert.ok(g.items.length >= 1, g.title);
    for (const i of g.items) assert.doesNotMatch(i, /interdit/i);
  }
  assert.ok(SNACKS.flatMap((g) => g.items).filter((i) => /kcal/.test(i)).length >= 8);
  assert.match(SNACK_TEST, /pomme/);
  const tea = TEA_TIPS.join(' ');
  assert.match(tea, /15 h/);
  assert.match(tea, /fer/);
  assert.match(tea, /détox/);
  for (const t of TEA_TIPS) assert.ok(t.length <= 110, t);
});

test('journal des repas : des aliments courants, en portions, avec des repères crédibles', () => {
  const ids = FOODS.map((f) => f.id);
  assert.equal(new Set(ids).size, ids.length);
  const cats = FOOD_CATS.map(([c]) => c);
  for (const c of cats) assert.ok(FOODS.some((f) => f.cat === c), c);
  for (const f of FOODS) {
    assert.ok(cats.includes(f.cat), f.id);
    assert.ok(f.emoji && f.name && f.portion, f.id);
    assert.ok(Number.isInteger(f.kcal) && f.kcal >= 0 && f.kcal <= 1000, f.id);
    // les protéines ne peuvent pas apporter plus de calories que l'aliment (4 kcal par g)
    assert.ok(f.p >= 0 && f.p * 4 <= f.kcal, f.id);
  }
  // ce qu'il demandait : patate douce et poulet ; et les boutons protéines de Jour existent tous
  assert.ok(ids.includes('patate-douce') && ids.includes('poulet'));
  for (const id of PROTEIN_CHIPS) assert.ok(ids.includes(id), id);
  // cohérent avec les conseils de Manger : skyr 150 g = 90 kcal, 15 g ; amandes 25 g = 150 kcal
  const by = (id) => FOODS.find((f) => f.id === id);
  assert.deepEqual([by('skyr').kcal, by('skyr').p], [90, 15]);
  assert.equal(by('amandes').kcal, 150);
});
