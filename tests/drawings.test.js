import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { DRAWINGS, DIR, drawingFor, drawingTimeline, drawingSVG } from '../js/drawings.js';
import { beats } from '../js/figures.js';
import { POSES } from '../js/poses.js';
import { WORKOUTS, WARMUP } from '../js/data.js';

const root = new URL('../', import.meta.url);
const count = (s, re) => (s.match(re) ?? []).length;

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

test('dessins : chaque dessin a son bonhomme, ses images et un ordre qui boucle', () => {
  for (const [name, d] of Object.entries(DRAWINGS)) {
    assert.ok(POSES[name], `pas de bonhomme pour « ${name} »`);
    assert.equal(d.segs.length, beats(POSES[name]).seg.length, `${name} : un passage par pose clé`);
    const used = new Set(d.segs.flat());
    for (const k of used) assert.ok(Number.isInteger(k) && k >= 0 && k < d.n, `${name} : image ${k}`);
    assert.equal(used.size, d.n, `${name} : chaque image sert`);
    // chaque passage part de l'image où le précédent s'arrête, et le dernier revient au début
    d.segs.forEach((s, i) => assert.equal(s[0], d.segs.at(i - 1).at(-1), `${name} : passage ${i}`));
    if (d.side) assert.match(d.side, /^(gauche|droite)$/);
    for (let k = 0; k < d.n; k++) {
      const file = new URL(`${DIR}${d.slug}-${k}.webp`, root);
      assert.ok(existsSync(file), `image manquante : ${d.slug}-${k}.webp`);
      assert.deepEqual(webpSize(readFileSync(file)), [d.w, d.h], `${d.slug}-${k}.webp : taille du manifeste`);
    }
  }
});

test('dessins : trouvés sous le nom de l’exercice, en miroir de l’autre côté', () => {
  const names = [...WORKOUTS.flatMap((w) => w.exercises), ...WARMUP].map((e) => e.name);
  for (const name of names) {
    const r = drawingFor(name);
    if (r) assert.equal(r.fig, POSES[r.key]);
  }
  for (const [name, d] of Object.entries(DRAWINGS)) {
    if (!d.side) continue;
    const other = d.side === 'droite' ? 'gauche' : 'droite';
    assert.equal(drawingFor(`${name} (${d.side})`).mirror, false);
    assert.equal(drawingFor(`${name} (${other})`).mirror, true);
  }
  assert.equal(drawingFor('Exercice inconnu'), null);
  assert.equal(drawingSVG('Exercice inconnu'), '');
});

test('rythme : les images suivent les poses clés et le tempo du bonhomme', () => {
  for (const [name, d] of Object.entries(DRAWINGS)) {
    const keys = drawingTimeline(d, POSES[name]);
    assert.equal(keys[0].t, 0);
    assert.equal(keys[0].frame, d.segs[0][0]);
    keys.forEach((k, i) => {
      assert.ok(k.t >= 0 && k.t < 1, `${name} : ${k.t}`);
      if (i) {
        assert.ok(k.t > keys[i - 1].t, `${name} : temps croissants`);
        assert.notEqual(k.frame, keys[i - 1].frame);
      }
    });
  }
  // Un passage à 5 images, sans arrêt : chaque image arrive quand le geste
  // (adouci) est à mi-chemin entre elle et la précédente.
  const fig = { frames: [{}, {}], tempo: [2, 1], pause: [0, 0] };
  const keys = drawingTimeline({ slug: 't', n: 5, segs: [[0, 1, 2, 3, 4], [4, 3, 2, 1, 0]] }, fig);
  const ease = (u) => 0.5 - Math.cos(Math.PI * u) / 2;
  const down = keys.filter((k) => k.t < 2 / 3);
  assert.deepEqual(down.map((k) => k.frame), [0, 1, 2, 3, 4]);
  down.slice(1).forEach((k, i) => assert.ok(Math.abs(ease(k.t * 1.5) - (i + 0.5) / 4) < 1e-3));
  // l'arrêt sur la pose clé : la première image tient pendant la pause
  const held = drawingTimeline({ slug: 't', n: 2, segs: [[0, 1], [1, 0]] }, { frames: [{}, {}], tempo: [1, 1], pause: [1, 1] });
  assert.ok(held[1].t > 0.25, 'l’image d’arrivée attend la fin de l’arrêt');
  assert.throws(() => drawingTimeline({ slug: 't', n: 2, segs: [[0, 1]] }, fig));
});

test('dessin animé : les images se relaient au rythme du bonhomme ; immobile : départ et arrivée', () => {
  for (const name of Object.keys(DRAWINGS)) {
    const d = DRAWINGS[name];
    const svg = drawingSVG(name);
    const frames = new Set(d.segs.flat());
    assert.equal(count(svg, /<image /g), frames.size);
    assert.equal(count(svg, /<animate /g), frames.size > 1 ? frames.size : 0);
    assert.ok(svg.includes(`dur="${beats(POSES[name]).dur}s"`) || frames.size === 1);
    for (const m of svg.matchAll(/keyTimes="([^"]+)" values="([^"]+)"/g)) {
      const t = m[1].split(';').map(Number);
      const v = m[2].split(';');
      assert.equal(t[0], 0);
      assert.equal(t.length, v.length);
      v.forEach((x, i) => i && assert.notEqual(x, v[i - 1])); // seulement les changements
    }
    assert.match(svg, new RegExp(`viewBox="0 0 ${d.w} ${d.h}"`));
    const still = drawingSVG(name, { animate: false });
    assert.equal(count(still, /<animate /g), 0);
    assert.equal(count(still, /<image /g), d.segs[0][0] === d.segs[0].at(-1) ? 1 : 2);
    assert.equal(count(drawingSVG(name, { animate: false, ghost: false }), /<image /g), 1);
    if (d.side) {
      const other = d.side === 'droite' ? 'gauche' : 'droite';
      assert.match(drawingSVG(`${name} (${other})`), /scale\(-1 1\)/);
      assert.doesNotMatch(drawingSVG(`${name} (${d.side})`), /scale\(-1 1\)/);
    }
  }
});

test('cache hors ligne : la liste des dessins de sw.js correspond aux images', () => {
  const sw = readFileSync(new URL('sw.js', root), 'utf8');
  const drawn = Function(`return ${sw.match(/const DRAWN = (\{[^}]*\});/)[1]}`)();
  const expected = {};
  for (const d of Object.values(DRAWINGS)) expected[d.slug] = d.n;
  assert.deepEqual(drawn, expected);
  assert.match(sw, /k !== VERSION && k !== IMG/); // le cache des dessins survit aux mises à jour
});
