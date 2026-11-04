import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DAILY, KINDS, dailyFor, dailyStreak } from '../js/chess-daily.js';
import { fromFen, legalMoves, san, analyse, matingMoves, evaluate } from '../js/chess.js';

const bare = (s) => s.replace(/[+#]$/, '');
const sanOf = (pos, m) => bare(san(pos, m));

test('problème du jour : chaque problème a une seule solution, vérifiée par le moteur', () => {
  assert.ok(DAILY.length >= 120, `${DAILY.length} problèmes seulement`);
  assert.equal(new Set(DAILY.map((p) => p.fen.split(' ').slice(0, 2).join(' '))).size, DAILY.length, 'positions en double');
  const kinds = new Set(DAILY.map((p) => p.kind));
  for (const k of ['mate1', 'mate2', 'gain']) assert.ok(kinds.has(k), k);
  for (const p of DAILY) {
    assert.ok(KINDS[p.kind], p.kind);
    const pos = fromFen(p.fen);
    const moves = legalMoves(pos);
    assert.ok(moves.some((m) => sanOf(pos, m) === bare(p.answer)), `${p.fen} : ${p.answer} n’est pas jouable`);
    assert.ok(Math.abs(evaluate(pos)) <= 1500, `${p.fen} : déjà gagné d’avance`);
    if (p.kind === 'mate1') {
      const mates = matingMoves(pos, 1);
      assert.deepEqual(mates.map((m) => sanOf(pos, m)), [bare(p.answer)], `${p.fen} : un seul mat`);
    } else if (p.kind === 'mate2') {
      assert.equal(matingMoves(pos, 1).length, 0, `${p.fen} : pas de mat en 1`);
      const m2 = matingMoves(pos, 2, 2);
      assert.deepEqual(m2.map((m) => sanOf(pos, m)), [bare(p.answer)], `${p.fen} : un seul premier coup`);
    } else {
      assert.ok(p.gain >= 2, p.fen);
      const [best, second] = analyse(pos, { depth: 2, quiet: true, ms: 2000 });
      assert.equal(sanOf(pos, best.m), bare(p.answer), `${p.fen} : le meilleur coup`);
      assert.ok(best.score - second.score >= 150, `${p.fen} : un seul coup gagne`);
    }
  }
});

test('problème du jour : le même toute la journée, un autre le lendemain', () => {
  const a = dailyFor('2026-11-04');
  assert.deepEqual(dailyFor('2026-11-04'), a);
  assert.equal(a.id, 'jour-2026-11-04');
  assert.notEqual(dailyFor('2026-11-05').fen, a.fen);
  // tout le tour du stock avant de revoir le même
  const fens = new Set();
  let d = new Date('2026-01-01T12:00:00Z');
  for (let i = 0; i < DAILY.length; i++, d = new Date(d.getTime() + 864e5)) fens.add(dailyFor(d.toISOString().slice(0, 10)).fen);
  assert.equal(fens.size, DAILY.length);
  // prêt pour l'écran des problèmes : un but (mat) ou une réponse
  for (const day of ['2026-11-04', '2026-11-05', '2026-11-06', '2026-11-07']) {
    const p = dailyFor(day);
    assert.ok(p.goal === 'mate' || p.goal === 'mate2' || (Array.isArray(p.answer) && p.answer.length === 1), day);
    assert.ok(p.text.length > 10 && p.group && p.solution, day);
  }
});

test('problème du jour : ta série, les jours résolus d’affilée', () => {
  const done = { '2026-11-02': true, '2026-11-03': true, '2026-11-04': true, '2026-10-30': true };
  assert.equal(dailyStreak(done, '2026-11-04'), 3);
  assert.equal(dailyStreak(done, '2026-11-05'), 3); // pas encore fait aujourd'hui : la série tient
  assert.equal(dailyStreak(done, '2026-11-06'), 0); // un jour sauté : elle repart de zéro
  assert.equal(dailyStreak({}, '2026-11-04'), 0);
  assert.equal(dailyStreak(null, '2026-11-04'), 0);
  assert.equal(dailyStreak({ '2026-11-04': 'oui' }, '2026-11-04'), 0); // n'importe quoi : rien
});
