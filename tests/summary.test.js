import { test } from 'node:test';
import assert from 'node:assert/strict';
import { daySummary, weekSummary } from '../js/summary.js';

// 2026-10-01 est un jeudi (séance A prévue).
const S = '2026-10-01';
const base = () => ({
  settings: { startDate: S, bedtimeTarget: '23:30' },
  habits: [{ id: 'a', name: 'Lire' }, { id: 'b', name: 'Bouger' }],
  days: {},
  reviews: {},
});

test('bilan du jour : habitudes, séance, focus, protéines, grignotages, coucher, poids', () => {
  const st = base();
  st.days[S] = {
    habits: { a: 2 }, workouts: ['B'], focus: 2, protein: 3,
    snacks: [{ time: '16:10', trigger: 'Ennui' }], snackResisted: 1,
    weight: 74.2, bed: '01:10', wake: '08:30',
  };
  const lines = daySummary(st, S).split('\n');
  assert.equal(lines[0], 'Mon bilan Cap du jeudi 1 octobre');
  assert.equal(lines[1], 'Chaîne : 0 jour · journée pas encore validée');
  assert.equal(lines[2], 'Habitudes : 1/2 (1 en complet) · manque : Bouger');
  assert.ok(lines[3].startsWith('Séance : faite ✓ (B'));
  assert.ok(lines.includes('Focus : 2 sessions de 25 min'));
  assert.ok(lines.includes('Protéines : 3/4 portions'));
  assert.ok(lines.includes('Grignotages : 1 (16:10 Ennui) · 1 envie résistée'));
  assert.ok(lines.includes('Coucher visé ce soir : 01:15'));
  assert.ok(lines.includes('Nuit dernière : couché à 01:10, levé à 08:30 (7 h 20 de sommeil)'));
  assert.equal(lines.at(-1), 'Poids : 74,2 kg');
});

test('bilan du jour vide : rien d’inventé, poids absent', () => {
  const text = daySummary(base(), S);
  assert.match(text, /Habitudes : 0\/2 · manque : Lire, Bouger/);
  assert.match(text, /Séance : pas faite \(prévue : A/);
  assert.match(text, /Focus : aucune session/);
  assert.match(text, /Grignotages : aucun/);
  assert.doesNotMatch(text, /Poids|Nuit dernière/);
});

test('bilan du jour : mobilité seule un jour de séance, journée validée', () => {
  const st = base();
  st.days[S] = { habits: { a: 1, b: 1 }, workouts: ['M'] };
  const text = daySummary(st, S);
  assert.match(text, /Chaîne : 1 jour · journée validée/);
  assert.match(text, /Séance : mobilité seulement \(prévue : A/);
});

test('bilan de la semaine : sprint terminé, moyennes et réponses du bilan', () => {
  const st = base();
  for (let i = 0; i < 5; i++) {
    const k = `2026-10-0${i + 1}`;
    st.days[k] = { habits: { a: 1, b: 1 } };
  }
  Object.assign(st.days['2026-10-01'], { workouts: ['A'], protein: 4, focus: 2, bed: '23:30', weight: 75, snacks: [{ time: '16:00', trigger: 'Ennui' }] });
  Object.assign(st.days['2026-10-02'], { workouts: ['B', 'M'], protein: 2, focus: 1, bed: '00:30', wake: '08:30', weight: 74.5, snacks: [{ time: '22:00', trigger: 'Ennui' }, { time: '23:00', trigger: 'Stress' }], snackResisted: 2 });
  st.days['2026-10-04'].workouts = ['M'];
  st.days['2026-10-05'].weight = 74;
  st.reviews[1] = { win: 'Le sport le matin', change: 'Coucher plus tôt ' };
  const lines = weekSummary(st, S, '2026-10-08').split('\n');
  assert.equal(lines[0], 'Mon bilan Cap · sprint 1/12, du jeu. 1 oct. au mer. 7 oct.');
  assert.equal(lines[1], 'Jours validés : 5/7 · sprint réussi ✓');
  assert.equal(lines[2], 'Habitudes : Lire 5/7 · Bouger 5/7');
  assert.equal(lines[3], 'Séances : 2 sur 6 prévues (A, B) + 2 mobilité');
  assert.equal(lines[4], 'Focus : 3 sessions de 25 min');
  assert.equal(lines[5], 'Protéines : 0,9 portion/jour en moyenne · objectif (4) atteint 1 jour sur 7');
  assert.equal(lines[6], 'Grignotages : 3 · déclencheur n° 1 : Ennui (2 fois) · 2 envies résistées');
  assert.equal(lines[7], 'Coucher : visé 01:15 · réel en moyenne 00:00 (2 nuits notées) · sommeil moyen 8 h 00');
  assert.equal(lines[8], 'Poids : 75 → 74 kg (moyenne 74,5, 3 pesées)');
  assert.equal(lines[9], 'Ce qui a marché : Le sport le matin');
  assert.equal(lines[10], 'Ce que je change : Coucher plus tôt');
});

test('bilan de la semaine en cours : seuls les jours écoulés comptent', () => {
  const st = base();
  st.days[S] = { habits: { a: 1, b: 1 } };
  const text = weekSummary(st, S, '2026-10-03');
  assert.match(text, /Jours validés : 1\/3 · en cours \(jour 3\/7\)/);
  assert.match(text, /Habitudes : Lire 1\/3 · Bouger 1\/3/);
  assert.match(text, /Grignotages : aucun/);
  assert.doesNotMatch(text, /Poids/);
});
