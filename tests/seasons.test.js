import { test } from 'node:test';
import assert from 'node:assert/strict';
import { SEASONS, seasonYear, seasonOn, seasonStatus, newSeason, seasonWorkouts, dateFr } from '../js/seasons.js';
import { decorToShow, decorThumb, DECORS } from '../js/decors.js';
import { hubSVG } from '../js/gym.js';
import { trophyStats, trophyStatus } from '../js/trophies.js';

const S = Object.fromEntries(SEASONS.map((s) => [s.id, s]));
const sp = (t) => t.replace(/\s/g, ' '); // espaces fines du français

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

test('saisons : Halloween, Noël, printemps, été, bornes comprises ; Noël passe le nouvel an', () => {
  assert.deepEqual(SEASONS.map((s) => s.id), ['halloween', 'noel', 'printemps', 'ete']);
  assert.equal(seasonYear(S.halloween, '2026-10-14'), null);
  assert.equal(seasonYear(S.halloween, '2026-10-15'), 2026);
  assert.equal(seasonYear(S.halloween, '2026-11-05'), 2026);
  assert.equal(seasonYear(S.halloween, '2026-11-06'), null);
  assert.equal(seasonYear(S.noel, '2026-11-30'), null);
  assert.equal(seasonYear(S.noel, '2026-12-01'), 2026);
  assert.equal(seasonYear(S.noel, '2027-01-06'), 2026); // le Noël de 2026 finit en janvier 2027
  assert.equal(seasonYear(S.noel, '2027-01-07'), null);
  assert.equal(seasonYear(S.printemps, '2027-03-20'), 2027);
  assert.equal(seasonYear(S.printemps, '2027-05-01'), null);
  assert.equal(seasonYear(S.ete, '2027-08-31'), 2027);
  assert.equal(seasonYear(S.ete, '2027-09-01'), null);
  for (const junk of [undefined, null, '', 'abc', '2026-1-5']) assert.equal(seasonOn(junk), null, String(junk));
  // jamais deux saisons le même jour
  for (let d = new Date(Date.UTC(2026, 0, 1)); d < new Date(Date.UTC(2028, 0, 1)); d.setUTCDate(d.getUTCDate() + 1)) {
    const key = d.toISOString().slice(0, 10);
    assert.ok(SEASONS.filter((s) => seasonYear(s, key) !== null).length <= 1, key);
  }
  assert.equal(sp(dateFr([12, 1])), '1er décembre');
  assert.equal(sp(dateFr([10, 15])), '15 octobre');
});

test('saisons : ce qui est ouvert aujourd’hui, jusqu’à quand, et quand ça revient', () => {
  const st = seasonStatus('2026-11-01');
  assert.deepEqual(st.filter((s) => s.open).map((s) => s.id), ['halloween']);
  assert.equal(sp(st.find((s) => s.id === 'halloween').label), 'Jusqu’au 5 novembre');
  assert.equal(sp(st.find((s) => s.id === 'noel').label), 'Revient le 1er décembre');
  assert.deepEqual(seasonStatus('2026-06-15').filter((s) => s.open), []);
  assert.equal(seasonOn('2026-12-25').id, 'noel');
});

test('saisons : annoncée une fois par an, et de nouveau l’année suivante', () => {
  assert.equal(newSeason([], '2026-11-01').tag, 'halloween@2026');
  assert.equal(newSeason(null, '2026-11-01').tag, 'halloween@2026');
  assert.equal(newSeason(['salle', 'halloween@2026'], '2026-11-01'), null);
  assert.equal(newSeason(['halloween@2026'], '2027-10-20').tag, 'halloween@2027');
  assert.equal(newSeason([], '2026-06-15'), null);
  assert.equal(newSeason(['noel@2026'], '2027-01-03'), null); // toujours le Noël de 2026
});

test('saisons : tes séances pendant la saison (sans M, une fois par jour), la meilleure année', () => {
  const days = {
    '2025-10-20': { workouts: ['A'] }, '2025-10-21': { workouts: ['B'] },
    '2026-10-16': { workouts: ['A', 'A'] }, '2026-10-20': { workouts: ['C'] }, '2026-11-02': { workouts: ['B'] }, '2026-11-03': { workouts: ['M'] },
    '2026-11-06': { workouts: ['A'] }, // hors saison
    '2026-12-30': { workouts: ['B'] }, '2027-01-02': { workouts: ['A'] }, // le même Noël
  };
  assert.deepEqual(seasonWorkouts(days), { halloween: 3, noel: 2, printemps: 0, ete: 0 });
  assert.deepEqual(seasonWorkouts(undefined), { halloween: 0, noel: 0, printemps: 0, ete: 0 });
  // et le trophée de saison suit
  for (let k = 0; k < 6; k++) days[`2026-10-${22 + k}`] = { workouts: ['A'] };
  const s = trophyStats({ settings: {}, habits: [], days }, '2026-11-01');
  assert.equal(s.halloween, 9);
  const tr = trophyStatus(s);
  assert.equal(tr.find((t) => t.id === 'saison-halloween').earned, true);
  assert.equal(tr.find((t) => t.id === 'saison-noel').label, '2 / 10 séances pendant la saison');
});

test('saisons : le décor de saison se montre pendant sa saison, puis ton décor d’avant revient', () => {
  const stats = { workouts: 20 }; // le temple grec est débloqué
  assert.equal(decorToShow('halloween', stats, '2026-11-01'), 'halloween');
  assert.equal(decorToShow('halloween', stats, '2026-11-10', 'grec'), 'grec');
  assert.equal(decorToShow('halloween', { workouts: 2 }, '2026-11-10', 'grec'), 'salle'); // pas débloqué : la salle
  assert.equal(decorToShow('halloween', stats, undefined, 'grec'), 'grec');
  assert.equal(decorToShow('noel', stats, '2027-01-05'), 'noel');
  assert.equal(decorToShow('grec', stats, '2026-11-01'), 'grec');
});

test('saisons : chaque décor de saison se dessine en entier, de jour comme de nuit', () => {
  for (const { id } of SEASONS) {
    for (const animate of [true, false]) {
      for (const phase of ['jour', 'nuit']) {
        const svg = hubSVG({ pick: 'B', id: `s-${id}`, decor: id, animate, phase });
        assert.ok(wellFormed(svg), `${id} : balises mal fermées`);
        assert.doesNotMatch(svg, /https?:|<script|\son\w+=|NaN|undefined|Infinity/, id);
        const all = ids(svg);
        assert.equal(new Set(all).size, all.length, `${id} : identifiant en double`);
        assert.ok(refsOk(svg), `${id} : couleur introuvable`);
        assert.match(svg, /SÉANCE B/, id);
        assert.match(svg, /class="hub-screen"/, id);
        assert.match(svg, /class="hub-arcade"/, id);
        assert.equal((svg.match(/class="hub-plat"/g) ?? []).length, 5, id);
        if (!animate) assert.doesNotMatch(svg, /<animate/, `${id} : ça bouge alors qu’on réduit les animations`);
      }
    }
  }
  // leurs vignettes tiennent sur la même fiche que les autres décors
  const sheet = [...SEASONS, ...DECORS].map(({ id }) => decorThumb(id)).join('');
  assert.ok(wellFormed(sheet));
  assert.equal(new Set(ids(sheet)).size, ids(sheet).length);
  assert.ok(refsOk(sheet));
});
