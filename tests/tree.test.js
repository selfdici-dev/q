import { test } from 'node:test';
import assert from 'node:assert/strict';
import { growTree, treeSVG, seedOf } from '../js/tree.js';

test('arbre : même graine, même arbre ; autre graine, autre arbre', () => {
  assert.equal(treeSVG(0.7, seedOf('2026-10-03#0')), treeSVG(0.7, seedOf('2026-10-03#0')));
  assert.notEqual(treeSVG(1, seedOf('2026-10-03#0')), treeSVG(1, seedOf('2026-10-03#1')));
  assert.equal(seedOf('abc'), seedOf('abc'));
});

test('arbre : il pousse avec le temps de la session', () => {
  const seed = seedOf('2026-10-03#0');
  const count = (p) => (treeSVG(p, seed).match(/tree-branch/g) ?? []).length;
  assert.equal(count(0), 1); // juste la pousse
  let prev = 0;
  for (const p of [0.1, 0.3, 0.5, 0.7, 0.9, 1]) {
    assert.ok(count(p) >= prev, `branches à ${p}`);
    prev = count(p);
  }
  assert.doesNotMatch(treeSVG(0.5, seed), /tree-leaf/); // pas de feuilles à mi-chemin
  assert.match(treeSVG(1, seed), /tree-leaf/);
  assert.doesNotMatch(treeSVG(0.99, seed), /tree-fruit/); // les fruits n'arrivent qu'à la fin
});

test('arbre : tout reste dans le cadre, sans valeur invalide', () => {
  for (let i = 0; i < 40; i++) {
    const { branches, leaves } = growTree(seedOf(`2026-10-${i}#${i % 4}`));
    for (const b of branches) for (const [x, y] of [[b.x1, b.y1], [b.x2, b.y2]]) assert.ok(x > 2 && x < 118 && y > 2 && y < 98, `${x},${y}`);
    for (const l of leaves) assert.ok(l.y - l.rx > 0 && l.x > 0 && l.x < 120);
    assert.doesNotMatch(treeSVG(1, seedOf(`x${i}`)), /NaN|undefined/);
  }
});
