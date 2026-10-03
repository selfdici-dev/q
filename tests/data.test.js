import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WORKOUTS, WEEK_PLAN, WARMUP, demoUrl } from '../js/data.js';

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

test('silhouette en V : la séance B travaille épaules latérales et dorsaux', () => {
  const b = WORKOUTS.find((w) => w.id === 'B');
  assert.ok(b.exercises.some((e) => /largeur du V/.test(e.target) && /Dorsaux/.test(e.target)));
  assert.ok(b.exercises.some((e) => /largeur du V/.test(e.target) && /épaule/.test(e.target)));
  // la taille fine se travaille chaque jour dans la mobilité
  assert.ok(WORKOUTS.find((w) => w.id === 'M').exercises.some((e) => /taille fine/.test(e.target)));
});

test('liens de démo vidéo', () => {
  const q = (name) => decodeURIComponent(new URL(demoUrl(name)).searchParams.get('search_query'));
  assert.equal(q('Planche latérale (droite)'), 'Planche latérale exercice technique');
  assert.equal(q('Superman W'), 'prone W exercice technique');
  assert.equal(q('Tirage nageur à la serviette'), 'towel lat pulldown floor');
  assert.ok(demoUrl('Crunch inversé').startsWith('https://www.youtube.com/results?search_query='));
});
