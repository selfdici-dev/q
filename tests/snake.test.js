import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SN, snakeDelay, newSnake, turnSnake, stepSnake } from '../js/snake.js';

const on = (list, [r, c]) => list.some(([a, b]) => a === r && b === c);

test('serpent : départ au milieu, vers la droite, un fruit hors du serpent', () => {
  const g = newSnake(4);
  assert.equal(g.snake.length, 3);
  assert.deepEqual(g.snake[0], [7, 4]);
  assert.equal(g.dir, 'droite');
  assert.ok(g.food && !on(g.snake, g.food));
  assert.ok(g.food.every((v) => v >= 0 && v < SN));
  assert.deepEqual(newSnake(4), newSnake(4)); // même graine, même partie
});

test('serpent : il avance, tourne, et ne fait jamais demi-tour', () => {
  let g = { ...newSnake(1), food: [0, 0] };
  g = stepSnake(g);
  assert.deepEqual(g.snake, [[7, 5], [7, 4], [7, 3]]);
  assert.equal(turnSnake(g, 'gauche'), g); // demi-tour refusé
  assert.equal(turnSnake(g, 'n’importe'), g);
  g = stepSnake(turnSnake(g, 'haut'));
  assert.deepEqual(g.snake[0], [6, 5]);
  assert.equal(g.dir, 'haut');
  assert.equal(g.snake.length, 3);
});

test('serpent : un fruit mangé le fait grandir et en fait venir un autre', () => {
  const g = { ...newSnake(2), food: [7, 5] };
  const next = stepSnake(g);
  assert.equal(next.score, 1);
  assert.equal(next.snake.length, 4);
  assert.deepEqual(next.snake[0], [7, 5]);
  assert.ok(next.food && !on(next.snake, next.food));
});

test('serpent : perdu contre un bord ou contre sa queue (mais pas contre le bout qui s’en va)', () => {
  let g = { ...newSnake(3), food: [0, 0] };
  for (let k = 0; k < 20 && !g.over; k++) g = stepSnake(g);
  assert.equal(g.over, true); // le bord de droite
  assert.equal(stepSnake(g), g); // fini : plus rien ne bouge
  // un serpent en boucle qui se mord
  const loop = { snake: [[5, 5], [5, 6], [6, 6], [6, 5], [6, 4]], dir: 'bas', next: 'bas', food: [0, 0], rnd: 1, score: 0, over: false };
  assert.equal(stepSnake(loop).over, true);
  // la tête peut prendre la place du bout de la queue, qui avance en même temps
  const chase = { snake: [[5, 5], [5, 6], [6, 6], [6, 5]], dir: 'bas', next: 'bas', food: [0, 0], rnd: 1, score: 0, over: false };
  assert.equal(stepSnake(chase).over, false);
});

test('serpent : de plus en plus vite, avec une limite', () => {
  assert.equal(snakeDelay(0), 170);
  assert.ok(snakeDelay(10) < snakeDelay(4));
  assert.equal(snakeDelay(500), 70);
});
