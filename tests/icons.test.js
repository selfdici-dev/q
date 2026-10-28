import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ICONS, icon } from '../js/icons.js';
import { UNITS } from '../js/finance-data.js';

const src = ['app.js', 'money.js'].map((f) => readFileSync(new URL(`../js/${f}`, import.meta.url), 'utf8')).join('\n');

test('icônes : chaque icône demandée par l’appli existe', () => {
  const used = new Set([...src.matchAll(/icon\(\s*'([a-z-]+)'/g)].map((m) => m[1]));
  // noms passés par une liste (réglages : thème et coach vocal)
  for (const m of src.matchAll(/\['[a-z0-9]+', '([a-z-]+)', '[A-ZÉa-zé]+'\]/g)) used.add(m[1]);
  assert.ok(used.size >= 30, `${used.size} icônes seulement`);
  for (const name of used) assert.ok(ICONS[name], `icône manquante : ${name}`);
  // les étapes du parcours finance ont chacune la leur
  for (const u of UNITS) assert.ok(ICONS[u.icon], `${u.title} : icône ${u.icon}`);
});

test('icônes : du SVG simple, local et caché aux lecteurs d’écran', () => {
  for (const [name, body] of Object.entries(ICONS)) {
    // que des formes simples, aucun lien ni script, rien qui vienne d'Internet
    const tags = [...body.matchAll(/<([a-z]+)/g)].map((m) => m[1]);
    assert.ok(tags.length > 0, name);
    for (const t of tags) assert.ok(['path', 'circle', 'rect'].includes(t), `${name} : <${t}>`);
    assert.doesNotMatch(body, /url\(|http|href|script|on[a-z]+=/i, name);
  }
  const svg = icon('flame', 'big-ico');
  assert.match(svg, /^<svg class="ico big-ico" viewBox="0 0 24 24" fill="none" stroke="currentColor"/);
  assert.match(svg, /aria-hidden="true"/);
  assert.equal(icon('inconnue'), '');
});

test('icônes : plus d’emoji dans les titres de cartes ni dans les sections repliées', () => {
  const emoji = /\p{Extended_Pictographic}/u;
  for (const m of src.matchAll(/<h[23]>([^<]*)/g)) assert.doesNotMatch(m[1], emoji, m[1]);
  for (const m of src.matchAll(/fold\('[a-z-]+', '([^']*)'/g)) assert.doesNotMatch(m[1], emoji, m[1]);
});
