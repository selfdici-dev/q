import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ECHO_PADS, echoDelay, newEcho, pressEcho } from '../js/echo.js';

test('écho : une touche de plus à chaque tour réussi', () => {
  let g = newEcho(3);
  assert.equal(g.seq.length, 1);
  assert.ok(g.seq.every((p) => p >= 0 && p < ECHO_PADS));
  for (let round = 1; round <= 5; round++) {
    const len = g.seq.length;
    for (let k = 0; k < len; k++) {
      const res = pressEcho(g, g.seq[k]);
      assert.equal(res.ok, true);
      assert.equal(res.round, k === len - 1);
      g = res.game;
    }
    assert.equal(g.score, round);
    assert.equal(g.seq.length, round + 1);
    assert.equal(g.step, 0);
  }
  assert.deepEqual(newEcho(9), newEcho(9));
});

test('écho : une erreur et c’est fini', () => {
  const g = newEcho(1);
  const wrong = (g.seq[0] + 1) % ECHO_PADS;
  const res = pressEcho(g, wrong);
  assert.equal(res.ok, false);
  assert.equal(res.game.over, true);
  assert.equal(pressEcho(res.game, g.seq[0]).game, res.game);
});

test('écho : la démonstration accélère, avec une limite', () => {
  assert.ok(echoDelay(10) < echoDelay(2));
  assert.equal(echoDelay(100), 280);
});
