// Paires, un jeu de la borne d'arcade : retourne les cartes deux par deux
// pour retrouver les paires. Moins de coups, plus d'étoiles ; à chaque
// niveau, plus de cartes. Logique pure (sans DOM), testée par tests/pairs.test.js.
import { rand } from './games.js';

export const PAIR_SYMBOLS = 20; // dessins différents possibles (choisis au hasard)

// Paires au niveau n : 6, 8, 10, 12, puis 15.
export const pairsCount = (level) => [6, 8, 10, 12][level - 1] ?? 15;
// Colonnes de la grille : 3 pour 12 cartes, 4 jusqu'à 24, 5 au-delà.
export const pairsCols = (cards) => (cards <= 12 ? 3 : cards <= 24 ? 4 : 5);

function shuffled(list, r) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    let x;
    [x, r] = rand(r);
    const j = Math.floor(x * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return [a, r];
}

// cards : le numéro de paire de chaque carte ; syms : le dessin de chaque paire.
export function newPairs(seed = 1, level = 1) {
  const n = pairsCount(level);
  let r = seed | 0;
  let cards, syms;
  [cards, r] = shuffled(Array.from({ length: n * 2 }, (_, i) => i >> 1), r);
  [syms, r] = shuffled(Array.from({ length: PAIR_SYMBOLS }, (_, i) => i), r);
  return { level, cards, syms: syms.slice(0, n), open: [], found: [], moves: 0, done: false };
}

// Retourne la carte i. Deux cartes ouvertes qui ne vont pas ensemble se
// referment à la carte suivante (ou avec hidePairs, après un court moment).
export function flipCard(game, i) {
  if (game.done || !(i >= 0 && i < game.cards.length) || game.found.includes(i)) return game;
  if (game.open.length < 2 && game.open.includes(i)) return game; // déjà retournée
  const open = game.open.length === 2 ? [i] : [...game.open, i];
  if (open.length < 2) return { ...game, open };
  const moves = game.moves + 1;
  const [a, b] = open;
  if (game.cards[a] !== game.cards[b]) return { ...game, open, moves };
  const found = [...game.found, a, b];
  return { ...game, open: [], found, moves, done: found.length === game.cards.length };
}

export const hidePairs = (game) => (game.open.length === 2 ? { ...game, open: [] } : game);

// Étoiles : 3 en au plus 1,5 coup par paire, 2 jusqu'à 2 coups par paire, sinon 1.
export function pairsStars(game) {
  const n = game.cards.length / 2;
  return game.moves <= Math.ceil(n * 1.5) ? 3 : game.moves <= n * 2 ? 2 : 1;
}
