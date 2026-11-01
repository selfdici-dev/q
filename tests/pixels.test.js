import { test } from 'node:test';
import assert from 'node:assert/strict';
import { PUZZLES, SIZES, sizeOf, runs, clues, newPixels, paint, linesOk, countSolutions } from '../js/pixels.js';

test('pixels : les suites d’une ligne', () => {
  assert.deepEqual(runs([1, 1, 0, 1, 0, 0]), [2, 1]);
  assert.deepEqual(runs([0, 0, 0]), [0]);
  assert.deepEqual(runs([1, 1, 1]), [3]);
  assert.deepEqual(runs([2, 1, 2, 1]), [1, 1]); // une croix compte comme du vide
});

test('pixels : des dessins de 5, 10 et 15 cases de côté, carrés, nommés et colorés', () => {
  assert.equal(new Set(PUZZLES.map((p) => p.id)).size, PUZZLES.length);
  for (const n of SIZES) assert.ok(PUZZLES.filter((p) => sizeOf(p) === n).length >= 5, `${n} × ${n}`);
  for (const p of PUZZLES) {
    const n = sizeOf(p);
    assert.ok(SIZES.includes(n), p.id);
    assert.ok(p.rows.every((r) => r.length === n && /^[#.]+$/.test(r)), `${p.id} : grille carrée`);
    assert.ok(p.name && /^#[0-9a-f]{6}$/.test(p.color), p.id);
    // chaque ligne et chaque colonne a au moins une case noire ou est vraiment vide : le dessin est là
    assert.ok(p.rows.join('').includes('#'), p.id);
  }
});

test('pixels : chaque dessin n’a qu’une solution, trouvable sans deviner', () => {
  for (const p of PUZZLES) {
    const c = clues(p);
    assert.equal(countSolutions(c.rows, c.cols, 2), 1, `${p.id} : plusieurs solutions`);
  }
});

test('pixels : noircir, croiser, effacer ; fini quand tous les chiffres collent', () => {
  const p = PUZZLES.find((x) => x.id === 'coeur');
  let g = newPixels('coeur');
  assert.equal(g.n, 5);
  assert.equal(g.grid.length, 25);
  g = paint(g, 0, 2); // une croix
  assert.equal(g.grid[0], 2);
  g = paint(g, 0, 0);
  assert.equal(g.grid[0], 0);
  assert.equal(paint(g, 0, 0), g); // rien ne change : même partie
  assert.equal(paint(g, 99, 1), g); // hors de la grille
  const want = p.rows.join('').split('').map((c) => (c === '#' ? 1 : 0));
  // des croix sur les vides, puis toutes les noires : gagné, les croix s'effacent
  want.forEach((v, i) => { if (!v) g = paint(g, i, 2); });
  want.forEach((v, i) => { if (v) g = paint(g, i, 1); });
  assert.equal(g.done, true);
  assert.deepEqual(g.grid, want);
  assert.equal(paint(g, 0, 1), g); // fini : la grille ne bouge plus
  const ok = linesOk(g);
  assert.ok(ok.rows.every(Boolean) && ok.cols.every(Boolean));
  // un dessin inconnu : le premier
  assert.equal(newPixels('???').id, PUZZLES[0].id);
});
