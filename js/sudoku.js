// Sudoku, un jeu de la borne d'arcade : remplis la grille pour que chaque
// ligne, chaque colonne et chaque carré de 3 × 3 contienne une seule fois
// les chiffres de 1 à 9. Les grilles sont fabriquées ici (hasard
// reproductible), à solution unique, en 3 niveaux. Logique pure (sans DOM),
// testée par tests/sudoku.test.js.
import { rand } from './games.js';

// Niveau : combien de chiffres sont donnés au départ (au plus).
export const SD_LEVELS = { facile: 38, moyen: 31, difficile: 26 };

const ROW = (i) => Math.floor(i / 9);
const COL = (i) => i % 9;
const BOX = (i) => Math.floor(ROW(i) / 3) * 3 + Math.floor(COL(i) / 3);
// les 20 cases qui voient chaque case (même ligne, colonne ou carré)
export const PEERS = Array.from({ length: 81 }, (_, i) => Array.from({ length: 81 }, (_, j) => j).filter((j) => j !== i && (ROW(j) === ROW(i) || COL(j) === COL(i) || BOX(j) === BOX(i))));
const bits = (m) => { let n = 0; for (; m; m &= m - 1) n++; return n; };

// Nombre de solutions d'une grille (0 = vide), en s'arrêtant à `limit`.
export function countSolutions(grid, limit = 2) {
  const g = [...grid];
  const rows = Array(9).fill(0), cols = Array(9).fill(0), boxes = Array(9).fill(0);
  for (let i = 0; i < 81; i++) {
    if (!g[i]) continue;
    const b = 1 << g[i];
    if ((rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]) & b) return 0;
    rows[ROW(i)] |= b; cols[COL(i)] |= b; boxes[BOX(i)] |= b;
  }
  let count = 0;
  const solve = () => {
    let best = -1, mask = 0, fewest = 10;
    for (let i = 0; i < 81 && fewest > 1; i++) {
      if (g[i]) continue;
      const m = ~(rows[ROW(i)] | cols[COL(i)] | boxes[BOX(i)]) & 0x3fe;
      const n = bits(m);
      if (n < fewest) { best = i; mask = m; fewest = n; }
    }
    if (best < 0) return ++count >= limit;
    for (let d = 1; d <= 9; d++) {
      const b = 1 << d;
      if (!(mask & b)) continue;
      g[best] = d; rows[ROW(best)] |= b; cols[COL(best)] |= b; boxes[BOX(best)] |= b;
      if (solve()) return true;
      g[best] = 0; rows[ROW(best)] &= ~b; cols[COL(best)] &= ~b; boxes[BOX(best)] &= ~b;
    }
    return false;
  };
  solve();
  return count;
}

// Une grille neuve du niveau voulu : { puzzle, solution } en chaînes de 81 chiffres.
export function makeSudoku(seed = 1, level = 'facile') {
  let r = seed | 0;
  const shuffled = (list) => {
    const a = [...list];
    for (let k = a.length - 1; k > 0; k--) {
      let x;
      [x, r] = rand(r);
      const j = Math.floor(x * (k + 1));
      [a[k], a[j]] = [a[j], a[k]];
    }
    return a;
  };
  // une grille pleine au hasard
  const sol = Array(81).fill(0);
  const fill = (i) => {
    if (i === 81) return true;
    for (const d of shuffled([1, 2, 3, 4, 5, 6, 7, 8, 9])) {
      if (PEERS[i].some((j) => sol[j] === d)) continue;
      sol[i] = d;
      if (fill(i + 1)) return true;
    }
    sol[i] = 0;
    return false;
  };
  fill(0);
  // on retire des chiffres tant que la solution reste unique
  const puzzle = [...sol];
  const goal = SD_LEVELS[level] ?? SD_LEVELS.facile;
  let given = 81;
  for (const i of shuffled(Array.from({ length: 81 }, (_, k) => k))) {
    if (given <= goal) break;
    const keep = puzzle[i];
    puzzle[i] = 0;
    if (countSolutions(puzzle, 2) === 1) given--;
    else puzzle[i] = keep;
  }
  return { puzzle: puzzle.join(''), solution: sol.join('') };
}

export function newSudoku(seed = 1, level = 'facile') {
  const { puzzle, solution } = makeSudoku(seed, level);
  return { level: SD_LEVELS[level] ? level : 'facile', puzzle, solution, grid: puzzle, notes: Array(81).fill(0), mistakes: 0, secs: 0, done: false };
}

const set = (s, i, ch) => s.slice(0, i) + ch + s.slice(i + 1);

// Pose le chiffre d (0 : efface) dans la case i. Un chiffre faux compte une
// erreur (il reste affiché en rouge) ; un juste efface ce chiffre des notes
// des cases qu'il voit.
export function sdPlace(game, i, d) {
  if (game.done || game.puzzle[i] !== '0' || !(d >= 0 && d <= 9)) return game;
  if (Number(game.grid[i]) === d) return game;
  const notes = [...game.notes];
  notes[i] = 0;
  const right = d === Number(game.solution[i]);
  if (right) for (const j of PEERS[i]) notes[j] &= ~(1 << d);
  const grid = set(game.grid, i, String(d));
  return { ...game, grid, notes, mistakes: game.mistakes + (d && !right ? 1 : 0), done: grid === game.solution };
}

// Note (ou retire) le chiffre d dans une case vide.
export function sdNote(game, i, d) {
  if (game.done || game.grid[i] !== '0' || !(d >= 1 && d <= 9)) return game;
  const notes = [...game.notes];
  notes[i] ^= 1 << d;
  return { ...game, notes };
}

// Combien de fois chaque chiffre est déjà bien placé (pour griser ceux finis).
export function sdCounts(game) {
  const n = Array(10).fill(0);
  for (let i = 0; i < 81; i++) if (game.grid[i] !== '0' && game.grid[i] === game.solution[i]) n[Number(game.grid[i])]++;
  return n;
}
