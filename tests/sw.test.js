import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';

const root = new URL('../', import.meta.url);
const sw = readFileSync(new URL('sw.js', root), 'utf8');
const files = [...sw.match(/const FILES = \[([\s\S]*?)\];/)[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

test('cache hors ligne : chaque fichier listé existe, et chaque module y est', () => {
  for (const f of files) if (f !== './') assert.ok(existsSync(new URL(f, root)), `fichier manquant : ${f}`);
  for (const js of readdirSync(new URL('js/', root))) assert.ok(files.includes(`./js/${js}`), `oublié dans FILES : js/${js}`);
  assert.match(sw, /const VERSION = 'cap-v\d+';/);
});

test('mises à jour : le service worker redemande les fichiers au serveur', () => {
  // Réseau d'abord, sans resservir la copie du navigateur (sinon une mise à
  // jour peut rester invisible jusqu'à 10 min sur GitHub Pages).
  assert.match(sw, /cache: 'no-cache'/);
  assert.match(sw, /skipWaiting\(\)/);
  assert.match(sw, /clients\.claim\(\)/);
});
