import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PAIR_SYMBOLS, pairsCount, pairsCols, newPairs, flipCard, hidePairs, pairsStars } from '../js/pairs.js';

test('paires : chaque carte a sa jumelle, plus de cartes à chaque niveau', () => {
  for (const level of [1, 2, 3, 4, 5, 9]) {
    const g = newPairs(level * 7, level);
    const n = pairsCount(level);
    assert.equal(g.cards.length, 2 * n);
    for (let k = 0; k < n; k++) assert.equal(g.cards.filter((x) => x === k).length, 2);
    assert.equal(g.syms.length, n);
    assert.equal(new Set(g.syms).size, n);
    assert.ok(g.syms.every((s) => s >= 0 && s < PAIR_SYMBOLS));
  }
  assert.deepEqual([1, 2, 3, 4, 5, 6].map(pairsCount), [6, 8, 10, 12, 15, 15]);
  assert.deepEqual([12, 16, 20, 24, 30].map(pairsCols), [3, 4, 4, 4, 5]);
  assert.deepEqual(newPairs(3, 2), newPairs(3, 2));
});

test('paires : deux cartes pareilles restent ouvertes, deux différentes se referment', () => {
  let g = newPairs(5, 1);
  const a = 0;
  const twin = g.cards.findIndex((k, i) => i !== a && k === g.cards[a]);
  const other = g.cards.findIndex((k) => k !== g.cards[a]);
  // une mauvaise paire : compte un coup, reste ouverte jusqu'à la carte suivante
  g = flipCard(g, a);
  assert.deepEqual(g.open, [a]);
  assert.equal(flipCard(g, a), g); // la même carte : rien
  g = flipCard(g, other);
  assert.equal(g.moves, 1);
  assert.deepEqual(g.open, [a, other]);
  assert.deepEqual(hidePairs(g).open, []);
  // la carte suivante referme les deux, puis la bonne paire est trouvée
  g = flipCard(g, a);
  assert.deepEqual(g.open, [a]);
  g = flipCard(g, twin);
  assert.deepEqual(g.found.sort(), [a, twin].sort());
  assert.deepEqual(g.open, []);
  assert.equal(g.moves, 2);
  assert.equal(flipCard(g, a), g); // une carte trouvée ne se retourne plus
});

test('paires : finir la grille, étoiles selon les coups', () => {
  let g = newPairs(9, 1);
  for (let k = 0; k < 6; k++) {
    const [i, j] = g.cards.map((x, idx) => [x, idx]).filter(([x]) => x === k).map(([, idx]) => idx);
    g = flipCard(flipCard(g, i), j);
  }
  assert.equal(g.done, true);
  assert.equal(g.moves, 6);
  assert.equal(pairsStars(g), 3);
  assert.equal(pairsStars({ ...g, moves: 12 }), 2);
  assert.equal(pairsStars({ ...g, moves: 13 }), 1);
  assert.equal(flipCard(g, 0), g);
});
