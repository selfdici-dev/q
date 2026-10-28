import { test } from 'node:test';
import assert from 'node:assert/strict';
import { roomSVG } from '../js/room.js';

test('salle : le décor est complet (mur, grille, logo, spots, LED, parquet)', () => {
  const svg = roomSVG();
  assert.match(svg, /^<svg class="room" viewBox="0 0 360 220" preserveAspectRatio="xMidYMax slice" aria-hidden="true">/);
  for (const part of ['room-glow', 'room-grid', 'room-logo', 'room-name', 'room-planks', 'room-led', 'room-vig', 'room-dark']) assert.match(svg, new RegExp(`class="${part}"`), part);
  // trois spots, numérotés pour s'allumer l'un après l'autre
  assert.deepEqual([...svg.matchAll(/class="room-spot (s\d)"/g)].map((m) => m[1]), ['s1', 's2', 's3']);
  // le logo : une aiguille de boussole en 4 facettes de cuivre
  assert.equal(svg.match(/<g class="room-logo">(.*?)<\/g>/)[1].match(/<path /g).length, 4);
  // le voile noir de l'entrée est invisible par défaut (la Salle ne s'assombrit pas)
  assert.match(svg, /class="room-dark"[^>]*fill-opacity="0"/);
});

test('salle : rien qui vienne d’Internet, des identifiants propres à chaque décor', () => {
  const a = roomSVG({ id: 'salle' });
  const b = roomSVG({ w: 220, h: 400, logo: [0.5, 0.33], size: 1.9, floor: 0.72, id: 'intro' });
  for (const svg of [a, b]) {
    assert.doesNotMatch(svg, /https?:|href=|<script|<image|on[a-z]+=/i);
    // chaque url(#…) pointe vers un dégradé ou un motif défini dans ce même décor
    const ids = new Set([...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]));
    for (const m of svg.matchAll(/url\(#([^)]+)\)/g)) assert.ok(ids.has(m[1]), m[1]);
  }
  const idsA = [...a.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  const idsB = [...b.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
  assert.ok(idsA.every((x) => x.startsWith('salle-')) && idsB.every((x) => x.startsWith('intro-')));
  assert.equal(idsA.filter((x) => idsB.includes(x)).length, 0);
  // même réglage, même dessin
  assert.equal(roomSVG({ id: 'salle' }), a);
  assert.match(b, /viewBox="0 0 220 400"/);
});
