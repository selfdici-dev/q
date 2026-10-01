import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  todayKey, addDays, chain, recoveryMode, sprintInfo, bedtimeMinutes, minutesToHHMM,
  sleepDuration, rollingAverage,
} from '../js/logic.js';

const habits = [{ id: 'a' }, { id: 'b' }];
function mk(start, pattern) {
  // pattern : chaîne de '1' (validé) / '0' (raté), un caractère par jour depuis start
  const days = {};
  [...pattern].forEach((c, i) => {
    if (c === '1') days[addDays(start, i)] = { habits: { a: 1, b: 2 } };
  });
  return { settings: { startDate: start }, habits, days };
}

test('la journée bascule à 4 h', () => {
  assert.equal(todayKey(new Date(2026, 9, 2, 1, 30)), '2026-10-01');
  assert.equal(todayKey(new Date(2026, 9, 2, 4, 1)), '2026-10-02');
});

test('chaîne : un raté isolé ne casse pas, deux ratés oui', () => {
  const s = '2026-10-01';
  assert.equal(chain(mk(s, '1111'), addDays(s, 3)).count, 4);
  const one = chain(mk(s, '11011'), addDays(s, 4));
  assert.deepEqual(one, { count: 4, jokers: 1 });
  assert.equal(chain(mk(s, '110011'), addDays(s, 5)).count, 2);
});

test("chaîne : aujourd'hui non validé est en cours, pas un raté", () => {
  const s = '2026-10-01';
  assert.equal(chain(mk(s, '1110'), addDays(s, 3)).count, 3);
  // hier raté, aujourd'hui en cours : la chaîne tient encore
  assert.equal(chain(mk(s, '11100'), addDays(s, 4)).count, 3);
});

test('mode reprise', () => {
  const s = '2026-10-01';
  assert.equal(recoveryMode(mk(s, '10'), addDays(s, 1)).active, false);
  assert.equal(recoveryMode(mk(s, '100'), addDays(s, 2)).active, true);
  assert.equal(recoveryMode(mk(s, '1000'), addDays(s, 3)).twoMissed, true);
  assert.equal(recoveryMode(mk(s, '1001'), addDays(s, 3)).active, false);
  assert.equal(recoveryMode(mk(s, '0'), s).active, false);
});

test('sprints de 7 jours, réussis à 5/7', () => {
  const s = '2026-10-01';
  const info = sprintInfo(mk(s, '1101101' + '11'), addDays(s, 8));
  assert.equal(info.index, 1);
  assert.equal(info.sprints[0].valid, 5);
  assert.equal(info.sprints[0].passed, true);
  assert.equal(info.sprints[0].finished, true);
  assert.equal(info.current.number, 2);
  assert.equal(info.sprints.length, 12);
});

test('heures de coucher après minuit', () => {
  assert.ok(bedtimeMinutes('01:30') > bedtimeMinutes('23:30'));
  assert.equal(minutesToHHMM(bedtimeMinutes('01:30')), '01:30');
  assert.equal(minutesToHHMM((bedtimeMinutes('23:00') + bedtimeMinutes('01:00')) / 2), '00:00');
  assert.equal(sleepDuration('01:00', '09:15'), 495);
  assert.equal(sleepDuration('23:00', '07:00'), 480);
});

test('moyenne glissante 7 jours', () => {
  const pts = [
    { key: '2026-10-01', value: 75 },
    { key: '2026-10-02', value: 74 },
    { key: '2026-10-09', value: 73 },
  ];
  const r = rollingAverage(pts);
  assert.equal(r[1].value, 74.5);
  assert.equal(r[2].value, 73);
});

test('une seule reprise par fenêtre de 7 jours', () => {
  const s = '2026-10-01';
  // ratés aux jours 2 et 4 : la 2e reprise est refusée
  assert.equal(chain(mk(s, '1101011'), addDays(s, 6)).count, 2);
  // ratés aux jours 1 et 8 : deux reprises espacées de 7 jours, acceptées
  assert.deepEqual(chain(mk(s, '1011111101'), addDays(s, 9)), { count: 8, jokers: 2 });
  const r = recoveryMode(mk(s, '110100'), addDays(s, 5));
  assert.equal(r.active, true);
  assert.equal(r.jokerUsed, true);
});

test("modifier les habitudes ne réécrit pas l'historique", () => {
  const s = '2026-10-01';
  const st = { settings: { startDate: s }, habits: [{ id: 'a' }], days: {} };
  st.days[s] = { ids: ['a'], habits: { a: 1 } };
  st.habits.push({ id: 'b' });
  assert.equal(chain(st, addDays(s, 1)).count, 1);
});

test('niveaux : 0, 100, 300, 600 XP', async () => {
  const { levelInfo } = await import('../js/logic.js');
  assert.equal(levelInfo(0).level, 1);
  assert.equal(levelInfo(99).level, 1);
  assert.equal(levelInfo(100).level, 2);
  assert.equal(levelInfo(300).level, 3);
  assert.deepEqual([levelInfo(350).into, levelInfo(350).span], [50, 300]);
});

test('XP recalculée depuis les données', async () => {
  const { totalXP } = await import('../js/logic.js');
  const s = '2026-10-01';
  const st = mk(s, '1');
  st.days[s].workouts = ['A'];
  st.lessons = { precaution: { perfect: true } };
  st.trades = [{ entry: 10, stop: 9, exit: 12, qty: 1 }, { entry: 10, stop: 9, qty: 1 }];
  // habitudes 10 + 20, jour validé 20, séance 30, leçon 40 + 20, trade clôturé 15
  assert.equal(totalXP(st), 155);
});

test('intérêts composés, taille de position, statistiques de trades', async () => {
  const { compound, positionSize, tradeStats } = await import('../js/logic.js');
  assert.equal(Math.round(compound(100, 7, 10).value), 17308);
  assert.equal(compound(100, 0, 1).value, 1200);
  assert.equal(positionSize(1000, 1, 50, 45).shares, 2);
  const st = tradeStats([
    { side: 'long', entry: 100, stop: 90, exit: 120, qty: 1, followed: true },
    { side: 'long', entry: 100, stop: 90, exit: 90, qty: 1, followed: true },
    { side: 'short', entry: 50, stop: 55, exit: 45, qty: 2, followed: false },
    { side: 'long', entry: 10, stop: 9, qty: 1 },
  ]);
  assert.equal(st.count, 3);
  assert.equal(st.open, 1);
  assert.equal(st.expectancy, (2 - 1 + 1) / 3);
  assert.equal(st.pnl, 20 - 10 + 10);
});
