import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newSprint, jumpSprint, stepSprint, sprintScore, sprintSpeed, OBSTACLES, RUNNER_X, RW } from '../js/sprint.js';

// un robot : saute pour être au plus haut au milieu de l'obstacle qui arrive
function bot(seed, meters) {
  let g = jumpSprint(newSprint(seed));
  while (!g.over && Math.floor(g.dist / 10) < meters) {
    const next = g.obstacles.filter((o) => o.x + o.w > RUNNER_X - RW / 2).sort((a, b) => a.x - b.x)[0];
    if (next && g.y === 0 && g.vy === 0 && next.x - (RUNNER_X + RW / 2) + next.w / 2 < sprintSpeed(g.dist) * 300 + 4) g = jumpSprint(g);
    g = stepSprint(g, 16);
  }
  return g;
}

test('sprint : la première touche fait partir, puis on ne saute que les pieds au sol', () => {
  let g = newSprint(3);
  assert.equal(stepSprint(g, 500), g); // pas parti : rien ne bouge
  g = jumpSprint(g);
  assert.ok(g.started && g.vy > 0);
  g = stepSprint(g, 100);
  assert.ok(g.y > 0);
  assert.equal(jumpSprint(g), g); // en l'air : pas de deuxième saut
  // le saut monte à ≈ 24 et dure ≈ 0,6 s
  let peak = 0, t = 0;
  let h = jumpSprint(newSprint(5));
  do { h = stepSprint(h, 8); t += 8; peak = Math.max(peak, h.y); } while (h.y > 0 && t < 2000);
  assert.ok(peak > 22 && peak < 26, `hauteur ${peak}`);
  assert.ok(t > 520 && t < 680, `durée ${t}`);
  // touché juste avant d'atterrir : le saut part à l'atterrissage
  let b = jumpSprint(newSprint(5));
  while (!(b.vy < 0 && b.y < 4)) b = stepSprint(b, 8);
  b = jumpSprint(b);
  assert.equal(b.buffer, true);
  b = stepSprint(b, 120);
  assert.ok(b.y > 0 && b.jumps === 2);
});

test('sprint : sans sauter, le premier obstacle arrête la course ; plus on court, plus ça va vite', () => {
  let g = jumpSprint(newSprint(7));
  g = { ...g, vy: 0 };
  for (let k = 0; k < 2000 && !g.over; k++) g = stepSprint(g, 16);
  assert.equal(g.over, true);
  assert.ok(sprintScore(g) > 0 && sprintScore(g) < 100);
  assert.equal(stepSprint(g, 100), g); // fini : plus rien ne bouge
  assert.ok(sprintSpeed(0) < sprintSpeed(10000));
  assert.equal(sprintSpeed(1e9), sprintSpeed(2e9)); // la vitesse a un plafond
});

test('sprint : chaque obstacle peut être sauté (un robot court 3 000 m, quelle que soit la partie)', () => {
  for (const seed of [1, 2, 3, 42, 99, 2026]) {
    const g = bot(seed, 3000);
    assert.equal(g.over, false, `partie ${seed} : arrêt à ${Math.floor(g.dist / 10)} m`);
    assert.ok(g.bonus > 0, 'des gourdes attrapées');
    assert.ok(g.obstacles.every((o) => OBSTACLES[o.kind]));
  }
  // même graine, même course
  assert.deepEqual(bot(9, 300), bot(9, 300));
  // le score : les mètres plus les gourdes
  const g = bot(4, 500);
  assert.equal(sprintScore(g), Math.floor(g.dist / 10) + g.bonus);
});
