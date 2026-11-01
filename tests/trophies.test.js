import { test } from 'node:test';
import assert from 'node:assert/strict';
import { TROPHIES, trophyStats, trophyStatus, newTrophies } from '../js/trophies.js';
import { DECORS } from '../js/decors.js';
import { ICONS } from '../js/icons.js';
import { LESSONS, PUZZLES } from '../js/chess-school.js';

test('trophées : des identifiants uniques, bronze, argent ou or, une icône qui existe', () => {
  assert.equal(new Set(TROPHIES.map((t) => t.id)).size, TROPHIES.length);
  assert.ok(TROPHIES.length >= 25);
  for (const t of TROPHIES) {
    assert.ok(['bronze', 'argent', 'or'].includes(t.tier), t.id);
    assert.ok(ICONS[t.icon], `${t.id} : icône ${t.icon}`);
    assert.ok(t.name && t.desc && t.group && t.need.n > 0, t.id);
  }
  // le trophée « tous les décors » suit le nombre de décors
  assert.equal(TROPHIES.find((t) => t.id === 'd17').need.n, DECORS.length);
});

test('trophées : gagnés au seuil exact, progression affichée, chiffres bizarres à zéro', () => {
  const at = (stats, id, seen) => trophyStatus(stats, seen).find((t) => t.id === id);
  assert.equal(at({ workouts: 9 }, 's10').earned, false);
  assert.equal(at({ workouts: 9 }, 's10').label, '9 / 10 séances');
  assert.equal(at({ workouts: 10 }, 's10').earned, true);
  assert.equal(at({ workouts: 10 }, 's10').label, '10 séances');
  assert.equal(at({ level: 4 }, 'lv5').label, 'niveau 4 / 5');
  assert.equal(at({ chain: 2 }, 'ch3').label, '2 / 3 jours de chaîne');
  assert.equal(at({ taquin4: 0 }, 'g-taquin').label, '0 / 1 taquin 4 × 4');
  for (const junk of [{}, undefined, { workouts: -3 }, { workouts: 'x' }]) {
    assert.ok(trophyStatus(junk).every((t) => !t.earned && t.pct >= 0 && t.pct <= 1 && !/NaN/.test(t.label)));
  }
});

test('trophées : déjà gagné, il le reste (même si la chaîne casse) ; annoncé une seule fois', () => {
  const stats = { chain: 8, workouts: 1 };
  assert.deepEqual(newTrophies([], stats).map((t) => t.id), ['s1', 'ch3', 'ch7']);
  assert.deepEqual(newTrophies(['s1', 'ch3'], stats).map((t) => t.id), ['ch7']);
  // la chaîne retombe à 0 : les trophées vus restent gagnés
  const after = trophyStatus({ chain: 0, workouts: 1 }, ['s1', 'ch3', 'ch7']);
  assert.equal(after.find((t) => t.id === 'ch7').earned, true);
  assert.deepEqual(newTrophies(['s1', 'ch3', 'ch7'], { chain: 0, workouts: 1 }), []);
  assert.deepEqual(newTrophies(null, {}), []);
});

test('trophées : les chiffres viennent de tes données (chaîne, jeux, décors)', () => {
  const days = {};
  for (const k of ['2026-10-01', '2026-10-02', '2026-10-03', '2026-10-04']) days[k] = { habits: { a: 1 }, workouts: ['A'] };
  const state = {
    settings: { startDate: '2026-10-01' },
    habits: [{ id: 'a', name: 'A' }],
    days,
    games: { echo: { best: 11 }, briques: { level: 3 }, taquin: { best: { 4: 120 } }, blocs: { best: 3500 } },
  };
  const s = trophyStats(state, '2026-10-04');
  assert.equal(s.chain, 4);
  assert.equal(s.workouts, 4);
  assert.equal(s.echo, 11);
  assert.equal(s.briques, 3);
  assert.equal(s.taquin4, 1);
  assert.equal(s.decors, 2); // la salle et le dojo (3 500 aux Blocs)
  const won = trophyStatus(s).filter((t) => t.earned).map((t) => t.id);
  for (const id of ['s1', 'ch3', 'g-echo', 'g-bricks', 'g-taquin', 'g-blocs']) assert.ok(won.includes(id), id);
  // sans date de départ ni jeux : zéro partout, sans erreur
  const empty = trophyStats({ settings: {}, habits: [], days: {} }, '2026-10-04');
  assert.equal(empty.chain, 0);
  assert.equal(empty.decors, 1);
});

test('trophées : les échecs (toutes les leçons, tous les problèmes, Cap battu au niveau Coriace)', () => {
  const lessons = Object.fromEntries(LESSONS.map((l) => [l.id, true]));
  const games = { echecs: { lessons: { ...lessons, inconnue: true }, puzzles: { p1: true, p2: true, zz: true }, wins: { moyen: 3 } } };
  const s = trophyStats({ settings: {}, habits: [], days: {}, games }, '2026-11-01');
  assert.equal(s.echecsLecons, LESSONS.length); // une leçon inconnue ne compte pas
  assert.equal(s.echecsPb, 2);
  assert.equal(s.echecsCoriace, 0);
  const at = (id, stats) => trophyStatus(stats).find((t) => t.id === id);
  assert.equal(at('g-ecole', s).earned, true);
  assert.equal(at('g-tactique', s).earned, false);
  assert.equal(at('g-tactique', s).label, `2 / ${PUZZLES.length} problèmes`);
  assert.equal(at('g-coriace', s).earned, false);
  assert.equal(at('g-coriace', { echecsCoriace: 1 }).earned, true);
  assert.equal(trophyStats({ settings: {}, habits: [], days: {}, games: { echecs: { wins: { coriace: 2 } } } }, '2026-11-01').echecsCoriace, 2);
});
