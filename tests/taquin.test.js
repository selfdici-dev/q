import { test } from 'node:test';
import assert from 'node:assert/strict';
import { solvedTiles, newTaquin, slide, solvable } from '../js/taquin.js';

test('taquin : une grille mélangée, jamais rangée, toujours faisable', () => {
  for (const n of [3, 4]) {
    for (let seed = 1; seed <= 30; seed++) {
      const g = newTaquin(seed, n);
      assert.deepEqual([...g.tiles].sort((a, b) => a - b), Array.from({ length: n * n }, (_, i) => i));
      assert.notDeepEqual(g.tiles, solvedTiles(n));
      assert.ok(solvable(g.tiles, n), `${n} ${seed}`);
    }
  }
  assert.deepEqual(newTaquin(7, 4), newTaquin(7, 4));
  // la règle de parité reconnaît une grille impossible (deux cases échangées)
  const bad = solvedTiles(3);
  [bad[0], bad[1]] = [bad[1], bad[0]];
  assert.equal(solvable(bad, 3), false);
  assert.equal(solvable(solvedTiles(4), 4), true);
});

test('taquin : une case glisse vers la vide ; une ligne entière aussi ; en diagonale, rien', () => {
  const g = { n: 3, tiles: [1, 2, 3, 4, 5, 6, 7, 8, 0], moves: 0, done: false };
  const one = slide(g, 7); // le 8 glisse à droite
  assert.deepEqual(one.tiles, [1, 2, 3, 4, 5, 6, 7, 0, 8]);
  assert.equal(one.moves, 1);
  const line = slide(g, 6); // le 7 et le 8 glissent ensemble
  assert.deepEqual(line.tiles, [1, 2, 3, 4, 5, 6, 0, 7, 8]);
  const col = slide(g, 2); // le 3 et le 6 descendent
  assert.deepEqual(col.tiles, [1, 2, 0, 4, 5, 3, 7, 8, 6]);
  assert.equal(slide(g, 0), g); // en diagonale
  assert.equal(slide(g, 8), g); // la case vide elle-même
});

test('taquin : rangée, c’est gagné, et plus rien ne bouge', () => {
  const g = { n: 3, tiles: [1, 2, 3, 4, 5, 6, 7, 0, 8], moves: 4, done: false };
  const won = slide(g, 8);
  assert.equal(won.done, true);
  assert.equal(won.moves, 5);
  assert.equal(slide(won, 7), won);
});
