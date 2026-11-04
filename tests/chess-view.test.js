import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createChess, chessArt } from '../js/chess-view.js';
import { LESSONS, PUZZLES } from '../js/chess-school.js';

// L'écran des échecs n'écrit que du HTML : on le fait tourner sans navigateur.
globalThis.window ??= { scrollTo() {} };
const sq = (n) => String((8 - Number(n[1])) * 8 + 'abcdefgh'.indexOf(n[0]));
const count = (html, re) => (html.match(re) ?? []).length;

function setup(state = { games: {} }) {
  const party = [];
  const chess = createChess({ state, save() {}, render() {}, celebrate: (m) => party.push(m) });
  const act = (name, data = {}) => chess.actions[name]({ dataset: data });
  const tap = (...names) => names.forEach((n) => act('ch-sq', { sq: sq(n) }));
  return { state, party, chess, act, tap };
}

test('échecs (écran) : l’accueil montre les leçons, les problèmes et les niveaux de Cap', () => {
  const { chess } = setup();
  const html = chess.view();
  assert.equal(count(html, /data-act="ch-lesson"/g), LESSONS.length);
  for (const lv of ['Débutant', 'Moyen', 'Coriace']) assert.match(html, new RegExp(lv));
  assert.match(html, /Nouvelle partie/);
  assert.doesNotMatch(html, /Reprendre la partie/);
  // l'image de la tuile : un dessin local
  assert.match(chessArt(), /^<svg/);
  assert.doesNotMatch(chessArt(), /http|href/);
});

test('échecs (écran) : une leçon se fait au doigt, et reste réussie', () => {
  const { state, party, chess, act, tap } = setup();
  act('ch-lesson', { id: 'plateau' });
  assert.match(chess.view(), /C’est parti/);
  act('ch-start');
  const board = chess.view();
  assert.equal(count(board, /class="ch-hit"/g), 64);
  tap('h1'); // pas la bonne case
  assert.match(chess.view(), /ch-msg ko/);
  tap(...LESSONS[0].steps[0].ask);
  assert.match(chess.view(), /ch-msg ok/);
  act('ch-next');
  assert.equal(state.games.echecs.lessons.plateau, true);
  assert.ok(party.some((m) => /Leçon réussie/.test(m)));
  assert.match(chess.view(), /La tour/); // la leçon suivante s'ouvre
});

test('échecs (écran) : les étoiles, et « Recommencer » pour faire mieux que son score', () => {
  const { chess, act, tap } = setup();
  act('ch-lesson', { id: 'tour' });
  act('ch-start');
  tap('b2'); // la tour ne va pas en diagonale
  assert.match(chess.view(), /ne peut pas aller là/);
  tap('a6', 'f6', 'f3', 'f2'); // 4 coups au lieu de 3
  let html = chess.view();
  assert.match(html, /Réussi en 4 coups\. On peut le faire en 3/);
  assert.match(html, /data-act="ch-retry"/);
  act('ch-retry');
  tap('a6', 'f6', 'f2');
  html = chess.view();
  assert.match(html, /Parfait : 3 coups, le minimum/);
  assert.doesNotMatch(html, /data-act="ch-retry"/);
});

test('échecs (écran) : la promotion se choisit, et seule la bonne pièce réussit', () => {
  const { chess, act, tap } = setup();
  act('ch-lesson', { id: 'pion' });
  act('ch-start');
  tap('e4', 'd5');
  assert.match(chess.view(), /exd5 : bravo/);
  act('ch-next');
  tap('b7', 'b8');
  const html = chess.view();
  assert.equal(count(html, /data-act="ch-promo"/g), 4);
  assert.match(html, /<use href="#cp-wQ"\/><\/svg><\/button>/); // les pièces du joueur (blanches)
  tap('a1'); // toucher le plateau annule la promotion
  assert.equal(count(chess.view(), /data-act="ch-promo"/g), 0);
  tap('b7', 'b8');
  act('ch-promo', { t: '4' }); // une tour : pas ce qui est demandé
  assert.match(chess.view(), /b8=T\+ : ce n’est pas ça/);
  tap('b7', 'b8');
  act('ch-promo', { t: '5' });
  assert.match(chess.view(), /b8=D\+ : bravo/);
});

test('échecs (écran) : un problème se résout au doigt', () => {
  const { state, chess, act, tap } = setup();
  act('ch-puzzles');
  assert.equal(count(chess.view(), /data-act="ch-puzzle"/g), PUZZLES.length);
  act('ch-puzzle', { id: 'p2' });
  tap('d1');
  assert.match(chess.view(), /class="ch-tgt"/); // les cases où la tour peut aller
  tap('d2'); // pas mat
  assert.match(chess.view(), /ce n’est pas ça/);
  assert.equal(state.games.echecs?.puzzles?.p2, undefined);
  tap('d1', 'd8');
  assert.match(chess.view(), /Td8# : bravo/);
  assert.equal(state.games.echecs.puzzles.p2, true);
});

test('échecs (écran) : une partie contre Cap, gardée, reprise, annulée, abandonnée', async () => {
  const { state, chess, act, tap } = setup();
  act('ch-level', { id: 'debutant' });
  act('ch-color', { c: 'w' });
  act('ch-new');
  tap('e2', 'e4');
  assert.match(chess.view(), /Cap réfléchit/);
  await new Promise((r) => setTimeout(r, 1500));
  assert.match(chess.view(), /À toi de jouer/);
  assert.equal(state.games.echecs.cur.sans.length, 2);
  assert.equal(state.games.echecs.cur.sans[0], 'e4');
  // Cap rouvert : la partie gardée reprend, coups compris
  const again = setup(state);
  assert.match(again.chess.view(), /Reprendre la partie/);
  again.act('ch-resume');
  assert.match(again.chess.view(), /<b>1\.<\/b> e4 /);
  // annuler son coup : on revient au départ
  act('ch-undo');
  assert.equal(state.games.echecs.cur.sans.length, 0);
  // abandonner : une défaite au niveau Débutant, plus de partie en cours
  globalThis.confirm = () => true;
  act('ch-resign');
  assert.equal(state.games.echecs.losses.debutant, 1);
  assert.equal(state.games.echecs.cur, null);
  assert.match(chess.view(), /Rejouer/);
});

test('échecs (écran) : la partie finie se revoit, Cap note tes coups', async () => {
  const state = { games: { echecs: { lessons: {}, puzzles: {}, wins: {}, draws: {}, losses: {}, last: { start: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', sans: ['e4', 'e5', 'Dh5', 'Cc6', 'Fc4', 'Cf6', 'Dxf7#'], color: 8, level: 'moyen', result: 'perdu' } } } };
  const { chess, act } = setup(state);
  assert.match(chess.view(), /Revoir ta dernière partie \(perdue\)/);
  act('ch-review');
  assert.match(chess.view(), /Cap revoit tes coups… 0 \/ 3/);
  await new Promise((r) => setTimeout(r, 2500));
  const html = chess.view();
  assert.match(html, /<b>67 %<\/b>/);
  assert.match(html, /Ton plus gros faux pas : 3\.\.\. Cf6\?\?/);
  act('ch-rv-next');
  // la faute : la position d'avant, ton coup en rouge, le meilleur en vert
  const fault = chess.view();
  assert.match(fault, /3\.\.\. Cf6\?\? — Gaffe/);
  assert.match(fault, /class="ch-mark ko"/);
  assert.match(fault, /class="ch-mark ok"/);
  act('ch-rv-go', { i: '1' });
  assert.match(chess.view(), /1\. e4 : le coup de Cap\./);
  act('ch-home');
  assert.doesNotMatch(chess.view(), /Revoir<\/b>/);
});

