import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dayPhase, daylightArt, nightHint, PHASE_NAMES } from '../js/daylight.js';
import { hubSVG } from '../js/gym.js';
import { DECORS } from '../js/decors.js';

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

test('heure : matin dès 6 h, journée à 11 h, soir à 17 h, heure bleue à 21 h, nuit à 23 h', () => {
  const cases = { '00:30': 'nuit', '05:59': 'nuit', '06:00': 'matin', '08:00': 'matin', '10:59': 'matin', '11:00': 'jour', '16:59': 'jour',
    '17:00': 'soir', '20:59': 'soir', '21:00': 'crepuscule', '22:59': 'crepuscule', '23:00': 'nuit', '23:59': 'nuit', '7:05': 'matin' };
  for (const [t, phase] of Object.entries(cases)) assert.equal(dayPhase(t), phase, t);
  // une heure illisible : la journée, sans effet
  for (const junk of [undefined, null, '', 'abc', '25:00', '12:75', 1200]) assert.equal(dayPhase(junk), 'jour', String(junk));
  for (const p of ['matin', 'jour', 'soir', 'crepuscule', 'nuit']) assert.ok(PHASE_NAMES[p], p);
});

test('heure : en journée la salle reste telle quelle, les autres moments posent leur lumière', () => {
  assert.deepEqual(daylightArt('jour'), { defs: '', over: '' });
  assert.deepEqual(daylightArt('inconnu'), { defs: '', over: '' });
  for (const p of ['matin', 'soir', 'crepuscule', 'nuit']) {
    const art = daylightArt(p, { u: (n) => `t-${n}` });
    assert.match(art.over, new RegExp(`tod-${p}`));
    assert.ok(wellFormed(art.defs + art.over), p);
    assert.ok(ids(art.defs).every((i) => i.startsWith('t-')), p);
  }
  // le matin et le soir : des rayons, de côtés opposés ; la nuit : étoiles et lune
  assert.match(daylightArt('matin').over, /tod-rays/);
  assert.match(daylightArt('soir').over, /tod-rays/);
  assert.notEqual(daylightArt('matin').defs, daylightArt('soir').defs);
  assert.match(daylightArt('nuit').over, /tod-sky/);
  // une lune la nuit, sauf si le décor a déjà la sienne (le toit, le désert) ou son soleil (la plage)
  assert.match(daylightArt('nuit').over, /moon-cut/);
  assert.doesNotMatch(daylightArt('nuit', { moon: false }).over, /moon-cut/);
  for (const id of ['toit', 'desert', 'plage']) assert.doesNotMatch(hubSVG({ pick: 'B', id: 'm', decor: id, animate: false, phase: 'nuit' }), /moon-cut/, id);
  assert.match(hubSVG({ pick: 'B', id: 'm', decor: 'salle', animate: false, phase: 'nuit' }), /moon-cut/);
  assert.doesNotMatch(daylightArt('crepuscule').over, /tod-sky/);
  // animations seulement si on les veut
  assert.match(daylightArt('nuit').over, /<animate/);
  for (const p of ['matin', 'soir', 'crepuscule', 'nuit']) assert.doesNotMatch(daylightArt(p, { animate: false }).over, /<animate/, p);
});

test('heure : chaque décor se dessine à chaque moment, sans couleur introuvable ni identifiant en double', () => {
  // en journée (et sans heure donnée) : pas de couche de lumière
  assert.doesNotMatch(hubSVG({ pick: 'B', id: 'h', decor: 'salle', animate: false }), /hub-tod/);
  assert.doesNotMatch(hubSVG({ pick: 'B', id: 'h', decor: 'salle', animate: false, phase: 'jour' }), /hub-tod/);
  for (const { id } of DECORS) {
    for (const phase of ['matin', 'soir', 'crepuscule', 'nuit']) {
      const svg = hubSVG({ pick: 'B', id: `t-${id}`, decor: id, animate: phase === 'nuit', phase });
      assert.ok(wellFormed(svg), `${id} ${phase}`);
      const all = ids(svg);
      assert.equal(new Set(all).size, all.length, `${id} ${phase} : identifiant en double`);
      assert.ok(refsOk(svg), `${id} ${phase} : couleur introuvable`);
      assert.doesNotMatch(svg, /NaN|undefined|Infinity/, `${id} ${phase}`);
      // la lumière passe sous le faisceau du poste choisi (qui reste allumé)
      assert.ok(svg.indexOf('class="hub-tod') < svg.indexOf('class="hub-light"'), `${id} ${phase}`);
    }
  }
});

test('heure : le soir et la nuit, un mot doux sous la salle (ton coucher et ton réveil)', () => {
  assert.equal(nightHint('jour'), '');
  assert.equal(nightHint('matin'), '');
  assert.equal(nightHint('soir'), '');
  assert.match(nightHint('crepuscule'), /vêtements de demain/);
  const n = nightHint('nuit', '23 h 30', '8 h');
  assert.match(n, /23 h 30/);
  assert.match(n, /8 h/);
  assert.doesNotMatch(n, /interdit|dois|faut/);
});
