// Casse-briques, un jeu de la borne d'arcade : renvoie la balle avec la
// raquette pour casser toutes les briques. 3 vies ; à chaque niveau, plus
// de rangées, des briques plus dures et une balle plus rapide. Logique pure
// (sans DOM, sans hasard), testée par tests/bricks.test.js.

export const BW = 100; // largeur du terrain (unités)
export const BH = 140; // hauteur
export const PADDLE_Y = 128; // haut de la raquette
export const BALL_R = 1.8;
const COLS = 8, MARGIN = 3, GAP = 1, ROW_H = 4.5, TOP = 14;

const paddleW = (level) => Math.max(12, 21 - (level - 1));
const speed = (level) => 0.055 * (1 + 0.08 * (level - 1)); // unités par milliseconde

// Les briques du niveau : de plus en plus de rangées ; en haut, des briques à 2 ou 3 coups.
function wall(level) {
  const rows = Math.min(4 + level, 9);
  const w = (BW - 2 * MARGIN - (COLS - 1) * GAP) / COLS;
  const bricks = [];
  for (let r = 0; r < rows; r++) {
    const hp = level >= 3 && r < Math.floor(level / 2) ? Math.min(3, 1 + Math.floor(level / 3)) : 1;
    for (let c = 0; c < COLS; c++) bricks.push({ x: MARGIN + c * (w + GAP), y: TOP + r * (ROW_H + GAP), w, h: ROW_H, hp, color: 1 + (r % 5) });
  }
  return bricks;
}

const onPaddle = (x) => ({ x, y: PADDLE_Y - BALL_R, vx: 0, vy: 0 });

export function newBricks(level = 1, score = 0, lives = 3) {
  return { level, lives, score, paddle: BW / 2, pw: paddleW(level), ball: onPaddle(BW / 2), served: false, bricks: wall(level), over: false, cleared: false };
}

// Lance la balle (vers le haut, un peu à droite).
export function serve(game) {
  if (game.served || game.over || game.cleared) return game;
  const v = speed(game.level);
  return { ...game, served: true, ball: { ...game.ball, vx: v * 0.5, vy: -v * 0.866 } };
}

// La raquette suit le doigt ; tant que la balle n'est pas lancée, elle est posée dessus.
export function movePaddle(game, x) {
  const half = game.pw / 2;
  const paddle = Math.min(BW - half, Math.max(half, x));
  return { ...game, paddle, ball: game.served ? game.ball : onPaddle(paddle) };
}

// Avance de ms millisecondes (par petits pas, pour ne jamais traverser une brique).
export function stepBricks(game, ms) {
  if (!game.served || game.over || game.cleared) return game;
  let g = game;
  let left = Math.min(ms, 100);
  while (left > 0 && g.served && !g.over && !g.cleared) {
    const dt = Math.min(4, left);
    left -= dt;
    g = tick(g, dt);
  }
  return g;
}

function tick(g, dt) {
  let { x, y, vx, vy } = g.ball;
  const prevY = y;
  x += vx * dt;
  y += vy * dt;
  // les murs
  if (x - BALL_R < 0) { x = BALL_R; vx = Math.abs(vx); }
  if (x + BALL_R > BW) { x = BW - BALL_R; vx = -Math.abs(vx); }
  if (y - BALL_R < 0) { y = BALL_R; vy = Math.abs(vy); }
  // la raquette : l'angle dépend de l'endroit touché (au bord, ça part de biais)
  const half = g.pw / 2;
  if (vy > 0 && prevY + BALL_R <= PADDLE_Y + 0.01 && y + BALL_R >= PADDLE_Y && x >= g.paddle - half - BALL_R && x <= g.paddle + half + BALL_R) {
    const off = Math.max(-1, Math.min(1, (x - g.paddle) / half));
    const v = Math.hypot(vx, vy);
    const a = (off * 60 * Math.PI) / 180;
    vx = v * Math.sin(a);
    vy = -v * Math.cos(a);
    y = PADDLE_Y - BALL_R;
  }
  // une brique touchée : elle perd un coup, la balle rebondit du côté touché
  let bricks = g.bricks;
  let score = g.score;
  const i = bricks.findIndex((b) => b.hp > 0 && overlap(x, y, b));
  if (i >= 0) {
    const b = bricks[i];
    const dx = Math.min(Math.abs(x - b.x), Math.abs(x - (b.x + b.w)));
    const dy = Math.min(Math.abs(y - b.y), Math.abs(y - (b.y + b.h)));
    const inside = x > b.x && x < b.x + b.w;
    if (inside || dy < dx) vy = -vy;
    else vx = -vx;
    bricks = bricks.map((k, j) => (j === i ? { ...k, hp: k.hp - 1 } : k));
    score += bricks[i].hp === 0 ? 10 * g.level : 5;
  }
  // la balle tombe : une vie de moins, elle revient sur la raquette
  if (y - BALL_R > BH) {
    const lives = g.lives - 1;
    return { ...g, bricks, score, lives, served: false, ball: onPaddle(g.paddle), over: lives <= 0 };
  }
  const cleared = bricks.every((b) => b.hp <= 0);
  return { ...g, bricks, score, ball: { x, y, vx, vy }, cleared };
}

function overlap(x, y, b) {
  const cx = Math.max(b.x, Math.min(x, b.x + b.w));
  const cy = Math.max(b.y, Math.min(y, b.y + b.h));
  return (x - cx) ** 2 + (y - cy) ** 2 < BALL_R ** 2;
}

// Niveau suivant : on garde le score et les vies.
export const nextBricks = (game) => newBricks(game.level + 1, game.score, game.lives);
