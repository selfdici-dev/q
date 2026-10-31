import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rand, SIZE, SHAPES, COLORS, canPlace, fitsAnywhere, newBlocks, placeBlock, blockPoints, calcQuestion, newCalc, answerCalc } from '../js/games.js';

const empty = () => Array(SIZE * SIZE).fill(0);

test('hasard : reproductible et entre 0 et 1', () => {
  let s = 42;
  const a = [];
  for (let i = 0; i < 100; i++) { let x; [x, s] = rand(s); a.push(x); }
  assert.ok(a.every((x) => x >= 0 && x < 1));
  let t = 42;
  const b = [];
  for (let i = 0; i < 100; i++) { let x; [x, t] = rand(t); b.push(x); }
  assert.deepEqual(a, b);
  assert.ok(new Set(a).size > 95);
});

test('blocs : des pièces propres, collées en haut à gauche, sans case en double', () => {
  for (const { c, w } of SHAPES) {
    assert.ok(w > 0);
    assert.equal(Math.min(...c.map(([r]) => r)), 0);
    assert.equal(Math.min(...c.map(([, k]) => k)), 0);
    assert.ok(c.every(([r, k]) => r < 5 && k < 5));
    assert.equal(new Set(c.map(String)).size, c.length);
  }
});

test('blocs : une pièce se pose dans la grille, pas sur une case prise', () => {
  const g = empty();
  const bar3 = [[0, 0], [0, 1], [0, 2]];
  assert.equal(canPlace(g, bar3, 0, 5), true);
  assert.equal(canPlace(g, bar3, 0, 6), false); // dépasse à droite
  assert.equal(canPlace(g, bar3, -1, 0), false);
  g[2] = 1;
  assert.equal(canPlace(g, bar3, 0, 0), false);
  assert.equal(canPlace(g, bar3, 1, 0), true);
  // grille pleine sauf une case : seule la pièce d'une case rentre
  const full = Array(SIZE * SIZE).fill(1);
  full[27] = 0;
  assert.equal(fitsAnywhere(full, [[0, 0]]), true);
  assert.equal(fitsAnywhere(full, [[0, 0], [0, 1]]), false);
});

test('blocs : une ligne ou une colonne pleine disparaît, et les points suivent', () => {
  // ligne 0 presque pleine : la barre de 3 la termine
  const game = newBlocks(7);
  const grid = empty();
  for (let c = 0; c < 5; c++) grid[c] = 2;
  const bar = SHAPES.findIndex((s) => String(s.c) === String([[0, 0], [0, 1], [0, 2]]));
  const g = { ...game, grid, pieces: [{ shape: bar, color: 3 }, game.pieces[1], game.pieces[2]], streak: 0, score: 0 };
  const res = placeBlock(g, 0, 0, 5);
  assert.equal(res.lines, 1);
  assert.equal(res.cleared.length, SIZE);
  assert.ok(res.game.grid.slice(0, SIZE).every((x) => x === 0));
  assert.equal(res.game.score, blockPoints(3, 1, 1)); // 3 cases + 10
  assert.equal(res.game.pieces[0], null);
  assert.equal(res.game.streak, 1);
  // une ligne et une colonne d'un coup (la croix) : 2 lignes, 10 × 4 points
  const g2 = empty();
  for (let c = 1; c < SIZE; c++) g2[c] = 1; // ligne 0 sauf (0, 0)
  for (let r = 1; r < SIZE; r++) g2[r * SIZE] = 1; // colonne 0 sauf (0, 0)
  const one = SHAPES.findIndex((s) => s.c.length === 1);
  const res2 = placeBlock({ ...game, grid: g2, pieces: [{ shape: one, color: 1 }, game.pieces[1], game.pieces[2]], streak: 0, score: 0 }, 0, 0, 0);
  assert.equal(res2.lines, 2);
  assert.equal(res2.cleared.length, 2 * SIZE - 1);
  assert.equal(res2.game.score, blockPoints(1, 2, 1));
  assert.equal(blockPoints(1, 2, 1), 41);
  assert.equal(blockPoints(4, 0, 3), 4); // pas de ligne : seulement les cases
  assert.equal(blockPoints(2, 1, 3), 2 + 10 + 20); // série de 3
});

test('blocs : nouvelles pièces après les trois, fin de partie quand plus rien ne rentre', () => {
  let game = newBlocks(3);
  assert.equal(game.pieces.length, 3);
  assert.ok(game.pieces.every((p) => p && p.color >= 1 && p.color <= COLORS));
  // on pose les trois pièces là où elles rentrent : trois nouvelles arrivent
  for (let i = 0; i < 3; i++) {
    const cells = SHAPES[game.pieces[i].shape].c;
    let done = false;
    for (let r = 0; r < SIZE && !done; r++) for (let c = 0; c < SIZE && !done; c++) {
      if (canPlace(game.grid, cells, r, c)) { game = placeBlock(game, i, r, c).game; done = true; }
    }
    assert.ok(done);
  }
  assert.ok(game.pieces.every(Boolean));
  // poser au mauvais endroit est refusé, la partie ne change pas
  assert.equal(placeBlock(game, 0, SIZE, SIZE), null);
  // grille bouchée en damier : les pièces de 2 cases et plus ne rentrent plus
  const board = Array.from({ length: SIZE * SIZE }, (_, k) => ((Math.floor(k / SIZE) + k) % 2 ? 1 : 0));
  const two = SHAPES.findIndex((s) => s.c.length === 2);
  const one = SHAPES.findIndex((s) => s.c.length === 1);
  const stuck = { ...game, grid: board, pieces: [{ shape: one, color: 1 }, { shape: two, color: 1 }, null] };
  const free = board.indexOf(0);
  const end = placeBlock(stuck, 0, Math.floor(free / SIZE), free % SIZE).game;
  assert.equal(end.over, true);
  // même graine, même partie
  assert.deepEqual(newBlocks(99).pieces, newBlocks(99).pieces);
});

test('calcul éclair : des questions justes, quatre réponses différentes dont la bonne', () => {
  for (let level = 0; level <= 6; level++) {
    let rnd = 1000 + level;
    for (let k = 0; k < 200; k++) {
      const { q, rnd: next } = calcQuestion(rnd, level);
      rnd = next;
      assert.ok(q.text.length > 3);
      assert.ok(Number.isFinite(q.answer) && q.answer > 0, `${q.text} = ${q.answer}`);
      assert.equal(q.options.length, 4);
      assert.equal(new Set(q.options).size, 4, q.text);
      assert.ok(q.options.includes(q.answer));
      assert.ok(q.options.every((o) => Number.isFinite(o) && o > 0));
      // on recalcule la bonne réponse à partir du texte
      const n = q.text.match(/\d+(?:[\s ]\d{3})*(?:,\d+)?/g).map((x) => Number(x.replace(/[\s ]/g, '').replace(',', '.')));
      const expect = {
        add: () => n[0] + n[1], sub: () => n[0] - n[1], table: () => n[0] * n[1], mul2: () => n[0] * n[1], div: () => n[0] / n[1],
        pct: () => (n[1] * n[0]) / 100, pct2: () => (n[1] * n[0]) / 100, sale: () => n[0] - (n[0] * n[1]) / 100,
        interest: () => (n[0] * n[1]) / 100, unit: () => n[1] / n[0],
      }[q.kind]();
      assert.ok(Math.abs(expect - q.answer) < 1e-9, `${q.text} : ${q.answer} au lieu de ${expect}`);
    }
  }
});

test('calcul éclair : le score, la série et le niveau suivent tes réponses', () => {
  let game = newCalc(5);
  assert.equal(game.level, 0);
  for (let i = 0; i < 3; i++) game = answerCalc(game, game.q.answer).game;
  assert.equal(game.score, 3);
  assert.equal(game.streak, 3);
  assert.equal(game.level, 1); // 3 bonnes réponses d'affilée : on monte
  const wrong = game.q.options.find((o) => o !== game.q.answer);
  const res = answerCalc(game, wrong);
  assert.equal(res.right, false);
  assert.equal(res.game.streak, 0);
  assert.equal(res.game.level, 0); // une erreur : on redescend
  assert.equal(res.game.score, 3);
  assert.equal(res.game.best, 3);
  assert.equal(res.game.done, 4);
  assert.equal(res.game.ok, 3);
  // bonus de série : à partir de 5 d'affilée, chaque bonne réponse vaut 2
  let g = newCalc(8);
  for (let i = 0; i < 5; i++) g = answerCalc(g, g.q.answer).game;
  assert.equal(g.score, 6);
});
