import { test } from 'node:test';
import assert from 'node:assert/strict';
import { OPENINGS, sideAt, whyIndex } from '../js/chess-openings.js';
import { fromFen, legalMoves, san, make, START } from '../js/chess.js';

test('ouvertures : chaque suite se joue coup par coup, chacun de tes coups a sa raison', () => {
  assert.ok(OPENINGS.length >= 4);
  assert.equal(new Set(OPENINGS.map((o) => o.id)).size, OPENINGS.length);
  assert.ok(OPENINGS.some((o) => o.color === 'w') && OPENINGS.some((o) => o.color === 'b'));
  for (const op of OPENINGS) {
    const pos = fromFen(START);
    op.line.forEach((s, k) => {
      const m = legalMoves(pos).find((x) => san(pos, x) === s || san(pos, x).replace(/[+#]$/, '') === s);
      assert.ok(m, `${op.name} : ${s} (demi-coup ${k}) n’est pas jouable`);
      make(pos, m);
    });
    // tes coups et leurs raisons : autant l'un que l'autre, rien de vide
    const mine = op.line.filter((_, k) => sideAt(k) === op.color);
    assert.equal(op.why.length, mine.length, op.name);
    for (const w of op.why) assert.ok(w.length > 10 && w.length <= 110, `${op.name} : ${w}`);
    assert.ok(op.intro.length > 20, op.name);
    // la suite se termine sur un de tes coups
    assert.equal(sideAt(op.line.length - 1), op.color, `${op.name} : finit sur un coup de Cap`);
  }
});

test('ouvertures : à qui de jouer, et quelle raison', () => {
  const it = OPENINGS.find((o) => o.id === 'italienne');
  assert.equal(sideAt(0), 'w');
  assert.equal(sideAt(1), 'b');
  assert.equal(whyIndex(it, 0), 0);
  assert.equal(whyIndex(it, 1), -1);
  assert.equal(whyIndex(it, 2), 1);
  const sc = OPENINGS.find((o) => o.id === 'scandinave');
  assert.equal(whyIndex(sc, 0), -1);
  assert.equal(whyIndex(sc, 1), 0);
  assert.equal(whyIndex(sc, 3), 1);
});
