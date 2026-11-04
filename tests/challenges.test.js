import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CHALLENGES, weekOf, weekChallenges, gameBase, challengeStatus, updateChallenges, challengeNews } from '../js/challenges.js';
import { totalXP, XP, addDays } from '../js/logic.js';
import { ICONS } from '../js/icons.js';

const sp = (t) => t.replace(/\s/g, ' ');
const base = (extra = {}) => ({ settings: { startDate: '2026-10-01' }, habits: [], days: {}, games: {}, ...extra });

test('défis : la semaine va du lundi au dimanche', () => {
  assert.equal(weekOf('2026-10-26'), '2026-10-26'); // lundi
  assert.equal(weekOf('2026-11-01'), '2026-10-26'); // dimanche
  assert.equal(weekOf('2026-11-02'), '2026-11-02');
  assert.equal(weekOf('2027-01-01'), '2026-12-28'); // par-dessus le nouvel an
});

test('défis : trois par semaine (sport, vie, arcade), toujours les mêmes pour une semaine, jamais deux fois de suite', () => {
  for (const f of Object.keys(CHALLENGES)) for (const c of CHALLENGES[f]) assert.ok(ICONS[c.icon], `${c.id} : icône`);
  const seen = new Set();
  let prev = null;
  for (let w = '2026-01-05', k = 0; k < 104; w = addDays(w, 7), k++) {
    const list = weekChallenges(w);
    assert.equal(list.length, 3);
    assert.ok(CHALLENGES.sport.includes(list[0]) && CHALLENGES.vie.includes(list[1]) && CHALLENGES.arcade.includes(list[2]), w);
    assert.deepEqual(weekChallenges(w), list); // même semaine, mêmes défis
    if (prev) list.forEach((c, i) => assert.notEqual(c.id, prev[i].id, `${w} : le même que la semaine d’avant`));
    list.forEach((c) => seen.add(c.id));
    prev = list;
  }
  // en deux ans, tous les défis sortent
  assert.equal(seen.size, Object.values(CHALLENGES).flat().length);
});

test('défis : l’avancement vient de tes jours de la semaine', () => {
  const week = '2026-11-02';
  // trouve une semaine dont le défi sport est « 4 séances » et le défi vie « 5 matins »
  let w = week;
  while (!(weekChallenges(w)[0].id === 'seances')) w = addDays(w, 7);
  const days = {};
  days[w] = { workouts: ['A'] };
  days[addDays(w, 1)] = { workouts: ['B', 'B'] }; // une fois par jour
  days[addDays(w, 2)] = { workouts: ['M'] }; // M ne compte pas pour « séances »
  days[addDays(w, -1)] = { workouts: ['C'] }; // la semaine d'avant : ne compte pas
  const st = challengeStatus(base({ days }), addDays(w, 2));
  const s = st.list[0];
  assert.equal(s.have, 2);
  assert.equal(s.label, '2 / 4');
  assert.equal(s.done, false);
  assert.equal(st.left, 5); // mercredi : encore 5 jours (mercredi compris)
  days[addDays(w, 3)] = { workouts: ['C'] };
  days[addDays(w, 4)] = { workouts: ['P'] };
  const st2 = challengeStatus(base({ days }), addDays(w, 6));
  assert.equal(st2.list[0].done, true);
  assert.equal(st2.list[0].label, 'Réussi');
  assert.equal(st2.left, 1);
});

test('défis : à l’arcade, on bat ses records du début de semaine', () => {
  let w = '2026-11-02';
  while (weekChallenges(w)[2].id !== 'serpent') w = addDays(w, 7);
  const games = { serpent: { best: 41 } };
  assert.equal(gameBase(games).serpent, 41);
  let state = base({ games });
  // lundi : la base est notée
  const up = updateChallenges(state, w);
  assert.equal(up[w].base.serpent, 41);
  state = { ...state, challenges: up };
  let c = challengeStatus(state, w).list[2];
  assert.equal(sp(c.text), 'Bats ton record au Serpent (41 fruits)');
  assert.equal(sp(c.label), 'À battre : 41');
  assert.equal(c.done, false);
  // jeudi : 44 fruits, le défi est réussi et enregistré
  state = { ...state, games: { serpent: { best: 44 } } };
  c = challengeStatus(state, addDays(w, 3)).list[2];
  assert.equal(c.done, true);
  const up2 = updateChallenges(state, addDays(w, 3));
  assert.ok(up2[w].done.includes('serpent'));
  assert.equal(up2[w].base.serpent, 41); // la base ne bouge pas
  // jamais joué : un premier point suffit
  let w2 = w;
  while (weekChallenges(w2)[2].id !== 'serpent' || w2 === w) w2 = addDays(w2, 7);
  const fresh = challengeStatus(base(), w2).list[2];
  assert.equal(fresh.text, 'Mange au moins un fruit au Serpent');
});

test('défis : aux échecs, une victoire contre Cap dans la semaine (à partir du 2 novembre 2026)', () => {
  assert.ok(!weekChallenges('2026-10-26').some((c) => c.id === 'echecs'));
  let w = '2026-11-02';
  while (weekChallenges(w)[2].id !== 'echecs') w = addDays(w, 7);
  let state = base({ games: { echecs: { wins: { debutant: 2 } } } });
  const up = updateChallenges(state, w);
  assert.equal(up[w].base.echecs, 2); // les victoires d'avant ne comptent pas
  state = { ...state, challenges: up };
  let c = challengeStatus(state, w).list[2];
  assert.equal(c.done, false);
  assert.equal(c.label, '0 / 1');
  state = { ...state, games: { echecs: { wins: { debutant: 2, moyen: 1 } } } };
  c = challengeStatus(state, addDays(w, 4)).list[2];
  assert.equal(c.done, true);
});

test('défis : 5 problèmes d’échecs du jour dans la semaine (à partir du 9 novembre 2026)', () => {
  assert.ok(!weekChallenges('2026-11-02').some((c) => c.id === 'probleme'));
  let w = '2026-11-09';
  while (weekChallenges(w)[2].id !== 'probleme') w = addDays(w, 7);
  const before = { [addDays(w, -3)]: true, [addDays(w, -2)]: true };
  let state = base({ games: { echecs: { daily: before } } });
  state = { ...state, challenges: updateChallenges(state, w) };
  const days = { ...before };
  for (let i = 0; i < 4; i++) days[addDays(w, i)] = true;
  days[addDays(w, 4)] = 'vu'; // pas résolu : ne compte pas
  let c = challengeStatus({ ...state, games: { echecs: { daily: days } } }, addDays(w, 4)).list[2];
  assert.equal(c.label, '4 / 5');
  days[addDays(w, 5)] = true;
  c = challengeStatus({ ...state, games: { echecs: { daily: days } } }, addDays(w, 5)).list[2];
  assert.equal(c.done, true);
});

test('défis : réussi le reste, annoncé une fois, et l’XP suit (+ le bonus des trois)', () => {
  const w = '2026-11-02';
  const before = totalXP(base());
  const one = base({ challenges: { [w]: { base: {}, done: ['seances'] } } });
  assert.equal(totalXP(one) - before, XP.challenge);
  const three = base({ challenges: { [w]: { base: {}, done: ['a', 'b', 'c', 'c'] } } });
  assert.equal(totalXP(three) - before, 3 * XP.challenge + XP.challengeWeek);
  assert.equal(totalXP(base({ challenges: 'cassé' })), before); // données bizarres : rien
  // un défi réussi qu'on ne t'a pas encore annoncé
  const id = weekChallenges(w)[0].id;
  const s = base({ challenges: { [w]: { base: {}, done: [id] } } });
  assert.deepEqual(challengeNews(s, addDays(w, 2)).fresh.map((c) => c.id), [id]);
  s.challenges[w].told = [id];
  assert.deepEqual(challengeNews(s, addDays(w, 2)).fresh, []);
  // déjà réussi : il le reste, même si les données changent
  assert.equal(challengeStatus(s, addDays(w, 2)).list[0].done, true);
  // rien de neuf : rien à enregistrer
  assert.equal(updateChallenges(s, addDays(w, 2)), null);
});

test('défis : la semaine d’avant se termine même si Cap n’a pas été ouvert le dimanche', () => {
  let w = '2026-11-02';
  while (weekChallenges(w)[0].id !== 'mobilite') w = addDays(w, 7);
  const days = { [addDays(w, 5)]: { workouts: ['M'] }, [addDays(w, 6)]: { workouts: ['M'] } };
  const state = base({ days, challenges: { [w]: { base: {} } } });
  const up = updateChallenges(state, addDays(w, 8)); // le mardi d'après
  assert.ok(up[w].done.includes('mobilite'));
});
