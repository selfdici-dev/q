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

test('coucher cible par semaine', async () => {
  const { weeklyBedtime } = await import('../js/logic.js');
  assert.equal(weeklyBedtime(1), '01:15');
  assert.equal(weeklyBedtime(4), '00:30');
  assert.equal(weeklyBedtime(8), '23:30');
  assert.equal(weeklyBedtime(12), '23:30');
});

test('ratio gain/risque, courbe en R, pertes du jour, répartition', async () => {
  const { rewardRisk, equityCurve, lossesToday, allocation } = await import('../js/logic.js');
  assert.equal(rewardRisk({ entry: 100, stop: 95, target: 110 }), 2);
  const trades = [
    { entry: 10, stop: 9, exit: 12, closed: '2026-10-01T10:00' },
    { entry: 10, stop: 9, exit: 9, closed: '2026-10-02T10:00' },
    { entry: 10, stop: 9, exit: 8.5, closed: '2026-10-02T11:00' },
  ];
  assert.deepEqual(equityCurve(trades), [2, 1, -0.5]);
  assert.equal(lossesToday(trades, '2026-10-02'), 2);
  const a = allocation([{ amount: 750 }, { amount: 250 }]);
  assert.equal(a.total, 1000);
  assert.equal(a.parts[0].pct, 75);
});

test('révision espacée', async () => {
  const { reviewCard, dueCards } = await import('../js/logic.js');
  let c = { id: 'x' };
  c = reviewCard(c, true, '2026-10-01');
  assert.deepEqual([c.box, c.due], [1, '2026-10-02']);
  c = reviewCard(c, true, '2026-10-02');
  assert.deepEqual([c.box, c.due], [2, '2026-10-05']);
  c = reviewCard(c, false, '2026-10-05');
  assert.deepEqual([c.box, c.due], [0, '2026-10-05']);
  assert.equal(dueCards([c, { id: 'y', due: '2026-10-09' }, { id: 'z' }], '2026-10-05').length, 2);
});

test('semaines de sport tenues', async () => {
  const { sportWeeks } = await import('../js/logic.js');
  // 2026-09-21 et 2026-09-28 sont des lundis
  const st = { settings: { startDate: '2026-09-21' }, days: {} };
  for (const k of ['2026-09-21', '2026-09-22', '2026-09-24', '2026-09-26']) st.days[k] = { workouts: ['A'] };
  st.days['2026-09-27'] = { workouts: ['M'] };
  for (const k of ['2026-09-28', '2026-09-29']) st.days[k] = { workouts: ['B', 'M'] };
  const r = sportWeeks(st, '2026-09-30');
  assert.deepEqual(r, { thisWeek: 2, goal: 4, streak: 1 });
});

test('message du jour sous la chaîne', async () => {
  const { todayNotice } = await import('../js/logic.js');
  const s = '2026-10-01';
  const full = (st, k) => { st.days[k] = { habits: { a: 2, b: 2 } }; return st; };
  assert.equal(todayNotice(mk(s, '1'), s), 'valid');
  assert.equal(todayNotice(full(mk(s, ''), s), s), 'full');
  assert.equal(todayNotice(mk(s, '10'), addDays(s, 1)), null);
  assert.equal(todayNotice(mk(s, '100'), addDays(s, 2)), 'recovery');
  assert.equal(todayNotice(mk(s, '1000'), addDays(s, 3)), 'twoMissed');
  assert.equal(todayNotice(mk(s, '110100'), addDays(s, 5)), 'restart');
  // 3e jour du sprint : jour minimum prévu, sauf s'il est déjà validé
  assert.equal(todayNotice(mk(s, '11'), addDays(s, 2)), 'minimumDay');
  assert.equal(todayNotice(mk(s, '111'), addDays(s, 2)), 'valid');
  // la reprise passe avant le jour minimum
  assert.equal(todayNotice(mk(s, '10'), addDays(s, 2)), 'recovery');
});

test('animations : seulement ce qui vient de changer', async () => {
  const { increased, previous } = await import('../js/logic.js');
  const memo = new Map();
  assert.equal(increased(memo, 'h', 0), false); // premier affichage : pas d'animation
  assert.equal(increased(memo, 'h', 0), false);
  assert.equal(increased(memo, 'h', 1), true); // coché à l'instant
  assert.equal(increased(memo, 'h', 1), false); // nouvel affichage : on ne rejoue pas
  assert.equal(increased(memo, 'h', 0), false); // décoché : pas de fête
  const bars = new Map();
  assert.equal(previous(bars, 'ring', 0.4, 0), 0); // à l'ouverture, l'anneau part de 0
  assert.equal(previous(bars, 'ring', 0.6, 0), 0.4);
  assert.equal(previous(bars, 'ring', 0.6, 0), 0.6);
  assert.equal(previous(bars, 'x', 5), 5);
});

test('déclencheurs de grignotage sur 14 jours', async () => {
  const { snackTriggers } = await import('../js/logic.js');
  const st = { days: {
    '2026-10-14': { snacks: [{ trigger: 'Ennui' }, { trigger: 'Stress' }] },
    '2026-10-10': { snacks: [{ trigger: 'Ennui' }] },
    '2026-09-30': { snacks: [{ trigger: 'Faim' }] }, // il y a 14 jours : hors fenêtre
  } };
  assert.deepEqual(snackTriggers(st, '2026-10-14'), [['Ennui', 2], ['Stress', 1]]);
  assert.deepEqual(snackTriggers(st, '2026-10-14', 15).at(-1), ['Faim', 1]);
});
