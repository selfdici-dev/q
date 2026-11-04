import { test } from 'node:test';
import assert from 'node:assert/strict';
import { kcalSpent, dayDeficit, deficitSummary, SPEND_BASE, KCAL_PER_KG } from '../js/deficit.js';
import { kcalTarget } from '../js/logic.js';

const meal = (kcal, n = 1) => ({ f: 'x', n, kcal, p: 0 });

test('déficit : la dépense suit les pas et la séance, ≈ 500 au-dessus de l’objectif de Manger', () => {
  assert.equal(kcalSpent(8000), SPEND_BASE);
  assert.equal(kcalSpent(undefined), SPEND_BASE); // sans pas notés : 8 000
  assert.equal(kcalSpent(12000), SPEND_BASE + 160);
  assert.equal(kcalSpent(3000), SPEND_BASE - 200);
  assert.equal(kcalSpent(8000, 120), SPEND_BASE + 120);
  assert.equal(kcalSpent(8000) - kcalTarget(8000), 500);
});

test('déficit : un jour noté, un jour vide, la séance du jour comptée une fois', () => {
  assert.equal(dayDeficit({}), null);
  assert.equal(dayDeficit({ meals: [] }), null);
  assert.equal(dayDeficit(undefined), null);
  const d = dayDeficit({ meals: [meal(600), meal(400, 2)], steps: 8000 });
  assert.deepEqual(d, { eaten: 1400, spent: SPEND_BASE, deficit: SPEND_BASE - 1400 });
  const kcalOf = (id) => ({ A: 90, C: 150 })[id] ?? 0;
  const sport = dayDeficit({ meals: [meal(2600)], workouts: ['C', 'C', 'A'], steps: 8000 }, kcalOf);
  assert.equal(sport.spent, SPEND_BASE + 240);
  assert.equal(sport.deficit, SPEND_BASE + 240 - 2600);
});

test('déficit : la semaine (depuis lundi) et le mois (depuis le 1er), jours notés seulement', () => {
  const days = {
    '2026-10-30': { meals: [meal(1850)] }, // octobre : hors du mois
    '2026-11-01': { meals: [meal(1850)] }, // dimanche : semaine d'avant, mais dans le mois
    '2026-11-02': { meals: [meal(1850)] }, // lundi
    '2026-11-03': { meals: [meal(2650)] }, // au-dessus de la dépense
    '2026-11-04': {}, // rien de noté : ne compte pas
    '2026-11-05': { meals: [meal(1550)] },
  };
  const s = deficitSummary({ days }, '2026-11-05');
  assert.deepEqual(s.today, { eaten: 1550, spent: SPEND_BASE, deficit: 800 });
  assert.equal(s.week.length, 7);
  assert.equal(s.week[0].key, '2026-11-02');
  assert.deepEqual(s.week.map((w) => w.day?.deficit ?? null), [500, -300, null, 800, null, null, null]);
  assert.deepEqual(s.week.map((w) => w.future), [false, false, false, false, true, true, true]);
  assert.deepEqual([s.weekSum.total, s.weekSum.logged, s.weekSum.avg], [1000, 3, 333]);
  assert.deepEqual([s.month.total, s.month.logged], [1500, 4]);
  assert.equal(s.month.kg, Math.round((1500 / KCAL_PER_KG) * 100) / 100);
  // le dimanche : la semaine finit, toute pleine ; rien de noté : zéro, sans erreur
  assert.equal(deficitSummary({ days }, '2026-11-08').week.every((w) => !w.future), true);
  const none = deficitSummary({ days: null }, '2026-11-05');
  assert.equal(none.today, null);
  assert.deepEqual([none.weekSum.total, none.month.logged, none.month.kg], [0, 0, 0]);
});
