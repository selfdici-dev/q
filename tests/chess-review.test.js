import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createReview, reviewSummary, MARKS } from '../js/chess-review.js';
import { START, BLACK, WHITE } from '../js/chess.js';

const run = (game) => {
  const rv = createReview(game);
  let guard = 0;
  while (!rv.done && guard++ < 100) rv.step();
  return rv;
};

test('revoir ta partie : la gaffe qui laisse un mat est trouvée, avec le bon coup', () => {
  // le « coup du berger » : les noirs (toi) laissent Dxf7 mat
  const rv = run({ start: START, sans: ['e4', 'e5', 'Dh5', 'Cc6', 'Fc4', 'Cf6', 'Dxf7#'], color: BLACK });
  assert.equal(rv.total, 3); // tes coups : e5, Cc6, Cf6
  assert.equal(rv.fens.length, 8);
  const [e5, c6, f6] = rv.items;
  assert.equal(e5.mark, '');
  assert.equal(c6.mark, '');
  assert.equal(f6.san, 'Cf6');
  assert.equal(f6.mark, '??');
  assert.ok(f6.loss >= 1000, String(f6.loss));
  assert.ok(f6.best && f6.best.san !== 'Cf6');
  assert.match(f6.comment, /^Gaffe : ton coup coûte ≈ \d/);
  const sum = reviewSummary(rv.items);
  assert.equal(sum.gaffes, 1);
  assert.equal(sum.accuracy, 67);
  assert.equal(sum.worst, f6);
});

test('revoir ta partie : un mat manqué compte comme une gaffe', () => {
  // le mat du couloir était là (Td8#), tu as joué Td2
  const rv = run({ start: '6k1/5ppp/8/8/8/8/5PPP/3R2K1 w - - 0 1', sans: ['Td2'], color: WHITE });
  assert.equal(rv.items.length, 1);
  assert.equal(rv.items[0].mark, '??');
  assert.equal(rv.items[0].best.san, 'Td8#');
  assert.match(rv.items[0].comment, /il y avait un mat avec Td8# !/);
});

test('revoir ta partie : les marques, une partie sans coup, une notation inconnue', () => {
  assert.deepEqual(MARKS.map((m) => m.sign), ['??', '?', '?!']);
  assert.ok(MARKS[0].min > MARKS[1].min && MARKS[1].min > MARKS[2].min);
  const none = run({ start: START, sans: [], color: WHITE });
  assert.equal(none.total, 0);
  assert.equal(reviewSummary(none.items).accuracy, 100);
  assert.equal(reviewSummary(none.items).worst, null);
  // une notation qui ne colle pas : on s'arrête là, sans erreur
  const cut = createReview({ start: START, sans: ['e4', 'Zz9', 'e5'], color: WHITE });
  assert.equal(cut.moves.length, 1);
  assert.equal(cut.step().san, 'e4');
  assert.equal(cut.step(), null);
  assert.equal(cut.done, true);
});
