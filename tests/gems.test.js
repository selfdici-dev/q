import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GEM_SIZE as N, GEM_MOVES, MOVE_BONUS, colorOf, isBolt, gemTarget, findRuns, canSwap, findMove, newGems, playSwap } from '../js/gems.js';

// Une grille sans alignement ni échange possible (couleurs décalées ligne à ligne).
const base = () => Array.from({ length: N * N }, (_, i) => ((i % N + 2 * Math.floor(i / N)) % 5) + 1);
const at = (r, c) => r * N + c;
const game = (grid) => ({ grid, rnd: 5, level: 1, target: 1e9, score: 0, moves: GEM_MOVES, won: false, over: false });

test('cristaux : les alignements de 3 et plus, en ligne et en colonne, éclairs compris', () => {
  const g = base();
  assert.deepEqual(findRuns(g), []);
  assert.equal(findMove(g), null); // aucun échange n'aligne rien
  g[at(0, 1)] = 1; g[at(0, 2)] = 1; // 1 1 1 en haut à gauche
  assert.deepEqual(findRuns(g), [[0, 1, 2]]);
  const v = base();
  v[at(1, 6)] = 12; v[at(2, 6)] = 2; v[at(3, 6)] = 2; // (0, 6) vaut déjà 2 ; un éclair compte pour sa couleur
  assert.deepEqual(findRuns(v), [[at(0, 6), at(1, 6), at(2, 6), at(3, 6)]]);
  assert.equal(colorOf(12), 2);
  assert.equal(isBolt(12), true);
  assert.equal(isBolt(2), false);
});

test('cristaux : on échange deux voisins (pas en diagonale, pas d’un bord à l’autre), et seulement si ça aligne', () => {
  const g = base();
  g[at(3, 0)] = 5; g[at(3, 1)] = 5; g[at(4, 2)] = 5;
  assert.equal(canSwap(g, at(3, 2), at(4, 2)), true);
  assert.equal(canSwap(g, at(4, 2), at(3, 2)), true);
  assert.equal(canSwap(g, at(3, 2), at(4, 3)), false); // diagonale
  assert.equal(canSwap(g, at(2, 6), at(3, 0)), false); // fin de ligne et début de la suivante
  assert.equal(canSwap(g, at(0, 0), at(0, 1)), false); // n'aligne rien
  assert.equal(canSwap(g, -1, 0), false);
  const move = findMove(g);
  assert.ok(move && canSwap(g, ...move));
});

test('cristaux : une grille neuve n’a aucun alignement tout fait, et toujours un coup à jouer', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const g = newGems(seed, 1);
    assert.equal(g.grid.length, N * N);
    assert.ok(g.grid.every((v) => v >= 1 && v <= 5));
    assert.deepEqual(findRuns(g.grid), []);
    assert.ok(findMove(g.grid));
  }
  assert.deepEqual(newGems(9).grid, newGems(9).grid); // même graine, même grille
  assert.equal(newGems(1, 3).target, gemTarget(3));
  assert.ok(gemTarget(2) > gemTarget(1));
});

test('cristaux : une ligne de 4 laisse un éclair là où tu as joué', () => {
  const g = base();
  g[at(3, 0)] = 5; g[at(3, 1)] = 5; g[at(4, 2)] = 5; // (3, 3) vaut déjà 5
  const res = playSwap(game(g), at(3, 2), at(4, 2));
  const first = res.steps[0];
  assert.deepEqual([...first.cleared].sort((a, b) => a - b), [at(3, 0), at(3, 1), at(3, 3)]);
  assert.deepEqual(first.bolts, [at(3, 2)]);
  assert.equal(first.grid[at(3, 2)], 15);
  assert.equal(first.points, 3 * 10 + 30);
  assert.equal(first.chain, 1);
});

test('cristaux : un éclair qui éclate emporte toute sa ligne et toute sa colonne', () => {
  const g = base();
  g[at(3, 3)] = 15; g[at(3, 4)] = 5; g[at(2, 5)] = 5;
  const res = playSwap(game(g), at(2, 5), at(3, 5));
  const cleared = new Set(res.steps[0].cleared);
  for (let k = 0; k < N; k++) {
    assert.ok(cleared.has(at(3, k)), `ligne ${k}`);
    assert.ok(cleared.has(at(k, 3)), `colonne ${k}`);
  }
  assert.equal(cleared.size, 2 * N - 1);
});

test('cristaux : après un coup, la grille est pleine et stable, les points et les coups suivent', () => {
  let g = newGems(42, 1);
  g = { ...g, target: 1e9 };
  for (let k = 0; k < 12; k++) {
    const move = findMove(g.grid);
    const res = playSwap(g, ...move);
    assert.ok(res);
    assert.equal(res.game.moves, g.moves - 1);
    assert.equal(res.points, res.steps.reduce((s, x) => s + x.points, 0));
    assert.equal(res.game.score, g.score + res.points);
    res.steps.forEach((s, i) => assert.equal(s.chain, i + 1));
    assert.ok(res.game.grid.every((v) => colorOf(v) >= 1 && colorOf(v) <= 5));
    assert.deepEqual(findRuns(res.game.grid), []);
    assert.ok(findMove(res.game.grid)); // jamais bloqué : on rebat les cartes s'il le faut
    g = res.game;
  }
  // un échange qui n'aligne rien est refusé, la partie ne change pas
  assert.equal(playSwap(game(base()), 0, 1), null);
});

test('cristaux : niveau réussi au score visé (bonus par coup restant), perdu sans coup', () => {
  const g = base();
  g[at(3, 0)] = 5; g[at(3, 1)] = 5; g[at(4, 2)] = 5;
  const won = playSwap({ ...game(g), target: 10 }, at(3, 2), at(4, 2)).game;
  assert.equal(won.won, true);
  assert.equal(won.over, false);
  assert.ok(won.score >= 10 + (GEM_MOVES - 1) * MOVE_BONUS);
  assert.equal(playSwap(won, 0, 1), null); // fini : plus de coup
  const last = playSwap({ ...game(g), moves: 1 }, at(3, 2), at(4, 2)).game;
  assert.equal(last.over, true);
  assert.equal(last.won, false);
  assert.equal(last.moves, 0);
});
