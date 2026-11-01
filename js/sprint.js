// Sprint, un jeu de la borne d'arcade : ton bonhomme court dans la salle ;
// touche l'écran pour sauter par-dessus les haltères, les disques, les
// kettlebells et les bancs, et attrape les gourdes au passage (+10). De plus
// en plus vite ; un obstacle touché, c'est fini. Score : les mètres courus,
// plus les gourdes. Logique pure (sans DOM ; le hasard vient d'une graine),
// testée par tests/sprint.test.js.
import { rand } from './games.js';

export const SW = 128; // largeur du terrain (unités)
export const SH = 64; // hauteur
export const GROUND = 54; // le sol, compté depuis le haut (comme à l'écran)
export const RUNNER_X = 30; // le milieu du bonhomme
export const RW = 6; // sa boîte pour les chocs : largeur…
export const RH = 15; // …et hauteur
const G = 0.000533; // gravité (unités par ms²)
const JUMP = 0.16; // élan du saut (unités par ms) : ≈ 24 de haut, ≈ 0,6 s en l'air
const START = 0.07; // vitesse de départ (unités par ms)
const MAX = 0.16;
const STEP = 8; // la course avance par pas de 8 ms

// Les obstacles : largeur, hauteur. Le banc et la double haltère, plus larges,
// arrivent après 150 m.
export const OBSTACLES = {
  haltere: { w: 9, h: 6 },
  disque: { w: 4, h: 12 },
  kettle: { w: 7, h: 9 },
  banc: { w: 18, h: 6 },
  double: { w: 19, h: 6 },
};
const EARLY = ['haltere', 'disque', 'kettle'];
const LATE = ['haltere', 'disque', 'kettle', 'banc', 'double'];
const ITEM = { w: 5, h: 7, bonus: 10 };

export const sprintSpeed = (dist) => Math.min(MAX, START + dist * 0.0000045);
export const sprintScore = (g) => Math.floor(g.dist / 10) + g.bonus;

export function newSprint(seed = 1) {
  return { rnd: seed | 0, dist: 0, bonus: 0, y: 0, vy: 0, buffer: false, obstacles: [], items: [], nextIn: 220, started: false, over: false, jumps: 0 };
}

// Toucher l'écran : le premier départ, puis un saut s'il a les pieds au sol
// (touché juste avant d'atterrir, le saut part à l'atterrissage).
export function jumpSprint(g) {
  if (g.over) return g;
  if (g.y === 0 && g.vy === 0) return { ...g, started: true, vy: JUMP, jumps: g.jumps + 1, buffer: false };
  if (g.vy < 0 && g.y < 5) return { ...g, buffer: true };
  return g;
}

const draw = (g) => {
  const [x, rnd] = rand(g.rnd);
  g.rnd = rnd;
  return x;
};
const overlap = (a0, a1, b0, b1) => a0 < b1 && b0 < a1;

// Fait avancer la course de ms millisecondes (par pas de 8 ms).
export function stepSprint(game, ms) {
  if (game.over || !game.started) return game;
  const g = { ...game, obstacles: game.obstacles.map((o) => ({ ...o })), items: game.items.map((o) => ({ ...o })) };
  for (let left = ms; left > 0 && !g.over; left -= STEP) {
    const dt = Math.min(STEP, left);
    const speed = sprintSpeed(g.dist);
    // le bonhomme : saut, retombée, atterrissage
    if (g.y > 0 || g.vy > 0) {
      g.vy -= G * dt;
      g.y = Math.max(0, g.y + g.vy * dt);
      if (g.y === 0) {
        g.vy = 0;
        if (g.buffer) Object.assign(g, { vy: JUMP, buffer: false, jumps: g.jumps + 1 });
      }
    }
    // la salle défile
    const move = speed * dt;
    g.dist += move;
    for (const o of g.obstacles) o.x -= move;
    for (const o of g.items) o.x -= move;
    g.obstacles = g.obstacles.filter((o) => o.x + o.w > -10);
    g.items = g.items.filter((o) => o.x + ITEM.w > -10 && !o.taken);
    // un nouvel obstacle, à une distance qui laisse toujours le temps de sauter
    g.nextIn -= move;
    if (g.nextIn <= 0) {
      const kinds = g.dist < 1500 ? EARLY : LATE;
      const kind = kinds[Math.floor(draw(g) * kinds.length)];
      const { w, h } = OBSTACLES[kind];
      g.obstacles.push({ kind, x: SW + 8, w, h });
      if (draw(g) < 0.35) g.items.push({ x: SW + 8 + w / 2 - ITEM.w / 2 + (draw(g) < 0.5 ? 0 : 34), y: h + 6 + draw(g) * 10, taken: false });
      const gap = 820 + draw(g) * Math.max(320, 1100 - g.dist * 0.03); // ms entre deux obstacles
      g.nextIn = gap * speed + w;
    }
    // les chocs (avec un peu d'indulgence sur les bords)
    const [x0, x1] = [RUNNER_X - RW / 2, RUNNER_X + RW / 2];
    if (g.obstacles.some((o) => overlap(x0 + 0.8, x1 - 0.8, o.x, o.x + o.w) && g.y < o.h - 0.8)) g.over = true;
    for (const it of g.items) {
      if (!it.taken && overlap(x0, x1, it.x, it.x + ITEM.w) && overlap(g.y, g.y + RH, it.y, it.y + ITEM.h)) {
        it.taken = true;
        g.bonus += ITEM.bonus;
      }
    }
  }
  return g;
}
