import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const m = JSON.parse(readFileSync(new URL('manifest.webmanifest', root), 'utf8'));
const app = readFileSync(new URL('js/app.js', root), 'utf8');

test('icône de Cap : des raccourcis (appui long) vers les échecs, ta journée, l’arcade, le focus', () => {
  assert.ok(Array.isArray(m.shortcuts) && m.shortcuts.length >= 3 && m.shortcuts.length <= 4);
  const tabs = new Set([...app.matchAll(/(\w+): '(?:moi|sport)'/g)].map((x) => x[1]).concat(['sport', 'manger', 'moi']));
  for (const s of m.shortcuts) {
    assert.ok(s.name && s.short_name.length <= 12 && s.description, s.name);
    const url = new URL(s.url, 'https://exemple.fr/cap/');
    assert.ok(s.url.startsWith('./'), `${s.name} : adresse relative`);
    assert.ok(tabs.has(url.hash.slice(1)), `${s.name} : onglet inconnu ${url.hash}`);
    for (const i of s.icons) assert.ok(existsSync(new URL(i.src, root)), i.src);
  }
  // « ?ouvrir=echecs » est compris par l'appli (et par l'arcade)
  assert.ok(m.shortcuts.some((s) => s.url.includes('ouvrir=echecs')));
  assert.match(app, /get\('ouvrir'\)/);
  assert.match(readFileSync(new URL('js/arcade.js', root), 'utf8'), /open\(id\) \{\n\s+if \(id !== 'echecs'\) return;/);
});
