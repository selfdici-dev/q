// Pixels cachés, un jeu de la borne d'arcade (un nonogramme) : les chiffres
// au bord de chaque ligne et de chaque colonne disent combien de cases noircir
// à la suite, dans l'ordre (« 3 1 » : trois cases, un trou, une case). Trouve
// lesquelles : un dessin apparaît. Trois tailles : 5 × 5, 10 × 10, 15 × 15.
// Chaque dessin n'a qu'une solution (vérifié par countSolutions dans les
// tests) : pas besoin de deviner. Logique pure (sans DOM), testée par
// tests/pixels.test.js.

// Les dessins : '#' à noircir, '.' à laisser vide.
export const PUZZLES = [
  // 5 × 5
  { id: 'coeur', name: 'Cœur', color: '#e0453a', rows: ['.#.#.', '#####', '#####', '.###.', '..#..'] },
  { id: 'fleche', name: 'Flèche', color: '#7cc4e4', rows: ['..#..', '.###.', '#.#.#', '..#..', '..#..'] },
  { id: 'maison', name: 'Maison', color: '#e7c76b', rows: ['..#..', '.###.', '#####', '#.#.#', '###.#'] },
  { id: 'sourire', name: 'Sourire', color: '#ffd23a', rows: ['.###.', '#.#.#', '#####', '#...#', '.###.'] },
  { id: 'cloche', name: 'Cloche', color: '#c3a3e0', rows: ['..#..', '.###.', '.###.', '#####', '..#..'] },
  { id: 'pomme5', name: 'Pomme', color: '#9fd08f', rows: ['...#.', '.##..', '####.', '#####', '.###.'] },
  // 10 × 10
  { id: 'haltere', name: 'Haltère', color: '#dc9a70', rows: ['..........', '.##....##.', '.##....##.', '###....###', '##########', '##########', '###....###', '.##....##.', '.##....##.', '..........'] },
  { id: 'trophee', name: 'Trophée', color: '#f2c14a', rows: ['.########.', '##.####.##', '#..####..#', '##.####.##', '.########.', '...####...', '....##....', '....##....', '..######..', '..######..'] },
  { id: 'pomme', name: 'Pomme', color: '#e0453a', rows: ['.....#....', '....#.....', '..##.###..', '.########.', '##########', '##########', '##########', '.########.', '.########.', '..##..##..'] },
  { id: 'eclair', name: 'Éclair', color: '#ffd23a', rows: ['....#####.', '...#####..', '..#####...', '.#####....', '.#########', '.....####.', '....####..', '...####...', '..###.....', '.##.......'] },
  { id: 'flamme', name: 'Flamme', color: '#ff8a3a', rows: ['....#.....', '....##....', '...###....', '...####.#.', '..#####.#.', '.########.', '.###.####.', '.##...###.', '..##.###..', '...####...'] },
  { id: 'tasse', name: 'Tasse de thé', color: '#7cc4e4', rows: ['...#..#...', '..#..#....', '...#..#...', '..........', '#########.', '#########.', '##########', '########.#', '#########.', '.#######..'] },
  // 15 × 15
  { id: 'kettlebell', name: 'Kettlebell', color: '#9aa0b4', rows: ['.....#####.....', '....##...##....', '...##.....##...', '...#.......#...', '...##.....##...', '....#######....', '...#########...', '..###########..', '.#############.', '.####.....####.', '.###.......###.', '.####.....####.', '..###########..', '...#########...', '....#######....'] },
  { id: 'couronne', name: 'Couronne', color: '#f2c14a', rows: ['.#.....#.....#.', '###...###...###', '.#.....#.....#.', '.##...###...##.', '.###.#####.###.', '.#############.', '.#############.', '.##.###.###.##.', '.#.#.#####.#.#.', '.##.###.###.##.', '.#############.', '..###########..', '...............', '.#############.', '.#############.'] },
  { id: 'fusee', name: 'Fusée', color: '#e98a6b', rows: ['.......#.......', '......###......', '.....#####.....', '.....#####.....', '.....##.##.....', '.....#...#.....', '.....##.##.....', '.....#####.....', '.....#####.....', '....#######....', '...##.###.##...', '..###.###.###..', '..##..###..##..', '......#.#......', '.....#...#.....'] },
  { id: 'chat', name: 'Chat', color: '#c3a3e0', rows: ['..#.....#......', '.##.....##.....', '.###...###.....', '.#########.....', '.##.###.##.....', '.#########.....', '.###...###...#.', '..#######....#.', '...#####.....#.', '..#######....#.', '.#########...#.', '.##########..#.', '.############..', '.##.####.##....', '.##.####.##....'] },
  { id: 'coureur', name: 'Coureur', color: '#9fd08f', rows: ['..........###..', '.........#####.', '.........#####.', '..........###..', '......######...', '.....########..', '....###.####.##', '...###..####...', '.......#####...', '......###.###..', '.....###...###.', '....###.....##.', '..####......##.', '..##........###', '...............'] },
];

export const SIZES = [5, 10, 15];
export const sizeOf = (p) => p.rows.length;

// Les suites d'une ligne de cases (1 : noire) : [3, 1], ou [0] si elle est vide.
export function runs(cells) {
  const out = [];
  let n = 0;
  for (const c of cells) {
    if (c === 1) n++;
    else if (n) { out.push(n); n = 0; }
  }
  if (n) out.push(n);
  return out.length ? out : [0];
}

// Les indices du bord : pour chaque ligne et chaque colonne.
export function clues(p) {
  const n = sizeOf(p);
  const grid = p.rows.map((r) => [...r].map((c) => (c === '#' ? 1 : 0)));
  return {
    rows: grid.map(runs),
    cols: Array.from({ length: n }, (_, c) => runs(grid.map((r) => r[c]))),
  };
}

// Une partie : la grille (0 vide, 1 noire, 2 croix « sûrement vide »).
export function newPixels(id) {
  const p = PUZZLES.find((x) => x.id === id) ?? PUZZLES[0];
  const n = sizeOf(p);
  return { id: p.id, n, grid: Array(n * n).fill(0), moves: 0, secs: 0, done: false };
}

const same = (a, b) => a.length === b.length && a.every((x, i) => x === b[i]);
const line = (g, k, horiz) => Array.from({ length: g.n }, (_, j) => (horiz ? g.grid[k * g.n + j] : g.grid[j * g.n + k]) === 1 ? 1 : 0);

// Lignes et colonnes dont les cases noires collent déjà à leurs indices.
export function linesOk(game) {
  const p = PUZZLES.find((x) => x.id === game.id);
  const cl = clues(p);
  return {
    rows: cl.rows.map((r, k) => same(runs(line(game, k, true)), r)),
    cols: cl.cols.map((c, k) => same(runs(line(game, k, false)), c)),
  };
}

// Pose une valeur sur une case (0, 1 ou 2). Fini quand toutes les lignes et
// colonnes collent à leurs indices : les croix restantes deviennent du vide.
export function paint(game, i, v) {
  if (game.done || i < 0 || i >= game.grid.length || ![0, 1, 2].includes(v) || game.grid[i] === v) return game;
  const grid = [...game.grid];
  grid[i] = v;
  const g = { ...game, grid, moves: game.moves + 1 };
  const ok = linesOk(g);
  return ok.rows.every(Boolean) && ok.cols.every(Boolean) ? { ...g, done: true, grid: grid.map((x) => (x === 1 ? 1 : 0)) } : g;
}

// ---------- vérification : combien de solutions pour ces indices ? ----------
// Toutes les façons de poser les suites dans une ligne de n cases qui
// respectent ce qu'on sait déjà (known : -1 inconnu, 0 vide, 1 noire).
function placements(clue, n, known) {
  const res = [];
  const blocks = clue[0] === 0 ? [] : clue;
  const rec = (b, start, acc) => {
    if (b === blocks.length) {
      const row = [...acc, ...Array(n - acc.length).fill(0)];
      if (row.every((v, i) => known[i] === -1 || known[i] === v)) res.push(row);
      return;
    }
    const restLen = blocks.slice(b + 1).reduce((s, x) => s + x + 1, 0);
    for (let s = start; s + blocks[b] + restLen <= n; s++) {
      const next = [...acc, ...Array(s - acc.length).fill(0), ...Array(blocks[b]).fill(1)];
      if (b < blocks.length - 1) next.push(0);
      if (next.slice(0, s + blocks[b]).every((v, i) => known[i] === -1 || known[i] === v)) rec(b + 1, next.length, next);
    }
  };
  rec(0, 0, []);
  return res;
}

// Le nombre de solutions (on s'arrête à limit) : déduction ligne par ligne,
// puis on essaie une case quand plus rien ne se déduit.
export function countSolutions(rowClues, colClues, limit = 2) {
  const n = rowClues.length;
  const solve = (grid) => {
    let changed = true;
    while (changed) {
      changed = false;
      for (const horiz of [true, false]) {
        for (let k = 0; k < n; k++) {
          const cells = Array.from({ length: n }, (_, j) => (horiz ? k * n + j : j * n + k));
          const known = cells.map((i) => grid[i]);
          if (!known.includes(-1)) {
            if (!same(runs(known), horiz ? rowClues[k] : colClues[k])) return 0;
            continue;
          }
          const opts = placements(horiz ? rowClues[k] : colClues[k], n, known);
          if (!opts.length) return 0;
          cells.forEach((i, j) => {
            if (grid[i] !== -1) return;
            const v = opts[0][j];
            if (opts.every((o) => o[j] === v)) { grid[i] = v; changed = true; }
          });
        }
      }
    }
    const free = grid.indexOf(-1);
    if (free < 0) return 1;
    let total = 0;
    for (const v of [1, 0]) {
      const g = [...grid];
      g[free] = v;
      total += solve(g);
      if (total >= limit) return total;
    }
    return total;
  };
  return solve(Array(n * n).fill(-1));
}
