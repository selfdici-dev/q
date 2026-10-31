// Cristaux, un jeu de la borne d'arcade : échange deux cristaux voisins pour
// en aligner 3 de la même couleur ou plus. Ils éclatent, ceux du dessus
// tombent, de nouveaux arrivent, et ça peut s'enchaîner. Une ligne de 4 ou
// plus laisse un cristal éclair : quand il éclate, il emporte toute sa ligne
// et sa colonne. Des niveaux : un score à atteindre en 20 coups, de plus en
// plus haut. Logique pure (sans DOM), testée par tests/gems.test.js.
import { rand } from './games.js';

export const GEM_SIZE = 7; // grille de 7 × 7
export const GEM_COLORS = 5;
export const GEM_MOVES = 20;
const N = GEM_SIZE;

// Une case : sa couleur (1 à 5), plus 10 pour un cristal éclair ; 0 : vide.
export const colorOf = (v) => v % 10;
export const isBolt = (v) => v >= 10;
// Score à atteindre au niveau n, et le bonus de chaque coup qui reste à la fin.
export const gemTarget = (level) => 1000 + (level - 1) * 400;
export const MOVE_BONUS = 40;

const gem = (rnd) => {
  const [x, s] = rand(rnd);
  return [1 + Math.floor(x * GEM_COLORS), s];
};
// deux cases voisines (côte à côte ou l'une sur l'autre)
export const adjacent = (a, b) => (Math.abs(a - b) === 1 && Math.floor(a / N) === Math.floor(b / N)) || Math.abs(a - b) === N;
const swapped = (grid, a, b) => {
  const g = [...grid];
  [g[a], g[b]] = [g[b], g[a]];
  return g;
};

// Les alignements : suites de 3 cases ou plus de la même couleur, en ligne ou en colonne.
export function findRuns(grid) {
  const runs = [];
  const scan = (cell) => {
    for (let line = 0; line < N; line++) {
      let k = 0;
      while (k < N) {
        const col = colorOf(grid[cell(line, k)] ?? 0);
        let e = k + 1;
        while (col && e < N && colorOf(grid[cell(line, e)]) === col) e++;
        if (col && e - k >= 3) runs.push(Array.from({ length: e - k }, (_, j) => cell(line, k + j)));
        k = e;
      }
    }
  };
  scan((r, c) => r * N + c);
  scan((c, r) => r * N + c);
  return runs;
}

// L'échange de a et b est-il permis ? (voisins, et ça aligne quelque chose)
export function canSwap(grid, a, b) {
  return a >= 0 && b >= 0 && a < N * N && b < N * N && adjacent(a, b) && Boolean(grid[a] && grid[b]) && findRuns(swapped(grid, a, b)).length > 0;
}

// Un échange possible (pour l'indice), ou null s'il n'y en a plus.
export function findMove(grid) {
  for (let i = 0; i < N * N; i++) {
    if (i % N < N - 1 && canSwap(grid, i, i + 1)) return [i, i + 1];
    if (i + N < N * N && canSwap(grid, i, i + N)) return [i, i + N];
  }
  return null;
}

// Une grille neuve : aucun alignement tout fait, au moins un échange possible.
function freshBoard(rnd) {
  let grid = [];
  for (let tries = 0; tries < 50; tries++) {
    grid = [];
    for (let i = 0; i < N * N; i++) {
      let v;
      do [v, rnd] = gem(rnd);
      while ((i % N >= 2 && grid[i - 1] === v && grid[i - 2] === v) || (i >= 2 * N && grid[i - N] === v && grid[i - 2 * N] === v));
      grid.push(v);
    }
    if (findMove(grid)) break;
  }
  return [grid, rnd];
}

export function newGems(seed = 1, level = 1) {
  const [grid, rnd] = freshBoard(seed | 0);
  return { grid, rnd, level, target: gemTarget(level), score: 0, moves: GEM_MOVES, won: false, over: false };
}

// Échange a et b. Renvoie la partie d'après et les étapes (pour l'animation :
// cases qui éclatent, éclairs créés, points, grille après la chute), ou null
// si l'échange n'aligne rien. Points : 10 par cristal × le rang dans
// l'enchaînement, 30 par éclair créé ; niveau réussi : 40 par coup restant.
export function playSwap(game, a, b) {
  if (game.won || game.over || !canSwap(game.grid, a, b)) return null;
  let grid = swapped(game.grid, a, b);
  let rnd = game.rnd;
  const steps = [];
  let total = 0;
  for (let chain = 1; chain <= 50; chain++) {
    const runs = findRuns(grid);
    if (!runs.length) break;
    const clear = new Set(runs.flat());
    // une ligne de 4 ou plus laisse un éclair : là où tu as joué, sinon au milieu
    const bolts = new Map();
    for (const run of runs) {
      if (run.length < 4) continue;
      const spot = (chain === 1 && run.find((i) => i === a || i === b)) ?? run[run.length >> 1];
      if (!bolts.has(spot)) bolts.set(spot, colorOf(grid[spot]));
    }
    // les éclairs qui éclatent emportent leur ligne et leur colonne (et ça se propage)
    const queue = [...clear].filter((i) => isBolt(grid[i]));
    const blown = new Set();
    while (queue.length) {
      const i = queue.pop();
      if (blown.has(i)) continue;
      blown.add(i);
      const r = Math.floor(i / N), c = i % N;
      for (let k = 0; k < N; k++) {
        for (const j of [r * N + k, k * N + c]) {
          if (clear.has(j)) continue;
          clear.add(j);
          if (isBolt(grid[j])) queue.push(j);
        }
      }
    }
    for (const spot of bolts.keys()) clear.delete(spot);
    const points = clear.size * 10 * chain + bolts.size * 30;
    total += points;
    const next = [...grid];
    for (const i of clear) next[i] = 0;
    for (const [spot, col] of bolts) next[spot] = col + 10;
    // ce qui reste tombe, de nouveaux cristaux arrivent par le haut
    const falls = [];
    for (let c = 0; c < N; c++) {
      const kept = [];
      for (let r = N - 1; r >= 0; r--) if (next[r * N + c]) kept.push(next[r * N + c]);
      for (let r = N - 1, k = 0; r >= 0; r--, k++) {
        let v = kept[k];
        if (v === undefined) {
          [v, rnd] = gem(rnd);
          falls.push(r * N + c);
        }
        next[r * N + c] = v;
      }
    }
    steps.push({ cleared: [...clear], bolts: [...bolts.keys()], fresh: falls, points, chain, grid: next });
    grid = next;
  }
  const moves = game.moves - 1;
  let score = game.score + total;
  const won = score >= game.target;
  if (won) score += moves * MOVE_BONUS;
  const over = !won && moves <= 0;
  let shuffled = false;
  if (!won && !over && !findMove(grid)) {
    [grid, rnd] = freshBoard(rnd);
    shuffled = true;
  }
  return { game: { ...game, grid, rnd, score, moves, won, over }, steps, points: total, shuffled };
}
