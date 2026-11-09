import { test } from 'node:test';
import assert from 'node:assert/strict';
import { BODY_LESSONS, bodyDone, bodyNext, bodyScore } from '../js/body.js';
import { ALL_LESSONS } from '../js/finance-data.js';

test('comprendre ton corps : des leçons complètes, sourcées, avec un quiz qui a une bonne réponse', () => {
  assert.ok(BODY_LESSONS.length >= 8);
  const ids = BODY_LESSONS.map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length);
  // rangées avec les leçons de finance (state.lessons) : jamais le même id
  for (const id of ids) {
    assert.match(id, /^corps-/);
    assert.ok(!ALL_LESSONS.some((l) => l.id === id), id);
  }
  for (const l of BODY_LESSONS) {
    for (const k of ['title', 'idea', 'example', 'exercise', 'src']) assert.ok(typeof l[k] === 'string' && l[k].length > 10, `${l.id} · ${k}`);
    assert.equal(l.quiz.length, 3, l.id);
    for (const q of l.quiz) {
      assert.ok(q.q && q.why && Array.isArray(q.a) && q.a.length >= 2, `${l.id} · ${q.q}`);
      assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < q.a.length, `${l.id} · ${q.q}`);
      assert.equal(new Set(q.a).size, q.a.length, `${l.id} : réponses en double`);
    }
    // encourager, jamais faire honte ni interdire
    assert.doesNotMatch(`${l.idea} ${l.example} ${l.exercise}`, /honte de toi|tu dois|interdit|nul\b/i, l.id);
  }
  // les sujets qu'il a demandés : le gras, les protéines, l'insuline et le jeûne, le sommeil, les abdos
  for (const id of ['corps-gras', 'corps-proteines', 'corps-insuline', 'corps-sommeil', 'corps-abdos']) assert.ok(ids.includes(id), id);
  assert.match(BODY_LESSONS.find((l) => l.id === 'corps-gras').idea, /84 %/);
});

test('comprendre ton corps : 2 bonnes réponses sur 3 pour valider, la prochaine leçon, et les leçons de finance ignorées', () => {
  const l = BODY_LESSONS[0];
  const right = l.quiz.map((q) => q.c);
  assert.deepEqual(bodyScore(l, right), { score: 3, passed: true, perfect: true });
  const oneWrong = [...right];
  oneWrong[2] = (right[2] + 1) % l.quiz[2].a.length;
  assert.deepEqual(bodyScore(l, oneWrong), { score: 2, passed: true, perfect: false });
  assert.equal(bodyScore(l, [right[0]]).passed, false);
  assert.equal(bodyScore(l, []).score, 0);
  // la progression
  assert.equal(bodyDone({}), 0);
  assert.equal(bodyNext({}).id, BODY_LESSONS[0].id);
  const lessons = { [BODY_LESSONS[0].id]: { score: 3 }, precaution: { score: 2 } };
  assert.equal(bodyDone(lessons), 1);
  assert.equal(bodyNext(lessons).id, BODY_LESSONS[1].id);
  assert.equal(bodyNext(Object.fromEntries(BODY_LESSONS.map((x) => [x.id, { score: 3 }]))), null);
  for (const junk of [null, undefined, 'x', 3]) assert.equal(bodyDone(junk), 0);
});
