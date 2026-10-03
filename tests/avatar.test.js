import { test } from 'node:test';
import assert from 'node:assert/strict';
import { avatarParams, avatarSVG, evolved, STAGES, STAGE_GAINS } from '../js/avatar.js';

test('ton double : un palier tous les 2 niveaux, 8 paliers', () => {
  assert.equal(STAGES, 8);
  assert.equal(STAGE_GAINS.length, STAGES);
  const start = avatarParams(1);
  assert.deepEqual([start.stage, start.rank, start.nextLevel, start.pecs, start.abs, start.jaw], [0, 'Recrue', 3, 0, 0, 0]);
  assert.equal(avatarParams(2).stage, 0);
  assert.equal(avatarParams(3).stage, 1);
  const top = avatarParams(40);
  assert.deepEqual([top.stage, top.nextLevel, top.nextGain, top.abs, top.jaw, top.vline, top.waist], [7, null, null, 1, 1, 1, 10]);
});

test('ton double ne fait que progresser avec le niveau', () => {
  let prev = avatarParams(1);
  for (let lvl = 2; lvl <= 20; lvl++) {
    const p = avatarParams(lvl);
    for (const k of ['stage', 'lift', 'pecs', 'abs', 'jaw', 'vline']) assert.ok(p[k] >= prev[k], `${k} au niveau ${lvl}`);
    assert.ok(p.waist <= prev.waist, `taille au niveau ${lvl}`);
    prev = p;
  }
});

test('son aura suit la chaîne (pleine à 3 semaines)', () => {
  assert.equal(avatarParams(5, 0).aura, 0.12);
  assert.equal(avatarParams(5, 21).aura, 0.8);
  assert.equal(avatarParams(5, 100).aura, 0.8);
  const mid = avatarParams(5, 10).aura;
  assert.ok(mid > 0.12 && mid < 0.8);
  // affichée en % : 0 % sans chaîne, 100 % à 3 semaines
  assert.deepEqual([avatarParams(5, 0).charge, avatarParams(5, 21).charge, avatarParams(5, 50).charge], [0, 100, 100]);
});

test('« ton double évolue » seulement quand son palier change', () => {
  assert.equal(evolved(2, 3), true);
  assert.equal(evolved(3, 4), false);
  assert.equal(evolved(4, 6), true); // saut de 2 niveaux qui franchit un palier
  assert.equal(evolved(15, 17), false); // dernier palier déjà atteint
  assert.equal(evolved(16, 17), false);
});

test('dessin : valeurs valides, détails selon le palier, immobile si demandé', () => {
  const low = avatarSVG(avatarParams(1));
  const high = avatarSVG(avatarParams(15, 30));
  assert.doesNotMatch(low + high, /NaN|undefined/);
  assert.equal((low.match(/class="av-line"/g) ?? []).length, 0);
  assert.equal((high.match(/class="av-line"/g) ?? []).length, 4); // poitrine, abdos, V, mâchoire
  assert.match(high, /<animateTransform/);
  assert.doesNotMatch(avatarSVG(avatarParams(15), { animate: false }), /<animate/);
});
