import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  todayKey, addDays, chain, recoveryMode, sprintInfo, bedtimeMinutes, minutesToHHMM,
  sleepDuration, rollingAverage, nextAction, retireHabits, dayStatus, recordWall,
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

test('réveil progressif : 30 min plus tôt tous les 3 jours, de 10 h à 8 h 30, coucher 8 h avant', async () => {
  const { wakePlan, bedGoal, clockFr } = await import('../js/logic.js');
  assert.equal(wakePlan(null, '2026-11-01'), null);
  // lancé le 31 : le 1er réveil visé est le 1er novembre ; ce soir, au lit avant 2 h
  let p = wakePlan('2026-11-01', '2026-10-31');
  assert.deepEqual([p.day, p.wake, p.nextWake, p.bed, p.stage], [0, null, '10:00', '02:00', 0]);
  assert.deepEqual(p.steps, ['10:00', '09:30', '09:00', '08:30']);
  // jours 1 à 3 : 10 h ; le soir du jour 3, le coucher suit le réveil du jour 4 (9 h 30)
  const at = (n) => wakePlan('2026-11-01', addDays('2026-11-01', n - 1));
  assert.deepEqual([at(1).wake, at(1).bed, at(3).wake, at(3).nextWake, at(3).bed], ['10:00', '02:00', '10:00', '09:30', '01:30']);
  assert.deepEqual([4, 7, 10, 40].map((n) => at(n).wake), ['09:30', '09:00', '08:30', '08:30']);
  assert.equal(at(9).bed, '00:30');
  assert.equal(at(1).goalBed, '00:30');
  assert.deepEqual([at(8).reached, at(9).reached, at(9).stage], [false, true, 3]);
  // une autre cible : pas de 30 min puis la cible ; une cible plus tardive que 10 h reste fixe
  assert.deepEqual(wakePlan('2026-11-01', '2026-11-01', '08:45').steps, ['10:00', '09:30', '09:00', '08:45']);
  assert.deepEqual(wakePlan('2026-11-01', '2026-11-01', '07:30').steps.length, 6);
  assert.equal(wakePlan('2026-11-01', '2026-11-01', '07:30').bed, '02:00');
  assert.equal(wakePlan('2026-11-01', '2026-11-20', '07:30').bed, '23:30');
  assert.deepEqual(wakePlan('2026-11-01', '2026-11-05', '10:30').steps, ['10:30']);
  // le coucher visé suit le plan s'il est lancé, sinon le programme de 12 semaines
  const state = { settings: { startDate: '2026-10-01', bedtimeTarget: '23:30', wakePlanStart: null, wakeTarget: '08:30' } };
  assert.equal(bedGoal(state, '2026-10-01'), '01:15');
  state.settings.wakePlanStart = '2026-10-02';
  assert.equal(bedGoal(state, '2026-10-01'), '02:00');
  assert.deepEqual(['10:00', '09:30', '00:30', '02:00', '00:00'].map(clockFr), ['10\u00a0h', '9\u00a0h\u00a030', '0\u00a0h\u00a030', '2\u00a0h', 'minuit']);
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

test('calendrier de régularité', async () => {
  const { regularityGrid } = await import('../js/logic.js');
  const s = '2026-10-01';
  const st = mk(s, '1101111');
  st.days[s].habits = { a: 2, b: 2 }; // jour 1 en complet
  st.days[addDays(s, 1)].workouts = ['B'];
  st.days[addDays(s, 4)].workouts = ['M'];
  const g = regularityGrid(st, addDays(s, 8));
  assert.equal(g.weeks.length, 12);
  assert.deepEqual(g.weeks[0].days.map((d) => d.level), ['full', 'min', 'miss', 'min', 'min', 'min', 'min']);
  assert.deepEqual([g.weeks[0].passed, g.weeks[0].finished], [true, true]);
  assert.deepEqual(g.weeks[1].days.slice(0, 3).map((d) => d.level), ['miss', 'now', 'future']);
  assert.equal(g.weeks[1].days[1].today, true);
  assert.deepEqual(g.weeks[0].days.map((d) => d.sport), [false, true, false, false, false, false, false]);
  // 6 validés sur 8 jours écoulés (aujourd'hui en cours ne compte pas), meilleure série 4
  assert.deepEqual([g.valid, g.full, g.elapsed, g.best], [6, 1, 8, 4]);
  // au-delà de 12 semaines, la grille s'allonge
  assert.equal(regularityGrid(st, addDays(s, 7 * 12 + 1)).weeks.length, 13);
});

test('étagères de livres : ordre, filtres, compteurs', async () => {
  const { bookShelves } = await import('../js/logic.js');
  const books = [
    { id: 'a', cat: 'Philo' }, { id: 'b', cat: 'Philo', start: true }, { id: 'c', cat: 'Philo' },
    { id: 'd', cat: 'Finance' }, { id: 'e', cat: 'Finance' },
  ];
  const st = { a: { status: 'done' }, c: { status: 'reading' }, e: { status: 'done' } };
  const all = bookShelves(books, st);
  assert.deepEqual(all.counts, { all: 5, todo: 2, reading: 1, done: 2 });
  assert.deepEqual(all.shelves.map((s) => s.cat), ['Philo', 'Finance']);
  assert.deepEqual(all.shelves[0].items.map((b) => b.id), ['c', 'b', 'a']); // en cours, ⭐, lu
  assert.deepEqual([all.shelves[0].done, all.shelves[0].total], [1, 3]);
  assert.deepEqual(all.reading.map((b) => b.id), ['c']);
  const done = bookShelves(books, st, 'done');
  assert.deepEqual(done.shelves.map((s) => s.items.map((b) => b.id)), [['a'], ['e']]);
  assert.deepEqual(bookShelves(books, st, 'reading').shelves.map((s) => s.cat), ['Philo']); // étagère vide masquée
  assert.equal(bookShelves(books).counts.todo, 5);
});

test('« Maintenant » : la première chose pas faite, le coucher passe devant le soir', () => {
  const plan = (doneIds = []) => ['seance', 'focus', 'coucher'].map((id) => ({ id, done: doneIds.includes(id) }));
  assert.equal(nextAction(plan(), '10:00', '23:00').id, 'seance');
  assert.equal(nextAction(plan(['seance']), '10:00', '23:00').id, 'focus');
  assert.equal(nextAction(plan(['seance', 'focus', 'coucher']), '10:00', '23:00'), null);
  // dans l'heure avant le coucher, et jusqu'à 3 h après
  assert.equal(nextAction(plan(), '22:15', '23:00').id, 'coucher');
  assert.equal(nextAction(plan(), '01:30', '23:00').id, 'coucher');
  assert.equal(nextAction(plan(), '21:30', '23:00').id, 'seance');
  assert.equal(nextAction(plan(), '08:00', '23:00').id, 'seance');
  // coucher visé après minuit
  assert.equal(nextAction(plan(), '00:30', '01:00').id, 'coucher');
  assert.equal(nextAction(plan(), '23:00', '01:00').id, 'seance');
  // téléphone déjà posé : on revient à l'ordre du plan
  assert.equal(nextAction(plan(['coucher']), '22:30', '23:00').id, 'seance');
  // jamais au-delà du changement de jour (4 h) : c'est déjà le plan du lendemain
  assert.equal(nextAction(plan(), '03:50', '01:15').id, 'coucher');
  assert.equal(nextAction(plan(), '04:05', '01:15').id, 'seance');
});

test('habitudes retirées : téléphone et focus enlevés une seule fois, historique intact', () => {
  const habits = ['sommeil', 'sport', 'focus', 'apprendre', 'manger'].map((id) => ({ id }));
  const all = { sommeil: 1, sport: 1, focus: 1, apprendre: 1, manger: 1 };
  const st = {
    settings: {},
    habits,
    days: {
      '2026-10-05': { habits: { ...all } }, // jour passé sans liste figée
      '2026-10-06': { habits: { sport: 1, apprendre: 1, manger: 1 }, ids: habits.map((h) => h.id) },
      '2026-10-07': { habits: { sport: 1, apprendre: 1, manger: 1 }, ids: habits.map((h) => h.id) },
    },
  };
  assert.equal(retireHabits(st, '2026-10-07'), true);
  assert.deepEqual(st.habits.map((h) => h.id), ['sport', 'apprendre', 'manger']);
  // les jours passés gardent leur liste : rien ne change pour la chaîne
  assert.equal(dayStatus(st, '2026-10-05').valid, true);
  assert.equal(dayStatus(st, '2026-10-06').valid, false);
  // aujourd'hui suit la nouvelle liste : physique, apprentissage, grignotage suffisent
  assert.equal(dayStatus(st, '2026-10-07').valid, true);
  // une seule fois : une habitude rajoutée ensuite n'est plus touchée
  st.habits.push({ id: 'focus' });
  assert.equal(retireHabits(st, '2026-10-07'), false);
  assert.equal(st.habits.length, 4);
});

test('calories d’une séance : MET × 3,5 × kg / 200 par minute, arrondi à 5', async () => {
  const { sessionKcal, lastValue, DEFAULT_WEIGHT } = await import('../js/logic.js');
  // 10 min d'effort à 6 MET pour 70 kg : 6 × 3,5 × 70 / 200 × 10 = 73,5 → 75
  assert.equal(sessionKcal([{ kind: 'work', secs: 600 }], 6, 70), 75);
  // les pauses comptent moins que l'effort, et un poids plus lourd brûle plus
  const steps = [{ kind: 'prep', secs: 10 }, { kind: 'work', secs: 300 }, { kind: 'rest', secs: 300 }];
  assert.ok(sessionKcal(steps, 6, 70) < sessionKcal([{ kind: 'work', secs: 600 }], 6, 70));
  assert.ok(sessionKcal(steps, 6, 90) > sessionKcal(steps, 6, 60));
  assert.equal(sessionKcal(steps, 6), sessionKcal(steps, 6, DEFAULT_WEIGHT));
  // dernier poids noté, en ignorant les jours vides
  const st = { days: { '2026-01-01': { weight: 71.5 }, '2026-01-03': { weight: '' }, '2026-01-02': { weight: '70.2' } } };
  assert.equal(lastValue(st, 'weight'), 70.2);
  assert.equal(lastValue({ days: {} }, 'weight'), null);
});

test('protéines en grammes : les anciennes portions valent 25 g, les grammes priment', async () => {
  const { proteinGrams } = await import('../js/logic.js');
  assert.equal(proteinGrams(undefined), 0);
  assert.equal(proteinGrams({}), 0);
  assert.equal(proteinGrams({ protein: 3 }), 75);
  assert.equal(proteinGrams({ protein: 3, proteinG: 48 }), 48);
  assert.equal(proteinGrams({ proteinG: 0, protein: 2 }), 0);
});

test('objectifs qui montent : objectif lu dans la consigne, record + 1, pas pour les tenues', async () => {
  const { goalOf, nextTarget, logRecord, recordKey } = await import('../js/logic.js');
  const { WORKOUTS } = await import('../js/data.js');
  assert.deepEqual(goalOf('Objectif : 10 à 13 pompes. 1. Parallettes…'), { min: 10, max: 13, unit: 'pompes' });
  assert.deepEqual(goalOf('Objectif : 6 à 10. 1. Fesses en l’air'), { min: 6, max: 10, unit: 'répétitions' });
  assert.deepEqual(goalOf('Objectif : 20 touches (10 par côté), lentes.'), { min: 20, max: 20, unit: 'touches' });
  assert.equal(goalOf('Objectif : 4 tenues de 6 s. 1. Planche'), null);
  assert.equal(goalOf('Objectif : 1 seule tenue jusqu’au bip.'), null);
  assert.equal(goalOf('Sur le dos, genoux pliés.'), null);
  // Sans record : l'objectif de départ ; avec : record + 1
  const g = goalOf('Objectif : 10 à 13 pompes.');
  assert.deepEqual(nextTarget(g, undefined), { target: 10, best: null });
  let rec = logRecord({}, recordKey('Pompes (sur parallettes)', 1), 12, '2026-10-15');
  assert.deepEqual(rec, { 'Pompes (sur parallettes)#1': { best: 12, last: 12, date: '2026-10-15' } });
  assert.deepEqual(nextTarget(g, rec['Pompes (sur parallettes)#1']), { target: 13, best: 12 });
  // Une moins bonne série garde le record
  rec = logRecord(rec, 'Pompes (sur parallettes)#1', 9, '2026-10-17');
  assert.deepEqual(rec['Pompes (sur parallettes)#1'], { best: 12, last: 9, date: '2026-10-17' });
  assert.equal(nextTarget(null, rec['x']), null);
  // Les exercices en répétitions de B ont un objectif lisible
  for (const e of WORKOUTS.find((w) => w.id === 'B').exercises.filter((x) => !/Planche|L-sit/.test(x.name))) assert.ok(goalOf(e.cue), e.name);
});

test('coach vocal : une phrase courte par étape, avec le record quand il existe', async () => {
  const { spokenStep } = await import('../js/logic.js');
  const work = { kind: 'work', name: 'Roue abdominale à genoux (1/2)', cue: 'Objectif : 8 allers-retours. 1. À genoux…' };
  assert.equal(spokenStep(work), 'Roue abdominale à genoux. Objectif : 8 allers-retours.');
  assert.equal(spokenStep(work, null, { target: 10, best: 9 }), 'Roue abdominale à genoux. Vise 10, ton record est 9.');
  assert.equal(spokenStep({ kind: 'work', name: 'Pompes (sur parallettes)', cue: 'Objectif : 20 touches (10 par côté), lentes.' }), 'Pompes sur parallettes. Objectif : 20 touches 10 par côté, lentes.');
  assert.equal(spokenStep({ kind: 'work', name: 'Planche penchée', cue: 'Tiens bien.' }), 'Planche penchée.');
  assert.equal(spokenStep({ kind: 'rest', name: 'Récupère' }, { name: 'Pompes pike' }), 'Repos. Ensuite : Pompes pike.');
  assert.equal(spokenStep({ kind: 'rest', name: 'Fin du tour' }, { name: 'Crunch vélo' }), 'Fin du tour. Ensuite : Crunch vélo.');
  assert.equal(spokenStep({ kind: 'prep', name: 'Prépare-toi' }, { name: 'Rotations des épaules et des bras' }), 'Prépare-toi. On commence par Rotations des épaules et des bras.');
  assert.equal(spokenStep(undefined), '');
});

test('objectifs : en haut de la fourchette, passer à la version plus dure ; record à zéro par exercice', async () => {
  const { nextTarget, dropRecords, spokenStep } = await import('../js/logic.js');
  assert.deepEqual(nextTarget({ min: 10, max: 13 }, { best: 13 }), { target: 13, best: 13, harder: true });
  assert.deepEqual(nextTarget({ min: 10, max: 13 }, { best: 12 }), { target: 13, best: 12 });
  assert.deepEqual(nextTarget({ min: 8, max: 8 }, { best: 9 }), { target: 10, best: 9 });
  const rec = { 'Pompes (sur parallettes)#1': { best: 13 }, 'Pompes (sur parallettes)#2': { best: 11 }, 'Pompes pike#1': { best: 7 } };
  assert.deepEqual(dropRecords(rec, 'Pompes (sur parallettes)'), { 'Pompes pike#1': { best: 7 } });
  assert.deepEqual(dropRecords(undefined, 'x'), {});
  assert.equal(spokenStep({ kind: 'work', name: 'Pompes (sur parallettes)', cue: 'Objectif : 10 à 13 pompes.' }, null, { target: 13, best: 13, harder: true }), 'Pompes sur parallettes. Passe à la version plus dure.');
});

test('créatine : jours cochés sur les 7 derniers, aujourd’hui compris', async () => {
  const { creatineWeek } = await import('../js/logic.js');
  const st = { days: {
    '2026-10-20': { creatine: true },
    '2026-10-18': { creatine: true },
    '2026-10-14': { creatine: true }, // 7e jour en arrière : compte
    '2026-10-13': { creatine: true }, // 8e jour : ne compte plus
    '2026-10-19': { creatine: false },
    '2026-10-17': { creatine: 'oui' }, // seul « true » compte
  } };
  assert.equal(creatineWeek(st, '2026-10-20'), 3);
  assert.equal(creatineWeek({ days: {} }, '2026-10-20'), 0);
});

test('mur des records : le meilleur de chaque exercice, tous tours confondus, le plus récent d’abord', () => {
  const records = {
    'Pompes (sur parallettes)#1': { best: 12, last: 11, date: '2026-10-20' },
    'Pompes (sur parallettes)#2': { best: 10, last: 10, date: '2026-10-26' },
    'Roue abdominale à genoux (1/2)#1': { best: 9, last: 9, date: '2026-10-10' },
    'Roue abdominale à genoux (2/2)#2': { best: 11, last: 6, date: '2026-10-12' },
    'Crunch vélo#1': { best: 0, last: 0, date: '2026-10-27' },
    'Exercice disparu#1': { best: 30, last: 30, date: '2026-10-27' },
  };
  const exercises = [
    { label: 'Pompes', names: ['Pompes (sur parallettes)'], unit: 'pompes', workout: 'B' },
    { label: 'Roue abdominale à genoux', names: ['Roue abdominale à genoux (1/2)', 'Roue abdominale à genoux (2/2)'], unit: 'allers-retours', workout: 'A' },
    { label: 'Crunch vélo', names: ['Crunch vélo'], unit: 'touches', workout: 'A' },
  ];
  const wall = recordWall(records, exercises);
  // un record à 0 ne compte pas ; un exercice retiré du programme non plus ;
  // les deux passages de la roue comptent ensemble
  assert.deepEqual(wall.map((r) => [r.label, r.best, r.date, r.workout]), [
    ['Pompes', 12, '2026-10-26', 'B'],
    ['Roue abdominale à genoux', 11, '2026-10-12', 'A'],
  ]);
  assert.equal(wall[0].unit, 'pompes');
  assert.equal(recordWall(records, exercises, 1).length, 1);
  assert.deepEqual(recordWall({}, exercises), []);
  assert.deepEqual(recordWall(undefined, exercises), []);
});

test('record battu : de combien, retenu pour la plaque neuve, au mur pendant 3 jours', async () => {
  const { beatBy, logRecord, FRESH_DAYS } = await import('../js/logic.js');
  // première note : rien à battre ; égal ou moins bien : pas de record
  assert.equal(beatBy(undefined, 12), null);
  assert.equal(beatBy({ best: 12 }, 12), null);
  assert.equal(beatBy({ best: 12 }, 9), null);
  assert.equal(beatBy({ best: 12 }, 15), 3);
  let rec = logRecord({}, 'Crunch vélo#1', 18, '2026-10-20');
  assert.equal(rec['Crunch vélo#1'].beatenOn, undefined); // la première note n'est pas un record battu
  rec = logRecord(rec, 'Crunch vélo#1', 21, '2026-10-27');
  assert.deepEqual(rec['Crunch vélo#1'], { best: 21, last: 21, date: '2026-10-27', beatenOn: '2026-10-27', beatenFrom: 18 });
  // une moins bonne série garde le jour du record et l'ancien chiffre
  rec = logRecord(rec, 'Crunch vélo#1', 19, '2026-10-28');
  assert.deepEqual(rec['Crunch vélo#1'], { best: 21, last: 19, date: '2026-10-28', beatenOn: '2026-10-27', beatenFrom: 18 });
  const ex = [{ label: 'Crunch vélo', names: ['Crunch vélo'], unit: 'touches', workout: 'A' }];
  const at = (today) => recordWall(rec, ex, 6, today)[0];
  assert.deepEqual([at('2026-10-27').fresh, at('2026-10-27').gain], [true, 3]);
  assert.equal(FRESH_DAYS, 2);
  assert.equal(at('2026-10-29').fresh, true); // avant-hier : encore neuve
  assert.deepEqual([at('2026-10-30').fresh, at('2026-10-30').gain], [false, 0]); // ensuite : une plaque comme les autres
  assert.equal(at('2026-10-26').fresh, false); // date du téléphone en arrière : rien de neuf
  assert.equal(recordWall(rec, ex)[0].fresh, false); // sans date du jour : rien de neuf
  // tous tours confondus : un record du tour 2 battu sous le chiffre du tour 1 ne change pas le mur
  const pex = [{ label: 'Pompes', names: ['Pompes (sur parallettes)'], unit: 'pompes', workout: 'B' }];
  let two = logRecord({ 'Pompes (sur parallettes)#1': { best: 20, last: 20, date: '2026-10-20' } }, 'Pompes (sur parallettes)#2', 14, '2026-10-21');
  two = logRecord(two, 'Pompes (sur parallettes)#2', 17, '2026-10-27');
  const wall = (today) => recordWall(two, pex, 6, today)[0];
  assert.deepEqual([wall('2026-10-27').best, wall('2026-10-27').fresh], [20, false]);
  // … et s'il passe au-dessus, le gain se compte depuis l'ancien chiffre du mur (20, pas 17)
  two = logRecord(two, 'Pompes (sur parallettes)#2', 22, '2026-10-28');
  assert.deepEqual([wall('2026-10-28').best, wall('2026-10-28').fresh, wall('2026-10-28').gain], [22, true, 2]);
});

test('« combien de touches ? », « combien d’allers-retours ? »', async () => {
  const { combien } = await import('../js/logic.js');
  assert.equal(combien('touches'), 'combien de touches');
  assert.equal(combien('pompes'), 'combien de pompes');
  assert.equal(combien('allers-retours'), 'combien d’allers-retours');
  assert.equal(combien('esquives'), 'combien d’esquives');
});
