import { test } from 'node:test';
import assert from 'node:assert/strict';
import { LESSONS, PUZZLES, judge, starMoves, defend } from '../js/chess-school.js';
import { fromFen, legalMoves, make, san, status, matingMoves, mateIn, bestMove, sqIndex, sqName, LEVELS } from '../js/chess.js';

const good = (ex) => {
  const pos = fromFen(ex.fen);
  return legalMoves(pos).filter((m) => judge(ex, pos, m).ok).map((m) => san(pos, m));
};

test('école : 16 leçons, chacune avec son texte et ses exercices', () => {
  assert.ok(LESSONS.length >= 16);
  assert.equal(new Set(LESSONS.map((l) => l.id)).size, LESSONS.length);
  for (const l of LESSONS) {
    assert.ok(l.title && l.intro.length && l.steps.length, l.id);
    for (const ex of l.steps) assert.ok(['square', 'stars', 'move', 'choice', 'endgame'].includes(ex.type) && ex.text, l.id);
  }
});

test('école : chaque exercice de coup a sa (ou ses) bonne(s) réponse(s), vérifiée(s) par le moteur', () => {
  for (const l of LESSONS) {
    for (const ex of l.steps.filter((x) => x.type === 'move')) {
      const ok = good(ex);
      assert.ok(ok.length > 0, `${l.id} : aucune bonne réponse`);
      if (ex.answer) for (const a of ex.answer) assert.ok(ok.some((s) => s.replace(/[+#]/g, '') === a.replace(/[+#]/g, '')), `${l.id} : ${a} n’est pas jouable`);
      // un mauvais coup existe (sauf « n'importe quel coup ») : l'exercice demande de réfléchir
      if (ex.goal !== 'any') assert.ok(legalMoves(fromFen(ex.fen)).length > ok.length, `${l.id} : tout est bon`);
    }
    for (const ex of l.steps.filter((x) => x.type === 'choice')) assert.ok(ex.good >= 0 && ex.good < ex.choices.length && ex.why, l.id);
    for (const ex of l.steps.filter((x) => x.type === 'square')) assert.ok(ex.ask.every((s) => /^[a-h][1-8]$/.test(s)), l.id);
  }
});

test('école : les étoiles s’attrapent, et le meilleur nombre de coups annoncé est le vrai', () => {
  for (const l of LESSONS) {
    for (const ex of l.steps.filter((x) => x.type === 'stars')) {
      // le plus court chemin qui ramasse toutes les étoiles (recherche en largeur)
      const all = ex.stars.map(sqIndex);
      const start = { at: ex.from, got: [] };
      let frontier = [start], depth = 0, found = null;
      const seen = new Set([`${ex.from}|`]);
      while (frontier.length && !found && depth < 12) {
        depth++;
        const next = [];
        for (const s of frontier) {
          for (const to of starMoves(ex, s.at)) {
            const got = [...new Set([...s.got, ...(all.includes(to) ? [to] : [])])].sort();
            const key = `${sqName(to)}|${got.join(',')}`;
            if (seen.has(key)) continue;
            seen.add(key);
            if (got.length === all.length) { found = depth; break; }
            next.push({ at: sqName(to), got });
          }
          if (found) break;
        }
        frontier = next;
      }
      assert.equal(found, ex.best, `${l.id} : en ${found} coups, pas ${ex.best}`);
      assert.ok(ex.stars.every((s) => !(ex.blockers ?? []).includes(s) && s !== ex.from), l.id);
    }
  }
});

test('école : la finale « mater avec la dame » se gagne dans les temps contre Cap', () => {
  const ex = LESSONS.find((l) => l.id === 'finale').steps[0];
  const pos = fromFen(ex.fen);
  let moves = 0;
  while (!status(pos) && moves < ex.max) {
    make(pos, bestMove(pos, { depth: 3, quiet: true, ms: 3000 }));
    moves++;
    if (status(pos)) break;
    make(pos, defend(pos));
  }
  assert.equal(status(pos), 'mat', `pas de mat en ${ex.max} coups`);
});

test('problèmes : mats en 1, vrais mats en 2, gains de matériel, tous vérifiés', () => {
  assert.ok(PUZZLES.length >= 12);
  assert.equal(new Set(PUZZLES.map((p) => p.id)).size, PUZZLES.length);
  for (const p of PUZZLES) {
    const pos = fromFen(p.fen);
    assert.ok(legalMoves(pos).length > 1, p.id);
    const ok = good(p);
    assert.ok(ok.length > 0, `${p.id} : aucune solution`);
    if (p.goal === 'mate2') {
      assert.equal(mateIn(pos, 1), false, `${p.id} : un mat en 1 existe`);
      assert.ok(matingMoves(pos, 2).length > 0, `${p.id} : pas de mat en 2`);
    }
    if (p.answer) assert.equal(ok.length, p.answer.length, `${p.id} : d’autres coups gagnent aussi`);
  }
});
