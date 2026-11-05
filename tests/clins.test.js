import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CLINS, clin, GHOST, ghostHere, ghostSVG, ghostZone } from '../js/clins.js';
import { hubSVG, arcadeZone, hubLayout } from '../js/gym.js';
import { QUOTES, quoteOfDay } from '../js/quotes.js';
import { addDays } from '../js/logic.js';

// Chaque balise ouverte est refermée, dans l'ordre (sinon le dessin casse).
function wellFormed(svg) {
  const stack = [];
  for (const [, close, name, self] of svg.matchAll(/<(\/?)([a-zA-Z]+)\b[^>]*?(\/?)>/g)) {
    if (self) continue;
    if (!close) stack.push(name);
    else if (stack.pop() !== name) return false;
  }
  return stack.length === 0;
}

test('clins d’œil : de temps en temps, jamais tous les jours, le même toute la journée', () => {
  const days = Array.from({ length: 180 }, (_, i) => addDays('2026-11-01', i));
  for (const moment of Object.keys(CLINS)) {
    const shown = days.filter((d) => clin(moment, d, { bed: '23 h 30', wake: '8 h' }));
    assert.ok(shown.length > 180 * 0.15 && shown.length < 180 * 0.65, `${moment} : ${shown.length} jours sur 180`);
    for (const d of days.slice(0, 20)) assert.equal(clin(moment, d), clin(moment, d), `${moment} ${d}`);
    // chaque réplique finit par sortir
    const seen = new Set(shown.map((d) => clin(moment, d, { bed: '23 h 30', wake: '8 h' })));
    assert.equal(seen.size, CLINS[moment].length, moment);
  }
  // un moment inconnu ou une date illisible : rien
  assert.equal(clin('inconnu', '2026-11-05'), '');
  for (const junk of [undefined, null, '', 'demain']) assert.equal(clin('seance', junk), '');
});

test('clins d’œil : la nuit garde ton coucher et ton réveil ; encourager, jamais faire honte', () => {
  const night = Array.from({ length: 60 }, (_, i) => addDays('2026-11-01', i)).map((d) => clin('nuit', d, { bed: '23 h 30', wake: '8 h' })).filter(Boolean);
  assert.ok(night.length > 0);
  for (const n of night) {
    assert.match(n, /23 h 30/);
    assert.match(n, /8 h/);
    assert.doesNotMatch(n, /\{\w+\}/);
  }
  for (const line of Object.values(CLINS).flat()) {
    assert.ok(line.length > 5 && line.length < 120, line);
    assert.doesNotMatch(line, /honte|nul\b|faible|gros|interdit|tu dois/i, line);
  }
});

test('Fantôme : il dort dans la salle le soir tard et la nuit, pas le jour', () => {
  assert.deepEqual(['matin', 'jour', 'soir', 'crepuscule', 'nuit'].map(ghostHere), [false, false, false, true, true]);
  for (const animate of [true, false]) {
    const svg = ghostSVG(animate);
    assert.ok(wellFormed(svg));
    assert.match(svg, /class="hub-ghost"/);
    if (!animate) assert.doesNotMatch(svg, /<animate/);
  }
  assert.match(hubSVG({ pick: 'B', phase: 'nuit' }), /class="hub-ghost"/);
  assert.match(hubSVG({ pick: 'B', phase: 'crepuscule', decor: 'grec' }), /class="hub-ghost"/);
  assert.doesNotMatch(hubSVG({ pick: 'B', phase: 'jour' }), /hub-ghost/);
  assert.doesNotMatch(hubSVG({ pick: 'B', phase: 'nuit', animate: false }), /<animate/);
  // sa zone à toucher ne cache ni la borne d'arcade ni le centre des postes
  const [gx, gy, gw, gh] = ghostZone();
  const [ax, ay, aw, ah] = arcadeZone();
  assert.ok(gy > ay + ah || gx > ax + aw, 'Fantôme sous la borne');
  assert.ok(GHOST.X > 0.9 && GHOST.Y > 2.7 && GHOST.Y < 4.3, 'sur le sol libre, entre P, M et la borne');
  for (const { box: [x, y, w, h] } of hubLayout()) {
    const [cx, cy] = [x + w / 2, y + h / 2];
    assert.ok(!(cx > gx && cx < gx + gw && cy > gy && cy < gy + gh), 'Fantôme sur le centre d’un poste');
  }
});

test('citation du jour : quelques répliques de la série, réparties dans la rotation', () => {
  const got = QUOTES.filter((q) => /Game of Thrones/.test(q.author));
  assert.equal(got.length, 5);
  assert.ok(QUOTES.every((q) => q.text && q.author));
  // jamais deux jours de suite : un clin d'œil tous les trois ou quatre jours
  const days = Array.from({ length: QUOTES.length * 2 }, (_, i) => addDays('2026-11-01', i));
  const flags = days.map((d) => /Game of Thrones/.test(quoteOfDay(d).author));
  for (let i = 1; i < flags.length; i++) assert.ok(!(flags[i] && flags[i - 1]), days[i]);
});
