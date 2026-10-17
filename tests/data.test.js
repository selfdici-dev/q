import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORKOUTS, WEEK_PLAN, WARMUP, HELP, demoUrl, baseName } from '../js/data.js';

test('séances : les IDs stockés dans l’historique ne changent pas', () => {
  assert.deepEqual(WORKOUTS.map((w) => w.id), ['A', 'B', 'C', 'M']);
  for (const id of Object.values(WEEK_PLAN)) assert.ok(WORKOUTS.some((w) => w.id === id), id);
  assert.deepEqual(Object.keys(WEEK_PLAN).map(Number).sort(), [0, 1, 2, 3, 4, 5, 6]);
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
  const all = [...WORKOUTS.flatMap((w) => [w.desc, ...w.exercises.flatMap((e) => [e.name, e.cue])]), ...WARMUP.flatMap((e) => [e.name, e.cue])];
  for (const text of all) assert.doesNotMatch(text, /bouteille|serviette|sac à dos|haltère|barre|chaise|mur\b|\btable\b|\bporte\b/i, text);
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
  assert.equal(ex('B').filter((e) => /élastique/i.test(e.name)).length, 3);
  assert.ok(ex('B').some((e) => e.name === 'Curl biceps à l’élastique'));
  for (const e of ex('B').filter((x) => /parallettes/i.test(x.cue))) assert.match(e.cue, /Sans parallettes : /, e.name);
  assert.ok(ex('B').some((e) => /^Pompes pike/.test(e.name)) && ex('B').some((e) => /^L-sit/.test(e.name)));
  // B : deux exercices pour des pectoraux fermes (pompes et pompes serrées)
  assert.ok(ex('B').filter((e) => /pectoraux/i.test(e.target)).length >= 2);
  // rien ne vise la largeur : pas d'exercice d'épaules latérales ni de trapèzes
  for (const w of WORKOUTS) for (const e of w.exercises) assert.doesNotMatch(`${e.name} ${e.target}`, /latérales|trapèze|largeur/i);
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
  assert.ok(demoUrl('Crunch inversé').startsWith('https://www.youtube.com/results?search_query='));
});

test('aide « ? » : chaque onglet expliqué en 3 phrases courtes', () => {
  assert.deepEqual(Object.keys(HELP), ['jour', 'focus', 'sport', 'argent', 'moi']);
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

test('A et C : un minimum chiffré au début de chaque consigne, pour savoir quand l’exercice est validé', () => {
  for (const id of ['A', 'C']) {
    for (const e of WORKOUTS.find((w) => w.id === id).exercises) assert.match(e.cue, /^Objectif : \d/, `${id} · ${e.name}`);
  }
});

test('B : des consignes courtes et en étapes, lisibles pendant l’effort', () => {
  for (const e of WORKOUTS.find((w) => w.id === 'B').exercises) {
    assert.ok(e.cue.length <= 330, `${e.name} : ${e.cue.length} caractères`);
    assert.match(e.cue, /1\. |Étape 1 : /, e.name);
  }
});
