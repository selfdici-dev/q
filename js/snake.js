// Serpent, un jeu de la borne d'arcade : guide le serpent vers les fruits ;
// il grandit à chaque fruit et va de plus en plus vite. Ne touche ni les
// bords ni ta queue. Logique pure (sans DOM), testée par tests/snake.test.js.
import { rand } from './games.js';

export const SN = 15; // grille de 15 × 15
const DIRS = { haut: [-1, 0], bas: [1, 0], gauche: [0, -1], droite: [0, 1] };
const OPPOSITE = { haut: 'bas', bas: 'haut', gauche: 'droite', droite: 'gauche' };

// Millisecondes par pas : plus court tous les 5 fruits, jamais sous 70.
export const snakeDelay = (score) => Math.max(70, 170 - Math.floor(score / 5) * 12);

// Un fruit sur une case libre (null si le serpent remplit toute la grille).
function placeFood(snake, rnd) {
  const free = [];
  for (let r = 0; r < SN; r++) for (let c = 0; c < SN; c++) if (!snake.some(([a, b]) => a === r && b === c)) free.push([r, c]);
  if (!free.length) return [null, rnd];
  const [x, s] = rand(rnd);
  return [free[Math.floor(x * free.length)], s];
}

export function newSnake(seed = 1) {
  const mid = Math.floor(SN / 2);
  const snake = [[mid, 4], [mid, 3], [mid, 2]]; // la tête d'abord
  const [food, rnd] = placeFood(snake, seed | 0);
  return { snake, dir: 'droite', next: 'droite', food, rnd, score: 0, over: false };
}

// Tourne au prochain pas ; le demi-tour est interdit.
export function turnSnake(game, dir) {
  if (!DIRS[dir] || game.over || dir === OPPOSITE[game.dir]) return game;
  return { ...game, next: dir };
}

// Un pas : le serpent avance d'une case. Un fruit mangé : il grandit, un autre apparaît.
export function stepSnake(game) {
  if (game.over) return game;
  const dir = game.next;
  const [dr, dc] = DIRS[dir];
  const head = [game.snake[0][0] + dr, game.snake[0][1] + dc];
  const eats = Boolean(game.food) && head[0] === game.food[0] && head[1] === game.food[1];
  const body = eats ? game.snake : game.snake.slice(0, -1); // la queue avance, sauf quand il mange
  const hit = head[0] < 0 || head[1] < 0 || head[0] >= SN || head[1] >= SN || body.some(([a, b]) => a === head[0] && b === head[1]);
  if (hit) return { ...game, dir, over: true };
  const snake = [head, ...body];
  if (!eats) return { ...game, dir, snake };
  const [food, rnd] = placeFood(snake, game.rnd);
  return { ...game, dir, snake, food, rnd, score: game.score + 1, over: !food };
}
