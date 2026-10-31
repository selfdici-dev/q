// Code secret, un jeu de la borne d'arcade : trouve la suite de 4 couleurs
// cachée (parmi 6, une couleur peut revenir) en 10 essais au plus. Après
// chaque essai : ● une bonne couleur à la bonne place, ○ une bonne couleur
// mal placée. Logique pure (sans DOM), testée par tests/code.test.js.
import { rand } from './games.js';

export const CODE_LEN = 4;
export const CODE_COLORS = 6;
export const CODE_TRIES = 10;

// ● et ○ d'un essai (chaque couleur du code ne compte qu'une fois).
export function scoreGuess(secret, guess) {
  let black = 0;
  const restSecret = [], restGuess = [];
  secret.forEach((c, i) => {
    if (c === guess[i]) black++;
    else { restSecret.push(c); restGuess.push(guess[i]); }
  });
  let white = 0;
  for (const c of restGuess) {
    const k = restSecret.indexOf(c);
    if (k >= 0) { white++; restSecret.splice(k, 1); }
  }
  return { black, white };
}

export function newCode(seed = 1) {
  let r = seed | 0;
  const secret = [];
  for (let i = 0; i < CODE_LEN; i++) {
    let x;
    [x, r] = rand(r);
    secret.push(1 + Math.floor(x * CODE_COLORS));
  }
  return { secret, guesses: [], won: false, over: false };
}

// Un essai : 4 couleurs de 1 à 6 (sinon rien ne change).
export function playGuess(game, guess) {
  if (game.won || game.over || guess.length !== CODE_LEN || guess.some((c) => !Number.isInteger(c) || c < 1 || c > CODE_COLORS)) return game;
  const res = scoreGuess(game.secret, guess);
  const guesses = [...game.guesses, { guess: [...guess], ...res }];
  const won = res.black === CODE_LEN;
  return { ...game, guesses, won, over: !won && guesses.length >= CODE_TRIES };
}
