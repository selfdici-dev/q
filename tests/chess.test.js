import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fromFen, toFen, perft, legalMoves, san, make, unmake, status, inCheck, bestMove, mateIn, matingMoves, findMove, reach, sqIndex, sqName, LEVELS, START, ROOK, BISHOP, KNIGHT, KING, QUEEN, PAWN } from '../js/chess.js';

const play = (pos, list) => {
  for (const s of list) {
    const m = legalMoves(pos).find((x) => san(pos, x).replace(/[+#]/g, '') === s.replace(/[+#]/g, ''));
    assert.ok(m, `coup introuvable : ${s}`);
    make(pos, m);
  }
  return pos;
};

test('échecs : les règles sont justes (comptages « perft » de référence)', () => {
  const cases = [
    [START, [20, 400, 8902]],
    ['r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039]], // roques, prises en passant, promotions
    ['8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812]],
    ['r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264]],
    ['rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486]],
  ];
  for (const [fen, want] of cases) {
    const pos = fromFen(fen);
    want.forEach((n, d) => assert.equal(perft(pos, d + 1), n, `${fen} à ${d + 1}`));
    assert.equal(toFen(pos), fen); // la position est rendue intacte
  }
  assert.throws(() => fromFen('pas une position'));
  assert.equal(sqName(sqIndex('e4')), 'e4');
});

test('échecs : la notation française (pièces, prises, roque, promotion, échec, mat)', () => {
  const pos = fromFen(START);
  assert.deepEqual(legalMoves(pos).map((m) => san(pos, m)).sort().slice(0, 4), ['Ca3', 'Cc3', 'Cf3', 'Ch3']);
  play(pos, ['e4', 'e5', 'Cf3', 'Cc6', 'Fc4', 'Cf6', 'O-O']);
  assert.match(toFen(pos), /^r1bqkb1r\/pppp1ppp\/2n2n2\/4p3\/2B1P3\/5N2\/PPPP1PPP\/RNBQ1RK1 b kq/);
  // le baiser de la dame
  const mat = fromFen('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4');
  assert.ok(legalMoves(mat).map((m) => san(mat, m)).includes('Dxf7#'));
  // promotion (et son échec), prise en passant, deux cavaliers qui vont sur la même case
  const promo = fromFen('7k/1P6/8/8/8/8/8/6K1 w - - 0 1');
  assert.ok(legalMoves(promo).map((m) => san(promo, m)).includes('b8=D+'));
  assert.ok(legalMoves(promo).map((m) => san(promo, m)).includes('b8=C'));
  const ep = fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
  const epm = findMove(ep, sqIndex('e5'), sqIndex('d6'));
  assert.equal(san(ep, epm), 'exd6');
  make(ep, epm);
  assert.equal(ep.board[sqIndex('d5')], 0); // le pion pris en passant disparaît
  unmake(ep);
  assert.equal(toFen(ep), '4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
  const twins = fromFen('4k3/8/8/8/8/8/8/1N2KN2 w - - 0 1');
  assert.ok(legalMoves(twins).map((m) => san(twins, m)).includes('Cbd2'));
});

test('échecs : la fin de la partie (mat, pat, plus assez de pièces, 50 coups, répétition)', () => {
  assert.equal(status(fromFen('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1')), null);
  assert.equal(status(fromFen('R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1')), 'mat');
  assert.equal(status(fromFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1')), 'pat');
  assert.equal(status(fromFen('8/8/4k3/8/8/2N5/8/4K3 w - - 0 1')), 'materiel');
  assert.equal(status(fromFen('8/8/4k3/8/8/2R5/8/4K3 w - - 100 80')), '50');
  const pos = fromFen(START);
  const keys = [toFen(pos, false)];
  for (const s of ['Cf3', 'Cf6', 'Cg1', 'Cg8', 'Cf3', 'Cf6', 'Cg1', 'Cg8']) { play(pos, [s]); keys.push(toFen(pos, false)); }
  assert.equal(status(pos, keys), 'repetition');
  assert.equal(inCheck(fromFen('4k3/8/8/8/8/8/4q3/4K3 w - - 0 1')), true);
});

test('échecs : Cap ne rate pas un mat, ne laisse pas une dame gratuite, réfléchit vite', () => {
  const mat = fromFen('r1bqkb1r/pppp1ppp/2n2n2/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 4 4');
  for (const lv of Object.keys(LEVELS)) assert.equal(san(mat, bestMove(mat, { ...LEVELS[lv], rnd: () => 0.5 })), 'Dxf7#', lv);
  const dame = fromFen('rnb1kbnr/pppp1ppp/8/4p3/4P2q/5N2/PPPP1PPP/RNBQKB1R w KQkq - 2 3');
  for (const lv of ['moyen', 'coriace']) assert.equal(san(dame, bestMove(dame, LEVELS[lv])), 'Cxh4', lv);
  const t0 = Date.now();
  bestMove(fromFen(START), LEVELS.coriace);
  assert.ok(Date.now() - t0 < 2500, 'trop lent');
  assert.equal(bestMove(fromFen('R5k1/5ppp/8/8/8/8/5PPP/6K1 b - - 0 1')), null); // mat : plus de coup
  // les mats forcés
  const deux = fromFen('2r3k1/5ppp/8/8/8/8/3R1PPP/3R2K1 w - - 0 1');
  assert.equal(mateIn(deux, 1), false);
  assert.deepEqual(matingMoves(deux, 2).map((m) => san(deux, m)), ['Td8+']);
});

test('échecs : où va une pièce seule (pour les leçons)', () => {
  const at = (t, s, b = []) => reach(t, sqIndex(s), new Set(b.map(sqIndex))).map(sqName).sort();
  assert.equal(at(ROOK, 'a1').length, 14);
  assert.equal(at(BISHOP, 'c1').length, 7);
  assert.equal(at(QUEEN, 'd4').length, 27);
  assert.equal(at(KING, 'e1').length, 5);
  assert.deepEqual(at(KNIGHT, 'b1'), ['a3', 'c3', 'd2']);
  assert.deepEqual(at(PAWN, 'e2'), ['e3', 'e4']);
  assert.deepEqual(at(ROOK, 'h8', ['h5', 'e8']), ['f8', 'g8', 'h6', 'h7']);
});
