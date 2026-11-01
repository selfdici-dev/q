import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GEAR, SLOTS, gearStats, gearStatus, wornGear, wearGear, newGear } from '../js/outfit.js';
import { avatarSVG, avatarParams, gearIcon } from '../js/avatar.js';
import { ICONS } from '../js/icons.js';

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
const ids = (svg) => [...svg.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
const refsOk = (svg) => [...svg.matchAll(/url\(#([^)]+)\)/g)].every(([, ref]) => ids(svg).includes(ref));

test('garde-robe : 8 accessoires, chacun sa place et son défi, du plus facile au plus dur', () => {
  assert.equal(GEAR.length, 8);
  assert.equal(new Set(GEAR.map((g) => g.id)).size, GEAR.length);
  for (const g of GEAR) {
    assert.ok(SLOTS[g.slot], g.id);
    assert.ok(['trophees', 'or'].includes(g.need.kind) && g.need.n > 0, g.id);
    assert.ok(g.name && g.desc, g.id);
  }
  const counts = GEAR.filter((g) => g.need.kind === 'trophees').map((g) => g.need.n);
  assert.deepEqual(counts, [...counts].sort((a, b) => a - b));
  assert.ok(ICONS && gearIcon('cape').includes('<path'));
});

test('garde-robe : les trophées gagnés débloquent, au seuil exact ; la médaille veut un trophée en or', () => {
  assert.deepEqual(gearStats([{ earned: true, tier: 'bronze' }, { earned: true, tier: 'or' }, { earned: false, tier: 'or' }]), { trophees: 2, or: 1 });
  assert.deepEqual(gearStats(undefined), { trophees: 0, or: 0 });
  const at = (stats, id) => gearStatus(stats).find((g) => g.id === id);
  assert.equal(at({ trophees: 0 }, 'bandeau').unlocked, false);
  assert.equal(at({ trophees: 0 }, 'bandeau').label, '0 / 1 trophée');
  assert.equal(at({ trophees: 1 }, 'bandeau').unlocked, true);
  assert.equal(at({ trophees: 5 }, 'lunettes').label, '5 / 6 trophées');
  assert.equal(at({ trophees: 6 }, 'lunettes').unlocked, true);
  assert.equal(at({ trophees: 30, or: 0 }, 'medaille').label, '0 / 1 trophée en or');
  assert.equal(at({ trophees: 0, or: 1 }, 'medaille').unlocked, true);
  assert.equal(at({ trophees: 24 }, 'couronne').unlocked, false);
  assert.equal(at({ trophees: 25 }, 'couronne').unlocked, true);
  for (const junk of [{}, undefined, { trophees: -4 }, { trophees: 'x' }]) assert.ok(gearStatus(junk).every((g) => !g.unlocked && !/NaN/.test(g.label)));
});

test('garde-robe : un seul accessoire par place, rien qui ne soit débloqué', () => {
  const stats = { trophees: 30, or: 1 };
  let outfit = [];
  outfit = wearGear(outfit, 'bandeau', stats);
  assert.deepEqual(outfit, ['bandeau']);
  outfit = wearGear(outfit, 'couronne', stats); // même place : la couronne remplace le bandeau
  assert.deepEqual(outfit, ['couronne']);
  outfit = wearGear(outfit, 'cape', stats);
  outfit = wearGear(outfit, 'medaille', stats);
  outfit = wearGear(outfit, 'gants', stats); // le cou : les gants remplacent la médaille
  assert.deepEqual(outfit, ['gants', 'cape', 'couronne']);
  outfit = wearGear(outfit, 'cape', stats); // retoucher : on l'enlève
  assert.deepEqual(outfit, ['gants', 'couronne']);
  // pas débloqué : rien ne change ; inconnu : rien non plus
  assert.deepEqual(wearGear(['bandeau'], 'couronne', { trophees: 3 }), ['bandeau']);
  assert.deepEqual(wearGear(['bandeau'], 'chapeau', stats), ['bandeau']);
  // une tenue enregistrée bizarre est nettoyée (inconnu, en double, pas débloqué)
  assert.deepEqual(wornGear(['x', 'bandeau', 'couronne', 'lunettes'], { trophees: 6 }), ['bandeau', 'lunettes']);
  assert.deepEqual(wornGear('bandeau', stats), []);
  const before = ['bandeau'];
  wearGear(before, 'lunettes', stats);
  assert.deepEqual(before, ['bandeau']); // l'ancienne tenue ne change pas
});

test('garde-robe : chaque accessoire débloqué est annoncé une fois', () => {
  assert.deepEqual(newGear([], { trophees: 3 }).map((g) => g.id), ['bandeau', 'serviette']);
  assert.deepEqual(newGear(['bandeau'], { trophees: 3 }).map((g) => g.id), ['serviette']);
  assert.deepEqual(newGear(['bandeau', 'serviette'], { trophees: 3 }), []);
  assert.deepEqual(newGear(null, {}), []);
});

test('garde-robe : ton double porte ses accessoires, à chaque palier, sans casser le dessin', () => {
  const all = GEAR.map((g) => g.id);
  for (const level of [1, 9, 15]) {
    for (const gear of [[], ...all.map((g) => [g]), ['couronne', 'cape', 'ceinture', 'medaille', 'lunettes']]) {
      const svg = avatarSVG(avatarParams(level, 10), { animate: false, gear });
      assert.ok(wellFormed(svg), `${level} ${gear}`);
      assert.ok(refsOk(svg), `${level} ${gear} : couleur introuvable`);
      assert.equal(new Set(ids(svg)).size, ids(svg).length, `${level} ${gear}`);
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `${level} ${gear}`);
      for (const g of gear) assert.match(svg, new RegExp(`av-${g === 'cape' ? 'cape' : g}`), g);
    }
  }
  // la cape passe derrière le corps, les autres devant
  const svg = avatarSVG(avatarParams(9, 0), { animate: false, gear: ['cape', 'bandeau'] });
  assert.ok(svg.indexOf('av-cape') < svg.indexOf('class="av-body"'));
  assert.ok(svg.indexOf('av-bandeau') > svg.indexOf('class="av-body"'));
  // le portrait de la Salle : le médaillon seul, sans les paliers
  const crop = avatarSVG(avatarParams(9, 0), { animate: false, crop: true });
  assert.match(crop, /viewBox="6 0 108 136"/);
  assert.doesNotMatch(crop, /av-pip/);
});
