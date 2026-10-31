import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SD_LEVELS, PEERS, countSolutions, makeSudoku, newSudoku, sdPlace, sdNote, sdCounts } from '../js/sudoku.js';

const valid = (s) => {
  const g = [...s].map(Number);
  return g.every((v, i) => v >= 1 && v <= 9 && PEERS[i].every((j) => g[j] !== v));
};

test('sudoku : chaque case voit 20 cases (ligne, colonne, carré)', () => {
  assert.ok(PEERS.every((p) => p.length === 20));
  assert.ok(PEERS[0].includes(8) && PEERS[0].includes(72) && PEERS[0].includes(20));
  assert.ok(!PEERS[0].includes(30));
});

test('sudoku : des grilles justes, à solution unique, au bon niveau', () => {
  for (const level of Object.keys(SD_LEVELS)) {
    for (let seed = 1; seed <= 8; seed++) {
      const { puzzle, solution } = makeSudoku(seed, level);
      assert.equal(puzzle.length, 81);
      assert.ok(valid(solution), `${level} ${seed} : solution fausse`);
      assert.ok([...puzzle].every((c, i) => c === '0' || c === solution[i]));
      assert.equal([...puzzle].filter((c) => c !== '0').length, SD_LEVELS[level]);
      assert.equal(countSolutions([...puzzle].map(Number), 2), 1, `${level} ${seed} : plusieurs solutions`);
    }
  }
  assert.deepEqual(makeSudoku(5, 'moyen'), makeSudoku(5, 'moyen')); // même graine, même grille
  assert.notEqual(makeSudoku(5, 'moyen').puzzle, makeSudoku(6, 'moyen').puzzle);
});

test('sudoku : compter les solutions (aucune si deux chiffres se gênent, plusieurs si la grille est vide)', () => {
  const empty = Array(81).fill(0);
  assert.equal(countSolutions(empty, 2), 2);
  const clash = [...empty];
  clash[0] = 5; clash[1] = 5;
  assert.equal(countSolutions(clash, 2), 0);
});

test('sudoku : poser, se tromper, effacer, noter, finir', () => {
  let g = newSudoku(3, 'facile');
  const given = g.puzzle.indexOf('1') >= 0 ? [...g.puzzle].findIndex((c) => c !== '0') : 0;
  assert.equal(sdPlace(g, given, 5), g); // une case donnée ne bouge pas
  const i = g.puzzle.indexOf('0');
  const right = Number(g.solution[i]);
  const wrong = right === 9 ? 1 : right + 1;
  // les notes : on note puis on retire
  g = sdNote(g, i, 4);
  assert.equal(g.notes[i], 1 << 4);
  g = sdNote(g, i, 4);
  assert.equal(g.notes[i], 0);
  // un chiffre faux compte une erreur, reste affiché ; l'effacer ne compte rien
  g = sdPlace(g, i, wrong);
  assert.equal(g.grid[i], String(wrong));
  assert.equal(g.mistakes, 1);
  assert.equal(sdPlace(g, i, wrong).mistakes, 1); // le même chiffre : rien de neuf
  g = sdPlace(g, i, 0);
  assert.equal(g.grid[i], '0');
  assert.equal(g.mistakes, 1);
  // le bon chiffre efface cette note chez les cases qui le voient
  const peer = PEERS[i].find((j) => g.grid[j] === '0');
  g = sdNote(g, peer, right);
  g = sdPlace(g, i, right);
  assert.equal(g.notes[peer] & (1 << right), 0);
  assert.equal(sdCounts(g)[right], [...g.grid].filter((c, k) => c === String(right) && g.solution[k] === c).length);
  // tout remplir : c'est fini
  for (let k = 0; k < 81; k++) if (g.grid[k] === '0') g = sdPlace(g, k, Number(g.solution[k]));
  assert.equal(g.done, true);
  assert.equal(sdPlace(g, i, 0), g); // fini : plus rien ne bouge
});
