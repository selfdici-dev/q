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
  // traits de définition : classe av-mark (les anciennes règles .av-line ne s'y appliquent pas)
  assert.equal((low.match(/class="av-mark"/g) ?? []).length, 0);
  assert.equal((high.match(/class="av-mark"/g) ?? []).length, 4); // poitrine, abdos, V, mâchoire
  assert.match(high, /<animateTransform/);
  assert.doesNotMatch(avatarSVG(avatarParams(15), { animate: false }), /<animate/);
});

test('dessin : chaque palier se dessine, cadre 120 × 160, racine class="avatar", sans texte', () => {
  for (let lvl = 1; lvl <= 16; lvl++) {
    for (const animate of [true, false]) {
      const svg = avatarSVG(avatarParams(lvl, lvl * 2), { animate });
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `niveau ${lvl}`);
      assert.match(svg, /^<svg class="avatar" viewBox="0 0 120 160"/);
      assert.doesNotMatch(svg, /<text/);
    }
  }
});

test('dessin : ids uniques (héros et fiche affichés ensemble), références valides', () => {
  const ids = (s) => [...s.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  const a = avatarSVG(avatarParams(9, 5), { animate: false });
  const b = avatarSVG(avatarParams(9, 5), { animate: false });
  assert.ok(ids(a).length > 0);
  assert.equal(new Set([...ids(a), ...ids(b)]).size, ids(a).length + ids(b).length);
  // chaque url(#…) / href="#…" pointe vers un id du même dessin
  for (const [, ref] of a.matchAll(/(?:url\(#|href="#)([^)"]+)/g)) assert.ok(ids(a).includes(ref), ref);
});

test('dessin : couleurs uniquement par jetons CSS, chacun avec une valeur de secours', () => {
  const svg = avatarSVG(avatarParams(13, 12));
  for (const v of ['--figure', '--accent', '--accent-2', '--bg']) assert.match(svg, new RegExp(`var\\(${v}, #`));
  for (const v of svg.match(/var\([^)]*\)/g)) assert.match(v, /^var\(--[\w-]+, #[0-9a-f]{3,6}\)$/, v);
  // aucune couleur écrite en dur en dehors des jetons
  assert.doesNotMatch(svg.replace(/var\([^)]*\)/g, ''), /#[0-9a-fA-F]{3,6}\b|rgba?\(|hsla?\(/);
});

test('dessin : les paliers atteints s’allument, l’anneau s’épaissit avec la chaîne', () => {
  for (const lvl of [1, 9, 15]) {
    const svg = avatarSVG(avatarParams(lvl), { animate: false });
    assert.equal((svg.match(/class="av-pip" [^>]*url\(/g) ?? []).length, avatarParams(lvl).stage + 1);
    assert.equal((svg.match(/class="av-pip"/g) ?? []).length, STAGES);
  }
  const width = (s) => Number(s.match(/class="av-frame"[^>]*stroke-width="([\d.]+)"/)[1]);
  assert.ok(width(avatarSVG(avatarParams(5, 30), { animate: false })) > width(avatarSVG(avatarParams(5, 0), { animate: false })));
});
