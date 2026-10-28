import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
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

test('séance dans la salle : le décor du lecteur garde ses proportions et ne dépasse jamais l’écran', () => {
  const css = readFileSync(new URL('../css/styles.css', import.meta.url), 'utf8');
  const app = readFileSync(new URL('../js/app.js', import.meta.url), 'utf8');
  const rule = css.match(/\.player-room \{[^}]+\}/)[0];
  // plus large que l'écran, il ferait glisser le lecteur sur le côté
  assert.match(rule, /max-width: 100vw/);
  assert.match(rule, /mask-image/);
  // mêmes proportions dans le CSS et dans le dessin : le parquet reste sous les pieds du bonhomme
  const [, w, h] = app.match(/roomSVG\(\{ w: (\d+), h: (\d+), floor: [\d.]+, id: 'seance' \}\)/);
  assert.match(rule, new RegExp(`aspect-ratio: ${w} / ${h}`));
  // le décor de la séance a ses propres identifiants (la Salle reste dessous)
  assert.notEqual(roomSVG({ id: 'seance' }), roomSVG({ id: 'salle' }));
  // les spots ne s'allument qu'avec les animations permises (dans un bloc « no-preference »)
  const blocks = [...css.matchAll(/@media \(prefers-reduced-motion: no-preference\) \{/g)].map((m) => {
    let depth = 0;
    for (let i = m.index; i < css.length; i++) {
      if (css[i] === '{') depth++;
      if (css[i] === '}' && --depth === 0) return css.slice(m.index, i);
    }
    return '';
  });
  assert.ok(blocks.some((b) => b.includes('.player-room.lights .room-spot')));
  assert.equal(css.split('.player-room.lights').length - 1, blocks.join('').split('.player-room.lights').length - 1);
});
