import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CODE_LEN, CODE_COLORS, CODE_TRIES, scoreGuess, newCode, playGuess } from '../js/code.js';

test('code secret : ● bonne place, ○ bonne couleur mal placée, chaque couleur une seule fois', () => {
  assert.deepEqual(scoreGuess([1, 2, 3, 4], [1, 2, 3, 4]), { black: 4, white: 0 });
  assert.deepEqual(scoreGuess([1, 2, 3, 4], [4, 3, 2, 1]), { black: 0, white: 4 });
  assert.deepEqual(scoreGuess([1, 1, 2, 2], [1, 2, 1, 5]), { black: 1, white: 2 });
  assert.deepEqual(scoreGuess([1, 2, 3, 4], [5, 5, 5, 5]), { black: 0, white: 0 });
  assert.deepEqual(scoreGuess([6, 6, 6, 1], [6, 1, 1, 1]), { black: 2, white: 0 });
  assert.deepEqual(scoreGuess([2, 3, 2, 3], [3, 2, 3, 2]), { black: 0, white: 4 });
});

test('code secret : un code de 4 couleurs parmi 6, reproductible', () => {
  for (let s = 1; s <= 30; s++) {
    const g = newCode(s);
    assert.equal(g.secret.length, CODE_LEN);
    assert.ok(g.secret.every((c) => c >= 1 && c <= CODE_COLORS));
  }
  assert.deepEqual(newCode(8), newCode(8));
});

test('code secret : gagné quand tout est bien placé, perdu après 10 essais', () => {
  let g = { ...newCode(1), secret: [1, 2, 3, 4] };
  assert.equal(playGuess(g, [1, 2, 3]), g); // pas assez de couleurs
  assert.equal(playGuess(g, [1, 2, 3, 9]), g); // couleur inconnue
  g = playGuess(g, [4, 3, 2, 1]);
  assert.deepEqual(g.guesses[0], { guess: [4, 3, 2, 1], black: 0, white: 4 });
  g = playGuess(g, [1, 2, 3, 4]);
  assert.equal(g.won, true);
  assert.equal(playGuess(g, [1, 1, 1, 1]), g); // fini
  let lost = { ...newCode(2), secret: [6, 6, 6, 6] };
  for (let k = 0; k < CODE_TRIES; k++) lost = playGuess(lost, [1, 2, 3, 4]);
  assert.equal(lost.over, true);
  assert.equal(lost.won, false);
  assert.equal(lost.guesses.length, CODE_TRIES);
});
