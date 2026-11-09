import { test } from 'node:test';
import assert from 'node:assert/strict';
import { binder } from '../js/binder.js';
import { WORKOUTS, WARMUP, baseName } from '../js/data.js';

test('classeur : chaque mouvement une fois (gauche et droite, 1er et 2e passage ensemble), l’échauffement compris', () => {
  const b = binder({ days: {} }, WORKOUTS, WARMUP);
  const all = new Set([...WORKOUTS.flatMap((w) => [...w.exercises, ...(w.flemme?.exercises ?? [])]), ...WARMUP].map((e) => baseName(e.name)));
  // la version flemme du A y ajoute ses levées de jambes
  assert.deepEqual(b.list.find((x) => x.name === 'Levées de jambes')?.workouts, ['A']);
  assert.equal(b.total, all.size);
  assert.equal(new Set(b.list.map((x) => x.name)).size, b.total);
  assert.equal(b.found, 0);
  const side = b.list.find((x) => x.name === 'Planche latérale');
  assert.deepEqual(side.names, ['Planche latérale (droite)', 'Planche latérale (gauche)']);
  // le nom affiché : sans le côté ni le passage, mais avec ce qui décrit le mouvement
  assert.equal(side.label, 'Planche latérale');
  assert.equal(b.list.find((x) => x.name === 'Roue abdominale à genoux').label, 'Roue abdominale à genoux');
  assert.equal(b.list.find((x) => x.name === 'Pompes').label, 'Pompes (sur parallettes)');
  // l'échauffement : dans les séances qui ne sont pas fixes (A, B, C), pas en P ni en M
  const warm = b.list.find((x) => x.name === 'Chat-vache');
  assert.equal(warm.warm, true);
  assert.deepEqual(warm.workouts.sort(), WORKOUTS.filter((w) => !w.fixed).map((w) => w.id).sort());
});

test('classeur : découvert dès sa première séance, jours comptés une fois, ton record', () => {
  const a = WORKOUTS.find((w) => w.id === 'A');
  const name = a.exercises[0].name;
  const state = {
    days: {
      '2026-11-02': { workouts: ['A', 'A'] }, // refaite le même jour : un seul jour
      '2026-11-03': { workouts: ['B'] },
      '2026-11-04': { workouts: ['A', 'M'] },
    },
    records: { [`${name}#1`]: { best: 14 }, [`${name}#2`]: { best: 11 }, 'Inconnu#1': { best: 99 } },
  };
  const b = binder(state, WORKOUTS, WARMUP);
  const first = b.list.find((x) => x.name === baseName(name));
  assert.equal(first.found, true);
  assert.equal(first.times, 2);
  assert.equal(first.best, 14);
  // l'échauffement : fait en A et en B, donc 3 jours
  assert.equal(b.list.find((x) => x.name === 'Chat-vache').times, 3);
  // une séance jamais faite (P) : ses exercices sont encore à découvrir
  const p = WORKOUTS.find((w) => w.id === 'P');
  for (const e of p.exercises) {
    const x = b.list.find((y) => y.name === baseName(e.name));
    if (x.workouts.every((w) => w === 'P')) assert.equal(x.found, false, x.name);
  }
  assert.ok(b.found > 0 && b.found < b.total);
  // données bizarres : rien de découvert, sans erreur
  assert.equal(binder({ days: null, records: 'x' }, WORKOUTS, WARMUP).found, 0);
  assert.equal(binder(undefined, WORKOUTS).found, 0);
});
