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

test('matériel : le corps, un tapis et une roue abdominale, rien d’autre', () => {
  const all = [...WORKOUTS.flatMap((w) => [w.desc, ...w.exercises.flatMap((e) => [e.name, e.cue])]), ...WARMUP.flatMap((e) => [e.name, e.cue])];
  for (const text of all) assert.doesNotMatch(text, /bouteille|serviette|sac à dos|haltère|élastique|barre|chaise|mur\b/i, text);
});

test('objectif fin et élancé : roue ×2, burpees sans saut, posture et mâchoire', () => {
  const ex = (id) => WORKOUTS.find((w) => w.id === id).exercises;
  assert.equal(ex('A').filter((e) => baseName(e.name) === 'Roue abdominale à genoux').length, 2);
  // C : burpees sans saut (silencieux) à la place des montées de genoux
  assert.ok(ex('C').some((e) => e.name === 'Burpees sans saut'));
  assert.ok(ex('C').every((e) => !/montées de genoux/i.test(e.name)));
  assert.ok(ex('M').filter((e) => /mâchoire/.test(e.target)).length >= 2);
  // A : crunch (haut des abdos) et Russian twist (obliques) ; B sans pompes pike ni tirage superman
  // A : ses exercices préférés (planches, hollow, Russian twist) + crunch vélo et roue ×2 à 40 s
  for (const n of ['Crunch vélo', 'Russian twist', 'Planche sur avant-bras', 'Planche latérale (droite)', 'Planche latérale (gauche)', 'Hollow hold genoux pliés']) assert.ok(ex('A').some((e) => e.name === n), n);
  assert.ok(ex('A').filter((e) => /^Roue/.test(e.name)).every((e) => e.work >= 40));
  // M : posture et mâchoire, sans les exercices où l'on ne sent rien
  assert.ok(['Pont fessier', 'Superman', 'Extension du cou', 'Livre ouvert (droite)', 'Anges au sol', 'Étirement des pectoraux au sol (gauche)'].every((n) => ex('M').some((e) => e.name === n)));
  // M : plus de langue au palais ni de renforcement du cou (pas de gros cou)
  assert.ok(ex('M').every((e) => !/langue|renforcement du cou/i.test(e.name)));
  assert.ok(ex('M').every((e) => !/respiration|vacuum|chat-vache|posture de l/i.test(e.name)));
  // C : plus de jumping jacks
  assert.ok(ex('C').every((e) => !/jumping/i.test(e.name)));
  assert.ok(ex('M').reduce((t, e) => t + e.work + 5, 0) <= 11 * 60);
  assert.ok(ex('B').every((e) => !/pike|tirage superman/i.test(e.name)));
  // B : bras, avant-bras, épaules et dos, sans la posture (déjà dans M), 2 tours faisables
  for (const muscle of [/biceps/i, /triceps/i, /avant-bras/i, /épaules/i, /dos/i]) assert.ok(ex('B').some((e) => muscle.test(e.target)), String(muscle));
  assert.ok(ex('B').every((e) => !/planche inversée|superman y|posture/i.test(`${e.name} ${e.target}`)));
  assert.ok(WORKOUTS.find((w) => w.id === 'B').rounds <= 2);
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
  assert.equal(q('Planche latérale (droite)'), 'Planche latérale exercice technique');
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
