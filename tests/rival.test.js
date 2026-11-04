import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUNDS, rivalStatus } from '../js/rival.js';
import { ICONS } from '../js/icons.js';

const MATIN = ['eau', 'douche', 'sourcils', 'cheveux']; // une routine du matin complète
const SOIR = ['eau', 'vetements', 'lit']; // une routine du soir complète
const state = (days, startDate = '2026-09-01') => ({ settings: { startDate }, habits: [{ id: 'a', name: 'A' }], days });

test('rival : la semaine en cours face aux mêmes jours de la semaine d’avant', () => {
  for (const r of ROUNDS) assert.ok(ICONS[r.icon], `${r.id} : icône`);
  // mercredi 4 novembre : du lundi 2 au mercredi 4, contre du lundi 26 au mercredi 28 octobre
  const days = {
    '2026-10-26': { workouts: ['A'], habits: { a: 1 }, routine: MATIN },
    '2026-10-27': { workouts: ['B'], habits: { a: 1 }, read: true },
    '2026-10-29': { workouts: ['A'], habits: { a: 1 }, routine: MATIN, read: true }, // jeudi : hors duel (pas encore joué cette semaine)
    '2026-11-02': { workouts: ['A'], habits: { a: 1 }, routine: [...MATIN, ...SOIR] },
    '2026-11-03': { workouts: ['B', 'M'], habits: { a: 1 } },
    '2026-11-04': { workouts: ['C'], routine: MATIN },
  };
  const st = rivalStatus(state(days), '2026-11-04');
  assert.equal(st.day, 3);
  assert.equal(st.left, 4);
  const at = (id) => st.rounds.find((r) => r.id === id);
  assert.deepEqual([at('seances').me, at('seances').rival, at('seances').lead], [3, 2, 'toi']);
  assert.deepEqual([at('jours').me, at('jours').rival, at('jours').lead], [2, 2, 'egal']);
  assert.deepEqual([at('matins').me, at('matins').rival], [2, 1]);
  assert.deepEqual([at('soirs').me, at('soirs').rival], [1, 0]);
  assert.deepEqual([at('lecture').me, at('lecture').rival, at('lecture').lead], [0, 1, 'rival']);
  assert.deepEqual([st.me, st.rival], [3, 1]);
  assert.equal(st.fresh, false);
  assert.match(st.verdict, /^Tu mènes 3 à 1/);
});

test('rival : en retard, à égalité, le dimanche, et ta première semaine', () => {
  const lastWeek = { '2026-10-26': { workouts: ['A'] }, '2026-10-27': { workouts: ['B'] } };
  const behind = rivalStatus(state(lastWeek), '2026-11-03');
  assert.deepEqual([behind.me, behind.rival], [0, 1]);
  assert.match(behind.verdict, /mène 1 à 0\. Il reste 5 jours pour le rattraper\./);
  // dimanche : plus de jour pour rattraper
  assert.match(rivalStatus(state(lastWeek), '2026-11-08').verdict, /La revanche, c’est dès lundi\./);
  // rien des deux côtés : égalité, sans manche gagnée
  const tie = rivalStatus(state({}), '2026-11-04');
  assert.deepEqual([tie.me, tie.rival], [0, 0]);
  assert.match(tie.verdict, /^Égalité pour l’instant/);
  // départ cette semaine : pas de rival encore
  const first = rivalStatus(state({ '2026-11-02': { workouts: ['A'] } }, '2026-11-02'), '2026-11-04');
  assert.equal(first.fresh, true);
  assert.match(first.verdict, /^Ta première semaine/);
  // données bizarres : zéro partout, sans erreur
  const junk = rivalStatus({ settings: {}, habits: [], days: null }, '2026-11-04');
  assert.ok(junk.rounds.every((r) => r.me === 0 && r.rival === 0));
});
