// Taquin, un jeu de la borne d'arcade : remets les cases dans l'ordre en les
// faisant glisser vers la case vide (une ligne entière glisse d'un coup).
// 3 × 3 ou 4 × 4. Logique pure (sans DOM), testée par tests/taquin.test.js.
import { rand } from './games.js';

export const solvedTiles = (n) => [...Array.from({ length: n * n - 1 }, (_, i) => i + 1), 0];
const isSolved = (tiles) => tiles.every((t, i) => t === (i === tiles.length - 1 ? 0 : i + 1));

// Mélange en faisant de vrais coups au hasard depuis la grille rangée :
// la grille obtenue a toujours une solution.
export function newTaquin(seed = 1, n = 3) {
  let r = seed | 0;
  const tiles = solvedTiles(n);
  let empty = n * n - 1, prev = -1;
  for (let k = 0; k < n * n * 40 || isSolved(tiles); k++) {
    const er = Math.floor(empty / n), ec = empty % n;
    const near = [[er - 1, ec], [er + 1, ec], [er, ec - 1], [er, ec + 1]].filter(([a, b]) => a >= 0 && b >= 0 && a < n && b < n).map(([a, b]) => a * n + b).filter((j) => j !== prev);
    let x;
    [x, r] = rand(r);
    const j = near[Math.floor(x * near.length)];
    [tiles[empty], tiles[j]] = [tiles[j], tiles[empty]];
    prev = empty;
    empty = j;
  }
  return { n, tiles, moves: 0, done: false };
}

// Fait glisser la case i (et celles entre elle et la case vide, sur la même ligne ou colonne).
export function slide(game, i) {
  const { n } = game;
  const empty = game.tiles.indexOf(0);
  if (game.done || i === empty || !(i >= 0 && i < n * n)) return game;
  const [ir, ic, er, ec] = [Math.floor(i / n), i % n, Math.floor(empty / n), empty % n];
  if (ir !== er && ic !== ec) return game;
  const step = ir === er ? Math.sign(ic - ec) : Math.sign(ir - er) * n;
  const tiles = [...game.tiles];
  for (let k = empty; k !== i; k += step) tiles[k] = tiles[k + step];
  tiles[i] = 0;
  return { ...game, tiles, moves: game.moves + 1, done: isSolved(tiles) };
}

// Une grille a-t-elle une solution ? (règle de parité des inversions)
export function solvable(tiles, n) {
  const list = tiles.filter((t) => t);
  let inv = 0;
  for (let a = 0; a < list.length; a++) for (let b = a + 1; b < list.length; b++) if (list[a] > list[b]) inv++;
  if (n % 2) return inv % 2 === 0;
  const rowFromBottom = n - Math.floor(tiles.indexOf(0) / n);
  return (inv + rowFromBottom) % 2 === 1;
}
