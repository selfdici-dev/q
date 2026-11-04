import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { HEROES, HERO_DIR, heroFor, heroSVG } from '../js/heroes.js';
import { beats } from '../js/figures.js';
import { POSES } from '../js/poses.js';
import { STATIONS } from '../js/gym.js';

const root = new URL('../', import.meta.url);
// Taille d'une image WebP (en-tête VP8X, VP8L ou VP8).
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF');
  assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8X') return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)];
  if (kind === 'VP8L') {
    const b = buf.readUInt32LE(21);
    return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)];
  }
  return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
}

test('persos de la Salle : un par poste, ses images, au rythme de son bonhomme', () => {
  for (const st of STATIONS) assert.ok(heroFor(st.ex), `pas de perso pour ${st.id} (${st.ex})`);
  for (const [name, d] of Object.entries(HEROES)) {
    assert.ok(POSES[name], `pas de bonhomme pour « ${name} »`);
    assert.equal(d.segs.length, beats(POSES[name]).seg.length, `${name} : un passage par pose clé`);
    d.segs.forEach((s, i) => assert.equal(s[0], d.segs.at(i - 1).at(-1), `${name} : passage ${i}`));
    assert.equal(new Set(d.segs.flat()).size, d.n, `${name} : chaque image sert`);
    for (let k = 0; k < d.n; k++) {
      const file = new URL(`${HERO_DIR}${d.slug}-${k}.webp`, root);
      assert.ok(existsSync(file), `image manquante : ${d.slug}-${k}.webp`);
      assert.deepEqual(webpSize(readFileSync(file)), [d.w, d.h], `${d.slug}-${k}.webp : taille du manifeste`);
    }
    // mesures : le sol sous le haut, le milieu dans l'image, une échelle
    assert.ok(d.top >= 0 && d.top < d.ground && d.ground <= 1, name);
    assert.ok(d.center > 0.2 && d.center < 0.8, name);
    assert.ok(d.unit > 5 && d.unit < 60, name);
    if (d.reach !== undefined) assert.ok(d.reach > 0.5 && d.reach <= 1, name);
  }
  // le boxeur a ses gants (le sac se pend là où ils vont)
  assert.ok(HEROES['Shadow boxing'].reach);
});

test('persos de la Salle : un SVG qui joue les images en boucle, immobile si on réduit les animations', () => {
  const svg = heroSVG('Shadow boxing');
  assert.match(svg, /^<svg class="fig draw" viewBox="0 0 \d+ \d+"/);
  assert.match(svg, /<animate attributeName="opacity"/);
  for (const [, src] of svg.matchAll(/<image href="([^"]+)"/g)) assert.match(src, /^img\/jeu\/shadow-boxing-\d\.webp$/);
  const still = heroSVG('Shadow boxing', { animate: false });
  assert.doesNotMatch(still, /<animate/);
  assert.equal((still.match(/<image/g) ?? []).length, 1); // la pose de départ seule, sans fantôme
  // « (droite) » : le côté rendu, sans miroir
  assert.equal(heroFor('Fente basse (droite)').mirror, false);
  assert.equal(heroFor('Fente basse (gauche)').mirror, true);
  assert.equal(heroFor('Exercice inconnu'), null);
});

test('persos de la Salle : leurs images sont gardées hors ligne (GAME dans sw.js)', () => {
  const sw = readFileSync(new URL('sw.js', root), 'utf8');
  const game = Object.fromEntries([...sw.match(/const GAME = \{([^}]*)\};/)[1].matchAll(/'?([\w-]+)'?: (\d+)/g)].map(([, k, n]) => [k, Number(n)]));
  assert.deepEqual(game, Object.fromEntries(Object.values(HEROES).map((d) => [d.slug, d.n])));
});
