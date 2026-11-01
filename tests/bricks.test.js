import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BW, BH, PADDLE_Y, BALL_R, newBricks, serve, movePaddle, stepBricks, nextBricks } from '../js/bricks.js';

const flying = (g, ball) => ({ ...g, served: true, ball });

test('casse-briques : un mur de briques, la balle posée sur la raquette, 3 vies', () => {
  const g = newBricks(1);
  assert.equal(g.bricks.length, 8 * 5);
  assert.ok(g.bricks.every((b) => b.hp === 1 && b.x >= 0 && b.x + b.w <= BW));
  assert.equal(g.lives, 3);
  assert.equal(g.served, false);
  assert.equal(g.ball.y, PADDLE_Y - BALL_R);
  // plus de rangées et des briques plus dures ensuite, une raquette plus petite
  const g5 = newBricks(5);
  assert.ok(g5.bricks.length > g.bricks.length);
  assert.ok(g5.bricks.some((b) => b.hp > 1));
  assert.ok(g5.pw < g.pw);
  // la raquette suit le doigt, sans sortir du terrain ; la balle reste dessus
  const m = movePaddle(g, -50);
  assert.equal(m.paddle, g.pw / 2);
  assert.equal(m.ball.x, m.paddle);
  assert.equal(stepBricks(g, 100), g); // pas lancée : rien ne bouge
});

test('casse-briques : la balle part vers le haut et rebondit sur les murs', () => {
  const g = serve(newBricks(1));
  assert.ok(g.ball.vy < 0 && g.ball.vx > 0);
  const moved = stepBricks(g, 50);
  assert.ok(moved.ball.y < g.ball.y);
  const left = stepBricks(flying(g, { x: BALL_R + 0.2, y: 80, vx: -0.05, vy: 0.01 }), 20);
  assert.ok(left.ball.vx > 0);
  const far = [{ x: 0, y: 100, w: 5, h: 2, hp: 1, color: 1 }]; // une brique loin de la balle
  const top = stepBricks({ ...flying(g, { x: 50, y: BALL_R + 0.2, vx: 0, vy: -0.05 }), bricks: far }, 20);
  assert.ok(top.ball.vy > 0);
});

test('casse-briques : la raquette renvoie la balle, de biais si on la touche au bord', () => {
  const g = newBricks(1);
  const mid = stepBricks(flying(g, { x: 50, y: PADDLE_Y - BALL_R - 0.5, vx: 0, vy: 0.05 }), 30);
  assert.ok(mid.ball.vy < 0);
  assert.ok(Math.abs(mid.ball.vx) < 1e-9);
  const edge = stepBricks(flying(g, { x: 50 + g.pw / 2 - 0.5, y: PADDLE_Y - BALL_R - 0.5, vx: 0, vy: 0.05 }), 30);
  assert.ok(edge.ball.vy < 0 && edge.ball.vx > 0.02);
});

test('casse-briques : une brique touchée disparaît et rapporte des points', () => {
  const g = newBricks(1);
  const b = g.bricks.at(-1); // la rangée du bas
  const hit = stepBricks(flying(g, { x: b.x + b.w / 2, y: b.y + b.h + BALL_R + 0.3, vx: 0, vy: -0.05 }), 20);
  assert.equal(hit.bricks.at(-1).hp, 0);
  assert.equal(hit.score, 10);
  assert.ok(hit.ball.vy > 0);
  // la dernière brique cassée : niveau fini, le suivant garde le score et les vies
  const last = { ...g, bricks: [{ ...b }], served: true, ball: { x: b.x + b.w / 2, y: b.y + b.h + BALL_R + 0.3, vx: 0, vy: -0.05 } };
  const done = stepBricks(last, 20);
  assert.equal(done.cleared, true);
  const next = nextBricks(done);
  assert.equal(next.level, 2);
  assert.equal(next.score, done.score);
  assert.equal(next.lives, done.lives);
});

test('casse-briques : la balle perdue coûte une vie, et à 0 c’est fini', () => {
  const g = newBricks(1);
  const fall = stepBricks(flying(g, { x: 5, y: BH - 1, vx: 0, vy: 0.05 }), 100);
  assert.equal(fall.lives, 2);
  assert.equal(fall.served, false);
  const end = stepBricks(flying({ ...g, lives: 1 }, { x: 5, y: BH - 1, vx: 0, vy: 0.05 }), 100);
  assert.equal(end.over, true);
  assert.equal(serve(end), end);
});
