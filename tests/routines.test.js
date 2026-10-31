import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ROUTINES, routineStatus, toggleRoutine, morningTime, wakeAt8 } from '../js/routines.js';

test('routines : le matin (eau, douche, sérum sourcils, crème cheveux), le soir (vêtements, au lit)', () => {
  assert.deepEqual(ROUTINES.matin.items.map((x) => x.id), ['eau', 'douche', 'sourcils', 'cheveux']);
  assert.deepEqual(ROUTINES.soir.items.map((x) => x.id), ['vetements', 'lit']);
  assert.match(ROUTINES.matin.items.find((x) => x.id === 'sourcils').sub, /The Ordinary/);
  assert.match(ROUTINES.matin.items.find((x) => x.id === 'cheveux').sub, /SheaMoisture/);
  // des identifiants uniques (ils sont stockés), un texte court pour le plan du jour
  const all = Object.values(ROUTINES).flatMap((r) => r.items);
  assert.equal(new Set(all.map((x) => x.id)).size, all.length);
  for (const x of all) assert.ok(x.label && x.short && x.sub && x.sub.length <= 110, x.id);
});

test('routines : cocher, décocher, et ce qu’il reste', () => {
  let done = toggleRoutine(undefined, 'douche');
  assert.deepEqual(done, ['douche']);
  let st = routineStatus(done, 'matin');
  assert.equal(st.done, 1);
  assert.equal(st.total, 4);
  assert.equal(st.complete, false);
  assert.deepEqual(st.left.map((x) => x.id), ['eau', 'sourcils', 'cheveux']);
  for (const id of ['eau', 'sourcils', 'cheveux']) done = toggleRoutine(done, id);
  assert.equal(routineStatus(done, 'matin').complete, true);
  assert.equal(routineStatus(done, 'soir').complete, false); // le soir est à part
  done = toggleRoutine(done, 'douche'); // décocher
  assert.equal(routineStatus(done, 'matin').done, 3);
  // un geste inconnu ou des données abîmées ne cassent rien ; l'ancienne liste ne change pas
  const before = ['eau'];
  assert.deepEqual(toggleRoutine(before, 'inconnu'), ['eau']);
  assert.deepEqual(toggleRoutine(before, 'lit'), ['eau', 'lit']);
  assert.deepEqual(before, ['eau']);
  assert.deepEqual(toggleRoutine('n’importe quoi', 'lit'), ['lit']);
  assert.deepEqual(toggleRoutine([3, 'eau'], 'eau'), []);
  assert.equal(routineStatus(null, 'soir').done, 0);
});

test('routines : celle du matin se propose de 4 h à midi', () => {
  assert.equal(morningTime('04:00'), true);
  assert.equal(morningTime('08:12'), true);
  assert.equal(morningTime('11:59'), true);
  assert.equal(morningTime('12:00'), false);
  assert.equal(morningTime('23:30'), false);
  assert.equal(morningTime('01:00'), false); // encore la veille
});

test('réveil visé à 8 h : une seule fois, sans écraser un autre choix', () => {
  assert.equal(wakeAt8({ wakeTarget: '08:30' }).wakeTarget, '08:00');
  assert.equal(wakeAt8({ wakeTarget: '08:30' }).wake8, true);
  assert.equal(wakeAt8({ wakeTarget: '07:30' }).wakeTarget, '07:30');
  // déjà fait : si tu remets 8 h 30 ensuite, ça reste 8 h 30
  const later = { wakeTarget: '08:30', wake8: true };
  assert.equal(wakeAt8(later), later);
  const s = { wakeTarget: '08:30', bedtimeTarget: '23:30' };
  const out = wakeAt8(s);
  assert.equal(out.bedtimeTarget, '23:30');
  assert.equal(s.wakeTarget, '08:30'); // l'ancien objet ne change pas
});
