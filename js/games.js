// Les jeux de la borne d'arcade de la Salle. Logique pure (sans DOM), testée
// par tests/games.test.js.
// - Blocs : poser des pièces sur une grille 8 × 8 ; une ligne ou une colonne
//   pleine disparaît. Trois pièces à la fois ; la partie s'arrête quand aucune
//   pièce restante ne rentre.
// - Calcul éclair : 60 secondes de calcul mental utile (prix, soldes,
//   pourcentages, intérêts), une réponse parmi quatre ; ça monte en
//   difficulté tant que tu enchaînes.

// Hasard reproductible : un entier d'état, avancé à chaque tirage (mulberry32).
export function rand(s) {
  s = (s + 0x6d2b79f5) | 0;
  let t = Math.imul(s ^ (s >>> 15), 1 | s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return [((t ^ (t >>> 14)) >>> 0) / 4294967296, s];
}

// ---------- Blocs ----------
export const SIZE = 8;
// Pièces : cases [ligne, colonne] depuis le coin haut-gauche ; w = poids du
// tirage (les grosses pièces sont plus rares).
export const SHAPES = [
  { c: [[0, 0]], w: 2 },
  { c: [[0, 0], [0, 1]], w: 3 }, { c: [[0, 0], [1, 0]], w: 3 },
  { c: [[0, 0], [0, 1], [0, 2]], w: 3 }, { c: [[0, 0], [1, 0], [2, 0]], w: 3 },
  { c: [[0, 0], [0, 1], [0, 2], [0, 3]], w: 2 }, { c: [[0, 0], [1, 0], [2, 0], [3, 0]], w: 2 },
  { c: [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]], w: 1 }, { c: [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]], w: 1 },
  { c: [[0, 0], [0, 1], [1, 0], [1, 1]], w: 3 },
  { c: [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]], w: 1 },
  { c: [[0, 0], [1, 0], [1, 1]], w: 2 }, { c: [[0, 1], [1, 0], [1, 1]], w: 2 },
  { c: [[0, 0], [0, 1], [1, 0]], w: 2 }, { c: [[0, 0], [0, 1], [1, 1]], w: 2 },
  { c: [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]], w: 1 }, { c: [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]], w: 1 },
  { c: [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]], w: 1 }, { c: [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]], w: 1 },
  { c: [[0, 0], [0, 1], [0, 2], [1, 1]], w: 2 }, { c: [[0, 1], [1, 0], [1, 1], [2, 1]], w: 2 },
  { c: [[0, 1], [1, 0], [1, 1], [1, 2]], w: 2 }, { c: [[0, 0], [1, 0], [1, 1], [2, 0]], w: 2 },
  { c: [[0, 1], [0, 2], [1, 0], [1, 1]], w: 2 }, { c: [[0, 0], [0, 1], [1, 1], [1, 2]], w: 2 },
  { c: [[0, 0], [1, 0], [1, 1], [2, 1]], w: 2 }, { c: [[0, 1], [1, 0], [1, 1], [2, 0]], w: 2 },
  { c: [[0, 0], [1, 0], [2, 0], [2, 1]], w: 2 }, { c: [[0, 0], [0, 1], [0, 2], [1, 0]], w: 2 },
  { c: [[0, 0], [0, 1], [1, 1], [2, 1]], w: 2 }, { c: [[0, 2], [1, 0], [1, 1], [1, 2]], w: 2 },
];
export const COLORS = 5; // couleurs des pièces (celles des séances)
const WEIGHT = SHAPES.reduce((a, s) => a + s.w, 0);

const at = (grid, r, c) => grid[r * SIZE + c];
export function canPlace(grid, cells, r, c) {
  return cells.every(([dr, dc]) => r + dr >= 0 && r + dr < SIZE && c + dc >= 0 && c + dc < SIZE && !at(grid, r + dr, c + dc));
}
export function fitsAnywhere(grid, cells) {
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) if (canPlace(grid, cells, r, c)) return true;
  return false;
}

// Trois pièces au hasard (au moins une qui rentre, si c'est possible).
function draw(grid, rnd) {
  let best = null;
  for (let tries = 0; tries < 12; tries++) {
    const set = [];
    for (let k = 0; k < 3; k++) {
      let x;
      [x, rnd] = rand(rnd);
      let pick = x * WEIGHT;
      const i = SHAPES.findIndex((s) => (pick -= s.w) < 0);
      [x, rnd] = rand(rnd);
      set.push({ shape: i, color: 1 + Math.floor(x * COLORS) });
    }
    best = set;
    if (set.some((p) => fitsAnywhere(grid, SHAPES[p.shape].c))) break;
  }
  return [best, rnd];
}

export function newBlocks(seed = 1) {
  const grid = Array(SIZE * SIZE).fill(0);
  const [pieces, rnd] = draw(grid, seed | 0);
  return { grid, pieces, rnd, score: 0, streak: 0, lines: 0, over: false };
}

// Points : 1 par case posée, puis 10 × n² pour n lignes effacées d'un coup, plus
// 10 × la série (lignes effacées à plusieurs coups de suite).
export function blockPoints(cells, n, streak) {
  return cells + (n ? 10 * n * n + 10 * Math.max(0, streak - 1) : 0);
}

// Pose la pièce i en (r, c) : renvoie la nouvelle partie (ou null si
// impossible) et les cases effacées (pour l'animation).
export function placeBlock(game, i, r, c) {
  const p = game.pieces[i];
  if (!p || game.over) return null;
  const cells = SHAPES[p.shape].c;
  if (!canPlace(game.grid, cells, r, c)) return null;
  const grid = [...game.grid];
  for (const [dr, dc] of cells) grid[(r + dr) * SIZE + c + dc] = p.color;
  const rows = [], cols = [];
  for (let k = 0; k < SIZE; k++) {
    if (Array.from({ length: SIZE }, (_, j) => grid[k * SIZE + j]).every(Boolean)) rows.push(k);
    if (Array.from({ length: SIZE }, (_, j) => grid[j * SIZE + k]).every(Boolean)) cols.push(k);
  }
  const cleared = new Set();
  for (const k of rows) for (let j = 0; j < SIZE; j++) cleared.add(k * SIZE + j);
  for (const k of cols) for (let j = 0; j < SIZE; j++) cleared.add(j * SIZE + k);
  for (const x of cleared) grid[x] = 0;
  const n = rows.length + cols.length;
  const streak = n ? game.streak + 1 : 0;
  let pieces = game.pieces.map((q, k) => (k === i ? null : q));
  let rnd = game.rnd;
  if (pieces.every((q) => !q)) [pieces, rnd] = draw(grid, rnd);
  const over = pieces.every((q) => !q || !fitsAnywhere(grid, SHAPES[q.shape].c));
  return {
    game: { grid, pieces, rnd, score: game.score + blockPoints(cells.length, n, streak), streak, lines: game.lines + n, over },
    cleared: [...cleared],
    lines: n,
  };
}

// ---------- Calcul éclair ----------
export const CALC_TIME = 60;

const pick = (rnd, list) => {
  const [x, s] = rand(rnd);
  return [list[Math.floor(x * list.length)], s];
};
const int = (rnd, lo, hi) => {
  const [x, s] = rand(rnd);
  return [lo + Math.floor(x * (hi - lo + 1)), s];
};
const fr = (v) => Number(v).toLocaleString('fr-FR', { maximumFractionDigits: 2 });

// Une question du niveau donné : { text, answer, options (4, dont la bonne) }.
// Niveaux : 0 additions et tables, 1 soustractions et doubles, 2 pourcentages
// simples et soldes, 3 multiplications à 2 chiffres et divisions, 4+ intérêts,
// pourcentages quelconques, prix à l'unité.
export function calcQuestion(rnd, level) {
  const kinds = [['add', 'table'], ['sub', 'add', 'table'], ['pct', 'sale', 'sub'], ['mul2', 'div', 'pct', 'sale'], ['interest', 'pct2', 'unit', 'mul2']][Math.min(level, 4)];
  let kind, a, b, text, answer;
  [kind, rnd] = pick(rnd, kinds);
  if (kind === 'add') { [a, rnd] = int(rnd, 12, 89); [b, rnd] = int(rnd, 12, 89); text = `${a} + ${b}`; answer = a + b; }
  else if (kind === 'sub') { [a, rnd] = int(rnd, 40, 150); [b, rnd] = int(rnd, 11, a - 5); text = `${a} − ${b}`; answer = a - b; }
  else if (kind === 'table') { [a, rnd] = int(rnd, 3, 12); [b, rnd] = int(rnd, 3, 12); text = `${a} × ${b}`; answer = a * b; }
  else if (kind === 'mul2') { [a, rnd] = int(rnd, 12, 49); [b, rnd] = int(rnd, 3, 9); text = `${a} × ${b}`; answer = a * b; }
  else if (kind === 'div') { [b, rnd] = int(rnd, 3, 12); [a, rnd] = int(rnd, 4, 15); text = `${a * b} ÷ ${b}`; answer = a; }
  else if (kind === 'pct') { let p; [p, rnd] = pick(rnd, [10, 20, 25, 50]); [a, rnd] = int(rnd, 2, 20); a *= 20; text = `${p} % de ${a}`; answer = (a * p) / 100; }
  else if (kind === 'sale') { let p; [p, rnd] = pick(rnd, [10, 20, 25, 30, 50]); [a, rnd] = int(rnd, 2, 15); a *= 10; text = `${a} € soldé −${p} %`; answer = a - (a * p) / 100; }
  else if (kind === 'pct2') { let p; [p, rnd] = pick(rnd, [5, 15, 30, 40, 75]); [a, rnd] = int(rnd, 2, 16); a *= 20; text = `${p} % de ${a}`; answer = (a * p) / 100; }
  else if (kind === 'interest') { let p; [p, rnd] = pick(rnd, [2, 3, 4, 5, 10]); [a, rnd] = int(rnd, 1, 20); a *= 100; text = `${fr(a)} € placés à ${p} % : intérêts en 1 an`; answer = (a * p) / 100; }
  else { let n; [n, rnd] = pick(rnd, [2, 3, 4, 5, 6, 8]); [a, rnd] = int(rnd, 2, 9); text = `${n} articles pour ${fr(a * n)} € : prix d'un`; answer = a; }
  // trois mauvaises réponses proches et crédibles, toutes différentes
  const wrong = new Set();
  const near = [1, 2, 10, -1, -2, -10, 5, -5, answer, -answer / 2];
  let guard = 0;
  while (wrong.size < 3 && guard++ < 50) {
    let d;
    [d, rnd] = pick(rnd, near);
    const w = Math.round((answer + d) * 100) / 100;
    if (w > 0 && w !== answer) wrong.add(w);
  }
  for (let k = 1; wrong.size < 3; k++) wrong.add(answer + k * 3);
  const options = [answer, ...wrong];
  for (let k = options.length - 1; k > 0; k--) {
    let x;
    [x, rnd] = rand(rnd);
    const j = Math.floor(x * (k + 1));
    [options[k], options[j]] = [options[j], options[k]];
  }
  return { q: { text, answer, options, kind }, rnd };
}

// Une partie de Calcul éclair : score, série, niveau (monte toutes les 3
// bonnes réponses d'affilée, redescend d'un cran à chaque erreur).
export function newCalc(seed = 1) {
  const { q, rnd } = calcQuestion(seed | 0, 0);
  return { q, rnd, score: 0, streak: 0, best: 0, level: 0, done: 0, ok: 0 };
}

export function answerCalc(game, value) {
  const right = value === game.q.answer;
  const streak = right ? game.streak + 1 : 0;
  const level = right ? (streak % 3 === 0 ? game.level + 1 : game.level) : Math.max(0, game.level - 1);
  const score = game.score + (right ? 1 + Math.floor(streak / 5) : 0);
  const { q, rnd } = calcQuestion(game.rnd, level);
  return { game: { q, rnd, score, streak, best: Math.max(game.best, streak), level, done: game.done + 1, ok: game.ok + (right ? 1 : 0) }, right };
}
