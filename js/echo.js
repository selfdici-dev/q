// Écho, un jeu de la borne d'arcade : quatre touches s'allument dans un
// ordre ; refais la suite. À chaque tour, une touche de plus. Une erreur,
// et c'est fini. Logique pure (sans DOM), testée par tests/echo.test.js.
import { rand } from './games.js';

export const ECHO_PADS = 4;
// Durée d'une lumière pendant la démonstration : de plus en plus vite.
export const echoDelay = (len) => Math.max(280, 620 - len * 25);

const pad = (rnd) => {
  const [x, s] = rand(rnd);
  return [Math.floor(x * ECHO_PADS), s];
};

export function newEcho(seed = 1) {
  const [p, rnd] = pad(seed | 0);
  return { seq: [p], step: 0, rnd, score: 0, over: false };
}

// Une touche : juste, on avance ; la suite finie, un tour de plus ; fausse, c'est perdu.
export function pressEcho(game, p) {
  if (game.over) return { game, ok: false, round: false };
  if (p !== game.seq[game.step]) return { game: { ...game, over: true }, ok: false, round: false };
  const step = game.step + 1;
  if (step < game.seq.length) return { game: { ...game, step }, ok: true, round: false };
  const [next, rnd] = pad(game.rnd);
  return { game: { ...game, seq: [...game.seq, next], step: 0, rnd, score: game.seq.length }, ok: true, round: true };
}
